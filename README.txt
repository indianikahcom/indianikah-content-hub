IndiaNikah AI Content Hub - Milestone 2.1 Summary Refactor

Changes:
- Profile imports now use profileSummaryStatsService + profileSummaryTemplateService.
- Removed percentage output and legacy *-wise headings from profileImportService.
- Preserved cursor import, recent import, source refresh, queue creation, and read-only production DB behavior.
- No Prisma schema or migration changes.

Install:
1. Stop the backend.
2. Extract this ZIP into the project root (the folder containing backend), allowing overwrite.
3. From backend run:
   node --check src/services/profileImportService.js
   node --check src/services/profileSummaryStatsService.js
   node --check src/services/profileSummaryTemplateService.js
   node --check src/services/profileDailySummaryService.js
4. Start the backend.
5. Run a recent profile import with generateSummary=true.

Expected headings:
Gender, Age Groups, Top Cities, Top States, Occupations, Education, Marital Status.
No percentages are included.
