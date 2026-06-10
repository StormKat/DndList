import { getStore } from "@netlify/blobs";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PORTRAIT_KEY = "syebastyian";

export default async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, { Allow: "POST" });
  }

  const expectedToken = Netlify.env.get("PORTRAIT_UPLOAD_TOKEN");
  const suppliedToken = request.headers.get("x-upload-token");

  if (!expectedToken) {
    return json({ error: "Upload password is not configured" }, 503);
  }

  if (!suppliedToken || suppliedToken !== expectedToken) {
    return json({ error: "Wrong upload password" }, 401);
  }

  const contentType = request.headers.get("content-type")?.split(";")[0];
  if (!contentType || !ALLOWED_TYPES.has(contentType)) {
    return json({ error: "Only JPG, PNG and WEBP files are allowed" }, 415);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_FILE_SIZE) {
    return json({ error: "File is larger than 4 MB" }, 413);
  }

  const file = await request.arrayBuffer();
  if (file.byteLength === 0) {
    return json({ error: "The uploaded file is empty" }, 400);
  }
  if (file.byteLength > MAX_FILE_SIZE) {
    return json({ error: "File is larger than 4 MB" }, 413);
  }
  if (!matchesImageSignature(file, contentType)) {
    return json({ error: "The file contents do not match its image type" }, 415);
  }

  const store = getStore("character-portraits");
  await store.set(PORTRAIT_KEY, file, {
    metadata: {
      contentType,
      updatedAt: new Date().toISOString(),
    },
  });

  return json({ ok: true });
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

function matchesImageSignature(file, contentType) {
  const bytes = new Uint8Array(file);

  if (contentType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (contentType === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((byte, index) => bytes[index] === byte);
  }

  if (contentType === "image/webp") {
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  }

  return false;
}
