function splitFacebookPostId(value, fallbackPageId = null) {
    const externalId = String(value || "").trim();
    const fallback = String(fallbackPageId || "").trim();

    if (!externalId) {
        return { pageId: fallback || null, postId: null };
    }

    const separatorIndex = externalId.indexOf("_");

    if (separatorIndex > 0 && separatorIndex < externalId.length - 1) {
        return {
            pageId: externalId.slice(0, separatorIndex),
            postId: externalId.slice(separatorIndex + 1),
        };
    }

    return {
        pageId: fallback || null,
        postId: externalId,
    };
}

function buildFacebookPostUrl(value, fallbackPageId = null) {
    const { pageId, postId } = splitFacebookPostId(
        value,
        fallbackPageId
    );

    if (!pageId || !postId) {
        return null;
    }

    const query = new URLSearchParams({
        story_fbid: postId,
        id: pageId,
    });

    return `https://www.facebook.com/permalink.php?${query.toString()}`;
}

module.exports = {
    buildFacebookPostUrl,
    splitFacebookPostId,
};
