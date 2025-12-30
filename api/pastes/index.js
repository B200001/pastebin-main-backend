import { nanoid } from "nanoid";
import { redis } from "../_redis.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { content, ttl_seconds, max_views } = req.body;

  // Validation
  if (!content || typeof content !== "string" || content.trim() === "") {
    return res.status(400).json({ error: "Invalid content" });
  }

  if (
    ttl_seconds !== undefined &&
    (!Number.isInteger(ttl_seconds) || ttl_seconds < 1)
  ) {
    return res.status(400).json({ error: "Invalid ttl_seconds" });
  }

  if (
    max_views !== undefined &&
    (!Number.isInteger(max_views) || max_views < 1)
  ) {
    return res.status(400).json({ error: "Invalid max_views" });
  }

  const id = nanoid(10);
  const createdAt = Date.now();
  const expiresAt = ttl_seconds
    ? createdAt + ttl_seconds * 1000
    : null;

  await redis.set(`paste:${id}`, {
    content,
    views: 0,
    max_views: max_views ?? null,
    expires_at: expiresAt,
  });

  res.status(201).json({
    id,
    url: `${req.headers.origin}/p/${id}`,
  });
}
