/**
 * Zabanyar Gemini proxy — Cloudflare Worker.
 * Keeps GEMINI_API_KEY on the server; the app calls  <worker-url>/v1beta/models/<model>:generateContent  without a key.
 * Env vars (wrangler secret / dashboard):
 *   GEMINI_API_KEY   (secret, required)
 *   ALLOWED_ORIGINS  comma-separated, e.g. "https://zabanyar.example.com,capacitor://localhost,https://localhost"  ("*" = any; not recommended)
 *   ALLOWED_MODELS   optional, comma-separated, default "gemini-3.8-flash,gemini-3.5-flash-lite,gemini-flash-latest"
 *   RATE_PER_MIN     optional per-IP requests/minute (best-effort, per isolate), default 30
 */
const hits = new Map();
export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
    const okOrigin = allowed.includes("*") || allowed.includes(origin);
    const cors = { "Access-Control-Allow-Origin": okOrigin ? (origin || "*") : "null", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", Vary: "Origin" };
    const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });
    if (req.method === "OPTIONS") return new Response(null, { status: okOrigin ? 204 : 403, headers: cors });
    if (!okOrigin) return json(403, { error: { message: "Origin not allowed", status: "FORBIDDEN" } });
    if (req.method !== "POST") return json(405, { error: { message: "Method not allowed" } });
    const url = new URL(req.url);
    const m = url.pathname.match(/^\/v1beta\/models\/([a-z0-9.\-]+):generateContent$/);
    const models = (env.ALLOWED_MODELS || "gemini-3.8-flash,gemini-3.5-flash-lite,gemini-flash-latest").split(",").map(s => s.trim());
    if (!m || !models.includes(m[1])) return json(404, { error: { message: "Model or path not allowed", status: "NOT_FOUND" } });
    const ip = req.headers.get("CF-Connecting-IP") || "?", now = Date.now(), limit = +(env.RATE_PER_MIN || 30);
    const h = (hits.get(ip) || []).filter(t => now - t < 60000); h.push(now); hits.set(ip, h);
    if (h.length > limit) return json(429, { error: { message: "Rate limit exceeded", status: "RESOURCE_EXHAUSTED" } });
    const len = +(req.headers.get("Content-Length") || 0); if (len > 4_000_000) return json(413, { error: { message: "Payload too large" } });
    const body = await req.text(); if (body.length > 4_000_000) return json(413, { error: { message: "Payload too large" } });
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m[1]}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY }, body });
    return new Response(upstream.body, { status: upstream.status, headers: { ...cors, "Content-Type": "application/json" } });
  }
};
