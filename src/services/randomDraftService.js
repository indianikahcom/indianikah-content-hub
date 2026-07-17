const randomSourceService = require("./randomSourceService");
const aiGenerationService = require("./aiGenerationService");

async function createRandomDraft({ type, platform = "TELEGRAM" }) {
    const source = await randomSourceService.getRandomUnpublishedSource({
        type,
        platform,
    });

    // A source can remain eligible when it already has an unpublished post.
    // Reuse that post rather than creating a duplicate.
    if (source.post) {
        return {
            selectedSource: source,
            post: source.post,
            generated: false,
            reusedExistingPost: true,
        };
    }

    const generated = await aiGenerationService.generateForSource(source.id);

    return {
        selectedSource: source,
        post: generated.post,
        generated: true,
        reusedExistingPost: false,
        provider: generated.provider,
        model: generated.model,
        promptKey: generated.promptKey,
    };
}

module.exports = {
    createRandomDraft,
};
