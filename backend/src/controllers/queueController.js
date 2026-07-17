const queueService = require("../services/queueService");

async function addRandom(req, res, next) {
    try {
        const data = await queueService.addRandom(req.body);
        return res.status(data.created ? 201 : 200).json({
            success: true,
            message: data.created
                ? "Random content added to the queue"
                : "The selected post is already in the queue",
            data,
        });
    } catch (error) {
        next(error);
    }
}

async function list(req, res, next) {
    try {
        const data = await queueService.list(req.query);
        return res.json({
            success: true,
            count: data.length,
            data,
        });
    } catch (error) {
        next(error);
    }
}

async function get(req, res, next) {
    try {
        return res.json({
            success: true,
            data: await queueService.getById(req.params.id),
        });
    } catch (error) {
        next(error);
    }
}

async function approve(req, res, next) {
    try {
        return res.json({
            success: true,
            message: "Queue post approved",
            data: await queueService.approve(req.params.id),
        });
    } catch (error) {
        next(error);
    }
}

async function publish(req, res, next) {
    try {
        return res.json({
            success: true,
            message: "Queue item publishing completed",
            data: await queueService.publish(req.params.id),
        });
    } catch (error) {
        next(error);
    }
}

async function cancel(req, res, next) {
    try {
        return res.json({
            success: true,
            message: "Queue item cancelled",
            data: await queueService.remove(req.params.id),
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    addRandom,
    list,
    get,
    approve,
    publish,
    cancel,
};
