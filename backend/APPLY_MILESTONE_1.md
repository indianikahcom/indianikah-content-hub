# IndiaNikah AI Content Hub — Knowledge Base Milestone 1

This package is intentionally non-destructive. Copy the included `src` folders
into your existing `backend/src` folder. Do not replace your full `app.js` or
`schema.prisma`.

## Included

- Complete Knowledge Item repository
- Service layer and business rules
- Controller layer
- REST routes
- Zod validation
- Pagination, search and filtering
- Status workflow
- Duplicate prevention
- Bulk approval submission
- Knowledge statistics
- Prisma schema reference
- API smoke-test script

## Expected Prisma model

The code expects:

```js
prisma.knowledgeItem
```

That means your Prisma schema model must be named:

```prisma
model KnowledgeItem
```

If your existing model has a different name, change `MODEL_NAME` at the top of:

```text
src/repositories/knowledgeRepository.js
```

## 1. Extract into the project

From:

```text
E:\projects\IndiaNikah\AI-Content-Hub\indianikah-content-hub
```

Extract this ZIP and copy the contents of its `backend` folder into your existing
`backend` folder.

## 2. Mount the route

Open `backend/src/app.js`.

Add with the other route imports:

```js
const knowledgeRoutes = require("./routes/knowledgeRoutes");
```

Add with the other `app.use(...)` lines, before the global error handler:

```js
app.use("/api/knowledge", knowledgeRoutes);
```

The global error handler must remain last.

## 3. Verify Prisma

Run:

```powershell
cd E:\projects\IndiaNikah\AI-Content-Hub\indianikah-content-hub\backend

npx prisma format
npx prisma validate
npx prisma generate
```

Because your Knowledge Base migration is already applied, do not create another
migration unless `schema.prisma` is not synchronized with that migration.

## 4. Start backend

```powershell
npm run dev
```

## 5. Smoke test

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-knowledge-milestone-1.ps1
```

## API

- `POST /api/knowledge`
- `GET /api/knowledge`
- `GET /api/knowledge/:id`
- `PUT /api/knowledge/:id`
- `PATCH /api/knowledge/:id`
- `PATCH /api/knowledge/:id/status`
- `DELETE /api/knowledge/:id`
- `GET /api/knowledge/statistics`
- `POST /api/knowledge/bulk/submit`

## Status transitions

- `DRAFT -> PENDING_APPROVAL | ARCHIVED`
- `PENDING_APPROVAL -> DRAFT | APPROVED | REJECTED | ARCHIVED`
- `APPROVED -> DRAFT | ARCHIVED`
- `REJECTED -> DRAFT | PENDING_APPROVAL | ARCHIVED`
- `ARCHIVED -> DRAFT`

Nothing is published by this module. Publishing integration belongs to a later
milestone and must still require APPROVED status.
