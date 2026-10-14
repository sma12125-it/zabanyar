// Zabanyar Gemini proxy — plain Node.js (>=18), zero dependencies. Run on any VPS outside Iran.
// GEMINI_API_KEY=... ALLOWED_ORIGINS=https://your.site PORT=8787 node node-server.mjs
// Optionally serve the web app too: STATIC_DIR=../dist  (then app + proxy share one HTTPS origin behind nginx/caddy)
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const KEY = process.env.GEMINI_API_KEY, PORT = +(process.env.PORT || 8787), RATE = +(process.env.RATE_PER_MIN || 30);
const ALLOWED = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
const MODELS = (process.env.ALLOWED_MODELS || "gemini-3.8-flash,gemini-3.5-flash-lite,gemini-flash-latest").split(",").map(s => s.trim());
const STATIC = process.env.STATIC_DIR ? path.resolve(process.env.STATIC_DIR) : null;
if (!KEY) { console.error("Set GEMINI_API_KEY"); process.exit(1); }
const hits = new Map(), TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
http.createServer(async (req, res) => {
  const origin = req.headers.origin || ""; const okOrigin = !origin || ALLOWED.includes("*") || ALLOWED.includes(origin);
  const cors = { "Access-Control-Allow-Origin": origin && okOrigin ? origin : "null", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" };
  const send = (s, o) => { res.writeHead(s, { ...cors, "Content-Type": "application/json" }); res.end(JSON.stringify(o)); };
  const url = new URL(req.url, "http://x"); const m = url.pathname.match(/^\/v1beta\/models\/([a-z0-9.\-]+):generateContent$/);
  if (!m && req.method === "GET" && STATIC) { let p = path.join(STATIC, decodeURIComponent(url.pathname)); if (!p.startsWith(STATIC)) return send(403, {}); if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
    if (!fs.existsSync(p)) return send(404, { error: { message: "not found" } }); res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream", "Cache-Control": p.endsWith("sw.js") || p.endsWith("index.html") ? "no-cache" : "public, max-age=3600" }); return fs.createReadStream(p).pipe(res); }
  if (req.method === "OPTIONS") { res.writeHead(okOrigin ? 204 : 403, cors); return res.end(); }
  if (!okOrigin) return send(403, { error: { message: "Origin not allowed" } });
  if (req.method !== "POST" || !m || !MODELS.includes(m[1])) return send(404, { error: { message: "Model or path not allowed", status: "NOT_FOUND" } });
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress, now = Date.now(); const h = (hits.get(ip) || []).filter(t => now - t < 60000); h.push(now); hits.set(ip, h);
  if (h.length > RATE) return send(429, { error: { message: "Rate limit exceeded", status: "RESOURCE_EXHAUSTED" } });
  let body = ""; for await (const c of req) { body += c; if (body.length > 4_000_000) return send(413, { error: { message: "Payload too large" } }); }
  try { const up = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m[1]}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": KEY }, body });
    res.writeHead(up.status, { ...cors, "Content-Type": "application/json" }); res.end(await up.text()); } catch (e) { send(502, { error: { message: "Upstream error" } }); }
}).listen(PORT, () => console.log(`Zabanyar proxy on :${PORT}${STATIC ? " (serving " + STATIC + ")" : ""}`));
