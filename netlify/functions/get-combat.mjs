import { getStore } from "@netlify/blobs";

const COMBAT_KEY = "syebastyian";

export default async (request) => {
  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405, { Allow: "GET" });
  }

  const store = getStore("character-combat");
  const result = await store.getWithMetadata(COMBAT_KEY, { type: "json" });

  if (!result) {
    return json({ data: null, updatedAt: null });
  }

  return json({
    data: result.data,
    updatedAt: result.metadata?.updatedAt || null,
  });
};

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}
