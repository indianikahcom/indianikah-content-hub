IndiaNikah LinkedIn Publisher v2
===================================

Purpose
-------
Adds LinkedIn PERSONAL and ORGANIZATION publishing while preserving the
existing Telegram and Facebook publishers.

Included file
-------------
backend/src/services/platformPublishers.js

The existing controller and route do not need replacement if these already exist:

GET /api/platforms/linkedin/test
POST /api/posts/:id/publish

Recommended installation
------------------------
1. Extract this ZIP outside the repository, for example:

   E:\Temp\indianikah-linkedin-personal-v2

2. From the repository root run:

   powershell -ExecutionPolicy Bypass `
     -File "E:\Temp\indianikah-linkedin-personal-v2\APPLY-LINKEDIN-PERSONAL-V2.ps1"

The installer creates a timestamped backup of the existing
platformPublishers.js before replacing it. It also safely handles the case
where the package was extracted directly into the repository.

Personal publishing configuration
---------------------------------
PUBLISH_PLATFORMS=TELEGRAM,FACEBOOK,LINKEDIN

LINKEDIN_PUBLISH_ENABLED=true
LINKEDIN_PUBLISH_TARGET=PERSONAL
LINKEDIN_MEMBER_ID=your_member_id
LINKEDIN_ACCESS_TOKEN=your_new_access_token
LINKEDIN_VERSION=202606

LINKEDIN_ORGANIZATION_ID is not required for PERSONAL publishing.

Organization publishing configuration
-------------------------------------
LINKEDIN_PUBLISH_TARGET=ORGANIZATION
LINKEDIN_ORGANIZATION_ID=your_numeric_organization_id

Restart and test
----------------
cd backend
npm run dev

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/platforms/linkedin/test" `
  -Method Get |
ConvertTo-Json -Depth 10

Publish an approved post
------------------------
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/posts/POST_ID/publish" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"platforms":"ALL"}' |
ConvertTo-Json -Depth 20

Security
--------
The client secret and access token previously pasted into chat must be
rotated before testing this package. Never commit backend/.env.
