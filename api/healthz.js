import { redis } from "./_redis.js";
import { setCors } from "./_cors.js";

export default async function handler(req, res) {
  setCors(res)
  try {
    await redis.ping();
    res.status(200).json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
}
