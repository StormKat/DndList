import { getStore } from "@netlify/blobs";

const PORTRAIT_KEY = "syebastyian";

export default async (request) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  const store = getStore("character-portraits");
  const result = await store.getWithMetadata(PORTRAIT_KEY, {
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
