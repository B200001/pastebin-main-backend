import { redis } from "../_redis.js";

function nowMs(req) {
  if (
    process.env.TEST_MODE === "1" &&
    req.headers["x-test-now-ms"]
  ) {
    return Number(req.headers["x-test-now-ms"]);
  }
  return Date.now();
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  const paste = await redis.get(`paste:${id}`);

  if (!paste) {
    return res.status(404).json({ error: "Not found" });
  }

  const now = nowMs(req);

  // TTL
  if (paste.expires_at && now >= paste.expires_at) {
    await redis.del(`paste:${id}`);
    return res.status(404).json({ error: "Expired" });
  }

  // View limit
  if (paste.max_views !== null && paste.views >= paste.max_views) {
    return res.status(404).json({ error: "View limit exceeded" });
  }

  // Increment view
  paste.views += 1;
  await redis.set(`paste:${id}`, paste);

  res.status(200).json({
    content: paste.content,
    remaining_views:
      paste.max_views !== null
        ? Math.max(paste.max_views - paste.views, 0)
        : null,
    expires_at: paste.expires_at
      ? new Date(paste.expires_at).toISOString()
      : null,
  });
}
