require("dotenv").config();
const app = require("./app");
const { startProfileImportJob } = require("./jobs/profileImportJob");
const { startContentQueueJob } = require("./jobs/contentQueueJob");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    startProfileImportJob();
    startContentQueueJob();
});
