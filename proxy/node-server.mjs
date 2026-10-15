// Zabanyar Gemini proxy — plain Node.js (>=18), zero dependencies. Run on any VPS outside Iran.
// GEMINI_API_KEY=... ALLOWED_ORIGINS=https://your.site PORT=8787 node node-server.mjs
// Optionally serve the web app too: STATIC_DIR=../dist  (then app + proxy share one HTTPS origin behind nginx/caddy)
import http from "node:http"; import https from "node:https"; import fs from "node:fs"; import path from "node:path";
const KEY = process.env.GEMINI_API_KEY, PORT = +(process.env.PORT || 8787), RATE = +(process.env.RATE_PER_MIN || 60);
const ALLOWED = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
const MODELS = (process.env.ALLOWED_MODELS || "gemini-3.1-flash-lite,gemini-3.5-flash-lite,gemini-2.5-flash-lite,gemini-3.8-flash,gemini-flash-latest,gemini-3.8-flash-tts,gemini-3.8-flash-lite-tts,gemini-3.8-live").split(",").map(s => s.trim());
const UPSTREAM = new URL(process.env.UPSTREAM || "https://generativelanguage.googleapis.com"); // override only for testing
const LIVE_PATH = "/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";
const STATIC = process.env.STATIC_DIR ? path.resolve(process.env.STATIC_DIR) : null;
const PROV = { groq: ["https://api.groq.com/openai/v1", "GROQ_API_KEY"], openrouter: ["https://openrouter.ai/api/v1", "OPENROUTER_API_KEY"], mistral: ["https://api.mistral.ai/v1", "MISTRAL_API_KEY"], cerebras: ["https://api.cerebras.ai/v1", "CEREBRAS_API_KEY"], xai: ["https://api.x.ai/v1", "XAI_API_KEY"] }, PPATHS = ["/chat/completions", "/audio/transcriptions", "/audio/speech"];
if (!KEY && !Object.values(PROV).some(p => process.env[p[1]])) { console.error("Set GEMINI_API_KEY and/or GROQ_API_KEY, OPENROUTER_API_KEY, MISTRAL_API_KEY, CEREBRAS_API_KEY, XAI_API_KEY"); process.exit(1); }
const hits = new Map(), TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || ""; const okOrigin = !origin || ALLOWED.includes("*") || ALLOWED.includes(origin);
  const cors = { "Access-Control-Allow-Origin": origin && okOrigin ? origin : "null", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" };
  const send = (s, o) => { res.writeHead(s, { ...cors, "Content-Type": "application/json" }); res.end(JSON.stringify(o)); };
  const url = new URL(req.url, "http://x"); const m = url.pathname.match(/^\/v1beta\/models\/([a-z0-9.\-]+):generateContent$/) || (url.pathname === "/v1beta/interactions" || url.pathname === "/live-token" ? [url.pathname, null] : null);
  if (!m && req.method === "GET" && STATIC) { let p = path.join(STATIC, decodeURIComponent(url.pathname)); if (!p.startsWith(STATIC)) return send(403, {}); if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
    if (!fs.existsSync(p)) return send(404, { error: { message: "not found" } }); res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream", "Cache-Control": p.endsWith("sw.js") || p.endsWith("index.html") ? "no-cache" : "public, max-age=3600" }); return fs.createReadStream(p).pipe(res); }
  if (req.method === "OPTIONS") { res.writeHead(okOrigin ? 204 : 403, cors); return res.end(); }
  if (!okOrigin) return send(403, { error: { message: "Origin not allowed" } });
  const pm = url.pathname.match(/^\/p\/([a-z]+)(\/.*)$/);
  if (pm && req.method === "POST") { const pv = PROV[pm[1]], pk = pv && process.env[pv[1]]; if (!pk || !PPATHS.includes(pm[2])) return send(404, { error: { message: "Provider or path not enabled on this proxy" } });
    const ch = []; let n = 0; for await (const c of req) { n += c.length; if (n > 26_000_000) return send(413, { error: { message: "Payload too large" } }); ch.push(c); }
    try { const up = await fetch(pv[0] + pm[2], { method: "POST", headers: { "Content-Type": req.headers["content-type"] || "application/json", Authorization: "Bearer " + pk }, body: Buffer.concat(ch) });
      res.writeHead(up.status, { ...cors, "Content-Type": up.headers.get("content-type") || "application/json" }); return res.end(Buffer.from(await up.arrayBuffer())); } catch (e) { return send(502, { error: { message: "Upstream error" } }); } }
  if (!KEY && m) return send(404, { error: { message: "Gemini not enabled on this proxy" } });
  if (req.method !== "POST" || !m || (m[1] && !MODELS.includes(m[1]))) return send(404, { error: { message: "Model or path not allowed", status: "NOT_FOUND" } });
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress, now = Date.now(); const h = (hits.get(ip) || []).filter(t => now - t < 60000); h.push(now); hits.set(ip, h);
  if (h.length > RATE) return send(429, { error: { message: "Rate limit exceeded", status: "RESOURCE_EXHAUSTED" } });
  let body = ""; for await (const c of req) { body += c; if (body.length > 4_000_000) return send(413, { error: { message: "Payload too large" } }); }
  let target = `${UPSTREAM.origin}/v1beta/models/${m[1]}:generateContent`;
  if (url.pathname === "/v1beta/interactions") { let b; try { b = JSON.parse(body); } catch (e) {} if (!b || !MODELS.includes(String(b.model).replace(/^models\//, "")) || b.stream) return send(404, { error: { message: "Model not allowed", status: "NOT_FOUND" } }); target = `${UPSTREAM.origin}/v1beta/interactions`; }
  if (url.pathname === "/live-token") { let b = {}; try { b = JSON.parse(body || "{}"); } catch (e) {} const model = String(b.model || "gemini-3.8-live"); if (!MODELS.includes(model)) return send(404, { error: { message: "Model not allowed" } });
    target = `${UPSTREAM.origin}/v1beta/auth_tokens`; body = JSON.stringify({ uses: 1, expireTime: new Date(now + 30 * 60e3).toISOString(), newSessionExpireTime: new Date(now + 60e3).toISOString(), liveConnectConstraints: { model: "models/" + model } }); }
  try { const up = await fetch(target, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": KEY }, body });
    if (url.pathname === "/live-token") { const j = await up.json().catch(() => ({})); return send(up.status, up.ok ? { token: j.name } : j); }
    res.writeHead(up.status, { ...cors, "Content-Type": "application/json" }); res.end(await up.text()); } catch (e) { send(502, { error: { message: "Upstream error" } }); }
});
// Live API: raw WebSocket passthrough — the client's upgrade is forwarded to Google with the server-side key, then bytes are piped both ways.
server.on("upgrade", (req, sock, head) => {
  const origin = req.headers.origin || ""; const url = new URL(req.url, "http://x");
  if (url.pathname !== LIVE_PATH || !(ALLOWED.includes("*") || ALLOWED.includes(origin))) { sock.end("HTTP/1.1 403 Forbidden\r\n\r\n"); return; }
  const lib = UPSTREAM.protocol === "http:" ? http : https;
  const up = lib.request({ host: UPSTREAM.hostname, port: UPSTREAM.port || (UPSTREAM.protocol === "http:" ? 80 : 443), path: `${LIVE_PATH}?key=${encodeURIComponent(KEY)}`, method: "GET",
    headers: { Host: UPSTREAM.host, Connection: "Upgrade", Upgrade: "websocket", "Sec-WebSocket-Version": "13", "Sec-WebSocket-Key": req.headers["sec-websocket-key"], ...(req.headers["sec-websocket-extensions"] ? { "Sec-WebSocket-Extensions": req.headers["sec-websocket-extensions"] } : {}) } });
  up.on("upgrade", (res, upSock, upHead) => {
    sock.write("HTTP/1.1 101 Switching Protocols\r\n" + Object.entries(res.headers).map(([k, v]) => `${k}: ${v}`).join("\r\n") + "\r\n\r\n");
    if (upHead?.length) sock.write(upHead); if (head?.length) upSock.write(head);
    upSock.pipe(sock).pipe(upSock); const end = () => { sock.destroy(); upSock.destroy(); }; upSock.on("error", end); sock.on("error", end); upSock.on("close", end); sock.on("close", end);
  });
  up.on("response", res => { sock.end(`HTTP/1.1 ${res.statusCode} Upstream refused\r\n\r\n`); });
  up.on("error", () => sock.end("HTTP/1.1 502 Bad Gateway\r\n\r\n")); up.end();
});
server.listen(PORT, () => console.log(`Zabanyar proxy on :${PORT}${STATIC ? " (serving " + STATIC + ")" : ""}`));
