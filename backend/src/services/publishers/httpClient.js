async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    const text = await response.text();

    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { raw: text };
    }

    if (!response.ok) {
        const error = new Error(
            data?.error?.message ||
                data?.message ||
                `HTTP ${response.status}`
        );
        error.statusCode = response.status;
        error.responseData = data;
        throw error;
    }

    return data;
}

module.exports = {
    requestJson,
};
