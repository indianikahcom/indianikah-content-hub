let nodemailer;

function getNodemailer() {
    if (!nodemailer) {
        nodemailer = require("nodemailer");
    }
    return nodemailer;
}

function required(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is not configured`);
    }
    return value;
}

function transporter() {
    const library = getNodemailer();

    return library.createTransport({
        host: process.env.MS_SMTP_HOST || "smtp.office365.com",
        port: Number(process.env.MS_SMTP_PORT || 587),
        secure: false,
        requireTLS: true,
        auth: {
            user: required("MS_SMTP_USER"),
            pass: required("MS_SMTP_PASSWORD"),
        },
        tls: {
            minVersion: "TLSv1.2",
        },
    });
}

function htmlEscape(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function buildHtml(report) {
    const rows = report.results
        .map(
            (result) => `
            <tr>
              <td>${htmlEscape(result.platform)}</td>
              <td>${htmlEscape(result.status)}</td>
              <td>${htmlEscape(result.externalId || "-")}</td>
              <td>${
                  result.liveUrl
                      ? `<a href="${htmlEscape(
                            result.liveUrl
                        )}">Open post</a>`
                      : "-"
              }</td>
              <td>${htmlEscape(result.errorMessage || "-")}</td>
              <td>${htmlEscape(result.retryCount ?? 0)}</td>
            </tr>`
        )
        .join("");

    return `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2>IndiaNikah publishing report</h2>
      <p><strong>Post:</strong> ${htmlEscape(report.title)}</p>
      <p><strong>Post ID:</strong> ${htmlEscape(report.postId)}</p>
      <p><strong>Started:</strong> ${htmlEscape(report.startedAt)}</p>
      <p><strong>Completed:</strong> ${htmlEscape(report.completedAt)}</p>
      <p><strong>Overall status:</strong> ${htmlEscape(
          report.overallStatus
      )}</p>
      <h3>Content</h3>
      <pre style="white-space:pre-wrap;background:#f4f4f4;padding:12px">${htmlEscape(
          report.content
      )}</pre>
      <h3>Platform results</h3>
      <table border="1" cellpadding="7" cellspacing="0" style="border-collapse:collapse">
        <thead>
          <tr>
            <th>Platform</th>
            <th>Status</th>
            <th>Platform ID</th>
            <th>URL</th>
            <th>Error</th>
            <th>Retries</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function buildSubject(report) {
    const results = Array.isArray(report.results)
        ? report.results
        : [];

    const platforms = [
        ...new Set(
            results
                .map((result) =>
                    String(result.platform || "")
                        .trim()
                        .toUpperCase()
                )
                .filter(Boolean)
        ),
    ];

    const platformLabel = platforms.length
        ? platforms.join(", ")
        : "PUBLISHING";

    const status = String(
        report.overallStatus || "UNKNOWN"
    ).toUpperCase();

    const statusIcon =
        status === "SUCCESS"
            ? "✅"
            : status === "FAILED"
                ? "❌"
                : status === "PARTIAL_SUCCESS"
                    ? "⚠️"
                    : "ℹ️";

    const title =
        String(report.title || "Untitled post").trim();

    return `${statusIcon} IndiaNikah | ${platformLabel} | ${status} | ${title}`;
}

async function sendPublishingReport(report) {
    const to =
        process.env.PUBLISH_REPORT_EMAIL ||
        process.env.MS_SMTP_USER;

    if (!to) {
        throw new Error(
            "PUBLISH_REPORT_EMAIL or MS_SMTP_USER is required"
        );
    }

    const mail = {
        from:
            process.env.MS_SMTP_FROM ||
            process.env.MS_SMTP_USER,
        to,
        subject: buildSubject(report),
        html: buildHtml(report),
        text: JSON.stringify(report, null, 2),
    };

    return transporter().sendMail(mail);
}

module.exports = {
    sendPublishingReport,
};
