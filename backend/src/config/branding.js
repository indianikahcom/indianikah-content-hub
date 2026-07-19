const BRAND_NAME = "IndiaNikah.com";
const WEBSITE_URL = "https://indianikah.com";
const BRAND_PROMISE = "100% free forever for Indian Muslims.";
const FRAUD_WARNING = "⚠️ Beware of fraudsters. We never ask for money.";
const BRAND_LINE = `${BRAND_NAME} — ${BRAND_PROMISE}`;
const BRAND_BLOCK = `${BRAND_LINE}\n\n${FRAUD_WARNING}`;

function removeExistingBranding(content = "") {
  return String(content)
    .replace(/IndiaNikah(?:\.com)?\s*[—-]\s*100%\s*free\s*forever(?:\s*for\s*Indian\s*Muslims)?\.?/gi, "")
    .replace(/IndiaNikah\s+is\s+100%\s+free\s+forever\.?/gi, "")
    .replace(/⚠️?\s*Beware\s+(?:of|from)\s+(?:fraudsters|frauds)[,.;]?\s*(?:we|we\s+do\s+not|we\s+don't)\s+(?:never\s+)?ask\s+for\s+money\.?/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function appendBranding(content = "") {
  const cleanContent = removeExistingBranding(content);
  return cleanContent ? `${cleanContent}\n\n${BRAND_BLOCK}` : BRAND_BLOCK;
}

module.exports = {
  BRAND_NAME,
  WEBSITE_URL,
  BRAND_PROMISE,
  FRAUD_WARNING,
  BRAND_LINE,
  BRAND_BLOCK,
  removeExistingBranding,
  appendBranding
};
