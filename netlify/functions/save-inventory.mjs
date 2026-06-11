import { getStore } from "@netlify/blobs";

const MAX_INVENTORY_SIZE = 256 * 1024;
const INVENTORY_KEY = "syebastyian";

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
  if (contentLength > MAX_INVENTORY_SIZE) {
    return json({ error: "Inventory is too large" }, 413);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!isValidInventory(payload)) {
    return json({ error: "Invalid inventory data" }, 400);
  }

  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  if (encoded.byteLength > MAX_INVENTORY_SIZE) {
    return json({ error: "Inventory is too large" }, 413);
  }

  const updatedAt = new Date().toISOString();
  const store = getStore("character-inventory");
  await store.setJSON(INVENTORY_KEY, payload, {
    metadata: { updatedAt },
  });

  return json({ ok: true, updatedAt });
};

function isValidInventory(payload) {
  if (!payload || payload.version !== 1 || !Array.isArray(payload.categories)) {
    return false;
  }
  if (!payload.currency || !Number.isFinite(payload.currency.gold) || !Number.isFinite(payload.currency.silver)) {
    return false;
  }
  if (payload.categories.length > 20) return false;

  return payload.categories.every((category) =>
    category &&
    typeof category.id === "string" &&
    typeof category.title === "string" &&
    Array.isArray(category.items) &&
    category.items.length <= 100 &&
    category.items.every((item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      item.name.length <= 120 &&
      Number.isInteger(item.quantity) &&
      item.quantity >= 0 &&
      item.quantity <= 99999
    )
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
