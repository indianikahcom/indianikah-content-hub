const express = require("express");
const healthRoutes = require("./routes/healthRoutes");
const postRoutes = require("./routes/postRoutes");

const app = express();

app.use(express.json());

app.use("/", healthRoutes);
app.use("/api", postRoutes);

module.exports = app;