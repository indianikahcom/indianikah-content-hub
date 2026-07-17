const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse({
        body: req.body,
        params: req.params,
        query: req.query
    });

    if (!result.success) {
        return res.status(400).json({
            status: "ERROR",
            message: "Validation failed",
            details: result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message
            }))
        });
    }

    if (result.data.body !== undefined) req.body = result.data.body;
    if (result.data.params !== undefined) req.validatedParams = result.data.params;
    if (result.data.query !== undefined) req.validatedQuery = result.data.query;

    return next();
};

module.exports = validate;
