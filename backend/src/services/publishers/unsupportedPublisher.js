async function publish({ platform }) {
    throw new Error(
        `${platform} publishing is not configured in Milestone 5`
    );
}

module.exports = { publish };
