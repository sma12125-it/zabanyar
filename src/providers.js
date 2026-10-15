/* Zabanyar v8 — AI provider layer: multi-provider chat with automatic failover, speech-to-text (Gemini / Groq Whisper),
   and AI-health tracking for the online/offline switch. Loaded BEFORE app.js; uses S, toast, aiErr from app.js at call time.
   Verified 2026-10-15 (docs + CORS preflight from a browser origin): all endpoints below send Access-Control-Allow-Origin,
   so the browser can call them directly; a proxy is only needed where the service itself is blocked (e.g. Google from Iran). */
"use strict";
const PROVIDERS = {
  gemini: { name: "Google Gemini", kind: "gemini", keyUrl: "https://aistudio.google.com/apikey",
    free: "رایگان؛ سقف روزانه برای هر پروژه در AI Studio نمایش داده می‌شود (Flash-Lite حدود ۵۰۰ درخواست در روز، Flash حدود ۲۰). از ایران مسدود است (VPN یا سرور واسط)." },
  groq: { name: "Groq", base: "https://api.groq.com/openai/v1", keyUrl: "https://console.groq.com/keys", def: "openai/gpt-oss-20b",
    models: ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.8-27b"],
    free: "پلن رایگان: حدود ۳۰ درخواست در دقیقه و ۱۰۰۰ در روز برای هر مدل؛ تبدیل گفتار Whisper حدود ۲۰۰۰ درخواست در روز. صدای Orpheus فقط ۱۰۰ درخواست در روز." },
  openrouter: { name: "OpenRouter", base: "https://openrouter.ai/api/v1", keyUrl: "https://openrouter.ai/keys", def: "google/gemma-4-31b-it:free",
    models: ["google/gemma-4-31b-it:free", "nvidia/nemotron-3-super-120b-a12b:free", "thinkingmachines/inkling-small:free", "google/gemma-4-26b-a4b-it:free"],
    free: "مدل‌های «:free» رایگان‌اند: ۲۰ درخواست در دقیقه و ۵۰ در روز (با خرید حداقل ۱۰ دلار اعتبار: ۱۰۰۰ در روز). فهرست مدل‌های رایگان مرتب عوض می‌شود." },
  mistral: { name: "Mistral", base: "https://api.mistral.ai/v1", keyUrl: "https://console.mistral.ai/api-keys", def: "ministral-8b-latest",
    models: ["ministral-8b-latest", "ministral-14b-latest", "open-mistral-nemo"],
    free: "«Free mode» بدون کارت بانکی؛ سقف‌ها منتشر نشده (در کنسول). با کلید رایگان mistral-small/medium در دسترس نیست؛ Ministral و Nemo کار می‌کنند." },
  cerebras: { name: "Cerebras", base: "https://api.cerebras.ai/v1", keyUrl: "https://cloud.cerebras.ai", def: "gpt-oss-120b",
    models: ["gpt-oss-120b", "qwen-3.8-27b"],
    free: "رایگان دائمی ندارد: ۵ دلار اعتبار آزمایشی ۳۰ روزه (نیازمند ثبت کارت بانکی)، ۵ درخواست در دقیقه، یک میلیون توکن در روز." },
  xai: { name: "xAI Grok", base: "https://api.x.ai/v1", keyUrl: "https://console.x.ai", def: "grok-4.3",
    models: ["grok-4.3", "grok-4.20-0309-non-reasoning", "grok-4.7"],
    free: "اعتبار رایگان اولیه ندارد؛ باید اعتبار پیش‌پرداخت بخرید (grok-4.3: ۱٫۲۵ / ۲٫۵ دلار برای هر میلیون توکن ورودی/خروجی)." },
  custom: { name: "سرویس سفارشی (سازگار با OpenAI)", base: "", def: "", models: [], free: "هر سرویس سازگار با OpenAI (مثلاً Ollama یا LM Studio روی شبکه‌ی خودتان)." }
};
/* Gemini text models (pricing page, 2026-10-14). Free-tier RPD are what AI Studio reported in Sept 2026 — they change; check AI Studio. */
const GEMINI_MODELS = [
  ["gemini-3.1-flash-lite", "⭐ پیشنهادی برای معلم — ارزان‌ترین با کیفیت خوب · رایگان ≈۵۰۰ درخواست/روز · پولی ۰٫۲۵/۱٫۵ دلار"],
  ["gemini-3.5-flash-lite", "Flash-Lite جدیدتر · رایگان ≈۵۰۰/روز · پولی ۰٫۳۰/۲٫۵ دلار"],
  ["gemini-2.5-flash-lite", "قدیمی‌تر، کم‌هزینه‌ترین · پولی ۰٫۱۰/۰٫۴۰ دلار"],
  ["gemini-3.8-flash", "هوشمندترین Flash — فقط برای کارهای پیچیده (خلاصه‌ی جلسه) · رایگان فقط ≈۲۰ درخواست/روز · پولی ۰٫۷۵/۳٫۷۵ دلار"],
  ["gemini-3.6-flash", "نسل قبل Flash · رایگان ≈۲۰/روز"]];
const REC_CHAT = "gemini-3.1-flash-lite", REC_HEAVY = "gemini-3.8-flash";
const pconf = id => (S.pk || {})[id] || {};
const geminiReady = () => (S.provider === "gemini" && !!S.gkey) || (S.provider === "proxy" && !!S.proxy);
function providerReady(id) { if (id === "gemini") return geminiReady(); const c = pconf(id); if (id === "custom") return !!(c.base && c.model); return !!c.key || (!!c.viaProxy && !!S.proxy); }
const chainIds = () => [...new Set((S.chain && S.chain.length ? S.chain : ["gemini"]).filter(id => PROVIDERS[id]))];
const readyChain = () => chainIds().filter(providerReady);
/* AI health: when every provider fails for network reasons we mark AI as down for a while → device voice + scripted tutor. */
const AIH = { down: false, until: 0, why: "", lastOk: null };
const aiReady = () => readyChain().length > 0;
const aiUsable = () => aiReady() && navigator.onLine !== false && !(AIH.down && Date.now() < AIH.until);
function markAI(ok, why) { const was = aiUsable(); if (ok) { AIH.down = false; AIH.why = ""; } else { AIH.down = true; AIH.until = Date.now() + 90e3; AIH.why = why || ""; } if (was !== aiUsable()) window.dispatchEvent(new Event("zy-ai")); }
const sttProvider = () => { const want = S.stt || "auto"; if (want === "device") return null;
  const g = geminiReady(), q = providerReady("groq") && (pconf("groq").key || pconf("groq").viaProxy);
  if (want === "groq") return q ? "groq" : g ? "gemini" : null; if (want === "gemini") return g ? "gemini" : q ? "groq" : null; return q ? "groq" : g ? "gemini" : null; };
const canTranscribe = () => !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder) && !!sttProvider() && navigator.onLine !== false;

/* ---------- Gemini (generateContent) ---------- */
async function gemini(body, { json = false, model } = {}) {
  if (!geminiReady()) throw Object.assign(new Error("ابتدا کلید Gemini یا آدرس سرور واسط را در تنظیمات وارد کنید."), { why: "nokey" });
  const m = encodeURIComponent(model || S.gmodel || REC_CHAT);
  const url = S.provider === "proxy" ? `${S.proxy.replace(/\/$/, "")}/v1beta/models/${m}:generateContent` : `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;
  const headers = { "Content-Type": "application/json" }; if (S.provider === "gemini") headers["x-goog-api-key"] = S.gkey;
  if (json) body.generationConfig = { ...(body.generationConfig || {}), responseMimeType: "application/json" };
  let r, j; const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 45000);
  try { r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: ctl.signal }); j = await r.json().catch(() => ({})); }
  catch (e) { throw Object.assign(new Error(e.name === "AbortError" ? "پاسخ هوش مصنوعی خیلی طول کشید. دوباره تلاش کنید." : "اتصال به سرور برقرار نشد. اینترنت را بررسی کنید؛ Gemini از ایران بدون VPN یا سرور واسط در دسترس نیست."), { why: e.name === "AbortError" ? "timeout" : "network" }); }
  finally { clearTimeout(to); }
  if (!r.ok) { const msg = j.error?.message || j.error?.status || j.error; const m2 = aiErr(r.status, msg); throw Object.assign(new Error(m2), { why: r.status == 429 ? "quota" : /منطقه|مسدود/.test(m2) ? "blocked" : r.status >= 500 ? "server" : r.status == 401 || r.status == 403 ? "auth" : "api", status: r.status }); }
  const c = j.candidates?.[0]; if (!c) throw Object.assign(new Error(j.promptFeedback?.blockReason ? "پیام به دلیل سیاست‌های ایمنی مسدود شد." : "پاسخ خالی از Gemini."), { why: j.promptFeedback?.blockReason ? "safety" : "api" });
  const t = (c.content?.parts || []).filter(p => !p.thought).map(p => p.text || "").join("").trim();
  if (!t && c.finishReason === "SAFETY") throw Object.assign(new Error("پاسخ به دلیل سیاست‌های ایمنی مسدود شد."), { why: "safety" }); return t;
}
/* ---------- OpenAI-compatible chat (Groq, OpenRouter, Mistral, Cerebras, xAI, custom) ---------- */
function oaBase(id) { const c = pconf(id); if (id === "custom") return c.base.replace(/\/$/, ""); if (!c.key && c.viaProxy && S.proxy) return S.proxy.replace(/\/$/, "") + "/p/" + id; return PROVIDERS[id].base; }
function oaHeaders(id, json = true) { const c = pconf(id), h = json ? { "Content-Type": "application/json" } : {}; if (c.key) h.Authorization = "Bearer " + c.key;
  if (id === "openrouter") { h["HTTP-Referer"] = location.origin; h["X-Title"] = "Zabanyar"; } return h; }
async function oaChat(id, system, msgs, opt) {
  const model = pconf(id).model || PROVIDERS[id].def; let r, j; const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 45000);
  const body = { model, temperature: opt.temp ?? .8, max_tokens: opt.max || 400, messages: [{ role: "system", content: system }, ...msgs.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }))] };
  if (opt.json && id !== "cerebras") body.response_format = { type: "json_object" };
  if (/gpt-oss/.test(model)) body.reasoning_effort = "low"; // fewer hidden reasoning tokens
  try { r = await fetch(oaBase(id) + "/chat/completions", { method: "POST", headers: oaHeaders(id), body: JSON.stringify(body), signal: ctl.signal }); j = await r.json().catch(() => ({})); }
  catch (e) { throw Object.assign(new Error(`اتصال به ${PROVIDERS[id].name} برقرار نشد.`), { why: e.name === "AbortError" ? "timeout" : "network" }); } finally { clearTimeout(to); }
  if (!r.ok) { const msg = j.error?.message || j.message || j.detail || ""; throw Object.assign(new Error(`${PROVIDERS[id].name}: ${aiErr(r.status, typeof msg === "string" ? msg : JSON.stringify(msg))}`), { why: r.status == 429 || r.status == 402 ? "quota" : r.status >= 500 ? "server" : r.status == 401 || r.status == 403 ? "auth" : "api", status: r.status }); }
  const t = j.choices?.[0]?.message?.content; if (!t) throw Object.assign(new Error(`${PROVIDERS[id].name}: پاسخ خالی.`), { why: "api" }); return String(t).trim();
}
/** callAI(system, msgs, {temp, max, json, heavy}) — tries each configured provider in order; on quota/429/network/server errors it fails over. */
async function callAI(system, msgs, opt = {}) {
  const ids = readyChain(); if (!ids.length) throw Object.assign(new Error("هیچ سرویس هوش مصنوعی تنظیم نشده. در «تنظیمات» کلید Gemini، Groq یا سرویس دیگری وارد کنید."), { why: "nokey" });
  if (navigator.onLine === false) throw Object.assign(new Error("آفلاین هستید."), { why: "offline" });
  let last, failed = [];
  for (const id of ids) {
    try { let t;
      if (id === "gemini") { const m = msgs[0] && msgs[0].role !== "user" ? [{ role: "user", content: "(start)" }, ...msgs] : msgs;
        t = await gemini({ systemInstruction: { parts: [{ text: system }] }, contents: m.map(x => ({ role: x.role === "user" ? "user" : "model", parts: [{ text: x.content }] })), generationConfig: { temperature: opt.temp ?? .8, maxOutputTokens: opt.max || 400 } }, { json: opt.json, model: opt.heavy ? (S.gmodelHeavy || S.gmodel || REC_CHAT) : S.gmodel }); }
      else t = await oaChat(id, system, msgs, opt);
      if (failed.length) toast(`⚠️ ${failed.map(f => PROVIDERS[f].name).join("، ")} جواب نداد (${last?.why === "quota" ? "سهمیه تمام شد" : "خطا"}) — این پاسخ از ${PROVIDERS[id].name} است.`);
      AIH.lastOk = id; markAI(true); return t;
    } catch (e) { last = e; failed.push(id); if (e.why === "safety") throw e; }
  }
  if (failed.length > 1) last.message = `همه‌ی سرویس‌ها ناموفق بودند (${failed.map(f => PROVIDERS[f].name).join("، ")}). آخرین خطا: ${last.message}`;
  if (["network", "timeout", "blocked", "offline"].includes(last.why)) markAI(false, last.why);
  throw last;
}
/* ---------- Speech to text ---------- */
async function transcribeGroq(blob) {
  const fd = new FormData(); const ext = (blob.type.split("/")[1] || "webm").split(";")[0].replace("x-m4a", "m4a").replace("mp4", "m4a");
  fd.append("file", blob, "speech." + ext); fd.append("model", pconf("groq").stt || "whisper-large-v3-turbo"); fd.append("language", "en"); fd.append("response_format", "json"); fd.append("temperature", "0");
  fd.append("prompt", "A Persian-speaking learner practising casual spoken English. Keep their mistakes.");
  let r, j; try { r = await fetch(oaBase("groq") + "/audio/transcriptions", { method: "POST", headers: oaHeaders("groq", false), body: fd }); j = await r.json().catch(() => ({})); }
  catch (e) { throw Object.assign(new Error("اتصال به Groq برقرار نشد."), { why: "network" }); }
  if (!r.ok) throw Object.assign(new Error("Groq Whisper: " + aiErr(r.status, j.error?.message || "")), { why: r.status == 429 ? "quota" : "api" });
  return String(j.text || "").trim();
}
async function transcribeGemini(blob) {
  const wav = await toWav(blob).catch(() => null); const use = wav || blob;
  const data = await blobToB64(use), mimeType = wav ? "audio/wav" : geminiMime(blob.type);
  return gemini({ systemInstruction: { parts: [{ text: "Transcribe the English speech of a Persian-speaking learner exactly (keep mistakes), natural punctuation. Empty string if no speech. Output only the transcript." }] },
    contents: [{ role: "user", parts: [{ inlineData: { mimeType, data } }, { text: "Transcribe." }] }], generationConfig: { temperature: 0, maxOutputTokens: 200 } });
}
async function transcribe(blob) {
  const first = sttProvider(); if (!first) throw Object.assign(new Error(WHY.nokey), { why: "nokey" });
  const order = [first, first === "groq" ? (geminiReady() ? "gemini" : null) : (providerReady("groq") ? "groq" : null)].filter(Boolean);
  let last; for (const p of order) { try { const t = p === "groq" ? await transcribeGroq(blob) : await transcribeGemini(blob); if (p !== first) toast(`تبدیل گفتار با ${p === "groq" ? "Groq Whisper" : "Gemini"} انجام شد (سرویس اول جواب نداد).`); return t.replace(/^["'\s]+|["'\s]+$/g, ""); } catch (e) { last = e; } }
  throw last;
}
