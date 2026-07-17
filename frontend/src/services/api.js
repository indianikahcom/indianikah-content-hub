const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(payload?.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.details = payload?.details || null;
    throw error;
  }

  return payload;
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const api = {
  getDashboardSummary() {
    return request("/dashboard/summary");
  },

  getQueue(params = {}) {
    return request(`/queue${buildQuery(params)}`);
  },
  addRandomQueueItem(data) {
    return request("/queue/random", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  approveQueueItem(id) {
    return request(`/queue/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
  publishQueueItem(id) {
    return request(`/queue/${id}/publish`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
  cancelQueueItem(id) {
    return request(`/queue/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  publishEverywhere(postId) {
    return request(`/posts/${postId}/publish`, {
      method: "POST",
      body: JSON.stringify({ platforms: "ALL" }),
    });
  },
  getPostCampaigns(postId) {
    return request(`/posts/${postId}/campaigns`);
  },
  retryCampaign(campaignId) {
    return request(`/campaigns/${campaignId}/retry`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
  createRandomDraft(data) {
    return request("/automation/random-draft", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  testProductionConnection() {
    return request("/imports/connection");
  },
  getImports(params) {
    return request(`/imports${buildQuery(params)}`);
  },
  importBooks() {
    return request("/imports/books", { method: "POST", body: JSON.stringify({}) });
  },
  importGuidelines() {
    return request("/imports/guidelines", { method: "POST", body: JSON.stringify({}) });
  },
  importBlogs(data = { hours: 168 }) {
    return request("/imports/blogs", { method: "POST", body: JSON.stringify(data) });
  },
  importAll(data = { profileHours: 24, blogHours: 168, generateSummary: true }) {
    return request("/imports/all", { method: "POST", body: JSON.stringify(data) });
  },
  getPrompts() {
    return request("/prompts");
  },
  updatePrompt(key, content) {
    return request(`/prompts/${key}`, { method: "PUT", body: JSON.stringify({ content }) });
  },
  generateAiFromSource(id) {
    return request(`/ai/sources/${id}/generate`, { method: "POST", body: JSON.stringify({}) });
  },
  regeneratePost(id) {
    return request(`/ai/posts/${id}/regenerate`, { method: "POST", body: JSON.stringify({}) });
  },
  getGenerationLogs(params = {}) {
    return request(`/ai/logs${buildQuery(params)}`);
  },
  importProfiles(data = { hours: 24, generateSummary: true }) {
    return request("/imports/profiles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  getSources(params) {
    return request(`/sources${buildQuery(params)}`);
  },
  getSource(id) {
    return request(`/sources/${id}`);
  },
  updateSourceStatus(id, status) {
    return request(`/sources/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  generatePostFromSource(id) {
    return request(`/sources/${id}/generate-post`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
  getPosts(params) {
    return request(`/posts${buildQuery(params)}`);
  },
  getPost(id) {
    return request(`/posts/${id}`);
  },
  createPost(data) {
    return request("/posts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updatePost(id, data) {
    return request(`/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  updatePostStatus(id, status) {
    return request(`/posts/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  publishPostToTelegram(id) {
    return request(`/posts/${id}/publish/telegram`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
  getPostPublications(id) {
    return request(`/posts/${id}/publications`);
  },
};
