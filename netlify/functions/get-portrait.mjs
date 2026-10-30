import { getStore } from "@netlify/blobs";

const DEFAULT_CHARACTER_KEY = "syebastyian";

export default async (request) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  const store = getStore("character-portraits");
  const result = await store.getWithMetadata(getCharacterKey(request), {
    type: "arrayBuffer",
  });

  if (!result) {
    return new Response(null, { status: 404 });
  }

  const headers = {
    "content-type": result.metadata?.contentType || "image/jpeg",
    "cache-control": "no-cache",
  };

  if (request.method === "HEAD") {
    return new Response(null, { status: 200, headers });
  }

  return new Response(result.data, { status: 200, headers });
};

function getCharacterKey(request) {
  const value = new URL(request.url).searchParams.get("character");
  return value && /^[a-z0-9_-]{1,40}$/i.test(value) ? value.toLowerCase() : DEFAULT_CHARACTER_KEY;
}
