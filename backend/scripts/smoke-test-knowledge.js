const baseUrl = process.env.BASE_URL || "http://localhost:3000";

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${response.status} ${path}: ${JSON.stringify(body)}`);
  }
  return body;
};

(async () => {
  const created = await request("/api/knowledge", {
    method: "POST",
    body: JSON.stringify({
      type: "MARRIAGE_TIP",
      title: `Milestone 1 test ${Date.now()}`,
      content: "Respect, patience and honest communication build healthy marriages.",
      language: "en",
      category: "Marriage",
      tags: ["milestone-1", "smoke-test"],
    }),
  });

  const id = created.data.id;
  await request(`/api/knowledge/${id}`);
  await request("/api/knowledge?page=1&limit=10");
  await request(`/api/knowledge/${id}`, {
    method: "PUT",
    body: JSON.stringify({ summary: "Updated by smoke test" }),
  });
  await request(`/api/knowledge/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "PENDING_APPROVAL" }),
  });
  await request(`/api/knowledge/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "APPROVED" }),
  });
  await request(`/api/knowledge/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "DRAFT" }),
  });
  await request(`/api/knowledge/${id}`, { method: "DELETE" });
  console.log("Milestone 1 smoke test passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
