const AppError = require("../errors/AppError");

function extractOutputText(data) {
    if (data.output_text) return data.output_text;
    for (const item of data.output || []) {
        for (const part of item.content || []) {
            if (part.type === "output_text" && part.text) return part.text;
        }
    }
    return null;
}

async function generateJson({ systemPrompt, userPrompt }) {
    if (String(process.env.AI_GENERATION_ENABLED).toLowerCase() !== "true") {
        throw new AppError("AI generation is disabled. Set AI_GENERATION_ENABLED=true after configuring OPENAI_API_KEY.", 409);
    }
    if (!process.env.OPENAI_API_KEY) throw new AppError("OPENAI_API_KEY is not configured", 503);
    const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";
    const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model,
            instructions: systemPrompt,
            input: `Return the result as valid JSON with exactly two string keys: "title" and "content".` + "`n`n" + userPrompt,
            text: { format: { type: "json_object" } }
        })
    });
    const data = await response.json();
    if (!response.ok) throw new AppError(data?.error?.message || "OpenAI generation failed", 502);
    const text = extractOutputText(data);
    if (!text) throw new AppError("AI provider returned no text", 502);
    let parsed;
    try { parsed = JSON.parse(text); } catch { throw new AppError("AI provider returned invalid JSON", 502); }
    if (!parsed.title || !parsed.content) throw new AppError("AI response must contain title and content", 502);
    return { title: String(parsed.title).trim(), content: String(parsed.content).trim(), model };
}
module.exports = { generateJson };
