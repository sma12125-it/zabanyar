// Zabanyar build: content-src + legacy content -> dist/ (lazy JSON per level), versioned service worker.
import fs from "node:fs"; import path from "node:path"; import vm from "node:vm"; import crypto from "node:crypto";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const dist = path.join(root, "dist"), LEVELS = ["A1", "A2", "B1", "B2", "C1"];
fs.rmSync(dist, { recursive: true, force: true }); fs.mkdirSync(path.join(dist, "content"), { recursive: true });
// 1) legacy hand-written lessons (content/*.js using L())
const ctx = { LESSONS: [] }; vm.createContext(ctx);
for (const f of ["core", "a1", "a2", "b1", "b2", "c1"]) vm.runInContext(fs.readFileSync(path.join(root, "content", f + ".js"), "utf8").replace("const LESSONS=[];", "LESSONS.length=0;"), ctx);
const byLevel = Object.fromEntries(LEVELS.map(l => [l, []]));
for (const l of ctx.LESSONS) byLevel[l.level].push({ icon: l.icon, title: l.title, scene: l.scene, partner: l.partner, dialogue: l.dialogue, chunks: l.chunks, notes: l.notes, sounds: l.sounds, quiz: l.quiz });
// 2) DSL lessons
const errors = [];
for (const lv of LEVELS) {
  const file = path.join(root, "content-src", lv.toLowerCase() + ".txt"); if (!fs.existsSync(file)) continue;
  for (const block of fs.readFileSync(file, "utf8").split(/\n(?=# )/)) {
    const lines = block.trim().split("\n").map(s => s.trim()).filter(Boolean); if (!lines[0]?.startsWith("# ")) continue;
    const [icon, title, scene, partner] = lines[0].slice(2).split("|").map(s => s.trim());
    const L = { icon, title, scene, partner, dialogue: [], chunks: [], notes: [], sounds: [], quiz: [] };
    for (const ln of lines.slice(1)) {
      const p = ln.slice(2).split("|").map(s => s.trim());
      if (/^[AB]\|/.test(ln)) { const [s, en, fa] = ln.split("|"); L.dialogue.push({ me: s === "B", en: en.trim(), fa: (fa || "").trim() }); }
      else if (ln.startsWith("+ ")) L.chunks.push({ en: p[0], fa: p[1] });
      else if (ln.startsWith("! ")) L.notes.push({ book: p[0], casual: p[1], fa: p[2] });
      else if (ln.startsWith("~ ")) L.sounds.push({ w: p[0], how: p[1], fa: p[2] });
      else if (ln.startsWith("? ")) L.quiz.push({ q: p[0], o: p[1].split(";").filter(Boolean), a: +p[2] });
      else errors.push(`${lv} ${title}: bad line: ${ln}`);
    }
    byLevel[lv].push(L);
  }
}
// 3) validate + auto quiz + ids
const rnd = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(42);
const shuffle = a => a.map(v => [rnd(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
const index = { version: "", levels: {}, counts: {} }; let totalPhrases = 0, totalLessons = 0;
for (const lv of LEVELS) {
  const list = byLevel[lv]; const out = {};
  list.forEach((L, i) => {
    L.id = `${lv}-${String(i + 1).padStart(2, "0")}`; L.level = lv;
    for (const x of [...L.dialogue, ...L.chunks]) if (!x.en || !x.fa) errors.push(`${L.id} missing translation: ${x.en}`);
    if (!L.dialogue.some(d => d.me)) errors.push(`${L.id} has no learner line`);
    if (L.dialogue.length < 5 || L.chunks.length < 8) errors.push(`${L.id} too short`);
    if (!L.quiz.length) { // auto listening comprehension: meaning of partner lines
      const others = list.filter(o => o !== L).flatMap(o => o.dialogue.map(d => d.fa));
      for (const d of shuffle(L.dialogue.filter(d => !d.me)).slice(0, 2)) {
        const opts = shuffle([d.fa, ...shuffle(others).slice(0, 2)]);
        L.quiz.push({ q: `${L.partner} گفت: «${d.en}» — یعنی چه؟`, o: opts, a: opts.indexOf(d.fa), en: true });
      }
    }
    out[L.id] = L;
  });
  fs.writeFileSync(path.join(dist, "content", lv.toLowerCase() + ".json"), JSON.stringify(out));
  const ph = list.reduce((s, L) => s + L.dialogue.length + L.chunks.length, 0); totalPhrases += ph; totalLessons += list.length;
  index.levels[lv] = list.map(L => ({ id: L.id, icon: L.icon, title: L.title, scene: L.scene, n: L.chunks.length }));
  index.counts[lv] = { lessons: list.length, dialogue: list.reduce((s, L) => s + L.dialogue.length, 0), chunks: list.reduce((s, L) => s + L.chunks.length, 0) };
}
// 4) 30-day program
const bank = []; let cur;
for (const ln of fs.readFileSync(path.join(root, "content-src", "bank.txt"), "utf8").split("\n").map(s => s.trim()).filter(Boolean)) {
  if (ln.startsWith("@ ")) { const [d, theme, ai] = ln.slice(2).split("|"); cur = { day: +d, theme, ai, chunks: [] }; bank.push(cur); }
  else { const [en, fa] = ln.split("|"); if (!fa) errors.push("bank bad: " + ln); cur.chunks.push({ en: en.trim(), fa: fa.trim() }); }
}
const seq = ["A1", "A2", "B1", "B2"].flatMap(lv => index.levels[lv].map(l => l.id)); let k = 0;
const program = bank.map(b => { const review = b.day % 7 === 0 || b.day === 30; const n = review ? 0 : 3; const lessons = seq.slice(k, k + n); k += n; return { ...b, review, lessons, reviewGoal: review ? 40 : 20 }; });
fs.writeFileSync(path.join(dist, "content", "program.json"), JSON.stringify(program));
const bankCount = bank.reduce((s, b) => s + b.chunks.length, 0);
index.counts.total = { lessons: totalLessons, phrases: totalPhrases, programChunks: bankCount, all: totalPhrases + bankCount };
// 5) copy app shell
const copy = (s, d) => { for (const f of fs.readdirSync(s)) { const sp = path.join(s, f), dp = path.join(d, f); if (fs.statSync(sp).isDirectory()) { fs.mkdirSync(dp, { recursive: true }); copy(sp, dp); } else fs.copyFileSync(sp, dp); } };
copy(path.join(root, "src"), dist);
// 6) version + SW precache
const files = []; const walk = d => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : files.push(path.relative(dist, p)); } }; walk(dist);
const BUILD_SALT = "v5-mic"; const h = crypto.createHash("sha256").update(BUILD_SALT); for (const f of files.sort()) h.update(f).update(fs.readFileSync(path.join(dist, f)));
index.version = h.digest("hex").slice(0, 10); index.built = new Date().toISOString();
fs.writeFileSync(path.join(dist, "content", "index.json"), JSON.stringify(index));
const pre = files.filter(f => !f.startsWith("splash/") && !path.basename(f).startsWith("_") && f !== "sw.js").concat(["content/index.json"]).filter((v, i, a) => a.indexOf(v) === i);
const sw = fs.readFileSync(path.join(root, "src", "sw.js"), "utf8").replace("__VERSION__", index.version).replace("__PRECACHE__", JSON.stringify(["./", ...pre]));
fs.writeFileSync(path.join(dist, "sw.js"), sw);
fs.writeFileSync(path.join(dist, "version.json"), JSON.stringify({ version: index.version, built: index.built }));
console.log(JSON.stringify(index.counts, null, 1)); console.log("version", index.version, "files", files.length);
if (errors.length) { console.error("CONTENT ERRORS:\n" + errors.join("\n")); process.exit(1); }
