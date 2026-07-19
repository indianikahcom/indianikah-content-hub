const prisma = require("../database/prisma");
const repository = require("../repositories/campaignRepository");
const {
  enabledPlatforms,
  publishToPlatform,
} = require("./platformPublishers");
const AppError = require("../errors/AppError");
const {
  sendPublishingReport,
} = require("./microsoftEmailService");

function normalize(value) {
  if (
      value === "ALL" ||
      (
          Array.isArray(value) &&
          value.some(
              (item) =>
                  String(item).toUpperCase() === "ALL"
          )
      )
  ) {
    return enabledPlatforms();
  }

  const list = (
      Array.isArray(value)
          ? value
          : [value]
  )
      .map((item) =>
          String(item || "")
              .trim()
              .toUpperCase()
      )
      .filter(Boolean);

  if (!list.length) {
    throw new AppError(
        "At least one platform is required",
        400
    );
  }

  return [...new Set(list)];
}

function campaignStatus(rows) {
  const success = rows.filter(
      (row) => row.status === "SUCCESS"
  ).length;

  const failed = rows.filter(
      (row) => row.status === "FAILED"
  ).length;

  if (success === rows.length) {
    return "SUCCESS";
  }

  if (failed === rows.length) {
    return "FAILED";
  }

  return "PARTIAL_SUCCESS";
}

function parseResponseData(value) {
  if (!value) {
    return {};
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function buildLiveUrl(publication) {
  const responseData = parseResponseData(
      publication.responseData
  );

  if (responseData.linkedinPostUrl) {
    return responseData.linkedinPostUrl;
  }

  if (responseData.facebookPostUrl) {
    return responseData.facebookPostUrl;
  }

  if (responseData.telegramPostUrl) {
    return responseData.telegramPostUrl;
  }

  if (
      publication.platform === "TELEGRAM" &&
      responseData.channelUsername &&
      publication.externalMessageId
  ) {
    return `https://t.me/${responseData.channelUsername}/${publication.externalMessageId}`;
  }

  if (
      publication.platform === "FACEBOOK" &&
      responseData.facebookPostId
  ) {
    return `https://www.facebook.com/${responseData.facebookPostId}`;
  }

  return null;
}

function buildEmailReport({
                            post,
                            campaign,
                            completedCampaign,
                            results,
                          }) {
  return {
    title: post.title,
    postId: post.id,
    content: post.content,
    startedAt:
        campaign.startedAt ||
        campaign.createdAt ||
        new Date(),
    completedAt:
        completedCampaign.completedAt ||
        new Date(),
    overallStatus: completedCampaign.status,
    results: results.map((result) => ({
      platform: result.platform,
      status: result.status,
      externalId:
          result.externalMessageId || null,
      liveUrl: buildLiveUrl(result),
      errorMessage:
          result.errorMessage || null,
      retryCount:
          result.retryCount ?? 0,
    })),
  };
}

async function sendCampaignEmail({
                                   post,
                                   campaign,
                                   completedCampaign,
                                   results,
                                   sendEmail,
                                 }) {
  if (sendEmail === false) {
    return {
      status: "SKIPPED",
    };
  }

  const report = buildEmailReport({
    post,
    campaign,
    completedCampaign,
    results,
  });

  try {
    await sendPublishingReport(report);

    console.log(
        "Publishing report email sent",
        {
          campaignId: campaign.id,
          postId: post.id,
        }
    );

    return {
      status: "SENT",
    };
  } catch (error) {
    console.error(
        "Publishing report email failed",
        {
          campaignId: campaign.id,
          postId: post.id,
          error: error.message,
        }
    );

    return {
      status: "FAILED",
      error: error.message,
    };
  }
}

async function approvedPost(postId) {
  const post = await prisma.post.findUnique({
    where: {
      id: Number(postId),
    },
    include: {
      variants: true,
      source: true,
    },
  });

  if (!post) {
    throw new AppError(
        "Post not found",
        404
    );
  }

  if (post.status !== "APPROVED") {
    throw new AppError(
        "Only approved posts can be published",
        409
    );
  }

  return post;
}

async function publish(
    postId,
    options = {}
) {
  const post = await approvedPost(postId);

  const platforms = normalize(
      options.platforms || "ALL"
  );

  const active =
      await prisma.publishCampaign.findFirst({
        where: {
          postId: post.id,
          status: {
            in: [
              "PENDING",
              "RUNNING",
            ],
          },
        },
      });

  if (active) {
    throw new AppError(
        "This post already has an active campaign",
        409
    );
  }

  const campaign =
      await repository.create(
          post.id,
          platforms
      );

  const results = [];

  for (const row of campaign.publications) {
    try {
      const result =
          await publishToPlatform(
              row.platform,
              post
          );

      const publication =
          await repository.updatePublication(
              row.id,
              {
                destination:
                    result.destination ||
                    null,
                status: "SUCCESS",
                externalMessageId:
                    result.externalMessageId ||
                    null,
                publishedAt: new Date(),
                errorMessage: null,
                responseData:
                    result.responseData
                        ? JSON.stringify(
                            result.responseData
                        )
                        : null,
              }
          );

      results.push(publication);
    } catch (error) {
      const publication =
          await repository.updatePublication(
              row.id,
              {
                status: "FAILED",
                errorMessage:
                error.message,
              }
          );

      results.push(publication);
    }
  }

  const completedCampaign =
      await repository.update(
          campaign.id,
          {
            status:
                campaignStatus(results),
            completedAt: new Date(),
          }
      );

  const emailReport =
      await sendCampaignEmail({
        post,
        campaign,
        completedCampaign,
        results,
        sendEmail:
            options.sendEmail !== false,
      });

  return {
    ...completedCampaign,
    emailReport,
  };
}

async function retry(
    campaignId,
    options = {}
) {
  const campaign =
      await repository.findById(
          campaignId
      );

  if (!campaign) {
    throw new AppError(
        "Campaign not found",
        404
    );
  }

  const failed =
      campaign.publications.filter(
          (row) =>
              row.status === "FAILED"
      );

  if (!failed.length) {
    throw new AppError(
        "No failed platforms to retry",
        409
    );
  }

  await repository.update(
      campaign.id,
      {
        status: "RUNNING",
        completedAt: null,
      }
  );

  const results = [
    ...campaign.publications,
  ];

  for (const row of failed) {
    const index =
        results.findIndex(
            (item) =>
                item.id === row.id
        );

    try {
      const result =
          await publishToPlatform(
              row.platform,
              campaign.post
          );

      results[index] =
          await repository.updatePublication(
              row.id,
              {
                destination:
                    result.destination ||
                    null,
                status: "SUCCESS",
                externalMessageId:
                    result.externalMessageId ||
                    null,
                publishedAt: new Date(),
                errorMessage: null,
                responseData:
                    result.responseData
                        ? JSON.stringify(
                            result.responseData
                        )
                        : null,
              }
          );
    } catch (error) {
      results[index] =
          await repository.updatePublication(
              row.id,
              {
                status: "FAILED",
                errorMessage:
                error.message,
              }
          );
    }
  }

  const completedCampaign =
      await repository.update(
          campaign.id,
          {
            status:
                campaignStatus(results),
            completedAt: new Date(),
          }
      );

  const emailReport =
      await sendCampaignEmail({
        post: campaign.post,
        campaign,
        completedCampaign,
        results,
        sendEmail:
            options.sendEmail !== false,
      });

  return {
    ...completedCampaign,
    emailReport,
  };
}

module.exports = {
  publish,
  retry,
  listByPostId:
  repository.listByPostId,
};