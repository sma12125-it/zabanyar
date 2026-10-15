/**
 * Zabanyar Gemini proxy — Cloudflare Worker. Keeps GEMINI_API_KEY on the server.
 * Routes (the app adds no key):
 *   POST /v1beta/models/<model>:generateContent        text, transcription, session summary
 *   POST /v1beta/interactions                          Gemini TTS (natural lesson + tutor voices); body.model must be allowed
 *   WS   /ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent   Gemini Live (real-time voice tutor), key added here
 *   POST /live-token                                   optional: mint a 1-use ephemeral token for direct client→Google Live (needs Google reachable)
 * Env vars:
 *   GEMINI_API_KEY   (secret, required)
 *   ALLOWED_ORIGINS  comma-separated, e.g. "https://zabanyar.example.com,capacitor://localhost,https://localhost"
 *   ALLOWED_MODELS   optional, default: text + TTS + Live models below
 *   GROQ_API_KEY / OPENROUTER_API_KEY / MISTRAL_API_KEY / CEREBRAS_API_KEY / XAI_API_KEY  (optional secrets) enable
 *                    POST /p/<provider>/chat/completions | /audio/transcriptions | /audio/speech  (OpenAI-compatible passthrough,
 *                    used when the app's provider is set to "via proxy"; only providers with a key set are served)
 *   RATE_PER_MIN     optional per-IP requests/minute (best-effort, per isolate), default 60
 */
const DEFAULT_MODELS = "gemini-3.1-flash-lite,gemini-3.5-flash-lite,gemini-2.5-flash-lite,gemini-3.8-flash,gemini-flash-latest,gemini-3.8-flash-tts,gemini-3.8-flash-lite-tts,gemini-3.8-live";
const LIVE_PATH = "/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";
const G = "https://generativelanguage.googleapis.com";
const hits = new Map();
const PROV = { groq: ["https://api.groq.com/openai/v1", "GROQ_API_KEY"], openrouter: ["https://openrouter.ai/api/v1", "OPENROUTER_API_KEY"], mistral: ["https://api.mistral.ai/v1", "MISTRAL_API_KEY"], cerebras: ["https://api.cerebras.ai/v1", "CEREBRAS_API_KEY"], xai: ["https://api.x.ai/v1", "XAI_API_KEY"] };
const PPATHS = ["/chat/completions", "/audio/transcriptions", "/audio/speech"];
export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
    const okOrigin = allowed.includes("*") || allowed.includes(origin);
    const cors = { "Access-Control-Allow-Origin": okOrigin ? (origin || "*") : "null", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", Vary: "Origin" };
    const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });
    if (req.method === "OPTIONS") return new Response(null, { status: okOrigin ? 204 : 403, headers: cors });
    if (!okOrigin) return json(403, { error: { message: "Origin not allowed", status: "FORBIDDEN" } });
    const url = new URL(req.url), models = (env.ALLOWED_MODELS || DEFAULT_MODELS).split(",").map(s => s.trim());
    const ip = req.headers.get("CF-Connecting-IP") || "?", now = Date.now(), limit = +(env.RATE_PER_MIN || 60);
    const h = (hits.get(ip) || []).filter(t => now - t < 60000); h.push(now); hits.set(ip, h);
    if (h.length > limit) return json(429, { error: { message: "Rate limit exceeded", status: "RESOURCE_EXHAUSTED" } });
    // Live API WebSocket passthrough (the model is checked by Google against the key; Live models only via setup message)
    if (url.pathname === LIVE_PATH) {
      if ((req.headers.get("Upgrade") || "").toLowerCase() !== "websocket") return json(426, { error: { message: "Expected WebSocket" } });
      return fetch(new Request(`${G}${LIVE_PATH}?key=${encodeURIComponent(env.GEMINI_API_KEY)}`, req)); // Workers proxy the upgrade and return the 101 + WebSocket pair
    }
    if (req.method !== "POST") return json(405, { error: { message: "Method not allowed" } });
    const pm = url.pathname.match(/^\/p\/([a-z]+)(\/.*)$/);
    if (pm) { const pv = PROV[pm[1]]; if (!pv || !env[pv[1]] || !PPATHS.includes(pm[2])) return json(404, { error: { message: "Provider or path not enabled on this proxy" } });
      if (+(req.headers.get("Content-Length") || 0) > 26_000_000) return json(413, { error: { message: "Payload too large" } });
      const up = await fetch(pv[0] + pm[2], { method: "POST", headers: { "Content-Type": req.headers.get("Content-Type") || "application/json", Authorization: "Bearer " + env[pv[1]] }, body: req.body });
      return new Response(up.body, { status: up.status, headers: { ...cors, "Content-Type": up.headers.get("Content-Type") || "application/json" } }); }
    const len = +(req.headers.get("Content-Length") || 0); if (len > 4_000_000) return json(413, { error: { message: "Payload too large" } });
    const body = await req.text(); if (body.length > 4_000_000) return json(413, { error: { message: "Payload too large" } });
    let target;
    const m = url.pathname.match(/^\/v1beta\/models\/([a-z0-9.\-]+):generateContent$/);
    if (m && models.includes(m[1])) target = `${G}/v1beta/models/${m[1]}:generateContent`;
    else if (url.pathname === "/v1beta/interactions") { let b; try { b = JSON.parse(body); } catch (e) {} if (b && models.includes(String(b.model).replace(/^models\//, "")) && !b.stream) target = `${G}/v1beta/interactions`; }
    else if (url.pathname === "/live-token") {
      let b = {}; try { b = JSON.parse(body || "{}"); } catch (e) {} const model = String(b.model || "gemini-3.8-live"); if (!models.includes(model)) return json(404, { error: { message: "Model not allowed" } });
      const up = await fetch(`${G}/v1beta/auth_tokens`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({ uses: 1, expireTime: new Date(now + 30 * 60e3).toISOString(), newSessionExpireTime: new Date(now + 60e3).toISOString(), liveConnectConstraints: { model: "models/" + model } }) });
      const j = await up.json().catch(() => ({})); return up.ok ? json(200, { token: j.name }) : json(up.status, j);
    }
    if (!target) return json(404, { error: { message: "Model or path not allowed", status: "NOT_FOUND" } });
    const upstream = await fetch(target, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY }, body });
    return new Response(upstream.body, { status: upstream.status, headers: { ...cors, "Content-Type": "application/json" } });
  }
};
