/* Zabanyar v3 — Persian-first conversational English app. No build deps; content is lazy-loaded JSON. */
"use strict";
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)], app = $("#app");
const LEVELS = ["A1", "A2", "B1", "B2", "C1"], LVNAME = { A1: "مبتدی", A2: "پایه", B1: "متوسط", B2: "بالاتر از متوسط", C1: "پیشرفته" };
const DEFAULT_MODEL = "gemini-3.8-flash";
const DEF = { v: 3, xp: 0, streak: 0, last: null, level: null, done: {}, steps: {}, cards: {}, days: {}, chats: {}, reviewsToday: {}, lastLesson: null,
  provider: "gemini", gkey: "", gmodel: DEFAULT_MODEL, proxy: "", key: "", api: "https://api.openai.com/v1", model: "gpt-4o-mini",
  dark: null, accent: "en-US", rate: 1, engine: "record", audioMode: "ai", deviceTTS: false, ttsModel: "gemini-3.8-flash-tts", tutorTts: "gemini-3.8-flash-tts", tutorVoice: "Aoede", lessonVoice: "Kore", live: true, liveModel: "gemini-3.8-live", liveDirect: false, program: { start: null, tasks: {} }, micOk: false };
const S = (() => { let s = null; try { s = JSON.parse(localStorage.getItem("zy3")); } catch (e) {}
  if (!s) { s = {}; try { const o = JSON.parse(localStorage.getItem("zy2") || "null"); if (o) for (const k of ["xp", "streak", "last", "level", "gkey", "gmodel", "key", "api", "model", "dark", "accent"]) if (o[k] != null) s[k] = o[k]; if (o && o.provider) s.provider = o.provider; } catch (e) {} }
  if (s.engine === "auto" || s.engine === "gemini") s.engine = "record"; // v3 defaulted to Google-backed recognition, which fails in Iran
  return Object.assign(structuredClone(DEF), s); })();
let saveT; const save = () => { try { localStorage.setItem("zy3", JSON.stringify(S)); } catch (e) { toast("ذخیره‌سازی ناموفق بود (فضای مرورگر پر است؟)", true); } stats(); };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const today = () => new Date().toLocaleDateString("en-CA");
const fa = n => Number(n).toLocaleString("fa-IR");
const isFa = s => /[\u0600-\u06FF]/.test(s);
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
function addXP(n) { S.xp += n; const t = today(); S.days[t] = (S.days[t] || 0) + n; if (S.last !== t) { const y = new Date(Date.now() - 864e5).toLocaleDateString("en-CA"); S.streak = S.last === y ? S.streak + 1 : 1; S.last = t; } save(); }
function stats() { $("#stats").innerHTML = `<span class=pill title="روزهای پیاپی">🔥 ${fa(S.streak)}</span><span class=pill title="امتیاز">⭐ ${fa(S.xp)}</span>`; }
function toast(t, bad) { const d = document.createElement("div"); d.textContent = t; d.setAttribute("role", "status"); d.style.cssText = `position:fixed;top:calc(70px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);background:${bad ? "#dc2626" : "#16a34a"};color:#fff;padding:10px 18px;border-radius:12px;z-index:60;box-shadow:0 4px 12px #0003;max-width:90vw`; document.body.appendChild(d); setTimeout(() => d.remove(), bad ? 5000 : 2500); }
const announce = t => { $("#live").textContent = t; };
function modal(html) { $("#modalBox").innerHTML = html; $("#modal").classList.remove("hidden"); const f = $("#modalBox").querySelector("button,input"); f && f.focus(); }
const closeModal = () => $("#modal").classList.add("hidden");
window.addEventListener("error", e => { console.error(e.error || e.message); });
window.addEventListener("unhandledrejection", e => { console.error(e.reason); toast("خطای غیرمنتظره: " + (e.reason?.message || e.reason), true); });

/* ---------------- Content (lazy) ---------------- */
let IDX = null; const LV = {}; let PROGRAM = null;
async function getJSON(u) { const r = await fetch(u); if (!r.ok) throw new Error("HTTP " + r.status + " " + u); return r.json(); }
async function loadIndex() { IDX = await getJSON("content/index.json"); }
async function loadLevel(lv) { return LV[lv] || (LV[lv] = await getJSON(`content/${lv.toLowerCase()}.json`)); }
const NV = 5, FA_N = ["", "۱", "۲", "۳", "۴", "۵"];
/** Dialogue variants: key "A1-01" = گفتگو ۱ (base, backward-compatible), "A1-01#3" = گفتگو ۳. */
const parseKey = k => { const [id, n] = String(k).split("#"); return { id, n: Math.min(NV, Math.max(1, +n || 1)) }; };
const vkey = (id, n) => n > 1 ? id + "#" + n : id;
function viewOf(L, n) { const v = n > 1 && (L.variants || []).find(x => x.n == n);
  if (!v) return { ...L, n: 1, key: L.id, mood: "⭐ گفتگوی اصلی" };
  return { ...L, scene: v.scene, partner: v.partner, dialogue: v.dialogue, chunks: v.chunks, notes: v.notes, sounds: v.sounds, quiz: v.quiz, mood: v.mood, n, key: vkey(L.id, n) }; }
async function getBase(id) { const m = await loadLevel(id.split("-")[0]); return m[id]; }
async function getLesson(key) { const { id, n } = parseKey(key); const L = await getBase(id); return L && viewOf(L, n); }
const varsDone = id => [...Array(NV)].filter((_, i) => S.done[vkey(id, i + 1)]).length;
async function getProgram() { return PROGRAM || (PROGRAM = await getJSON("content/program.json")); }
const meta = id => IDX.levels[id.split("-")[0]].find(l => l.id === id);
const allMeta = () => LEVELS.flatMap(lv => IDX.levels[lv]);

/* ---------------- Speech: TTS ---------------- */
const Cap = window.Capacitor?.Plugins || {};
let voices = []; const loadV = () => voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; if (window.speechSynthesis) { loadV(); speechSynthesis.onvoiceschanged = loadV; }
let ttsToken = 0;
/** Device text-to-speech — only used when the user explicitly enables it (settings). */
function deviceSpeak(t, rate = 1, onend, tok = ++ttsToken) {
  const done = () => { if (tok === ttsToken) onend && onend(); };
  t = String(t).replace(/[\u0600-\u06FF]+/g, " ").trim(); if (!t) return done();
  const r = rate * (S.rate || 1);
  if (Cap.TextToSpeech) { Cap.TextToSpeech.speak({ text: t, lang: S.accent, rate: r, category: "playback" }).then(done, done); return; }
  if (!window.speechSynthesis) return done();
  speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = S.accent; u.rate = r;
  const v = voices.find(v => v.lang === S.accent && /natural|google|samantha|daniel/i.test(v.name)) || voices.find(v => v.lang === S.accent) || voices.find(v => v.lang.startsWith("en")); if (v) u.voice = v;
  u.onend = done; u.onerror = done; speechSynthesis.speak(u);
  setTimeout(() => { if (tok === ttsToken && !speechSynthesis.speaking && !speechSynthesis.pending) done(); }, 400 + t.length * 120); // safety for engines that never fire onend
}
document.addEventListener("pointerdown", function unlock() { try { if (window.speechSynthesis) { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; speechSynthesis.speak(u); } } catch (e) {} document.removeEventListener("pointerdown", unlock); }, { once: true });


/* ---------------- Speech: record + Gemini by default, native/Web Speech as optional fast mode ---------------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const canRecord = () => !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
const aiReady = () => S.provider === "gemini" ? !!S.gkey : S.provider === "proxy" ? !!S.proxy : !!S.key;
const canTranscribe = () => canRecord() && aiReady() && S.provider !== "openai";
const hasFast = () => !!(Cap.SpeechRecognition || SR);
function sttMode() {
  if (S.engine === "fast" && hasFast()) return "fast";
  if (canTranscribe()) return "record";
  if (hasFast()) return "fast";
  return canRecord() ? "nokey" : "none";
}
const sttLabel = () => ({ record: "ضبط صدا + تبدیل به متن با Gemini (پایدار)", fast: (Cap.SpeechRecognition ? "تشخیص سریع گوشی" : "تشخیص سریع مرورگر") + (canTranscribe() ? " — در صورت خطا خودکار: ضبط + Gemini" : " (به سرورهای Google وابسته است؛ برای پایداری کلید Gemini/سرور واسط وارد کنید)"), nokey: "نیاز به کلید Gemini یا سرور واسط", none: "در دسترس نیست — حالت تایپی" })[sttMode()];
const WHY = {
  denied: "اجازه‌ی میکروفون داده نشد. از تنظیمات گوشی/مرورگر دسترسی میکروفون را برای زبان‌یار فعال کنید.",
  silent: "میکروفون روشن بود ولی هیچ صدایی ضبط نشد (سطح صدا تقریباً صفر). میکروفون درست را انتخاب کنید، هدفون/بلوتوث را قطع کنید، برنامه‌ی دیگری که میکروفون را گرفته ببندید و نزدیک‌تر صحبت کنید. از «آزمایش میکروفون» در تنظیمات کمک بگیرید.",
  nospeech: "صدا ضبط شد ولی جمله‌ی قابل تشخیصی در آن نبود؛ واضح‌تر و کمی بلندتر دوباره بگویید.",
  network: "اتصال به سرویس تشخیص گفتار برقرار نشد. سرورهای Google (و Gemini) از ایران مسدود یا ناپایدارند: VPN را روشن کنید یا در تنظیمات «سرور واسط (پروکسی)» را وارد کنید.",
  timeout: "پاسخی از سرویس تشخیص گفتار نرسید (احتمالاً مسدود بودن Google). VPN یا سرور واسط را امتحان کنید.",
  nokey: "برای تبدیل صدا به متن، کلید Gemini یا آدرس سرور واسط را در تنظیمات وارد کنید.",
  unsupported: "ضبط صدا در این مرورگر/دستگاه پشتیبانی نمی‌شود؛ از حالت تایپی استفاده کنید.",
  error: "خطا در تبدیل صدا به متن؛ دوباره تلاش کنید."
};
const whyMsg = (why, detail) => detail || WHY[why] || WHY.error;
async function ensureMic() {
  if (!S.micOk) {
    const ok = await new Promise(res => { modal(`<h3>🎤 اجازه‌ی میکروفون</h3><p>برای تمرین گفتار، زبان‌یار به میکروفون نیاز دارد. صدای شما فقط برای تبدیل به متن استفاده می‌شود${sttMode() === "record" ? " (به سرویس Gemini فرستاده می‌شود)" : ""} و ذخیره نمی‌شود.</p><p class=muted>در پنجره‌ی بعدی مرورگر/گوشی «Allow / اجازه» را بزنید.</p><button class="btn p" id=mOk>ادامه</button><button class=btn id=mNo>فعلاً نه</button>`); $("#mOk").onclick = () => { closeModal(); res(true); }; $("#mNo").onclick = () => { closeModal(); res(false); }; });
    if (!ok) return false;
  }
  try {
    // Always probe getUserMedia: in the APK this makes Capacitor's WebChromeClient request RECORD_AUDIO and grant AUDIO_CAPTURE.
    if (navigator.mediaDevices?.getUserMedia) { const st = await navigator.mediaDevices.getUserMedia({ audio: true }); st.getTracks().forEach(t => t.stop()); }
    if (Cap.SpeechRecognition && sttMode() === "fast") { try { const p = await Cap.SpeechRecognition.requestPermissions(); if (p.speechRecognition !== "granted") throw 0; } catch (e) { if (!canRecord()) throw Object.assign(new Error(), { name: "NotAllowedError" }); } }
    S.micOk = true; save(); return true;
  } catch (e) { micError(e); return false; }
}
function micError(e) {
  const msg = e?.name === "NotAllowedError" || e?.name === "SecurityError"
    ? (location.protocol !== "https:" && !/localhost|127\.0\.0\.1/.test(location.hostname) && !window.Capacitor ? "میکروفون فقط روی HTTPS کار می‌کند. سایت را با https باز کنید." : IOS ? "دسترسی میکروفون رد شد. در آیفون: Settings ← Safari ← Microphone ← Allow (یا برای اپ نصب‌شده، آن را حذف و دوباره اضافه کنید)." : window.Capacitor ? "دسترسی میکروفون رد شد. Settings ← Apps ← زبان‌یار ← Permissions ← Microphone ← Allow." : "دسترسی میکروفون رد شد. از تنظیمات مرورگر (آیکون قفل کنار آدرس) اجازه‌ی میکروفون را برای این سایت فعال کنید.")
    : e?.name === "NotFoundError" ? "میکروفونی پیدا نشد." : e?.name === "NotReadableError" ? "میکروفون در اختیار برنامه‌ی دیگری است (تماس، ضبط صدا…). آن را ببندید و دوباره تلاش کنید." : "خطای میکروفون: " + (e?.message || e?.name);
  S.micOk = false; save(); modal(`<h3>🎤 مشکل میکروفون</h3><p>${esc(msg)}</p><button class="btn p" onclick="closeModal()">باشه</button>`);
}
let activeRec = null;
function stopListening() { try { activeRec?.stop(); } catch (e) {} }
/* Floating recording bar with a live level meter, visible on every screen while recording. */
function recBar(show, level = 0) {
  let b = $("#recbar");
  if (!b) { b = document.createElement("div"); b.id = "recbar"; b.className = "recbar hidden"; b.setAttribute("role", "status"); b.innerHTML = `<span class=recdot></span><span id=rbt>در حال ضبط… صحبت کنید</span><div class=meter aria-hidden=true><i></i></div><button class="btn sm" id=rbs>⏹ پایان</button>`; document.body.appendChild(b); b.querySelector("#rbs").onclick = () => stopListening(); }
  b.classList.toggle("hidden", !show); b.querySelector(".meter i").style.width = Math.min(100, Math.round(level * 100)) + "%";
  b.querySelector("#rbt").textContent = level > 0.08 ? "🔊 صدا دریافت می‌شود…" : "در حال ضبط… صحبت کنید";
}
function pickMime() {
  const order = IOS ? ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/aac", "audio/webm;codecs=opus", "audio/webm"] : ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4", "audio/aac"];
  return order.find(m => { try { return MediaRecorder.isTypeSupported?.(m); } catch (e) { return false; } }) || "";
}
/** recordClip -> {blob, peak, spoke, ms, label}. Live level via onLevel(0..1); silence detection auto-stops. */
async function recordClip({ onLevel, maxMs = 25000, noSpeechMs = 8000, silenceMs = 1500, vad = true, bar = true } = {}) {
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
  catch (e) { if (e?.name === "OverconstrainedError") stream = await navigator.mediaDevices.getUserMedia({ audio: true }); else throw e; }
  const label = stream.getAudioTracks()[0]?.label || "";
  if (!S.micOk) { S.micOk = true; save(); }
  const mime = pickMime(); const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); const chunks = []; activeRec = rec;
  let ac, raf, iv, spoke = false, silentSince = 0, peak = 0, floor = null; const t0 = Date.now();
  const stop = () => { if (rec.state === "recording") try { rec.stop(); } catch (e) {} };
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") await ac.resume().catch(() => {});
    const an = ac.createAnalyser(); an.fftSize = 1024; ac.createMediaStreamSource(stream).connect(an); const buf = new Uint8Array(an.fftSize);
    const tick = () => { an.getByteTimeDomainData(buf); let s = 0; for (const v of buf) s += (v - 128) ** 2; const rms = Math.sqrt(s / buf.length); peak = Math.max(peak, rms);
      const el = Date.now() - t0; if (el < 400) floor = floor == null ? rms : Math.min(floor, rms) * .5 + rms * .5;
      const th = Math.max(3.5, Math.min(12, (floor || 0) * 2.5 + 1.5)), lvl = Math.min(1, rms / 40); onLevel?.(lvl, rms); if (bar) recBar(true, lvl);
      if (vad) { if (rms > th) { spoke = true; silentSince = 0; } else if (spoke) { silentSince ||= Date.now(); if (Date.now() - silentSince > silenceMs) return stop(); }
        if (!spoke && el > noSpeechMs) return stop(); }
      if (el > maxMs) return stop(); };
    iv = setInterval(tick, 50); // setInterval (not rAF) so detection keeps working when the tab/WebView is backgrounded
  } catch (e) { setTimeout(stop, Math.min(maxMs, 8000)); }
  const blob = await new Promise((res, rej) => {
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    rec.onerror = e => rej(e.error || new Error("MediaRecorder error"));
    rec.onstop = () => { clearInterval(iv); cancelAnimationFrame(raf); stream.getTracks().forEach(t => t.stop()); try { ac?.close(); } catch (e) {} activeRec = null; if (bar) recBar(false);
      res(new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" })); };
    rec.start(250);
  });
  return { blob, peak, spoke, ms: Date.now() - t0, label, mime: blob.type };
}
const SILENT_PEAK = 1.5; // RMS on 0..128 scale; real mics in a quiet room give ~2+, a dead/muted input gives ~0
async function recordListen(cb, opt = {}) {
  const st = opt.onState || (() => {});
  let clip; st("listen");
  try { clip = await recordClip({ onLevel: opt.onLevel }); }
  catch (e) { st("idle"); recBar(false); if (/NotAllowed|Security|NotFound|NotReadable/.test(e?.name)) { micError(e); return cb(null, "denied"); } return cb(null, "error", "ضبط صدا ناموفق بود: " + (e?.message || e?.name)); }
  if (clip.peak < SILENT_PEAK) { st("idle"); return cb(null, "silent"); }
  if (clip.blob.size < 1200) { st("idle"); return cb(null, "nospeech"); }
  st("think");
  try { const t = await transcribe(clip.blob); st("idle"); cb(t || null, t ? "" : "nospeech"); }
  catch (e) { st("idle"); cb(null, e.why || "error", e.why === "nokey" || e.why === "network" ? "" : e.message); }
}
/** Fast mode (native plugin / Web Speech). Resolves {text, why}; never hangs (watchdog). */
function fastListen(st) {
  return new Promise(resolve => {
    let fin = false; const end = (text, why) => { if (fin) return; fin = true; clearTimeout(wd); activeRec = null; st("idle"); resolve({ text: text || null, why: text ? "" : why }); };
    const wd = setTimeout(() => { try { activeRec?.abort?.() ?? activeRec?.stop?.(); } catch (e) {} end(null, "timeout"); }, 12000);
    st("listen");
    if (Cap.SpeechRecognition) {
      const P = Cap.SpeechRecognition; activeRec = { stop: () => P.stop().catch(() => {}) };
      P.start({ language: S.accent || "en-US", maxResults: 1, partialResults: false, popup: false, prompt: "Speak now" })
        .then(r => end(r?.matches?.[0], "nospeech"))
        .catch(e => { const m = String(e?.message || e).toLowerCase(); end(null, /permission|denied|not allowed/.test(m) ? "denied" : /network|server|connect|timeout/.test(m) ? "network" : /no match|no speech|didn't|speech timeout/.test(m) ? "nospeech" : "error"); });
      return;
    }
    try {
      const r = new SR(); r.lang = S.accent || "en-US"; r.interimResults = false; r.continuous = false; r.maxAlternatives = 1; activeRec = r; let got = false;
      r.onresult = e => { const t = e.results?.[0]?.[0]?.transcript; if (t) { got = true; end(t, ""); } };
      r.onerror = e => end(null, e.error === "not-allowed" ? "denied" : e.error === "no-speech" ? "nospeech" : /network|service-not-allowed|language-not-supported/.test(e.error) ? "network" : e.error === "audio-capture" ? "capture" : "error");
      r.onend = () => end(null, got ? "" : "nospeech"); r.start();
    } catch (e) { end(null, "error"); }
  });
}
/** listen(cb, {onState, onLevel}) -> cb(text|null, reason, detail) */
async function listen(cb, opt = {}) {
  const mode = sttMode(); const st = opt.onState || (() => {});
  if (mode === "none") return cb(null, "unsupported");
  if (mode === "nokey") return cb(null, "nokey");
  if (!(await ensureMic())) return cb(null, "denied");
  stopTTS();
  if (mode === "fast") {
    const r = await fastListen(st);
    if (r.text) { S.fastFails = 0; save(); return cb(r.text, ""); }
    if (r.why === "denied") { micError({ name: "NotAllowedError" }); return cb(null, "denied"); }
    if (canTranscribe()) {
      S.fastFails = (S.fastFails || 0) + 1;
      if (S.fastFails >= 2) { S.engine = "record"; S.fastFails = 0; toast("تشخیص سریع دو بار جواب نداد؛ موتور گفتار به «ضبط + Gemini» تغییر کرد.", true); }
      save(); toast("تشخیص سریع جواب نداد — دوباره بگویید (این بار ضبط + Gemini)");
      return recordListen(cb, opt);
    }
    const base = r.why === "nospeech" ? WHY.nospeech : r.why === "capture" ? "تشخیص سریع نتوانست از میکروفون صدا بگیرد." : r.why === "network" || r.why === "timeout" ? WHY.network : WHY.error;
    return cb(null, r.why === "capture" ? "error" : r.why, base + (canRecord() ? " پیشنهاد: کلید Gemini یا سرور واسط را وارد کنید تا ضبط پایدار فعال شود." : ""));
  }
  return recordListen(cb, opt);
}
async function blobToB64(b) { const buf = new Uint8Array(await b.arrayBuffer()); let s = ""; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000)); return btoa(s); }
/** Decode whatever MediaRecorder produced (webm/opus, mp4/aac) and re-encode as 16 kHz mono WAV — a format Gemini officially accepts. */
async function toWav(blob) {
  const AC = window.AudioContext || window.webkitAudioContext, OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!AC || !OAC) return null;
  const ac = new AC(); let src;
  try { src = await ac.decodeAudioData(await blob.arrayBuffer()); } catch (e) { try { ac.close(); } catch (_) {} return null; } try { ac.close(); } catch (e) {}
  const rate = 16000, len = Math.max(1, Math.ceil(src.duration * rate)); const off = new OAC(1, len, rate); const n = off.createBufferSource(); n.buffer = src; n.connect(off.destination); n.start();
  const out = (await off.startRendering()).getChannelData(0); const dv = new DataView(new ArrayBuffer(44 + out.length * 2)); const w = (o, s) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF"); dv.setUint32(4, 36 + out.length * 2, true); w(8, "WAVE"); w(12, "fmt "); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, rate, true); dv.setUint32(28, rate * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, "data"); dv.setUint32(40, out.length * 2, true);
  for (let i = 0; i < out.length; i++) { const v = Math.max(-1, Math.min(1, out[i])); dv.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true); }
  return new Blob([dv], { type: "audio/wav" });
}
const geminiMime = t => { t = (t || "").split(";")[0]; return t === "audio/mp4" || t === "audio/x-m4a" ? "audio/aac" : t || "audio/webm"; };
async function transcribe(blob) {
  const wav = await toWav(blob).catch(() => null); const use = wav || blob;
  const data = await blobToB64(use), mimeType = wav ? "audio/wav" : geminiMime(blob.type);
  const t = await gemini({ systemInstruction: { parts: [{ text: "You are a speech-to-text engine. The speaker is a Persian-speaking learner of English. Transcribe exactly what they say, in English, with natural punctuation; keep their mistakes. If there is no intelligible speech, output an empty string. Output ONLY the transcript." }] },
    contents: [{ role: "user", parts: [{ inlineData: { mimeType, data } }, { text: "Transcribe this audio." }] }], generationConfig: { temperature: 0, maxOutputTokens: 300 } });
  return t.replace(/^["'\s]+|["'\s]+$/g, "");
}
const EXP = { "gonna": "going to", "wanna": "want to", "gotta": "got to", "kinda": "kind of", "i'm": "i am", "you're": "you are", "it's": "it is", "that's": "that is", "what's": "what is", "don't": "do not", "can't": "cannot", "won't": "will not", "i'll": "i will", "i'd": "i would", "i've": "i have", "we're": "we are", "let's": "let us", "there's": "there is", "isn't": "is not", "didn't": "did not", "doesn't": "does not", "that'd": "that would", "they're": "they are", "we've": "we have", "you've": "you have", "he's": "he is", "she's": "she is", "u": "you", "ya": "you", "ok": "okay" };
const norm = s => String(s).toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9' ]/g, " ").split(/\s+/).filter(Boolean).flatMap(w => (EXP[w] || w).split(" "));
function sim(said, target) { const a = norm(said), b = norm(target); if (!b.length) return 0; const m = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0)); for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) m[i][j] = a[i - 1] === b[j - 1] ? m[i - 1][j - 1] + 1 : Math.max(m[i - 1][j], m[i][j - 1]); return m[a.length][b.length] / b.length; }

/* ---------------- SRS (SM-2 variant with lapses) ---------------- */
function addCard(id, en, fa, src) { if (!S.cards[id]) S.cards[id] = { en, fa, src, ef: 2.5, n: 0, iv: 0, due: Date.now(), lapses: 0 }; }
function grade(id, q) { const c = S.cards[id]; if (!c) return; if (q < 3) { c.n = 0; c.iv = 0; c.lapses = (c.lapses || 0) + 1; } else { c.n++; c.iv = c.n == 1 ? 1 : c.n == 2 ? (q == 5 ? 4 : 3) : Math.round(c.iv * c.ef * (q == 5 ? 1.3 : q == 3 ? .8 : 1)); }
  c.ef = Math.max(1.3, c.ef + .1 - (5 - q) * (.08 + (5 - q) * .02)); c.due = Date.now() + (c.iv ? c.iv * 864e5 : 6e4); S.reviewsToday[today()] = (S.reviewsToday[today()] || 0) + 1; save(); }
const dueCards = () => Object.entries(S.cards).filter(([, c]) => c.due <= Date.now()).map(([id, c]) => ({ id, ...c }));
const weakCards = (n = 15) => Object.values(S.cards).filter(c => c.lapses || c.ef < 2.3).sort((a, b) => (b.lapses || 0) - (a.lapses || 0) || a.ef - b.ef).slice(0, n);

/* Mic test: live level meter, playback of the recording, optional transcription and fast-mode check. */
function micTest() {
  modal(`<h3>🎤 آزمایش میکروفون</h3><p class=muted>«ضبط» را بزنید و یک جمله‌ی انگلیسی بگویید. نوار سبز باید با صدای شما بالا و پایین برود.</p>
  <div class="meter big" aria-label="سطح صدا"><i id=mtl></i></div><p id=mts aria-live=polite class=muted>آماده</p>
  <button class="btn p" id=mtr>⏺ ضبط (حداکثر ۶ ثانیه)</button><button class=btn id=mtx disabled>⏹ توقف</button>
  <audio id=mta controls class=hidden style="width:100%;margin-top:8px"></audio>
  <div style="margin-top:8px"><button class=btn id=mtt disabled>📝 تبدیل به متن با Gemini</button>${hasFast() ? `<button class=btn id=mtf>⚡ آزمایش تشخیص سریع</button>` : ""}</div><div id=mto aria-live=polite></div>
  <button class=btn onclick="closeModal()">بستن</button>`);
  let last = null; const out = h => $("#mto") && ($("#mto").innerHTML = h);
  $("#mtx").onclick = () => stopListening();
  $("#mtr").onclick = async () => {
    if (!canRecord()) return out(`<b class=bad>${WHY.unsupported}</b>`);
    $("#mtr").disabled = true; $("#mtx").disabled = false; $("#mtt").disabled = true; $("#mta").classList.add("hidden"); out(""); $("#mts").textContent = "⏺ در حال ضبط… صحبت کنید";
    try {
      last = await recordClip({ vad: false, maxMs: 6000, bar: false, onLevel: (l, rms) => { if ($("#mtl")) { $("#mtl").style.width = Math.round(l * 100) + "%"; $("#mts").textContent = `⏺ سطح صدا: ${fa(Math.round(rms * 10) / 10)}`; } } });
      if (!$("#mta")) return; const a = $("#mta"); a.src = URL.createObjectURL(last.blob); a.classList.remove("hidden");
      const ok = last.peak >= SILENT_PEAK; $("#mts").innerHTML = `${ok ? "<b class=ok>✔ صدا ضبط شد</b>" : `<b class=bad>✘ ${WHY.silent}</b>`}<br><span dir=ltr style="font-size:.8em">peak ${last.peak.toFixed(1)} · ${esc(last.mime || "?")} · ${Math.round(last.blob.size / 1024)} KB${last.label ? " · " + esc(last.label) : ""}</span><br>با دکمه‌ی پخش، صدای ضبط‌شده را گوش دهید.`;
      $("#mtt").disabled = !ok;
    } catch (e) { if (/NotAllowed|Security|NotFound|NotReadable/.test(e?.name)) { closeModal(); micError(e); return; } $("#mts").textContent = "خطا: " + (e?.message || e?.name); }
    finally { if ($("#mtr")) { $("#mtr").disabled = false; $("#mtx").disabled = true; } }
  };
  $("#mtt").onclick = async () => { if (!last) return; if (!canTranscribe()) return out(`<b class=bad>${WHY.nokey}</b>`); out("⏳ تبدیل به متن…");
    try { const t = await transcribe(last.blob); out(t ? `<b class=ok>✔ شنیده شد:</b> <span dir=ltr lang=en>${esc(t)}</span>` : `<b class=bad>${WHY.nospeech}</b>`); } catch (e) { out(`<b class=bad>${esc(e.why === "network" ? WHY.network : e.message)}</b>`); } };
  if ($("#mtf")) $("#mtf").onclick = async () => { out("⚡ صحبت کنید…"); const r = await fastListen(() => {}); out(r.text ? `<b class=ok>✔ تشخیص سریع کار می‌کند:</b> <span dir=ltr lang=en>${esc(r.text)}</span>` : `<b class=bad>✘ تشخیص سریع جواب نداد (${esc(r.why)}). ${r.why === "network" || r.why === "timeout" ? WHY.network : ""} موتور «پایدار» را انتخاب کنید.</b>`); };
}

/* ---------------- AI providers ---------------- */
function aiErr(status, msg) { msg = msg || ""; const m = msg.toLowerCase();
  if ((status == 400 && /api key|api_key/.test(m)) || status == 401 || (status == 403 && /key/.test(m))) return "کلید API نامعتبر است. کلید را از Google AI Studio دوباره کپی کنید.";
  if (/location|region|country|not supported for your|user location/.test(m)) return "سرویس در منطقه‌ی شما در دسترس نیست (Gemini از ایران مسدود است). از سرور واسط (پروکسی) یا VPN استفاده کنید.";
  if (status == 429 || /quota|rate|exhausted/.test(m)) return "سهمیه یا محدودیت تعداد درخواست تمام شده. چند دقیقه صبر کنید یا مدل سبک‌تری (gemini-3.5-flash-lite) انتخاب کنید.";
  if (status == 404 || /not found|is not supported/.test(m)) return "نام مدل پیدا نشد. در تنظیمات مدل دیگری انتخاب کنید.";
  if (status == 413) return "فایل صوتی خیلی بزرگ است؛ کوتاه‌تر صحبت کنید.";
  if (status == 403) return "دسترسی رد شد (۴۰۳). ممکن است کلید محدود یا منطقه مسدود باشد.";
  if (status >= 500) return "سرور هوش مصنوعی موقتاً در دسترس نیست. دوباره تلاش کنید.";
  return "خطا (" + status + "): " + msg; }
async function gemini(body, { json = false } = {}) {
  if (!aiReady() || S.provider === "openai") throw Object.assign(new Error("ابتدا Gemini یا آدرس سرور واسط را در تنظیمات وارد کنید."), { why: "nokey" });
  const model = encodeURIComponent(S.gmodel || DEFAULT_MODEL);
  const url = S.provider === "proxy" ? `${S.proxy.replace(/\/$/, "")}/v1beta/models/${model}:generateContent` : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const headers = { "Content-Type": "application/json" }; if (S.provider === "gemini") headers["x-goog-api-key"] = S.gkey;
  if (json) body.generationConfig = { ...(body.generationConfig || {}), responseMimeType: "application/json" };
  let r, j; const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 45000);
  try { r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: ctl.signal }); j = await r.json().catch(() => ({})); }
  catch (e) { throw Object.assign(new Error(e.name === "AbortError" ? "پاسخ هوش مصنوعی خیلی طول کشید. دوباره تلاش کنید." : "اتصال به سرور برقرار نشد. اینترنت را بررسی کنید؛ Gemini از ایران بدون VPN یا سرور واسط در دسترس نیست."), { why: e.name === "AbortError" ? "timeout" : "network" }); }
  finally { clearTimeout(to); }
  if (!r.ok) { const m = aiErr(r.status, j.error?.message || j.error?.status || j.error); throw Object.assign(new Error(m), { why: /منطقه|مسدود/.test(m) ? "blocked" : "api" }); }
  const c = j.candidates?.[0]; if (!c) throw new Error(j.promptFeedback?.blockReason ? "پیام به دلیل سیاست‌های ایمنی مسدود شد." : "پاسخ خالی از Gemini.");
  const t = (c.content?.parts || []).filter(p => !p.thought).map(p => p.text || "").join("").trim();
  if (!t && c.finishReason === "SAFETY") throw new Error("پاسخ به دلیل سیاست‌های ایمنی مسدود شد."); return t;
}
async function callAI(system, msgs, opt = {}) {
  if (!aiReady()) throw new Error("ابتدا کلید API را در تنظیمات وارد کنید.");
  if (S.provider !== "openai") { const m = msgs[0] && msgs[0].role !== "user" ? [{ role: "user", content: "(start)" }, ...msgs] : msgs;
    return gemini({ systemInstruction: { parts: [{ text: system }] }, contents: m.map(x => ({ role: x.role === "user" ? "user" : "model", parts: [{ text: x.content }] })), generationConfig: { temperature: opt.temp ?? .8, maxOutputTokens: opt.max || 1024 } }, opt); }
  let r, j; try { r = await fetch(S.api.replace(/\/$/, "") + "/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + S.key }, body: JSON.stringify({ model: S.model, temperature: opt.temp ?? .8, messages: [{ role: "system", content: system }, ...msgs], ...(opt.json ? { response_format: { type: "json_object" } } : {}) }) }); j = await r.json().catch(() => ({})); }
  catch (e) { throw new Error("اتصال به سرور برقرار نشد."); }
  if (!r.ok) throw new Error(aiErr(r.status, j.error?.message)); const t = j.choices?.[0]?.message?.content; if (!t) throw new Error("پاسخ خالی از سرور."); return t;
}

/* speak / speakSeq / stopTTS / stopAll live in voice.js (natural Gemini voices). */
const dv = (l, d) => d.me ? ZYV.learnerVoice(l.partner) : ZYV.partnerVoice(l.partner);
const dlines = l => l.dialogue.map(d => ({ t: d.en, v: dv(l, d) }));

/* ---------------- Views ---------------- */
const V = {};
V.home = async () => {
  const done = Object.keys(S.done).filter(k => !k.includes("#")).length, total = IDX.counts.total.lessons, learned = Object.keys(S.cards).length, due = dueCards().length;
  const rec = allMeta().find(l => !S.done[l.id] && LEVELS.indexOf(l.id.split("-")[0]) >= LEVELS.indexOf(S.level || "A1")) || allMeta().find(l => !S.done[l.id]);
  const week = [...Array(7)].map((_, i) => S.days[new Date(Date.now() - (6 - i) * 864e5).toLocaleDateString("en-CA")] || 0), mx = Math.max(20, ...week);
  const pd = programDay();
  app.innerHTML = `<div class=card><h2>سلام! 👋 آماده‌ی حرف زدنی؟</h2><p class=muted>روش زبان‌یار: اول گفتگو، بعد قواعد. عبارت‌های واقعی را بشنو، تکرار کن، نقش بازی کن.</p>
  ${S.level ? `<p>سطح شما: <span class=badge>${S.level}</span> ${LVNAME[S.level]}</p>` : `<button class="btn p" data-go=placement>🎯 آزمون تعیین سطح (۲ دقیقه)</button>`}</div>
  <div class=card><h3>📅 برنامه‌ی فشرده‌ی ۳۰ روزه</h3>${pd ? `<p>امروز: <b>روز ${fa(pd)}</b> از ۳۰</p><div class=bar><i style="width:${pd / 30 * 100}%"></i></div><button class="btn p" data-day=${pd}>برنامه‌ی امروز ▶</button>` : `<p class=muted>هر روز ۳۰ تا ۴۵ دقیقه: سناریوی جدید، عبارت‌های پرکاربرد، مرور، سایه‌روی و گفتگو با معلم AI.</p><button class="btn p" data-go=program>شروع برنامه</button>`}</div>
  ${rec ? `<div class=card><span class=muted>سناریوی پیشنهادی</span><h3>${rec.icon} ${esc(rec.title)} <span class=badge>${rec.id.split("-")[0]}</span></h3><p class=muted>${esc(rec.scene)}</p><button class="btn p" data-lesson=${rec.id}>شروع ▶</button></div>` : ""}
  <div class="card grid"><div class=stat><b>${fa(done)}/${fa(total)}</b>سناریو</div><div class=stat><b>${fa(Object.keys(S.done).length)}/${fa(IDX.counts.total.dialogues || total)}</b>گفتگو</div><div class=stat><b>${fa(learned)}</b>کارت مرور</div><div class=stat><b>${fa(due)}</b>آماده‌ی مرور</div><div class=stat><b>${fa(S.streak)}🔥</b>روز پیاپی</div></div>
  <div class=card><b>فعالیت ۷ روز اخیر (XP)</b><div style="display:flex;align-items:flex-end;gap:6px;height:90px;margin-top:8px" role=img aria-label="نمودار فعالیت هفتگی">${week.map(v => `<div style="flex:1;background:var(--pri2);opacity:${v ? 1 : .2};height:${Math.max(4, v / mx * 85)}px;border-radius:6px 6px 0 0" title="${v}"></div>`).join("")}</div></div>
  <div class=card><b>پیشرفت در هر سطح</b>${LEVELS.map(lv => { const ls = IDX.levels[lv], d = ls.filter(l => S.done[l.id]).length; return `<div style="margin:6px 0"><span class=badge>${lv}</span> <span class=muted>${fa(d)} از ${fa(ls.length)}</span><div class=bar><i style="width:${d / ls.length * 100}%"></i></div></div>`; }).join("")}</div>`;
};
V.placement = async () => { let i = 0; const sc = {}; const P = window.PLACEMENT;
  const step = () => { if (i >= P.length) { let lvl = "A1"; for (const l of LEVELS) { const tot = P.filter(p => p.l == l).length; if ((sc[l] || 0) / tot >= .67) lvl = LEVELS[Math.min(LEVELS.indexOf(l) + 1, 4)]; else break; } if (!(sc.A1 >= 3)) lvl = "A1";
      S.level = lvl; addXP(20); app.innerHTML = `<div class=card style=text-align:center><div class=big>🎯</div><h2>سطح پیشنهادی: <span class=badge>${lvl}</span> ${LVNAME[lvl]}</h2><p class=muted>همه‌ی سناریوها باز هستند؛ سناریوهای سطح شما مشخص شده‌اند.</p><button class="btn p" data-go=map>رفتن به سناریوها</button></div>`; return; }
    const p = P[i]; app.innerHTML = `<div class=card><div class=bar><i style="width:${i / P.length * 100}%"></i></div><p class=muted>سؤال ${fa(i + 1)} از ${fa(P.length)}</p><p class="big" ${isFa(p.q) ? "" : 'dir=ltr lang=en'}>${esc(p.q)}</p>${p.o.map((o, j) => `<button class="btn" style="display:block;width:100%" ${isFa(o) ? "" : "dir=ltr lang=en"} data-j=${j}>${esc(o)}</button>`).join("")}<button class="btn sm" id=skip>نمی‌دانم</button></div>`;
    $$("[data-j]").forEach(b => b.onclick = () => { if (+b.dataset.j == p.a) sc[p.l] = (sc[p.l] || 0) + 1; i++; step(); }); $("#skip").onclick = () => { i++; step(); }; }; step(); };
V.map = async () => {
  app.innerHTML = `<div class=card><h2>🗺️ سناریوها</h2><p class=muted>${fa(IDX.counts.total.lessons)} سناریوی واقعی از A1 تا C1 · ${fa(IDX.counts.total.dialogues || IDX.counts.total.lessons)} گفتگو · ${fa(IDX.counts.total.all)} عبارت با ترجمه‌ی فارسی</p><input id=q placeholder="جستجو… (مثلاً قهوه، مصاحبه، phone)" aria-label="جستجوی سناریو"></div><div id=lv></div>`;
  const draw = (q = "") => { $("#lv").innerHTML = LEVELS.map(lv => { const ls = IDX.levels[lv].filter(l => !q || (l.title + l.scene).toLowerCase().includes(q)); if (!ls.length) return ""; return `<div class=lvl-h><span class=badge>${lv}</span><b>${LVNAME[lv]}</b><span class=muted>${fa(ls.filter(l => S.done[l.id]).length)}/${fa(ls.length)}</span></div><div class=grid>${ls.map(l => `<button class="node ${S.done[l.id] ? "done" : ""} ${S.level == lv && !S.done[l.id] ? "rec" : ""}" data-lesson=${l.id}><div class=ic aria-hidden=true>${l.icon}</div><b>${esc(l.title)}</b><div class=muted>${S.done[l.id] ? "✅ کامل" : fa(Object.keys(S.steps[l.id] || {}).length) + "/۶ بخش"} · 💬 ${fa(varsDone(l.id))}/${fa(l.v || 1)}</div></button>`).join("")}</div>`; }).join("") || `<p class=muted>چیزی پیدا نشد.</p>`; };
  draw(); $("#q").oninput = e => draw(e.target.value.trim().toLowerCase()); };
V.review = async () => { const q = dueCards();
  if (!q.length) { const n = Object.keys(S.cards).length; app.innerHTML = `<div class=card style=text-align:center><div class=big>🎉</div><h3>فعلاً مروری نمانده</h3><p class=muted>${n ? `${fa(n)} کارت دارید؛ هر کدام در زمان مناسب برمی‌گردد.` : "با باز کردن بخش «عبارت‌ها» در سناریوها یا بسته‌های روزانه، کارت اضافه می‌شود."}</p><p>مرورهای امروز: ${fa(S.reviewsToday[today()] || 0)}</p></div>`; return; }
  const c = q[0]; const rev = Math.random() < .5;
  app.innerHTML = `<div class=card style=text-align:center><p class=muted>باقی‌مانده: ${fa(q.length)} · مرورهای امروز: ${fa(S.reviewsToday[today()] || 0)} ${c.src === "tutor" ? "· 🤖 از اشتباهات جلسه‌ی معلم" : ""}</p><p class="big" ${rev ? "dir=ltr lang=en" : ""}>${esc(rev ? c.en : c.fa)}</p><p class=muted>${rev ? "معنی را به یاد بیاورید" : "عبارت انگلیسی را بلند بگویید، بعد ببینید"}</p><button class="btn p" id=show>نمایش پاسخ</button><div id=ans aria-live=polite></div></div>`;
  if (rev) speak(c.en);
  $("#show").onclick = () => { speak(c.en); $("#ans").innerHTML = `<p class="big" ${rev ? "" : "dir=ltr lang=en"}>${esc(rev ? c.fa : c.en)}</p><button class="btn sm" id=say aria-label="پخش">🔊</button><hr style="border:0;border-top:1px solid var(--line)"><button class=btn data-q=1>🔁 دوباره</button><button class=btn data-q=3>😓 سخت</button><button class=btn data-q=4>🙂 خوب</button><button class=btn data-q=5>😎 آسان</button>`;
    $("#say").onclick = () => speak(c.en); $$("[data-q]").forEach(b => b.onclick = () => { grade(c.id, +b.dataset.q); addXP(2); V.review(); }); $("[data-q='4']").focus(); }; };

/* ---------------- Lesson ---------------- */
const STEPS = [["dlg", "💬 گفتگو"], ["chunks", "🧩 عبارت‌ها"], ["notes", "📚 کتابی/محاوره"], ["shadow", "🔁 سایه‌روی"], ["role", "🎭 نقش‌آفرینی"], ["listen", "🎧 شنیداری"]];
function markStep(id, k) { S.steps[id] = S.steps[id] || {}; if (!S.steps[id][k]) { S.steps[id][k] = 1; addXP(5); } if (STEPS.every(([s]) => S.steps[id][s]) && !S.done[id]) { S.done[id] = 1; addXP(20); toast(id.includes("#") ? `🎉 گفتگو ${FA_N[parseKey(id).n]} کامل شد! +۲۰ XP` : "🎉 سناریو کامل شد! +۲۰ XP"); } save(); }
async function lesson(key, tab = "dlg") { stopAll(); let { id, n } = parseKey(key); if (!String(key).includes("#")) n = (S.vsel || {})[id] || 1; key = vkey(id, n); app.innerHTML = `<div class="card loading">در حال بارگذاری…</div>`;
  let l; try { l = await getLesson(key); if (!l) throw new Error("not found " + key); } catch (e) { app.innerHTML = `<div class=card><p class=bad>بارگذاری درس ناموفق بود (${esc(e.message)}).</p><button class="btn p" onclick="lesson('${key}','${tab}')">تلاش دوباره</button></div>`; return; }
  S.lastLesson = key; S.vsel = { ...(S.vsel || {}), [id]: l.n }; save(); const nv = 1 + (l.variants || []).length;
  app.innerHTML = `<div class=card><button class="btn sm" data-go=map>→ سناریوها</button><h2>${l.icon} ${esc(l.title)} <span class=badge>${l.level}</span></h2><div class=seg role=tablist aria-label="انتخاب گفتگو" id=vpick>${[...Array(nv)].map((_, i) => `<button role=tab aria-selected=${i + 1 == l.n} data-v=${i + 1} class="${i + 1 == l.n ? "on" : ""}">گفتگو ${FA_N[i + 1]}${S.done[vkey(id, i + 1)] ? " ✓" : ""}</button>`).join("")}</div>
  <p class=muted><b>${esc(l.mood)}</b> · ${esc(l.scene)} · طرف گفتگو: <b dir=ltr lang=en>${esc(l.partner)}</b></p>
  <div class=seg role=tablist>${STEPS.map(([k, n]) => `<button role=tab aria-selected=${k == tab} data-t=${k} class="${k == tab ? "on" : ""}">${n}${(S.steps[key] || {})[k] ? " ✓" : ""}</button>`).join("")}</div>
  <button class="btn sm" id=askT>🤖 تمرین این سناریو با معلم AI</button></div><div id=pane></div>`;
  $$("[data-t]").forEach(b => b.onclick = () => lesson(key, b.dataset.t)); $$("[data-v]").forEach(b => b.onclick = () => lesson(vkey(id, +b.dataset.v), tab)); $("#askT").onclick = () => { sessionStorage.zyTutor = JSON.stringify({ mode: "roleplay", lesson: key }); go("tutor"); };
  P[tab](l, $("#pane")); window.scrollTo(0, 0); }
const nextBtn = (l, k) => { const i = STEPS.findIndex(s => s[0] == k); return i < STEPS.length - 1 ? `<button class="btn p" data-next="${l.key}|${k}|${STEPS[i + 1][0]}">ادامه: ${STEPS[i + 1][1]} ←</button>` : `<button class="btn p" data-next="${l.key}|${k}|">پایان ✓</button>`; };
const P = {
  dlg(l, el) { el.innerHTML = `<div class=card><button class="btn p" id=play>▶ پخش کل گفتگو</button><button class=btn id=slow>🐢 آهسته</button><button class=btn id=tg>👁️ ترجمه</button>
    ${l.dialogue.map((d, i) => `<div class="bubble ${d.me ? "me" : "them"}"><div class=who>${d.me ? "شما" : esc(l.partner)}</div><div dir=ltr lang=en>${esc(d.en)} <button class="btn sm" data-say=${i} aria-label="پخش جمله">🔊</button></div><div class="fa tr">${esc(d.fa)}</div></div>`).join("")}</div><div class=card>${nextBtn(l, "dlg")}</div>`;
    $$("[data-say]").forEach(b => b.onclick = () => speak(l.dialogue[b.dataset.say].en, 1, null, { voice: dv(l, l.dialogue[b.dataset.say]) })); $("#play").onclick = () => speakSeq(dlines(l)); $("#slow").onclick = () => speakSeq(dlines(l), .7); $("#tg").onclick = () => $$(".tr").forEach(x => x.classList.toggle("hidden")); },
  chunks(l, el) { el.innerHTML = `<div class=card><p class=muted>عبارت‌ها را تکه‌تکه (chunk) یاد بگیرید، نه کلمه‌به‌کلمه. همه به کارت‌های مرور اضافه شدند.</p>${l.chunks.map((c, i) => `<div class=chunk><div><div dir=ltr lang=en><b>${esc(c.en)}</b></div><div class=muted>${esc(c.fa)}</div></div><button class="btn sm" data-i=${i} aria-label="پخش">🔊</button></div>`).join("")}</div><div class=card><h3>⚡ تمرین سریع معنی</h3><div id=qz aria-live=polite></div></div><div class=card>${nextBtn(l, "chunks")}</div>`;
    $$("[data-i]").forEach(b => b.onclick = () => speak(l.chunks[b.dataset.i].en)); l.chunks.forEach((c, i) => addCard(l.key + ":" + i, c.en, c.fa, l.key)); save();
    const pool = shuffle(l.chunks).slice(0, 5); let k = 0, score = 0;
    const q = () => { if (!$("#qz")) return; if (k >= pool.length) { $("#qz").innerHTML = `<p>امتیاز: <b>${fa(score)}/${fa(pool.length)}</b></p>`; return; }
      const c = pool[k], opts = shuffle([c, ...shuffle(l.chunks.filter(x => x !== c)).slice(0, 2)]);
      $("#qz").innerHTML = `<p class=big dir=ltr lang=en>${esc(c.en)}</p>${opts.map((o, j) => `<button class=btn style="display:block;width:100%" data-o=${j}>${esc(o.fa)}</button>`).join("")}<div id=qf></div>`;
      $$("[data-o]").forEach(b => b.onclick = () => { const ok = opts[b.dataset.o] === c; if (ok) { score++; addXP(1); } $("#qf").innerHTML = ok ? "<b class=ok>✔ درست</b>" : `<b class=bad>✘ ${esc(c.fa)}</b>`; $$("[data-o]").forEach(x => x.disabled = true); setTimeout(() => { k++; q(); }, ok ? 600 : 1400); }); }; q(); },
  notes(l, el) { el.innerHTML = `<div class=card><h3>📚 کتابی در برابر محاوره‌ای</h3>${l.notes.map(n => `<div class=cmp><div class=book><small>❌ کتابی/غیرطبیعی</small><div dir=ltr lang=en>${esc(n.book)}</div></div><div class=casual><small>✅ محاوره‌ای بومی</small><div dir=ltr lang=en>${esc(n.casual)} <button class="btn sm" data-w="${esc(n.casual)}" data-r=1 aria-label="پخش">🔊</button></div></div></div><div class=tip>💡 ${esc(n.fa)}</div>`).join("")}</div>
    <div class=card><h3>🗣️ گفتار پیوسته و تلفظ</h3>${l.sounds.map(s => `<div class=chunk><div><b dir=ltr lang=en>${esc(s.w)}</b> ← <b>«${esc(s.how)}»</b><div class=muted>${esc(s.fa)}</div></div><span><button class="btn sm" data-w="${esc(s.w)}" data-r=.6 aria-label="آهسته">🐢</button><button class="btn sm" data-w="${esc(s.w)}" data-r=1 aria-label="عادی">🔊</button></span></div>`).join("")}
    <div class=tip>نکته‌ی عمومی برای فارسی‌زبانان: صداهای th، تفاوت w و v، و بدون مصوت اضافه گفتن خوشه‌ها (street نه «اِستریت») را تمرین کنید. در گفتار سریع، t بین دو مصوت در لهجه‌ی آمریکایی شبیه d نرم می‌شود (water → «وادِر»).</div></div><div class=card>${nextBtn(l, "notes")}</div>`;
    $$("[data-w]").forEach(b => b.onclick = () => speak(b.dataset.w, +b.dataset.r)); },
  shadow(l, el) { let i = 0, rate = 1; const r = () => { const d = l.dialogue[i]; el.innerHTML = `<div class=card style=text-align:center><p class=muted>سایه‌روی: جمله را بشنوید و هم‌زمان یا بلافاصله با همان آهنگ تکرار کنید. (${fa(i + 1)}/${fa(l.dialogue.length)})</p>
    <div class=seg style="max-width:260px;margin:auto"><button data-r=.6 class="${rate < 1 ? "on" : ""}">🐢 آهسته</button><button data-r=1 class="${rate == 1 ? "on" : ""}">🐇 عادی</button></div>
    <p class=big dir=ltr lang=en>${esc(d.en)}</p><p class=muted>${esc(d.fa)}</p><button class="btn p" id=pl>🔊 پخش</button><button class=btn id=rec>🎤 تکرار و ارزیابی</button><div id=fb aria-live=polite></div>
    <div><button class=btn id=pv ${i == 0 ? "disabled" : ""}>→ قبلی</button><button class=btn id=nx ${i == l.dialogue.length - 1 ? "disabled" : ""}>بعدی ←</button></div></div><div class=card>${nextBtn(l, "shadow")}</div>`;
    $$("[data-r]").forEach(b => b.onclick = () => { rate = +b.dataset.r; r(); speak(d.en, rate, null, { voice: dv(l, d) }); }); $("#pl").onclick = () => speak(d.en, rate, null, { voice: dv(l, d) });
    $("#pv").onclick = () => { i--; r(); speak(l.dialogue[i].en, rate, null, { voice: dv(l, l.dialogue[i]) }); }; $("#nx").onclick = () => { i++; r(); speak(l.dialogue[i].en, rate, null, { voice: dv(l, l.dialogue[i]) }); }; $("#rec").onclick = () => evalSpeech(d.en, $("#fb")); }; r(); },
  role(l, el) { let i = 0, tot = 0, n = 0; const log = [];
    const r = () => { if (!el.isConnected) return; const d = l.dialogue[i];
      el.innerHTML = `<div class=card><p class=muted>🎭 شما نقش «شما» را بازی می‌کنید. جمله‌ی طرف مقابل پخش می‌شود؛ سپس جمله‌ی خود را بگویید (یا تایپ کنید). راهنمای فارسی کمکتان می‌کند. <br>موتور گفتار: ${sttLabel()}</p><div id=rl>${log.join("")}</div><div id=turn></div></div>`;
      const turn = $("#turn");
      if (!d) { const avg = n ? Math.round(tot / n * 100) : 0; turn.innerHTML = `<div class=tip>پایان نقش‌آفرینی! میانگین دقت: <b>${fa(avg)}٪</b></div><button class=btn onclick="lesson('${l.key}','role')">🔁 دوباره</button> ${nextBtn(l, "role")}`; return; }
      if (!d.me) { log.push(`<div class="bubble them"><div class=who>${esc(l.partner)}</div><div dir=ltr lang=en>${esc(d.en)}</div></div>`); $("#rl").innerHTML = log.join(""); i++; speak(d.en, 1, () => setTimeout(r, 250), { voice: dv(l, d) }); return; }
      turn.innerHTML = `<div class="bubble me"><div class=who>نوبت شما — به انگلیسی بگویید:</div><div>«${esc(d.fa)}»</div><div class="hidden" dir=ltr lang=en id=hint>${esc(d.en)}</div></div>
      <button class="btn p" id=mic ${sttMode() == "none" ? "disabled" : ""}>🎤 بگویید</button><button class=btn id=hb>💡 نمایش جمله</button><div class=row><input id=typ dir=ltr lang=en placeholder="یا تایپ کنید…" aria-label="جمله‌ی خود را تایپ کنید"><button class=btn id=ok>✓</button></div><div id=fb aria-live=polite></div>`;
      const done = said => { const s = sim(said, d.en); tot += s; n++; if (s >= .7) addXP(2); log.push(`<div class="bubble me"><div class=who>شما · <b class=${s >= .7 ? "ok" : "bad"}>${fa(Math.round(s * 100))}٪</b></div><div dir=ltr lang=en>${esc(said)}</div>${s < 1 ? `<div class=fa dir=ltr lang=en>✅ ${esc(d.en)}</div>` : ""}</div>`); i++; r(); };
      $("#hb").onclick = () => { $("#hint").classList.toggle("hidden"); speak(d.en, .8, null, { voice: dv(l, d) }); }; $("#ok").onclick = () => { const t = $("#typ").value.trim(); if (t) done(t); }; $("#typ").onkeydown = e => { if (e.key == "Enter") $("#ok").click(); };
      $("#mic").onclick = () => listen((t, why, d) => { if (t) done(t); else if ($("#fb")) $("#fb").textContent = whyMsg(why, d) + " (می‌توانید تایپ هم کنید.)"; }, { onState: s => { if ($("#fb")) $("#fb").textContent = s == "listen" ? "⏺ در حال گوش دادن… (پس از مکث خودکار تمام می‌شود)" : s == "think" ? "⏳ در حال تبدیل صدا به متن…" : ""; } }); };
    r(); },
  listen(l, el) { el.innerHTML = `<div class=card><h3>🎧 درک شنیداری</h3><p class=muted>متن پنهان است. گفتگو را گوش دهید (چند بار هم اشکال ندارد) و جواب دهید.</p><button class="btn p" id=p1>▶ پخش عادی</button><button class=btn id=p2>🐢 پخش آهسته</button>
    <div>${l.quiz.map((q, i) => `<div style="margin-top:12px"><b>${fa(i + 1)}. <span ${q.en ? "" : ""}>${esc(q.q)}</span></b><div>${q.o.map((o, j) => `<button class=btn data-q=${i} data-j=${j}>${esc(o)}</button>`).join("")}</div><div id=f${i} aria-live=polite></div></div>`).join("")}</div>
    <div style="margin-top:12px"><b>${fa(l.quiz.length + 1)}. دیکته: جمله‌ای را که می‌شنوید بنویسید</b> <button class="btn sm" id=dp aria-label="پخش">🔊</button><input id=dc dir=ltr lang=en aria-label="دیکته"><button class=btn id=dk>بررسی</button><div id=df aria-live=polite></div></div>
    <button class="btn sm" id=st>📜 نمایش متن</button><div id=tx class=hidden>${l.dialogue.map(d => `<p dir=ltr lang=en>${esc(d.en)}</p>`).join("")}</div></div><div class=card>${nextBtn(l, "listen")}</div>`;
    const lines = dlines(l); $("#p1").onclick = () => speakSeq(lines, 1); $("#p2").onclick = () => speakSeq(lines, .7); $("#st").onclick = () => $("#tx").classList.toggle("hidden");
    $$("[data-q]").forEach(b => b.onclick = () => { const q = l.quiz[b.dataset.q], ok = +b.dataset.j == q.a; $("#f" + b.dataset.q).innerHTML = ok ? "<b class=ok>✔ درست</b>" : `<b class=bad>✘ پاسخ: ${esc(q.o[q.a])}</b>`; if (ok) addXP(2); $$(`[data-q="${b.dataset.q}"]`).forEach(x => x.disabled = true); });
    const dd = l.dialogue.filter(d => d.me)[0], dl = dd.en; $("#dp").onclick = () => speak(dl, .85, null, { voice: dv(l, dd) }); $("#dk").onclick = () => { const s = sim($("#dc").value, dl); $("#df").innerHTML = `<b class=${s >= .8 ? "ok" : "bad"}>${fa(Math.round(s * 100))}٪</b> — <span dir=ltr lang=en>${esc(dl)}</span>`; if (s >= .8) addXP(2); }; }
};
function evalSpeech(target, fb) { if (["none", "nokey"].includes(sttMode())) { fb.innerHTML = `<p class=muted>تشخیص گفتار در دسترس نیست. برای فعال شدن، از Chrome/Edge استفاده کنید یا در تنظیمات کلید Gemini وارد کنید. فعلاً بلند تکرار کنید و خودتان مقایسه کنید.</p>`; return; }
  listen((t, why, d) => { if (!t) { fb.textContent = whyMsg(why, d); return; } const s = sim(t, target), said = norm(t);
    fb.innerHTML = `<p>شنیده شد: <span dir=ltr lang=en>${esc(t)}</span></p><p dir=ltr lang=en>${norm(target).map(w => `<span class=${said.includes(w) ? "ok" : "bad"}>${esc(w)}</span>`).join(" ")}</p><b class=${s >= .7 ? "ok" : "bad"}>${fa(Math.round(s * 100))}٪ ${s >= .9 ? "عالی! 🌟" : s >= .7 ? "خوب 👍" : "دوباره امتحان کنید"}</b>`; if (s >= .7) addXP(2); },
    { onState: s => fb.textContent = s == "listen" ? "⏺ در حال گوش دادن…" : s == "think" ? "⏳ در حال تبدیل صدا به متن…" : fb.textContent }); }

/* ---------------- 30-day program ---------------- */
function programDay() { if (!S.program.start) return 0; return Math.min(30, Math.floor((new Date(today()) - new Date(S.program.start)) / 864e5) + 1); }
/** 30-day program rotates dialogue variants: day d, j-th lesson → گفتگو ((d-1+j) mod 5)+1 (falls back to 1 if missing). */
const progVar = (d, j, id) => { const n = ((d - 1 + j) % NV) + 1, m = meta(id); return n <= (m?.v || 1) ? n : 1; };
const progKeys = (p, d) => p.lessons.map((id, j) => vkey(id, progVar(d, j, id)));
async function dayStatus(d) { const p = (await getProgram())[d - 1], t = S.program.tasks[d] || {};
  const keys = progKeys(p, d), lessonsDone = keys.every(k => S.done[k]);
  const shadow = !!t.shadow || keys.some(k => (S.steps[k] || {}).shadow);
  const review = !!t.review || ((d === programDay()) && ((S.reviewsToday[today()] || 0) >= p.reviewGoal || (Object.keys(S.cards).length > 0 && !dueCards().length)));
  if (review && !t.review && d === programDay()) { S.program.tasks[d] = { ...t, review: 1 }; save(); }
  const r = { p, lessons: lessonsDone, pack: !!t.pack, review, shadow, ai: !!t.ai }; r.all = r.lessons && r.pack && r.review && r.shadow && r.ai; return r; }
V.program = async () => { const prog = await getProgram();
  if (!S.program.start) { app.innerHTML = `<div class=card><h2>📅 برنامه‌ی فشرده‌ی ۳۰ روزه‌ی مکالمه</h2>
    <p>هدف: رسیدن به <b>گفتگوی روزمره با اعتمادبه‌نفس</b> — سفارش دادن، گپ زدن، تلفن، کار، تعریف کردن ماجرا — با انگلیسی طبیعی و محاوره‌ای.</p>
    <div class=tip>⚠️ صادقانه: «روان مثل بومی‌ها در یک ماه» واقع‌بینانه نیست و هیچ برنامه‌ای آن را تضمین نمی‌کند. نتیجه به سطح شروع، زمان تمرین و صحبت کردن واقعی بستگی دارد. این برنامه سریع‌ترین مسیر معقول به «حرف زدن بدون ترس» است.</div>
    <h3>هر روز (۳۰ تا ۴۵ دقیقه):</h3><ul><li>🆕 ۳ سناریوی جدید (روزهای ۷، ۱۴، ۲۱، ۲۸ و ۳۰: مرور)</li><li>🧩 بسته‌ی ۱۸ عبارت پرکاربرد گفتاری</li><li>🧠 مرور فاصله‌دار (۲۰ کارت؛ روزهای مرور ۴۰)</li><li>🔁 سایه‌روی</li><li>🤖 ۱۰ دقیقه گفتگو با معلم AI (یا اگر کلید ندارید: نقش‌آفرینی بلند با خودتان)</li></ul>
    <p class=muted>مجموعاً ${fa(prog.reduce((s, d) => s + d.chunks.length, 0))} عبارت پرکاربرد + ${fa(prog.reduce((s, d) => s + d.lessons.length, 0))} سناریو.</p><button class="btn p" id=st>شروع از امروز</button></div>`;
    $("#st").onclick = () => { S.program.start = today(); save(); V.day(1); }; return; }
  const pd = programDay(); const sts = await Promise.all(prog.map(d => dayStatus(d.day)));
  app.innerHTML = `<div class=card><h2>📅 برنامه‌ی ۳۰ روزه</h2><p>امروز روز <b>${fa(pd)}</b> است · کامل‌شده: ${fa(sts.filter(s => s.all).length)}/۳۰</p><div class=bar><i style="width:${sts.filter(s => s.all).length / 30 * 100}%"></i></div><button class="btn sm" id=rs>شروع دوباره‌ی برنامه</button></div>
  ${prog.map((d, i) => `<button class="day ${d.day == pd ? "today" : ""} ${sts[i].all ? "done" : ""}" style="width:100%;text-align:inherit;font:inherit;color:inherit" data-day=${d.day}><span class=n>${sts[i].all ? "✅" : fa(d.day)}</span><span style="flex:1"><b>${esc(d.theme)}</b><br><span class=muted>${d.review ? "🔄 روز مرور" : fa(d.lessons.length) + " سناریو"} · ${fa(d.chunks.length)} عبارت</span></span>${d.day > pd ? "🔒" : ""}</button>`).join("")}`;
  $("#rs").onclick = () => { if (confirm("برنامه از امروز دوباره شروع شود؟")) { S.program = { start: today(), tasks: {} }; save(); V.program(); } }; };
V.day = async d => { const s = await dayStatus(d), p = s.p; const ck = b => `<span class=ck aria-label="${b ? "انجام شد" : "انجام نشده"}">${b ? "✅" : "⬜"}</span>`;
  const ls = progKeys(p, d).map(k => ({ ...meta(parseKey(k).id), key: k, n: parseKey(k).n }));
  app.innerHTML = `<div class=card><button class="btn sm" data-go=program>→ برنامه</button><h2>روز ${fa(d)}: ${esc(p.theme)}</h2>${d > programDay() ? `<p class=muted>🔒 این روز هنوز نرسیده؛ می‌توانید پیش‌نمایش ببینید.</p>` : ""}
  <div class=task>${ck(s.lessons)}<div><b>🆕 سناریوهای امروز</b>${p.review ? `<div class=muted>روز مرور: یکی از سناریوهای قبلی را دوباره کامل کنید یا بخش نقش‌آفرینی را تکرار کنید.</div>` : ls.map(l => `<div><button class="btn sm" data-lesson="${l.key}">${l.icon} ${esc(l.title)} · گفتگو ${FA_N[l.n]} ${S.done[l.key] ? "✅" : ""}</button></div>`).join("")}</div></div>
  <div class=task>${ck(s.pack)}<div><b>🧩 بسته‌ی عبارت‌ها: ${esc(p.theme)}</b><div class=muted>${fa(p.chunks.length)} عبارت پرکاربرد گفتاری</div></div><button class="btn p" data-pack=${d}>باز کردن</button></div>
  <div class=task>${ck(s.review)}<div><b>🧠 مرور فاصله‌دار</b><div class=muted>هدف: ${fa(p.reviewGoal)} کارت · امروز: ${fa(S.reviewsToday[today()] || 0)}</div></div><button class=btn data-go=review>مرور</button></div>
  <div class=task>${ck(s.shadow)}<div><b>🔁 سایه‌روی</b><div class=muted>بخش سایه‌روی یکی از سناریوها یا ۵ عبارت از بسته را با میکروفون تکرار کنید.</div></div></div>
  <div class=task>${ck(s.ai)}<div><b>🤖 گفتگو با معلم (۱۰ دقیقه)</b><div class=muted dir=ltr lang=en>${esc(p.ai)}</div></div><button class=btn id=ai>شروع</button></div>
  ${aiReady() ? "" : `<div class=tip>کلید هوش مصنوعی ندارید؟ به‌جای گفتگو با معلم، نقش‌آفرینی یک سناریو را دو بار با صدای بلند انجام دهید و این مورد را دستی تیک بزنید. <button class="btn sm" id=man>انجام دادم ✓</button></div>`}
  ${s.all ? `<div class=tip>🎉 روز ${fa(d)} کامل شد! فردا برگردید.</div>` : ""}</div>`;
  $("#ai").onclick = () => { sessionStorage.zyTutor = JSON.stringify({ mode: "program", day: d }); go("tutor"); };
  $("#man") && ($("#man").onclick = () => { S.program.tasks[d] = { ...(S.program.tasks[d] || {}), ai: 1 }; save(); V.day(d); }); };
V.pack = async d => { const p = (await getProgram())[d - 1]; p.chunks.forEach((c, i) => addCard(`d${d}:${i}`, c.en, c.fa, "day" + d)); save(); let evals = 0;
  app.innerHTML = `<div class=card><button class="btn sm" data-day=${d}>→ روز ${fa(d)}</button><h2>🧩 ${esc(p.theme)}</h2><p class=muted>گوش کنید، بلند تکرار کنید (🎤) و جمله‌ای از زندگی خودتان با هرکدام بسازید. همه به کارت‌های مرور اضافه شدند.</p><button class="btn p" id=pa>▶ پخش همه</button></div>
  <div class=card>${p.chunks.map((c, i) => `<div class=chunk><div><b dir=ltr lang=en>${esc(c.en)}</b><div class=muted>${esc(c.fa)}</div><div id=pf${i} aria-live=polite></div></div><span><button class="btn sm" data-s=${i} aria-label="پخش">🔊</button><button class="btn sm" data-m=${i} aria-label="تکرار با میکروفون">🎤</button></span></div>`).join("")}</div>
  <div class=card><button class="btn p" id=pd>یاد گرفتم ✓</button></div>`;
  const clean = s => s.replace(/\(.*?\)|=.*$/g, "").replace(/\.\.\./g, "").trim();
  $("#pa").onclick = () => speakSeq(p.chunks.map(c => ZYV.cleanPhrase(c.en)));
  $$("[data-s]").forEach(b => b.onclick = () => speak(ZYV.cleanPhrase(p.chunks[b.dataset.s].en)));
  $$("[data-m]").forEach(b => b.onclick = () => { const i = b.dataset.m; evalSpeech(clean(p.chunks[i].en), $("#pf" + i)); if (++evals >= 5) { S.program.tasks[d] = { ...(S.program.tasks[d] || {}), shadow: 1 }; save(); } });
  $("#pd").onclick = () => { S.program.tasks[d] = { ...(S.program.tasks[d] || {}), pack: 1, ...(sttMode() === "none" ? { shadow: 1 } : {}) }; addXP(10); V.day(d); }; };

/* ---------------- AI Teacher ---------------- */
const MODES = { free: ["💬", "گفتگوی آزاد"], roleplay: ["🎭", "نقش‌آفرینی سناریو"], explain: ["📖", "توضیح درس"], drill: ["🎯", "تمرین کلمات ضعیف"], pron: ["🗣️", "مربی تلفظ"], program: ["📅", "گفتگوی برنامه‌ی روزانه"] };
let T = { mode: "free", lesson: null, day: null }; let voiceOn = false, liveOn = false;
const LIVE_RULES = () => `\n\nVOICE SESSION RULES: This is a live spoken conversation. Speak English only (no Persian audio), ${S.accent === "en-GB" ? "with a natural Southern British (London) accent" : "with a natural General American accent"}, casual native style. Keep each turn short (1–3 sentences), then let the learner talk. Correct at most one important mistake per turn by modelling the natural version. If the learner interrupts, stop and listen.`;
const chatKey = () => T.mode + ":" + (T.mode === "program" ? T.day : ["roleplay", "explain"].includes(T.mode) ? T.lesson : "");
async function teacherPrompt() {
  const level = S.level || "A2"; const l = T.lesson ? await getLesson(T.lesson).catch(() => null) : null; const weak = weakCards(12);
  const day = T.mode === "program" && T.day ? (await getProgram())[T.day - 1] : null;
  const ctx = [`Learner: a Persian (Farsi) speaker, CEFR level ${level}. Goal: confident, natural everyday spoken English (casual native American/British), not textbook English.`,
    l ? `Current lesson: "${l.title}" (${l.level}), dialogue ${l.n} of ${1 + (l.variants || []).length} (${l.mood}) — scenario: ${l.scene}. Partner role: ${l.partner}. Key chunks: ${l.chunks.map(c => c.en).join("; ")}.\nThe selected dialogue the learner studied (partner = ${l.partner}, learner = "Me"):\n${l.dialogue.map(d => (d.me ? "Me: " : l.partner + ": ") + d.en).join("\n")}` : "",
    weak.length ? `Learner's weak phrases from spaced-repetition (reuse them naturally): ${weak.map(c => c.en).join("; ")}.` : "",
    day ? `30-day program day ${day.day}, theme chunks: ${day.chunks.map(c => c.en).slice(0, 18).join("; ")}. Task: ${day.ai}` : ""].filter(Boolean).join("\n");
  const common = `\nSTYLE: Speak like a friendly real native speaker: contractions, phrasal verbs, common idioms, natural fillers (you know, like, kinda, gonna) appropriate to the learner's level. Keep your English turn SHORT (1-3 sentences) and end with a question or prompt so the learner talks more than you.
CORRECTION: After your English turn, if the learner's last message had a mistake or sounded unnatural/textbook, add ONE line starting with "💡" in Persian: briefly explain the issue and give the natural native version in English. Max one correction per turn; be warm. If the message was good, occasionally add "💡 عالی!" with a short Persian praise. Never put Persian before the English turn.
Common Persian-speaker issues to watch: missing articles (a/the), word order (verb at end), tense (present perfect), he/she mix-ups, missing third-person -s, prepositions, overly formal phrasing.`;
  const modeTxt = {
    free: "MODE: Free conversation. Chat about the learner's life, interests and day. Ask follow-up questions.",
    roleplay: l ? `MODE: Roleplay. You ARE "${l.partner}" in this scene: ${l.scene}. Stay fully in character. If the chat is empty, open the scene naturally. Steer the learner to use the lesson's key chunks.` : "MODE: Roleplay a realistic everyday situation of your choice; announce the scene briefly first.",
    explain: `MODE: Teacher explanation. Explain in PERSIAN (with English examples) ${l ? `the key chunks and the casual-vs-textbook differences of the lesson "${l.title}"` : "a useful spoken-English topic for this level"}, one small piece at a time. After each piece, ask the learner to make their own sentence in English, then correct it. Here you may write mostly Persian, but English examples must be natural.`,
    drill: "MODE: Drill. Quiz the learner one item at a time on their weak phrases (or on high-frequency spoken chunks if none): give a Persian meaning or a situation and ask them to say it in natural English. Evaluate briefly, correct with 💡 in Persian, then move to the next item. Keep score.",
    pron: "MODE: Pronunciation coach. Give the learner one short natural sentence at a time to say aloud (their message is a speech transcript). Compare with the target; point out likely issues for Persian speakers (th /θ ð/, w vs v, vowel insertion in clusters like 'street', final consonants, word stress, connected speech like 'wanna', 'gotcha') with tips in Persian. Then give the next sentence.",
    program: day ? `MODE: Daily speaking session for day ${day.day} (${day.theme}). ${day.ai} Use today's chunks and encourage the learner to use them.` : "MODE: Daily speaking session."
  }[T.mode];
  return ctx + "\n" + modeTxt + common;
}
const englishPart = t => t.split("\n").filter(x => !x.trim().startsWith("💡")).join(" ").replace(/[\u0600-\u06FF][\u0600-\u06FF\s،؛؟]*/g, " ").replace(/\s+/g, " ").trim();
V.tutor = async () => {
  try { const t = JSON.parse(sessionStorage.zyTutor || "null"); if (t) { T = { ...T, ...t }; sessionStorage.removeItem("zyTutor"); } } catch (e) {}
  if (!T.lesson) T.lesson = S.lastLesson || "A1-01";
  if (!aiReady()) { app.innerHTML = `<div class=card><h2>🤖 معلم هوش مصنوعی</h2><p>معلمی که سطح شما، درس فعلی و کلمات ضعیفتان را می‌شناسد: توضیح می‌دهد، تمرین می‌دهد، نقش بازی می‌کند، تلفظ را بررسی می‌کند و در پایان جلسه خلاصه و اشتباهاتتان را به کارت‌های مرور اضافه می‌کند. حالت صوتی بدون دست هم دارد.</p>
    <p class=muted>این بخش اختیاری است و به کلید رایگان Google Gemini (یا آدرس سرور واسط) نیاز دارد.</p><button class="btn p" data-go=settings>تنظیم در «تنظیمات»</button></div>`; return; }
  const opts = LEVELS.map(lv => `<optgroup label="${lv}">${IDX.levels[lv].map(l => `<option value=${l.id} ${l.id == parseKey(T.lesson).id ? "selected" : ""}>${l.icon} ${esc(l.title)}</option>`).join("")}</optgroup>`).join("");
  app.innerHTML = `<div class=card><h3>🤖 معلم هوش مصنوعی <span class=voice-dot id=vd aria-hidden=true></span> <small class=muted id=vs></small></h3>
  <div class=modes role=radiogroup aria-label="حالت آموزش">${Object.entries(MODES).map(([k, [ic, n]]) => `<button class="btn ${k == T.mode ? "p" : ""}" role=radio aria-checked=${k == T.mode} data-mode=${k}>${ic} ${n}</button>`).join("")}</div>
  <div id=lsel class="${["roleplay", "explain"].includes(T.mode) ? "" : "hidden"}"><select id=les aria-label="انتخاب سناریو">${opts}</select><select id=lvar aria-label="انتخاب گفتگو">${[...Array(meta(parseKey(T.lesson).id)?.v || 1)].map((_, i) => `<option value=${i + 1} ${i + 1 == parseKey(T.lesson).n ? "selected" : ""}>گفتگو ${FA_N[i + 1]}</option>`).join("")}</select></div>
  ${T.mode === "program" ? `<p class=muted>روز ${fa(T.day || programDay() || 1)} برنامه</p>` : ""}
  <div id=log style="max-height:52vh;overflow:auto" aria-live=polite></div>
  <div class=row><input id=msg dir=ltr lang=en placeholder="Type or tap the mic…" aria-label="پیام به معلم"><button class=btn id=mic aria-label="صحبت با میکروفون">🎤</button><button class="btn p" id=send>ارسال</button></div>
  <div><button class="btn ${voiceOn ? "p" : ""}" id=voice>🎧 حالت صوتی بدون دست: ${voiceOn ? "روشن" : "خاموش"}</button><button class=btn id=end>🏁 پایان جلسه و خلاصه</button><button class="btn sm" id=clr>شروع دوباره</button></div>
  <p class=muted id=vm aria-live=polite></p><p class=muted>صدای معلم: ${S.audioMode === "device" ? "صدای گوشی" : "Gemini — " + esc(S.tutorVoice)}${liveSupported() ? " · حالت صوتی: گفتگوی زنده (Live)" : ""} · موتور گفتار: ${sttLabel()} · ${S.provider === "proxy" ? "از طریق سرور واسط" : S.provider === "gemini" ? "Gemini " + esc(S.gmodel) : "OpenAI-compatible"}</p></div>`;
  if (T.mode === "program" && !T.day) T.day = programDay() || 1;
  const chat = () => S.chats[chatKey()] = S.chats[chatKey()] || [];
  const setState = s => { const vd = $("#vd"); if (!vd) return; vd.className = "voice-dot " + (s || ""); $("#vs").textContent = { listen: "در حال گوش دادن…", think: "در حال فکر کردن…", speak: "در حال صحبت…" }[s] || ""; };
  const draw = () => { if (!$("#log")) return; $("#log").innerHTML = chat().map((m, i) => `<div class="bubble ${m.role == "user" ? "me" : "them"}"><div class=who>${m.role == "user" ? "شما" : "🤖 معلم"}</div><div style="white-space:pre-wrap" dir=auto>${esc(m.content)}</div>${m.role != "user" ? `<button class="btn sm" data-sp=${i} aria-label="پخش پاسخ">🔊</button>` : ""}</div>`).join(""); $("#log").scrollTop = 1e9;
    $$("[data-sp]").forEach(b => b.onclick = () => speak(englishPart(chat()[b.dataset.sp].content), 1, null, { tutor: true })); };
  let busy = false;
  const ask = async () => { busy = true; setState("think"); const m = chat();
    try { const reply = await callAI(await teacherPrompt(), m.length ? m.slice(-20) : [{ role: "user", content: "(Start the session now.)" }]); m.push({ role: "assistant", content: reply }); addXP(3); save(); draw();
      if (voiceOn) { setState("think"); speak(englishPart(reply), 1, () => { if (voiceOn && $("#log")) loopListen(); else setState(""); }, { tutor: true, onstart: () => setState("speak"), onfail: () => toast("صدای معلم ساخته نشد؛ متن پاسخ را بخوانید.", true) }); } else setState(""); }
    catch (e) { m.push({ role: "assistant", content: "⚠️ " + e.message }); save(); draw(); setState(""); voiceOn && toggleVoice(false); }
    busy = false; };
  const send = t => { t = (t ?? $("#msg").value).trim(); if (!t || busy) return; chat().push({ role: "user", content: t }); $("#msg").value = ""; save(); draw(); if (liveOn) return Live.sendText(t); ask(); };
  let misses = 0; const loopListen = () => listen((t, why, d) => { if (!voiceOn || !$("#log")) return; if (t) { misses = 0; send(t); } else if (why === "nospeech" && ++misses < 4) loopListen(); else { toggleVoice(false); toast(whyMsg(why, d), true); } }, { onState: setState });
  const startLive = async () => { const m = chat();
    try { await Live.start({ system: (await teacherPrompt()) + LIVE_RULES(), onState: setState,
        onUser: t => { m.push({ role: "user", content: t }); save(); draw(); }, onModel: t => { m.push({ role: "assistant", content: t }); addXP(3); save(); draw(); },
        onEnd: why => { if (why) toast(why, true); toggleVoice(false); } });
      liveOn = true; $("#vm") && ($("#vm").textContent = "⚡ گفتگوی زنده (Gemini Live) — هر وقت خواستید وسط حرف معلم صحبت کنید.");
    } catch (e) { Live.stop(); liveOn = false; if (!voiceOn) return; toast("گفتگوی زنده (Live) در دسترس نبود: " + (e.message || "") + " — حالت جایگزین: ضبط + پاسخ متنی + صدای Gemini.", true); $("#vm") && ($("#vm").textContent = "🔁 حالت جایگزین: ضبط ← پاسخ ← صدای Gemini"); if (!busy) loopListen(); } };
  const toggleVoice = on => { voiceOn = on ?? !voiceOn; const b = $("#voice"); if (b) { b.className = "btn " + (voiceOn ? "p" : ""); b.textContent = "🎧 حالت صوتی بدون دست: " + (voiceOn ? "روشن" : "خاموش"); } if (!voiceOn) { liveOn = false; stopAll(); setState(""); $("#vm") && ($("#vm").textContent = ""); } else if (liveSupported()) startLive(); else if (!busy) loopListen(); };
  $("#send").onclick = () => send(); $("#msg").onkeydown = e => { if (e.key == "Enter") send(); };
  $("#mic").onclick = () => listen((t, why, d) => t ? send(t) : toast(whyMsg(why, d), true), { onState: setState });
  $("#voice").onclick = async () => { if (!voiceOn && !(await ensureMic())) return; toggleVoice(); };
  $$("[data-mode]").forEach(b => b.onclick = () => { stopAll(); voiceOn = false; T.mode = b.dataset.mode; V.tutor(); });
  $("#les").onchange = e => { T.lesson = e.target.value; V.tutor(); }; $("#lvar").onchange = e => { T.lesson = vkey(parseKey(T.lesson).id, +e.target.value); V.tutor(); };
  $("#clr").onclick = () => { S.chats[chatKey()] = []; save(); draw(); ask(); };
  $("#end").onclick = () => endSession(chat());
  draw(); if (!chat().length) ask();
};
async function endSession(msgs) {
  if (msgs.filter(m => m.role === "user").length < 1) return toast("اول کمی گفتگو کنید.", true);
  stopAll(); voiceOn = false; modal(`<p>⏳ در حال تهیه‌ی خلاصه‌ی جلسه…</p>`);
  const sys = `You are an English teacher for a Persian speaker. Analyse ONLY the learner's (user) messages in this conversation and return strict JSON:
{"summary_fa": "2-3 sentence summary in Persian of how the session went", "strengths_fa": ["..."], "mistakes": [{"wrong": "learner's phrase", "right": "natural native version", "fa": "short Persian explanation"}], "new_phrases": [{"en": "useful natural phrase from the session", "fa": "Persian meaning"}], "next_step_fa": "one concrete tip in Persian"}
Max 8 mistakes, max 6 new_phrases. Use [] when none.`;
  try { const raw = await callAI(sys, [{ role: "user", content: msgs.map(m => (m.role === "user" ? "LEARNER: " : "TEACHER: ") + m.content).join("\n").slice(-12000) }], { json: true, temp: .2, max: 1500 });
    const j = JSON.parse(raw.replace(/^```(json)?|```$/g, "").trim()); let added = 0;
    for (const m of (j.mistakes || []).slice(0, 8)) if (m.right) { const id = "t:" + norm(m.right).join("_").slice(0, 60); if (!S.cards[id]) { addCard(id, m.right, (m.fa || "") + (m.wrong ? ` (به‌جای: ${m.wrong})` : ""), "tutor"); added++; } }
    for (const p of (j.new_phrases || []).slice(0, 6)) if (p.en && p.fa) { const id = "t:" + norm(p.en).join("_").slice(0, 60); if (!S.cards[id]) { addCard(id, p.en, p.fa, "tutor"); added++; } }
    if (T.mode === "program" && T.day) S.program.tasks[T.day] = { ...(S.program.tasks[T.day] || {}), ai: 1 };
    addXP(10); save();
    modal(`<h3>🏁 خلاصه‌ی جلسه</h3><p>${esc(j.summary_fa || "")}</p>${(j.strengths_fa || []).length ? `<b>👍 نقاط قوت</b><ul class=summary>${j.strengths_fa.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      ${(j.mistakes || []).length ? `<b>✏️ اصلاح‌ها</b><ul class=summary>${j.mistakes.map(m => `<li><s dir=ltr lang=en>${esc(m.wrong)}</s> ← <b dir=ltr lang=en>${esc(m.right)}</b><br><span class=muted>${esc(m.fa)}</span></li>`).join("")}</ul>` : ""}
      ${(j.new_phrases || []).length ? `<b>🧩 عبارت‌های جدید</b><ul class=summary>${j.new_phrases.map(p => `<li><b dir=ltr lang=en>${esc(p.en)}</b> — ${esc(p.fa)}</li>`).join("")}</ul>` : ""}
      ${j.next_step_fa ? `<div class=tip>➡️ ${esc(j.next_step_fa)}</div>` : ""}<p class=ok>${fa(added)} کارت به مرور اضافه شد.</p><button class="btn p" onclick="closeModal()">بستن</button>`);
  } catch (e) { modal(`<h3>خطا</h3><p>${esc(e.message?.startsWith("Unexpected") || e instanceof SyntaxError ? "پاسخ خلاصه قابل خواندن نبود؛ دوباره تلاش کنید." : e.message)}</p><button class="btn p" onclick="closeModal()">بستن</button>`); }
}

/* ---------------- Settings ---------------- */
V.settings = async () => {
  app.innerHTML = `<div class=card><h3>🤖 هوش مصنوعی (معلم + تبدیل صدا به متن)</h3><label>سرویس:<select id=prov><option value=gemini>Google Gemini — کلید شخصی (پیش‌فرض)</option><option value=proxy>Gemini از طریق سرور واسط (بدون کلید در مرورگر)</option><option value=openai>سازگار با OpenAI</option></select></label>
  <div id=gem><div class=tip>🔑 کلید رایگان Gemini را از <a href="https://aistudio.google.com/apikey" target=_blank rel=noopener>Google AI Studio</a> بگیرید (ورود با حساب گوگل ← Create API key). ⚠️ Gemini از داخل ایران مسدود است؛ VPN یا «سرور واسط» لازم است.</div>
    <label>کلید Gemini:<input id=gkey dir=ltr type=password autocomplete=off value="${esc(S.gkey)}" placeholder="AIza…"></label></div>
  <div id=prx><div class=tip>آدرس سرور واسطی که خودتان (یا مدیر سایت) راه‌اندازی کرده‌اید؛ کلید روی سرور نگه داشته می‌شود. راهنما در پوشه‌ی <code>proxy/</code>.</div><label>آدرس سرور واسط:<input id=proxy dir=ltr value="${esc(S.proxy)}" placeholder="https://zabanyar-proxy.example.workers.dev"></label></div>
  <div id=gmod><label>مدل Gemini:<input id=gmodel dir=ltr list=gm value="${esc(S.gmodel)}"></label><datalist id=gm><option value=gemini-3.8-flash><option value=gemini-3.5-flash-lite><option value=gemini-flash-latest><option value=gemini-3.6-flash><option value=gemini-2.5-flash></datalist><p class=muted>gemini-3.8-flash: هوشمندتر (پیش‌فرض) · gemini-3.5-flash-lite: سریع‌تر و ارزان‌تر</p></div>
  <div id=oai><label>آدرس API:<input id=api dir=ltr value="${esc(S.api)}"></label><label>مدل:<input id=model dir=ltr value="${esc(S.model)}"></label><label>کلید API:<input id=key dir=ltr type=password autocomplete=off value="${esc(S.key)}"></label><p class=muted>در این حالت تبدیل صدا به متن با Gemini در دسترس نیست.</p></div>
  <p class=muted>کلیدها فقط در همین دستگاه ذخیره می‌شوند و مستقیم به سرویس انتخاب‌شده فرستاده می‌شوند.</p><button class="btn p" id=sv>ذخیره</button> <button class=btn id=tst>🧪 آزمایش اتصال</button><div id=tr aria-live=polite></div></div>
  <div class=card><h3>🎤 گفتار</h3><label>موتور تشخیص گفتار:<select id=eng><option value=record>پایدار: ضبط صدا + Gemini (پیشنهادی، به‌خصوص در ایران و آیفون)</option><option value=fast>سریع: تشخیص گفتار گوشی/مرورگر (نیازمند Google) + بازگشت خودکار به Gemini</option></select></label><p class=muted>وضعیت فعلی: ${sttLabel()}${hasFast() ? "" : " · تشخیص سریع در این دستگاه نیست"}${canRecord() ? "" : " · ضبط صدا پشتیبانی نمی‌شود"}${location.protocol === "https:" || /localhost|127\.0\.0\.1/.test(location.hostname) || window.Capacitor ? "" : " · ⚠️ برای میکروفون HTTPS لازم است"}</p>
  <button class=btn id=mict>🎤 آزمایش میکروفون (سطح صدا + پخش)</button><div id=mr aria-live=polite></div>
  <label>لهجه‌ی صدا:<select id=acc><option value=en-US>آمریکایی (en-US)</option><option value=en-GB>بریتانیایی (en-GB)</option></select></label>
  <label>سرعت پخش: <input id=rate type=range min=.6 max=1.2 step=.1 value="${S.rate}" aria-label="سرعت پخش"></label></div>
  <div class=card><h3>🔊 صدای طبیعی (Gemini)</h3>
  <label>منبع صدای درس‌ها و معلم:<select id=amode><option value=ai>صدای طبیعی هوش مصنوعی (Gemini TTS / Live) — پیشنهادی</option><option value=device>صدای خود گوشی (رباتیک، آفلاین)</option></select></label>
  <label><input type=checkbox id=dtts ${S.deviceTTS ? "checked" : ""}> اگر صدای Gemini در دسترس نبود، با صدای گوشی پخش شود (پیش‌فرض: خاموش — فقط متن و پیام خطا)</label>
  <label>صدای معلم:<select id=tvoice>${ZYV.VOICES.map(([n, g, d]) => `<option value=${n}>${n} — ${d}</option>`).join("")}</select></label> <button class="btn sm" id=tvt>🔊 شنیدن نمونه</button>
  <label>صدای راوی عبارت‌ها:<select id=lvoice>${ZYV.VOICES.map(([n, g, d]) => `<option value=${n}>${n} — ${d}</option>`).join("")}</select></label>
  <p class=muted>در گفتگوهای درس، هر شخصیت صدای مخصوص خودش را دارد (شما و طرف مقابل با دو صدای متفاوت).</p>
  <label>مدل صدای درس‌ها:<select id=ttsm>${ZYV.TTS_MODELS.map(m => `<option>${m}</option>`).join("")}</select></label>
  <label>مدل صدای معلم (flash-lite سریع‌تر و ارزان‌تر است ولی سطح رایگان ندارد):<select id=ttst>${ZYV.TTS_MODELS.map(m => `<option>${m}</option>`).join("")}</select></label>
  <label><input type=checkbox id=live ${S.live !== false ? "checked" : ""}> حالت صوتی معلم با گفتگوی زنده‌ی Gemini Live (کم‌تأخیر، قطع کردن وسط حرف)</label>
  <label>مدل Live:<input id=livem dir=ltr value="${esc(S.liveModel || ZYV.LIVE)}"></label>
  <label class="${S.provider === "proxy" ? "" : "hidden"}"><input type=checkbox id=lived ${S.liveDirect ? "checked" : ""}> Live با توکن موقت از سرور واسط و اتصال مستقیم به Google (فقط اگر Google در دسترس است)</label>
  <p class=muted id=acache>صداهای ذخیره‌شده: …</p><button class=btn id=pgen>⬇️ ساخت و ذخیره‌ی صدای همه‌ی جمله‌های سطح من (برای آفلاین)</button> <button class="btn sm" id=aclr>🗑️ پاک کردن صداهای ذخیره‌شده</button><div id=pgo aria-live=polite></div></div>
  <div class=card><h3>💾 پشتیبان</h3><button class=btn id=ex>⬇️ دریافت فایل پشتیبان</button><label class=btn style="display:inline-block">⬆️ بازیابی از فایل<input id=im type=file accept="application/json,.json" class=hidden></label><label><input type=checkbox id=exk> کلیدهای API هم در پشتیبان باشد</label></div>
  <div class=card><h3>دیگر</h3><button class=btn data-go=placement>🎯 آزمون تعیین سطح دوباره</button><button class=btn id=rs>🗑️ پاک کردن همه‌ی داده‌ها</button><p class=muted>نسخه: ${esc(IDX.version)} · ${fa(IDX.counts.total.lessons)} سناریو · ${fa(IDX.counts.total.all)} عبارت</p></div>`;
  const pv = () => { const v = $("#prov").value; $("#gem").classList.toggle("hidden", v != "gemini"); $("#prx").classList.toggle("hidden", v != "proxy"); $("#gmod").classList.toggle("hidden", v == "openai"); $("#oai").classList.toggle("hidden", v != "openai"); };
  $("#prov").value = S.provider; $("#prov").onchange = pv; pv(); $("#eng").value = S.engine; $("#acc").value = S.accent;
  const store = () => { S.provider = $("#prov").value; S.gkey = $("#gkey").value.trim(); S.proxy = $("#proxy").value.trim(); S.gmodel = $("#gmodel").value.trim() || DEFAULT_MODEL; S.api = $("#api").value.trim(); S.model = $("#model").value.trim(); S.key = $("#key").value.trim(); save(); };
  $("#sv").onclick = () => { store(); $("#tr").innerHTML = "<b class=ok>✔ ذخیره شد</b>"; };
  $("#tst").onclick = async () => { store(); $("#tr").textContent = "در حال آزمایش…"; try { const r = await callAI("Reply with just: OK", [{ role: "user", content: "ping" }], { max: 20 }); $("#tr").innerHTML = `<b class=ok>✔ اتصال برقرار است:</b> <span dir=ltr>${esc(r.slice(0, 60))}</span>`; } catch (e) { $("#tr").innerHTML = `<b class=bad>${esc(e.message)}</b>`; } };
  $("#eng").onchange = e => { S.engine = e.target.value; save(); V.settings(); }; $("#acc").onchange = e => { S.accent = e.target.value; save(); }; $("#rate").onchange = e => { S.rate = +e.target.value; save(); speak("This is how fast I'll speak."); };
  $("#amode").value = S.audioMode || "ai"; $("#tvoice").value = S.tutorVoice; $("#lvoice").value = S.lessonVoice; $("#ttsm").value = S.ttsModel; $("#ttst").value = S.tutorTts;
  const vset = (id, k, f = e => e.target.value) => $(id).onchange = e => { S[k] = f(e); save(); };
  vset("#amode", "audioMode"); vset("#dtts", "deviceTTS", e => e.target.checked); vset("#tvoice", "tutorVoice"); vset("#lvoice", "lessonVoice"); vset("#ttsm", "ttsModel"); vset("#ttst", "tutorTts");
  vset("#live", "live", e => e.target.checked); vset("#livem", "liveModel", e => e.target.value.trim() || ZYV.LIVE); vset("#lived", "liveDirect", e => e.target.checked);
  $("#tvt").onclick = () => { store(); speak("Hey! I'm your English coach. Ready to practice some real conversation?", 1, null, { tutor: true }); };
  ADB.count().then(n => $("#acache") && ($("#acache").textContent = `صداهای ذخیره‌شده در این دستگاه: ${fa(n || 0)} جمله`));
  $("#aclr").onclick = async () => { await ADB.clear(); $("#acache").textContent = "صداهای ذخیره‌شده پاک شد."; };
  $("#pgen").onclick = async () => { store(); const lv = S.level || "A1"; if (!voiceReady()) return $("#pgo").innerHTML = "<b class=bad>ابتدا کلید Gemini یا سرور واسط را وارد کنید.</b>";
    if (!confirm(`ساخت صدای همه‌ی جمله‌های سطح ${lv} (حدود ۸۰۰ تا ۱۰۰۰ درخواست به Gemini؛ از سهمیه‌ی کلید شما کم می‌شود). ادامه؟`)) return;
    $("#pgen").disabled = true; try { const r = await pregenLevel(lv, (n, t, f) => $("#pgo") && ($("#pgo").textContent = `${fa(n)} / ${fa(t)}${f ? " · خطا: " + fa(f) : ""}`)); $("#pgo").innerHTML = `<b class=ok>✔ تمام شد (${fa(r.n)} جمله)</b>`; }
    catch (e) { $("#pgo").innerHTML = `<b class=bad>${esc(e.message)}</b>`; } finally { $("#pgen") && ($("#pgen").disabled = false); } };
  $("#mict").onclick = () => { store(); micTest(); };
  $("#ex").onclick = () => { const data = { app: "zabanyar", exported: new Date().toISOString(), state: { ...S } }; if (!$("#exk").checked) { data.state.gkey = ""; data.state.key = ""; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: "application/json" })); a.download = `zabanyar-backup-${today()}.json`; document.body.appendChild(a); a.click(); a.remove(); };
  $("#im").onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const j = JSON.parse(await f.text()); if (j.app !== "zabanyar" || !j.state || typeof j.state.cards !== "object") throw new Error("فایل پشتیبان معتبر نیست.");
      if (!confirm("داده‌های فعلی با فایل پشتیبان جایگزین شود؟")) return; const keep = { gkey: S.gkey, key: S.key }; const ns = Object.assign(structuredClone(DEF), j.state); if (!ns.gkey) ns.gkey = keep.gkey; if (!ns.key) ns.key = keep.key;
      localStorage.setItem("zy3", JSON.stringify(ns)); toast("بازیابی شد"); setTimeout(() => location.reload(), 600); } catch (err) { toast(err.message || "خطا در خواندن فایل", true); } };
  $("#rs").onclick = () => { if (confirm("همه‌ی پیشرفت و تنظیمات پاک شود؟")) { localStorage.removeItem("zy3"); location.reload(); } };
};

/* ---------------- Router & boot ---------------- */
function go(v, arg) { stopAll(); $$(".tabs button").forEach(b => { const on = b.dataset.v == v; b.classList.toggle("on", on); on ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current"); });
  Promise.resolve(V[v](arg)).catch(e => { app.innerHTML = `<div class=card><p class=bad>خطا: ${esc(e.message)}</p><button class="btn p" onclick="location.reload()">بارگذاری دوباره</button></div>`; }); window.scrollTo(0, 0); app.focus({ preventScroll: true }); }
document.addEventListener("click", e => { const b = e.target.closest("[data-go],[data-lesson],[data-day],[data-pack],[data-next]"); if (!b) return;
  if (b.dataset.go) go(b.dataset.go); else if (b.dataset.lesson) lesson(b.dataset.lesson); else if (b.dataset.day) { stopAll(); V.day(+b.dataset.day); } else if (b.dataset.pack) { stopAll(); V.pack(+b.dataset.pack); }
  else if (b.dataset.next) { const [id, k, nx] = b.dataset.next.split("|"); markStep(id, k); if (nx) lesson(id, nx); else { const { id: b, n } = parseKey(id); const L = LV[b.split("-")[0]]?.[b]; const nn = n < 1 + (L?.variants || []).length ? n + 1 : 0; nn && !S.done[vkey(b, nn)] ? lesson(vkey(b, nn)) : go("map"); } } });
$("#modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
function theme() { const dark = S.dark ?? matchMedia("(prefers-color-scheme: dark)").matches; document.documentElement.classList.toggle("dark", dark); $("#theme").textContent = dark ? "☀️" : "🌙"; }
$("#theme").onclick = () => { S.dark = !(S.dark ?? matchMedia("(prefers-color-scheme: dark)").matches); save(); theme(); };
$$(".tabs button").forEach(b => b.onclick = () => go(b.dataset.v));
function registerSW() { if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol) || window.Capacitor?.isNativePlatform?.()) return;
  navigator.serviceWorker.register("sw.js").then(reg => { const offer = w => { const bn = $("#banner"); bn.innerHTML = `نسخه‌ی جدید زبان‌یار آماده است. <button class="btn sm" id=upd>به‌روزرسانی</button>`; bn.classList.remove("hidden"); $("#upd").onclick = () => w.postMessage("skipWaiting"); };
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener("updatefound", () => { const w = reg.installing; w.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller) offer(w); }); });
    setInterval(() => reg.update().catch(() => {}), 36e5); }).catch(() => {});
  let reloaded = false; navigator.serviceWorker.addEventListener("controllerchange", () => { if (!reloaded) { reloaded = true; location.reload(); } }); }
window.addEventListener("online", () => $("#banner").classList.add("hidden"));
window.addEventListener("offline", () => { const bn = $("#banner"); bn.textContent = "آفلاین هستید — درس‌ها و مرور کار می‌کنند؛ معلم AI به اینترنت نیاز دارد."; bn.classList.remove("hidden"); });
(async function boot() { stats(); theme();
  try { await loadIndex(); } catch (e) { app.innerHTML = `<div class=card><p class=bad>بارگذاری محتوا ناموفق بود. اتصال اینترنت را بررسی کنید.</p><button class="btn p" onclick="location.reload()">تلاش دوباره</button></div>`; return; }
  const start = (location.hash || "").slice(1); go(V[start] ? start : "home"); registerSW();
  if (S.level) loadLevel(S.level).catch(() => {}); })();
