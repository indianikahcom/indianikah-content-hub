const prisma = require("../database/prisma");
const repository = require("../repositories/campaignRepository");
const { enabledPlatforms, publishToPlatform } = require("./platformPublishers");
const AppError = require("../errors/AppError");

function normalize(value) {
  if (value === "ALL" || (Array.isArray(value) && value.some(v => String(v).toUpperCase() === "ALL"))) {
    return enabledPlatforms();
  }
  const list = (Array.isArray(value) ? value : [value])
    .map(v => String(v || "").trim().toUpperCase()).filter(Boolean);
  if (!list.length) throw new AppError("At least one platform is required", 400);
  return [...new Set(list)];
}

function campaignStatus(rows) {
  const success = rows.filter(r => r.status === "SUCCESS").length;
  const failed = rows.filter(r => r.status === "FAILED").length;
  if (success === rows.length) return "SUCCESS";
  if (failed === rows.length) return "FAILED";
  return "PARTIAL_SUCCESS";
}

async function approvedPost(postId) {
  const post = await prisma.post.findUnique({
    where: { id: Number(postId) },
    include: { variants: true, source: true }
  });
  if (!post) throw new AppError("Post not found", 404);
  if (post.status !== "APPROVED") throw new AppError("Only approved posts can be published", 409);
  return post;
}

async function publish(postId, requested = "ALL") {
  const post = await approvedPost(postId);
  const platforms = normalize(requested);

  const active = await prisma.publishCampaign.findFirst({
    where: { postId: post.id, status: { in: ["PENDING", "RUNNING"] } }
  });
  if (active) throw new AppError("This post already has an active campaign", 409);

  const campaign = await repository.create(post.id, platforms);
  const results = [];

  for (const row of campaign.publications) {
    try {
      const result = await publishToPlatform(row.platform, post);
      results.push(await repository.updatePublication(row.id, {
        destination: result.destination || null,
        status: "SUCCESS",
        externalMessageId: result.externalMessageId || null,
        publishedAt: new Date(),
        errorMessage: null,
        responseData: result.responseData ? JSON.stringify(result.responseData) : null
      }));
    } catch (error) {
      results.push(await repository.updatePublication(row.id, {
        status: "FAILED",
        errorMessage: error.message
      }));
    }
  }

  return repository.update(campaign.id, {
    status: campaignStatus(results),
    completedAt: new Date()
  });
}

async function retry(campaignId) {
  const campaign = await repository.findById(campaignId);
  if (!campaign) throw new AppError("Campaign not found", 404);

  const failed = campaign.publications.filter(row => row.status === "FAILED");
  if (!failed.length) throw new AppError("No failed platforms to retry", 409);

  await repository.update(campaign.id, { status: "RUNNING", completedAt: null });
  const results = [...campaign.publications];

  for (const row of failed) {
    try {
      const result = await publishToPlatform(row.platform, campaign.post);
      results[results.findIndex(x => x.id === row.id)] =
        await repository.updatePublication(row.id, {
          destination: result.destination || null,
          status: "SUCCESS",
          externalMessageId: result.externalMessageId || null,
          publishedAt: new Date(),
          errorMessage: null,
          responseData: result.responseData ? JSON.stringify(result.responseData) : null
        });
    } catch (error) {
      results[results.findIndex(x => x.id === row.id)] =
        await repository.updatePublication(row.id, {
          status: "FAILED",
          errorMessage: error.message
        });
    }
  }

  return repository.update(campaign.id, {
    status: campaignStatus(results),
    completedAt: new Date()
  });
}

module.exports = {
  publish,
  retry,
  listByPostId: repository.listByPostId
};
