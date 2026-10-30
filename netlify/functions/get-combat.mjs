import { getStore } from "@netlify/blobs";

const DEFAULT_CHARACTER_KEY = "syebastyian";

export default async (request) => {
  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405, { Allow: "GET" });
  }

  const store = getStore("character-combat");
  const result = await store.getWithMetadata(getCharacterKey(request), { type: "json" });

  if (!result) {
    return json({ data: null, updatedAt: null });
  }

  return json({
    data: result.data,
    updatedAt: result.metadata?.updatedAt || null,
  });
};

function getCharacterKey(request) {
  const value = new URL(request.url).searchParams.get("character");
  return value && /^[a-z0-9_-]{1,40}$/i.test(value) ? value.toLowerCase() : DEFAULT_CHARACTER_KEY;
}

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
