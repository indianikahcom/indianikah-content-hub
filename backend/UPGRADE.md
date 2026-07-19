# Upgrade Instructions

1. Stop the backend.
2. Back up the current backend directory and `prisma/dev.db`.
3. Extract this ZIP into a separate folder first.
4. Copy your existing `.env` into the extracted backend root.
5. Run `npm install`.
6. Run `npx prisma format` and `npx prisma generate`.
7. Run `npx prisma migrate dev --name backend_stabilization`.
8. Run `npm run check:syntax` and `npm run test:stabilization`.
9. Start with `npm run dev`.
10. Test `/api/health`, `/api/imports/connection`, and a RECENT summary import before enabling schedulers.

Do not copy `node_modules`, generated Prisma files, or the old local database from this package over your working installation.
