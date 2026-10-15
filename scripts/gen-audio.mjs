#!/usr/bin/env node
// Zabanyar — pre-generate natural lesson audio with Gemini TTS (Interactions API).
//   GEMINI_API_KEY=... node scripts/gen-audio.mjs [--levels a1,a2] [--format mp3|opus|wav] [--concurrency 3] [--limit N] [--no-slow] [--program] [--dry]
// Output: audio/<key>.<ext> + audio/manifest.json (resumable: existing files are skipped). `node scripts/build.mjs` copies audio/ into dist/audio/.
// The app looks up each line by the same key (src/voices.js), so prebuilt files are used first, then IndexedDB, then on-demand generation.
import fs from "node:fs"; import path from "node:path"; import { execFileSync } from "node:child_process"; import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
new Function(fs.readFileSync(path.join(root, "src", "voices.js"), "utf8"))(); const Z = globalThis.ZYV;
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : true); };
const KEY = process.env.GEMINI_API_KEY, BASE = (process.env.GEMINI_BASE || "https://generativelanguage.googleapis.com").replace(/\/$/, "");
const MODEL = arg("model", process.env.TTS_MODEL || Z.DEFAULT_TTS), FORMAT = arg("format", "mp3"), CONC = +arg("concurrency", 3), LIMIT = +arg("limit", 0) || Infinity;
const LEVELS = String(arg("levels", "a1,a2,b1,b2,c1")).split(","), SLOW = !arg("no-slow", false), DRY = !!arg("dry", false), PROGRAM = arg("program", true) !== "no";
const dist = path.join(root, "dist"), out = path.join(root, "audio"); fs.mkdirSync(out, { recursive: true });
if (!fs.existsSync(path.join(dist, "content", "index.json"))) { console.error("Run `node scripts/build.mjs` first."); process.exit(1); }
const hasFfmpeg = (() => { try { execFileSync("ffmpeg", ["-version"], { stdio: "ignore" }); return true; } catch (e) { return false; } })();
const fmt = FORMAT === "wav" || !hasFfmpeg ? "wav" : FORMAT; if (fmt !== FORMAT) console.warn("ffmpeg not found → writing WAV");
// 1) collect lines exactly as the app plays them
const jobs = new Map(); const add = (text, voice, slow) => { text = Z.clean(text); if (!text) return; const k = Z.audioKey(text, voice, slow); if (!jobs.has(k)) jobs.set(k, { k, text, voice, slow }); };
for (const lv of LEVELS) { const data = JSON.parse(fs.readFileSync(path.join(dist, "content", lv + ".json"), "utf8"));
  for (const l of Object.values(data)) {
    for (const d of l.dialogue) { const v = d.me ? Z.learnerVoice(l.partner) : Z.partnerVoice(l.partner); add(d.en, v, false); if (SLOW) add(d.en, v, true); }
    for (const c of l.chunks) add(c.en, Z.NARRATOR, false);
    for (const s of l.sounds || []) { add(s.w, Z.NARRATOR, false); if (SLOW) add(s.w, Z.NARRATOR, true); } } }
if (PROGRAM) for (const day of JSON.parse(fs.readFileSync(path.join(dist, "content", "program.json"), "utf8"))) for (const c of day.chunks) add(Z.cleanPhrase(c.en), Z.NARRATOR, false);
const mfPath = path.join(out, "manifest.json"); const mf = fs.existsSync(mfPath) ? JSON.parse(fs.readFileSync(mfPath, "utf8")) : { version: 1, files: {} };
const todo = [...jobs.values()].filter(j => !mf.files[j.k] || !fs.existsSync(path.join(out, mf.files[j.k]))).slice(0, LIMIT);
const chars = todo.reduce((s, j) => s + j.text.length, 0);
console.log(`lines total ${jobs.size}, to generate ${todo.length} (${chars} chars), model ${MODEL}, format ${fmt}`);
if (DRY) process.exit(0);
if (!KEY && !process.env.GEMINI_BASE) { console.error("Set GEMINI_API_KEY"); process.exit(1); }
// 2) generate
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function tts(j) {
  const body = { model: MODEL, input: [{ type: "user_input", content: [{ type: "text", text: j.text, annotations: [{ type: "speech_metadata", style: j.slow ? Z.SLOW : Z.NORMAL }] }] }], response_format: { type: "audio" }, generation_config: { speech_config: [{ voice: j.voice }] } };
  for (let a = 0; a < 6; a++) {
    const r = await fetch(BASE + "/v1beta/interactions", { method: "POST", headers: { "Content-Type": "application/json", ...(KEY ? { "x-goog-api-key": KEY } : {}) }, body: JSON.stringify(body) }).catch(e => ({ ok: false, status: 0, json: async () => ({ error: { message: e.message } }) }));
    const js = await r.json().catch(() => ({}));
    if (r.ok) { let au = js.output_audio; if (!au?.data) for (const st of js.steps || []) for (const c of st.content || []) if (c.type === "audio" && c.data) au = c; if (au?.data) return Buffer.from(au.data, "base64"); throw new Error("no audio in response"); }
    if (r.status === 429 || r.status >= 500 || r.status === 0) { await sleep(2000 * 2 ** a); continue; }
    throw new Error(`HTTP ${r.status}: ${js.error?.message || ""}`);
  } throw new Error("retries exhausted");
}
let done = 0, failed = 0; const t0 = Date.now();
const saveMf = () => { mf.model = MODEL; mf.updated = new Date().toISOString(); mf.count = Object.keys(mf.files).length; fs.writeFileSync(mfPath, JSON.stringify(mf)); };
async function worker() { while (todo.length) { const j = todo.shift();
  try { const wav = await tts(j); const file = `${j.k}.${fmt}`, dest = path.join(out, file);
    if (fmt === "wav") fs.writeFileSync(dest, wav);
    else { const tmp = dest + ".wav"; fs.writeFileSync(tmp, wav); execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", tmp, ...(fmt === "opus" ? ["-c:a", "libopus", "-b:a", "32k", "-f", "webm"] : ["-c:a", "libmp3lame", "-b:a", "48k", "-ac", "1"]), dest]); fs.unlinkSync(tmp); }
    mf.files[j.k] = file; if (++done % 25 === 0) { saveMf(); console.log(`${done} done, ${failed} failed, ${((Date.now() - t0) / done).toFixed(0)} ms/line`); }
  } catch (e) { failed++; console.warn("✘", j.text.slice(0, 50), e.message); if (/HTTP 40[013]/.test(e.message)) { todo.length = 0; } } } }
await Promise.all(Array.from({ length: CONC }, worker)); saveMf();
console.log(`finished: ${done} generated, ${failed} failed, manifest has ${mf.count} files → ${path.relative(root, out)}/ (run build.mjs to copy into dist/audio)`);
