const express = require("express");
const healthRoutes = require("./routes/healthRoutes");
const postRoutes = require("./routes/postRoutes");
const sourceRoutes = require("./routes/sourceRoutes");
const importRoutes = require("./routes/importRoutes");
const generationRoutes = require("./routes/generationRoutes");
const composerRoutes = require("./routes/composerRoutes");
const promptRoutes = require("./routes/promptRoutes");
const aiGenerationRoutes = require("./routes/aiGenerationRoutes");
const errorHandler = require("./middleware/errorHandler");

const randomSourceRoutes = require("./routes/randomSourceRoutes");
const automationRoutes = require("./routes/automationRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const queueRoutes = require("./routes/queueRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const platformRoutes = require("./routes/platformRoutes");
const app = express();

app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api", postRoutes);
app.use("/api/sources/random", randomSourceRoutes);
app.use("/api/sources", sourceRoutes);
app.use("/api/imports", importRoutes);
app.use("/api/generation", generationRoutes);
app.use("/api/composer", composerRoutes);
app.use("/api/prompts", promptRoutes);
app.use("/api/ai", aiGenerationRoutes);



app.use("/api/automation", automationRoutes);

app.use("/api", campaignRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use("/api/platforms", platformRoutes);

// Global error handler must remain last
app.use(errorHandler);

module.exports = app;
