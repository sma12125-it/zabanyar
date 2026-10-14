/* Zabanyar — natural voice layer (v6).
   • Lesson audio: prebuilt files (audio/manifest.json) → IndexedDB cache → Gemini TTS on demand (cached once per line).
   • AI tutor: Gemini Live API (native audio, WebSocket, barge-in) in voice mode; otherwise text reply + Gemini TTS.
   • Device speechSynthesis is used ONLY if the user enables it in settings (off by default).
   Docs: ai.google.dev/gemini-api/docs/speech-generation · /live · /live-api/get-started-websocket · /ephemeral-tokens */
"use strict";
const GAPI = "https://generativelanguage.googleapis.com";
const apiBase = () => S.provider === "proxy" ? S.proxy.replace(/\/$/, "") : GAPI;
const apiHeaders = () => { const h = { "Content-Type": "application/json" }; if (S.provider === "gemini") h["x-goog-api-key"] = S.gkey; return h; };
const voiceReady = () => (S.provider === "gemini" && !!S.gkey) || (S.provider === "proxy" && !!S.proxy);
const b64ToBytes = b => { const s = atob(b), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
const bytesToB64 = u => { let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
function pcmToWav(pcm, rate = 24000) { const dv = new DataView(new ArrayBuffer(44)); const w = (o, s) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF"); dv.setUint32(4, 36 + pcm.length, true); w(8, "WAVE"); w(12, "fmt "); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, rate, true); dv.setUint32(28, rate * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, "data"); dv.setUint32(40, pcm.length, true);
  return new Blob([dv, pcm], { type: "audio/wav" }); }

/* ---------- IndexedDB clip cache ---------- */
const ADB = (() => { let p; const open = () => p ||= new Promise((res, rej) => { if (!window.indexedDB) return rej(new Error("no idb")); const r = indexedDB.open("zy-audio", 1); r.onupgradeneeded = () => r.result.createObjectStore("clips"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction("clips", mode), st = t.objectStore("clips"); const out = fn(st); t.oncomplete = () => res(out?.result); t.onerror = () => rej(t.error); }); };
  return { get: k => tx("readonly", s => s.get(k)).catch(() => null), put: (k, v) => tx("readwrite", s => s.put(v, k)).catch(() => {}), clear: () => tx("readwrite", s => s.clear()).catch(() => {}), count: () => tx("readonly", s => s.count()).catch(() => 0) }; })();

/* ---------- prebuilt manifest ---------- */
let prebuilt = null;
const loadPrebuilt = () => prebuilt ||= fetch("audio/manifest.json").then(r => r.ok ? r.json() : { files: {} }).then(j => j && j.files ? j : { files: {} }).catch(() => ({ files: {} }));

/* ---------- Gemini TTS (Interactions API) ---------- */
async function ttsGemini(text, voice, style, model) {
  if (!voiceReady()) throw Object.assign(new Error("برای صدای طبیعی، کلید Gemini یا سرور واسط را در تنظیمات وارد کنید."), { why: "nokey" });
  const body = { model, input: [{ type: "user_input", content: [{ type: "text", text, annotations: [{ type: "speech_metadata", style }] }] }], response_format: { type: "audio" }, generation_config: { speech_config: [{ voice }] } };
  let r, j; const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 40000);
  try { r = await fetch(apiBase() + "/v1beta/interactions", { method: "POST", headers: apiHeaders(), body: JSON.stringify(body), signal: ctl.signal }); j = await r.json().catch(() => ({})); }
  catch (e) { throw Object.assign(new Error(e.name === "AbortError" ? "ساخت صدا خیلی طول کشید." : "اتصال به سرویس صدای Gemini برقرار نشد (از ایران بدون VPN یا سرور واسط در دسترس نیست)."), { why: "network" }); }
  finally { clearTimeout(to); }
  if (!r.ok) throw Object.assign(new Error(aiErr(r.status, j.error?.message || j.error?.status || j.error)), { why: "api" });
  let a = j.output_audio || null;
  if (!a?.data) for (const st of j.steps || []) for (const c of st.content || []) if (c.type === "audio" && c.data) a = c;
  if (!a?.data) throw Object.assign(new Error("پاسخ Gemini صدا نداشت."), { why: "api" });
  const bytes = b64ToBytes(a.data), mime = (a.mime_type || a.mimeType || "audio/wav").split(";")[0];
  return mime === "audio/l16" || mime === "audio/pcm" ? pcmToWav(bytes, a.sample_rate || 24000) : new Blob([bytes], { type: mime });
}
const inflight = new Map();
async function getClip(text, voice, slow, { tutor = false, noGen = false } = {}) {
  text = ZYV.clean(text); const key = ZYV.audioKey(text, voice, slow);
  if (inflight.has(key)) return inflight.get(key);
  const p = (async () => {
    const pb = await loadPrebuilt(); const f = pb.files[key];
    if (f) { try { const r = await fetch("audio/" + f); if (r.ok) return await r.blob(); } catch (e) {} }
    if (!tutor) { const c = await ADB.get(key); if (c) return c; }
    if (noGen) return null;
    const blob = await ttsGemini(text, voice, slow ? ZYV.SLOW : tutor ? "warm, friendly, encouraging teacher; natural conversational pace" : ZYV.NORMAL, tutor ? (S.tutorTts || ZYV.TUTOR_TTS) : (S.ttsModel || ZYV.DEFAULT_TTS));
    if (!tutor) ADB.put(key, blob); return blob;
  })();
  inflight.set(key, p); p.finally(() => inflight.delete(key)).catch(() => {}); return p;
}

/* ---------- playback ---------- */
const player = new Audio(); player.preload = "auto"; player.setAttribute("playsinline", ""); let playerURL = null;
document.addEventListener("pointerdown", function unlock() { try { player.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA="; player.play().catch(() => {}); } catch (e) {} document.removeEventListener("pointerdown", unlock); }, { once: true });
function playBlob(blob) { return new Promise(res => { if (playerURL) URL.revokeObjectURL(playerURL); playerURL = URL.createObjectURL(blob); player.src = playerURL; player.playbackRate = S.rate || 1; player.preservesPitch = true;
  const end = () => { player.onended = player.onerror = player.onpause = null; res(); }; player.onended = end; player.onerror = end; player.onpause = () => { if (!player.ended) end(); }; player.play().catch(end); }); }
function stopTTS() { ttsToken++; try { player.pause(); } catch (e) {} try { window.speechSynthesis?.cancel(); Cap.TextToSpeech?.stop(); } catch (e) {} }
let lastAudioErr = 0, genToast = null;
function audioErr(e) { if (Date.now() - lastAudioErr < 8000) return; lastAudioErr = Date.now();
  toast((e?.message || "صدای طبیعی در دسترس نیست.") + (S.deviceTTS ? "" : " (می‌توانید متن را بخوانید؛ پخش با صدای گوشی در تنظیمات قابل فعال‌سازی است.)"), true); }
/** speak(text, rate, onend, {voice, tutor}) — rate < 1 means "slow" (generated slowly by the voice, not sped down). */
async function speak(t, rate = 1, onend, o = {}) {
  const tok = ++ttsToken; const done = () => { if (tok === ttsToken) onend && onend(); };
  t = ZYV.clean(t); if (!t) return done();
  if (S.audioMode === "device") return deviceSpeak(t, rate, onend, tok);
  try { window.speechSynthesis?.cancel(); player.pause(); } catch (e) {}
  const slow = rate < 1, voice = o.tutor ? (S.tutorVoice || ZYV.TUTOR) : (o.voice || S.lessonVoice || ZYV.NARRATOR);
  const slowT = setTimeout(() => { if (tok === ttsToken) genToast = toast("🎙️ در حال ساخت صدای طبیعی…"); }, 600);
  try { const blob = await getClip(t, voice, slow, { tutor: !!o.tutor }); clearTimeout(slowT); if (tok !== ttsToken) return; o.onstart?.(); await playBlob(blob); done(); }
  catch (e) { clearTimeout(slowT); if (tok !== ttsToken) return; if (S.deviceTTS) return deviceSpeak(t, rate, onend, tok); audioErr(e); o.onfail?.(e); done(); }
}
/** speakSeq(lines, rate, done): lines are strings or {t, v}. Pre-generates the next line while the current one plays. */
let seqId = 0;
function speakSeq(lines, rate = 1, done) { const id = ++seqId; const L = lines.map(x => typeof x === "string" ? { t: x } : x);
  const step = i => { if (id !== seqId) return; if (i >= L.length) return done && done();
    const nx = L[i + 1]; if (nx && S.audioMode !== "device" && voiceReady()) getClip(nx.t, nx.v || S.lessonVoice || ZYV.NARRATOR, rate < 1).catch(() => {});
    speak(L[i].t, rate, () => setTimeout(() => step(i + 1), 250), { voice: L[i].v }); }; step(0); }
const stopAll = () => { seqId++; stopTTS(); stopListening(); Live.stop(); };
/** Pre-generate all lines of a level for offline use (costs API quota). */
async function pregenLevel(lv, onProgress) { const data = await loadLevel(lv); const jobs = [];
  for (const l of Object.values(data)) { for (const d of l.dialogue) { const v = d.me ? ZYV.learnerVoice(l.partner) : ZYV.partnerVoice(l.partner); jobs.push([d.en, v, false], [d.en, v, true]); } for (const c of l.chunks) jobs.push([c.en, S.lessonVoice || ZYV.NARRATOR, false]); }
  let n = 0, fail = 0; const run = async () => { while (jobs.length) { const [t, v, s] = jobs.shift(); try { await getClip(t, v, s); } catch (e) { fail++; if (e.why === "nokey" || e.why === "network") { jobs.length = 0; throw e; } } onProgress?.(++n, n + jobs.length, fail); } };
  await Promise.all([run(), run()]); return { n, fail }; }

/* ---------- Gemini Live API: real-time voice tutor ---------- */
const LIVE_PATH = "/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";
const WORKLET = `class P extends AudioWorkletProcessor{process(i){const c=i[0]&&i[0][0];if(c)this.port.postMessage(c.slice(0));return true}}registerProcessor('zy-mic',P);`;
const liveSupported = () => !!(window.WebSocket && (window.AudioContext || window.webkitAudioContext) && navigator.mediaDevices?.getUserMedia) && voiceReady() && S.live !== false;
const Live = {
  ws: null, on: false,
  async liveUrl() {
    if (S.provider === "gemini") return `wss://generativelanguage.googleapis.com${LIVE_PATH}?key=${encodeURIComponent(S.gkey)}`;
    const base = S.proxy.replace(/\/$/, "");
    if (S.liveDirect) { // ephemeral token minted by the proxy; audio then goes straight to Google (needs Google reachable)
      const r = await fetch(base + "/live-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: S.liveModel || ZYV.LIVE }) }); const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.token) throw new Error("دریافت توکن موقت از سرور واسط ناموفق بود.");
      return `wss://generativelanguage.googleapis.com${LIVE_PATH}Constrained?access_token=${encodeURIComponent(j.token)}`; }
    return base.replace(/^http/, "ws") + LIVE_PATH;
  },
  setupMsg(system, alt) { const model = "models/" + (S.liveModel || ZYV.LIVE), speech = { voiceConfig: { prebuiltVoiceConfig: { voiceName: S.tutorVoice || ZYV.TUTOR } } };
    const base = { model, systemInstruction: { parts: [{ text: system }] }, inputAudioTranscription: {}, outputAudioTranscription: {} };
    // Current docs put responseModalities/speechConfig at the top of setup; older wire format nests them in generationConfig. We retry with the other shape if the server rejects the first.
    return { setup: alt ? { ...base, generationConfig: { responseModalities: ["AUDIO"], speechConfig: speech } } : { ...base, responseModalities: ["AUDIO"], speechConfig: speech } }; },
  async start({ system, onState = () => {}, onUser = () => {}, onModel = () => {}, onLevel = () => {}, onEnd = () => {} }) {
    this.stop(); this.on = true; const me = this; let ready = false, userBuf = "", modelBuf = "", alt = !!S.liveAlt;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.out = new AC(); this.nextT = 0; this.srcs = new Set();
    const flushUser = () => { if (userBuf.trim()) onUser(userBuf.trim()); userBuf = ""; };
    const flushModel = () => { if (modelBuf.trim()) onModel(modelBuf.trim()); modelBuf = ""; };
    const playPCM = b64 => { const u = b64ToBytes(b64), n = u.length >> 1, dv = new DataView(u.buffer), f = new Float32Array(n); for (let i = 0; i < n; i++) f[i] = dv.getInt16(i * 2, true) / 32768;
      const buf = this.out.createBuffer(1, n, 24000); buf.copyToChannel ? buf.copyToChannel(f, 0) : buf.getChannelData(0).set(f); const s = this.out.createBufferSource(); s.buffer = buf; s.connect(this.out.destination);
      const t = Math.max(this.nextT, this.out.currentTime + 0.04); s.start(t); this.nextT = t + buf.duration; this.srcs.add(s); onState("speak"); s.onended = () => { this.srcs.delete(s); if (!this.srcs.size && this.on) onState("listen"); }; };
    const interrupt = () => { for (const s of this.srcs) try { s.stop(); } catch (e) {} this.srcs.clear(); this.nextT = 0; };
    const connect = () => new Promise(async (resolve, reject) => {
      let url; try { url = await me.liveUrl(); } catch (e) { return reject(e); }
      const ws = new WebSocket(url); me.ws = ws; const to = setTimeout(() => { if (!ready) { try { ws.close(); } catch (e) {} reject(new Error("پاسخی از Gemini Live نرسید (احتمالاً مسدود است).")); } }, 12000);
      ws.onopen = () => ws.send(JSON.stringify(me.setupMsg(system, alt)));
      ws.onmessage = async ev => { let m; try { m = JSON.parse(typeof ev.data === "string" ? ev.data : await (ev.data.text ? ev.data.text() : new Response(ev.data).text())); } catch (e) { return; }
        if (m.setupComplete) { ready = true; clearTimeout(to); S.liveAlt = alt; resolve(); return; }
        const sc = m.serverContent; if (!sc) { if (m.goAway) toast("جلسه‌ی Live به‌زودی تمام می‌شود؛ دوباره روشن کنید."); return; }
        if (sc.interrupted) { interrupt(); flushModel(); onState("listen"); }
        if (sc.inputTranscription?.text) userBuf += sc.inputTranscription.text;
        const parts = sc.modelTurn?.parts || []; if (parts.length || sc.outputTranscription) flushUser();
        for (const p of parts) if (p.inlineData?.data && /audio\/pcm|l16/.test(p.inlineData.mimeType || "audio/pcm")) playPCM(p.inlineData.data);
        if (sc.outputTranscription?.text) modelBuf += sc.outputTranscription.text;
        if (sc.turnComplete) { flushUser(); flushModel(); } };
      ws.onerror = () => {};
      ws.onclose = ev => { clearTimeout(to); if (!ready) { if (!alt && (ev.code === 1007 || ev.code === 1008) && !me._retried) { me._retried = true; alt = true; return connect().then(resolve, reject); } reject(new Error(ev.reason || "اتصال Gemini Live برقرار نشد" + (ev.code ? ` (${ev.code})` : ""))); return; }
        if (me.on) { flushUser(); flushModel(); me.stop(); onEnd(ev.code === 1000 ? "" : "اتصال Live قطع شد" + (ev.reason ? ": " + ev.reason : "") + "."); } };
    });
    this._retried = false; onState("think");
    await connect(); // throws before ready → caller falls back
    // microphone → 16 kHz PCM16 chunks (~100 ms)
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    this.inp = new AC(); const src = this.inp.createMediaStreamSource(this.stream), rate = this.inp.sampleRate, ratio = rate / 16000; let acc = [], pos = 0;
    const feed = f => { let s = 0; for (let i = 0; i < f.length; i++) s += f[i] * f[i]; onLevel(Math.min(1, Math.sqrt(s / f.length) * 6));
      for (; pos < f.length; pos += ratio) acc.push(f[Math.floor(pos)]); pos -= f.length;
      if (acc.length >= 1600 && me.ws?.readyState === 1) { const pcm = new Int16Array(acc.length); for (let i = 0; i < acc.length; i++) { const v = Math.max(-1, Math.min(1, acc[i])); pcm[i] = v < 0 ? v * 0x8000 : v * 0x7fff; } acc = [];
        me.ws.send(JSON.stringify({ realtimeInput: { audio: { data: bytesToB64(new Uint8Array(pcm.buffer)), mimeType: "audio/pcm;rate=16000" } } })); } };
    try { if (!this.inp.audioWorklet) throw 0; await this.inp.audioWorklet.addModule(URL.createObjectURL(new Blob([WORKLET], { type: "text/javascript" }))); this.node = new AudioWorkletNode(this.inp, "zy-mic"); this.node.port.onmessage = e => feed(e.data); src.connect(this.node); }
    catch (e) { this.node = this.inp.createScriptProcessor(4096, 1, 1); this.node.onaudioprocess = e => feed(e.inputBuffer.getChannelData(0)); src.connect(this.node); this.node.connect(this.inp.destination); }
    this.ws.send(JSON.stringify({ realtimeInput: { text: "(The learner just joined. Greet them briefly and start.)" } }));
    onState("listen");
  },
  sendText(t) { if (this.ws?.readyState === 1) this.ws.send(JSON.stringify({ realtimeInput: { text: t } })); },
  stop() { const was = this.on; this.on = false; try { this.ws && this.ws.readyState <= 1 && this.ws.close(1000); } catch (e) {} this.ws = null;
    try { this.node?.disconnect(); } catch (e) {} this.node = null; try { this.stream?.getTracks().forEach(t => t.stop()); } catch (e) {} this.stream = null;
    try { this.inp?.close(); } catch (e) {} try { this.out?.close(); } catch (e) {} this.inp = this.out = null; this.srcs?.clear(); return was; }
};
