# IndiaNikah Content Queue

Implemented:

- ContentQueueItem table and migration.
- Add random BOOK, GUIDELINE, or BLOG to queue.
- Never-published content remains preferred by the existing cooldown selector.
- Existing drafts are reused instead of duplicated.
- Manual review remains default.
- One-click Approve & Publish uses the campaign publisher.
- Queue scheduler is disabled by default.
- Optional scheduler fills the queue and can publish already-approved due items.
- Blog import now fetches all missing records instead of using a date window.
- Existing Telegram, campaign, prompt, source, PostVariant and legacy Publication data are preserved.

Recommended local settings:

```env
CONTENT_QUEUE_CRON_ENABLED=false
CONTENT_QUEUE_CRON="15 * * * *"
QUEUE_TARGET_READY=6
QUEUE_AUTO_PUBLISH=false
```

Keep `QUEUE_AUTO_PUBLISH=false` until you are comfortable with scheduled publishing.
