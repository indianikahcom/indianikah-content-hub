# IndiaNikah AI Content Hub Backend

Express + Prisma/SQLite operational database with a SELECT-only production MySQL importer.

## Local setup

Keep the SSH tunnel open:

```powershell
ssh -L 3307:127.0.0.1:3306 root@YOUR_VPS_IP
```

Copy `.env.example` values into your existing `.env`, set the real production DB password, then:

```powershell
npm install
npx prisma migrate dev
npx prisma generate
npm run dev
```

## Production profile import

The importer explicitly selects privacy-safe profile fields. It does not select names, email, phone/WhatsApp, passwords, OTPs, addresses, verification documents, or private interaction histories.

APIs:

- `GET /api/imports/connection` - test the SELECT-only MySQL connection
- `POST /api/imports/profiles` - import recent profiles and create an anonymized daily summary draft
- `GET /api/imports?limit=20` - import history

Manual import body:

```json
{ "hours": 24, "generateSummary": true }
```

Imported profiles become `ContentSource` records with `externalId=profile:<profile_code>`. Duplicate profiles are skipped. A daily anonymized `PROFILE_SUMMARY` source and `DRAFT` post are generated once per India date.

## Scheduler

The scheduler is disabled by default. On the VPS set:

```env
PROFILE_IMPORT_CRON_ENABLED=true
PROFILE_IMPORT_CRON="0 8 * * *"
PROD_DB_PORT=3306
```

The cron runs in `Asia/Kolkata`.

## Telegram publishing

Required `.env` values:

```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHANNEL_ID=@IndiaNikah
TELEGRAM_PUBLISH_ENABLED=true
```

Apply the Publication migration and regenerate Prisma Client:

```bash
npx prisma migrate dev
npx prisma generate
```

API endpoints:

- `POST /api/posts/:id/publish/telegram` — publish an APPROVED post
- `GET /api/posts/:id/publications` — publication history

A successful `(postId, platform)` publication is unique, preventing duplicate Telegram posts. Failed attempts may be retried.
