# IndiaNikah AI Content Hub Admin UI

React + Vite admin dashboard for the IndiaNikah Content Hub backend.

## Included

- Dashboard metrics
- Content-source listing
- Source search, type filter, status filter, and pagination
- Source details and metadata view
- Generate draft post from a source
- Source reject/archive actions
- Post listing and status filtering
- Manual post creation
- Post editing
- Submit for approval
- Approve post
- Return approved/pending post to draft
- Responsive mobile layout
- Toast notifications and confirmation dialogs

## Expected backend

The backend should run at:

```text
http://localhost:3000
```

Vite proxies `/api` requests to that backend, so no CORS changes are required during local development.

## Install

```powershell
cd E:\projects\IndiaNikah\AI-Content-Hub\indianikah-content-hub

# Extract this project as the frontend folder
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Production build

```powershell
npm run build
```

The production files are created in `dist`.

## API endpoints used

```text
GET    /api/sources
GET    /api/sources/:id
PATCH  /api/sources/:id/status
POST   /api/sources/:id/generate-post

GET    /api/posts
GET    /api/posts/:id
POST   /api/posts
PUT    /api/posts/:id
PATCH  /api/posts/:id/status
```

## Environment

The default API base path is `/api`. To override it, copy `.env.example` to `.env`:

```env
VITE_API_BASE_URL=/api
```
