const profileImportService = require("../services/profileImportService");
const contentImportService = require("../services/contentImportService");

async function importProfiles(req, res, next) {
    try {
        const result = await profileImportService.importProfiles(req.body);
        return res.status(201).json({ success: true, message: "Production profiles imported successfully", data: result });
    } catch (error) { return next(error); }
}
async function importBooks(req, res, next) { try { return res.status(201).json({ success: true, message: "Books imported successfully", data: await contentImportService.importBooks() }); } catch (error) { return next(error); } }
async function importGuidelines(req, res, next) { try { return res.status(201).json({ success: true, message: "Guidelines imported successfully", data: await contentImportService.importGuidelines() }); } catch (error) { return next(error); } }
async function importBlogs(req, res, next) { try { return res.status(201).json({ success: true, message: "Blogs imported successfully", data: await contentImportService.importBlogs(req.body) }); } catch (error) { return next(error); } }
async function importAll(req, res, next) {
    try {
        const data = await contentImportService.importAll({ profileImportService, profileHours: req.body.profileHours, blogHours: req.body.blogHours, generateSummary: req.body.generateSummary });
        return res.status(201).json({ success: true, message: "All production content imported successfully", data });
    } catch (error) { return next(error); }
}
async function listImports(req, res, next) { try { const runs = await profileImportService.getImportRuns(req.validatedQuery.limit); return res.json({ success: true, count: runs.length, data: runs }); } catch (error) { return next(error); } }
async function importStatus(req, res, next) { try { return res.json({ success: true, data: await profileImportService.getImportStatus() }); } catch (error) { return next(error); } }
async function testConnection(req, res, next) { try { return res.json({ success: true, message: "Production database connection successful", data: await profileImportService.testConnection() }); } catch (error) { return next(error); } }

module.exports = { importProfiles, importBooks, importGuidelines, importBlogs, importAll, listImports, importStatus, testConnection };
