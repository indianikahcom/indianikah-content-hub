# IndiaNikah Knowledge Base patch

This patch adds structured support for Quran verses, Hadith, duas, Islamic articles, marriage guides/tips, books, videos, blogs, profiles, news, statistics, AI insights, manual content and external APIs.

## Install

1. Extract this ZIP into the backend root with `-Force`.
2. Apply `PRISMA-SCHEMA-ADDITION.txt` to `prisma/schema.prisma`.
3. Apply `APP-PATCH.txt` to `src/app.js`.
4. Run:

```powershell
npx prisma migrate dev
npx prisma generate
npm run dev
```

The included SQL migration is supplied for reference. `prisma migrate dev` should be preferred after updating the schema.

## Main APIs

- `POST /api/knowledge`
- `GET /api/knowledge`
- `GET /api/knowledge/:id`
- `PUT /api/knowledge/:id`
- `PATCH /api/knowledge/:id/status`
- `POST /api/knowledge/:id/references`
- `POST /api/knowledge/:id/assets`
- `POST /api/knowledge/:id/create-source`

`create-source` connects verified/review-ready knowledge to the existing ContentSource -> Draft -> Approval -> Publish pipeline.

## Quran example

```json
{
  "type": "QURAN_VERSE",
  "category": "Marriage",
  "title": "Tranquility, affection and mercy in marriage",
  "language": "en",
  "originalArabic": "...",
  "translation": "...",
  "content": "Surah Ar-Rum 30:21",
  "reference": "Quran 30:21",
  "referenceQuality": "PRIMARY_ISLAMIC_SOURCE",
  "status": "NEEDS_REVIEW",
  "references": [{
    "referenceType": "PRIMARY_ISLAMIC_SOURCE",
    "sourceName": "The Quran",
    "citation": "Surah Ar-Rum, 30:21",
    "referenceNumber": "30:21",
    "isPrimary": true
  }]
}
```

## Hadith example

```json
{
  "type": "HADITH",
  "category": "Marriage",
  "title": "Kind treatment of one's family",
  "content": "Hadith text or verified translation",
  "reference": "Collection and hadith number",
  "referenceQuality": "PRIMARY_ISLAMIC_SOURCE",
  "status": "NEEDS_REVIEW",
  "references": [{
    "referenceType": "PRIMARY_ISLAMIC_SOURCE",
    "collection": "Collection name",
    "referenceNumber": "Hadith number",
    "authenticity": "Sahih/Hasan/etc.",
    "isPrimary": true
  }]
}
```
