const { ZodError } = require("zod");
const logger = require("../logger/logger");

function errorHandler(error, request, response, next) {
    if (error instanceof ZodError) {
        return response.status(400).json({
            status: "ERROR",
            message: "Validation failed",
            errors: error.issues
        });
    }

    logger.error(error.stack);

    return response.status(500).json({
        status: "ERROR",
        message: "Internal server error"
    });
}

module.exports = errorHandler;