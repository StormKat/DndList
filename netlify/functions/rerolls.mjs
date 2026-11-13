import { getStore } from '@netlify/blobs';

export default async request => {
  const json = (data, status = 200) => Response.json(data, {
    status, headers: { 'cache-control': 'no-store' }
  });
  const key = new URL(request.url).searchParams.get('character');
  if (!key || !/^[a-z0-9_-]{1,40}$/.test(key)) return json({}, 400);
  if (request.method === 'POST') {
    const token = Netlify.env.get('PORTRAIT_UPLOAD_TOKEN');
    if (!token || request.headers.get('x-upload-token') !== token) return json({}, 401);
  } else if (request.method !== 'GET') {
    return json({}, 405);
  }

  const store = getStore({ name: 'character-rerolls', consistency: 'strong' });
  const entry = await store.getWithMetadata(key, { type: 'json' });
  const current = { count: entry?.data.count ?? null, revision: entry?.etag ?? null };
  if (request.method === 'GET') return json(current);

  const payload = await request.json().catch(() => null);
  if (!Number.isSafeInteger(payload?.count) || payload.count < 0) return json({}, 400);
  if (payload.revision !== current.revision) return json(current, 409);
  const result = await store.setJSON(key, { count: payload.count },
    entry ? { onlyIfMatch: entry.etag } : { onlyIfNew: true });
  if (!result.modified) return json({}, 409);
  return json({ count: payload.count, revision: result.etag });
};
