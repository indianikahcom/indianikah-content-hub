# IndiaNikah Admin Dashboard Upgrade

Added:

- Live operational summary endpoint: `GET /api/dashboard/summary`
- Dedicated Content Queue page
- Dedicated Prompt Settings page
- Queue, campaign, source and post statistics
- Recent queue and campaign activity
- Platform success-rate summary
- Import All from the top bar
- Publish Everywhere inside post review
- Telegram-only legacy publish button removed from the main workflow
- Visible encoding cleanup in App.jsx

No Prisma migration is required for this dashboard upgrade.
It uses the queue and campaign tables already installed.
