const {
    startContentAutomationScheduler,
    stopContentAutomationScheduler,
} = require("./schedulers/contentAutomationScheduler");
require("dotenv").config();
const app = require("./app");
const { startProfileImportJob } = require("./jobs/profileImportJob");
const { startContentQueueJob } = require("./jobs/contentQueueJob");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    startContentAutomationScheduler();
    startProfileImportJob();
    startContentQueueJob();
});

// Keep the API alive even when all optional schedulers are disabled.
server.ref();
const processKeepAlive = setInterval(() => {}, 60_000);

server.on("error", (error) => {
    console.error(`HTTP server failed: ${error.stack || error.message}`);
    process.exitCode = 1;
});

server.on("close", () => {
    clearInterval(processKeepAlive);
});

function shutdown(signal) {
    console.log(`${signal} received; closing HTTP server`);
    stopContentAutomationScheduler();

    const forceShutdown = setTimeout(() => {
        console.error("HTTP server shutdown timed out; forcing exit");
        server.closeAllConnections?.();
        process.exit(1);
    }, 10_000);
    forceShutdown.unref();

    server.close((error) => {
        clearTimeout(forceShutdown);
        clearInterval(processKeepAlive);

        if (error) {
            console.error(`HTTP server shutdown failed: ${error.message}`);
            process.exit(1);
        }

        process.exit(0);
    });
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
