# IndiaNikah AI image generation patch

This patch adds:

- `POST /api/posts/:id/generate-image`
- OpenAI image generation with local file caching
- Public serving from `/generated-media`
- Instagram automatic image validation
- On-the-fly AI generation when source images are missing or broken
- Default image fallback if AI generation is disabled or fails

## Extract

Extract the ZIP directly into the backend folder with overwrite enabled.

## Required `.env`

```env
AI_IMAGE_GENERATION_ENABLED=true
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_IMAGE_MODEL=gpt-image-1
OPENAI_IMAGE_SIZE=1024x1024
OPENAI_IMAGE_QUALITY=medium
OPENAI_IMAGE_OUTPUT_FORMAT=png
AI_IMAGE_OUTPUT_DIR=public/generated-media
AI_IMAGE_PUBLIC_BASE_URL=https://YOUR_PUBLIC_BACKEND_DOMAIN/generated-media
AI_IMAGE_BRAND_NAME=IndiaNikah
```

Keep your existing Instagram variables.

`AI_IMAGE_PUBLIC_BASE_URL` must be reachable by Meta over public HTTPS. A localhost URL cannot be used by Instagram.

## App integration

Add these lines to `src/app.js` if the included `APP-PATCH.txt` has not been applied automatically:

```js
const path = require("path");
const imageGenerationRoutes = require("./routes/imageGenerationRoutes");

app.use(
    "/generated-media",
    express.static(path.resolve(process.cwd(), "public/generated-media"))
);
app.use("/api", imageGenerationRoutes);
```

Place the static route after `app.use(express.json())`, and place the API route before the global error handler.

## Test image generation

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/posts/21/generate-image" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"force":true}' |
ConvertTo-Json -Depth 20
```

Then publish to Instagram normally.

## Important

The generated file is cached by post content. Re-publishing the same unchanged post does not generate and bill for another image.
