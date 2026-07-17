const { ZodError } = require("zod");
const logger = require("../logger/logger");
const AppError = require("../errors/AppError");

function errorHandler(error, request, response, next) {
    if (error instanceof ZodError) {
        return response.status(400).json({
            status: "ERROR",
            message: "Validation failed",
            errors: error.issues
        });
    }

    if (error instanceof AppError) {
        return response.status(error.statusCode).json({
            status: "ERROR",
            message: error.message,
            details: error.details
        });
    }

    logger.error(error.stack || error.message);

    return response.status(500).json({
        status: "ERROR",
        message: "Internal server error"
    });
}

module.exports = errorHandler;