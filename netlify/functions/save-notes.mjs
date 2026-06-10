import { getStore } from "@netlify/blobs";

const MAX_NOTES_SIZE = 100 * 1024;
const NOTES_KEY = "syebastyian";

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
  if (contentLength > MAX_NOTES_SIZE) {
    return json({ error: "Notes are too large" }, 413);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (typeof payload.notes !== "string") {
    return json({ error: "Notes must be text" }, 400);
  }

  const encodedNotes = new TextEncoder().encode(payload.notes);
  if (encodedNotes.byteLength > MAX_NOTES_SIZE) {
    return json({ error: "Notes are too large" }, 413);
  }

  const updatedAt = new Date().toISOString();
  const store = getStore("character-notes");
  await store.set(NOTES_KEY, payload.notes, {
    metadata: { updatedAt },
  });

  return json({ ok: true, updatedAt });
};

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}
