const express = require("express");

const app = express();

app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        version: "0.0.1"
    });
});

module.exports = app;