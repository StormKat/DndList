import { getStore } from "@netlify/blobs";

const MAX_COMBAT_SIZE = 1024 * 1024;
const COMBAT_KEY = "syebastyian";

export default async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, { Allow: "POST" });
  }

  const expectedToken = Netlify.env.get("PORTRAIT_UPLOAD_TOKEN");
  const suppliedToken = request.headers.get("x-upload-token");

  if (!expectedToken) {
    return json({ error: "Edit password is not configured" }, 503);
  }

  if (!suppliedToken || suppliedToken !== expectedToken) {
    return json({ error: "Wrong edit password" }, 401);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_COMBAT_SIZE) {
    return json({ error: "Combat data is too large" }, 413);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!isValidPayload(payload)) {
    return json({ error: "Invalid combat data" }, 400);
  }

  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  if (encoded.byteLength > MAX_COMBAT_SIZE) {
    return json({ error: "Combat data is too large" }, 413);
  }

  const updatedAt = new Date().toISOString();
  const store = getStore("character-combat");
  await store.setJSON(COMBAT_KEY, payload, {
    metadata: { updatedAt },
  });

  return json({ ok: true, updatedAt });
};

function isValidPayload(payload) {
  return (
    payload &&
    typeof payload === "object" &&
    payload.combatState &&
    typeof payload.combatState === "object" &&
    payload.combatState.version === 1 &&
    Array.isArray(payload.combatState.entities) &&
    Array.isArray(payload.combatState.log) &&
    Array.isArray(payload.combatArchive) &&
    payload.combatArchive.length <= 30
  );
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}
