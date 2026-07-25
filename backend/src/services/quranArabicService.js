const AppError = require("../errors/AppError");

function expandReference(value) {
    const match = String(value || "")
        .trim()
        .match(/^(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?$/);

    if (!match) {
        throw new AppError("Stored Quran reference is not supported", 422);
    }

    const surah = Number(match[1]);
    const firstAyah = Number(match[2]);
    const lastAyah = Number(match[3] || match[2]);

    if (
        surah < 1 ||
        surah > 114 ||
        firstAyah < 1 ||
        lastAyah < firstAyah ||
        lastAyah - firstAyah > 20
    ) {
        throw new AppError("Stored Quran reference is invalid", 422);
    }

    return Array.from(
        { length: lastAyah - firstAyah + 1 },
        (_, index) => ({
            surah,
            ayah: firstAyah + index,
            key: `${surah}:${firstAyah + index}`,
        })
    );
}

async function fetchAyah({ surah, ayah, key }, edition) {
    let response;

    try {
        response = await fetch(
            `https://api.alquran.cloud/v1/ayah/${encodeURIComponent(key)}/${encodeURIComponent(edition)}`,
            { signal: AbortSignal.timeout(15000) }
        );
    } catch (error) {
        throw new AppError(
            `Could not retrieve Quran text: ${error.message}`,
            502
        );
    }

    const payload = await response.json().catch(() => null);
    const data = payload?.data;

    if (
        !response.ok ||
        payload?.code !== 200 ||
        Number(data?.surah?.number) !== surah ||
        Number(data?.numberInSurah) !== ayah ||
        !String(data?.text || "").trim() ||
        (
            edition === "quran-uthmani" &&
            !/[\u0600-\u06FF]/u.test(String(data.text))
        )
    ) {
        throw new AppError(
            `Quran text could not be verified for ${key} (${edition})`,
            502
        );
    }

    return {
        key,
        text: String(data.text).trim(),
        edition: data.edition?.identifier || edition,
        editionName: data.edition?.englishName || null,
    };
}

async function fetchArabicByReference(reference) {
    const keys = expandReference(reference);
    const verses = [];

    for (const key of keys) {
        const [arabic, translation] = await Promise.all([
            fetchAyah(key, "quran-uthmani"),
            fetchAyah(key, "en.sahih"),
        ]);
        verses.push({
            key: key.key,
            arabic: arabic.text,
            translation: translation.text,
            translationEdition:
                translation.editionName || "Saheeh International",
        });
    }

    return {
        reference: String(reference).trim(),
        edition: "quran-uthmani",
        translationEdition: "en.sahih",
        translationName: "Saheeh International",
        source: "api.alquran.cloud",
        verses,
        text: verses.map((verse) => verse.arabic).join("\n"),
        translation: verses
            .map((verse) => `[${verse.key}] ${verse.translation}`)
            .join("\n"),
    };
}

module.exports = {
    expandReference,
    fetchArabicByReference,
};
