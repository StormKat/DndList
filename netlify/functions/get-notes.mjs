import { getStore } from "@netlify/blobs";

const NOTES_KEY = "syebastyian";

export default async (request) => {
  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405, { Allow: "GET" });
  }

  const store = getStore("character-notes");
  const result = await store.getWithMetadata(NOTES_KEY, { type: "text" });

  if (!result) {
    return json({ notes: "", updatedAt: null });
  }

  return json({
    notes: result.data,
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
