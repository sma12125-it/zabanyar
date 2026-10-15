// Dialogue variants (گفتگو ۲..۵) per scenario: parser + validation. Source: content-src/variants/*.txt
// Block format:
//   @ <lessonId>|<n 2..5>|<mood label fa>|<scene fa>|<partner>
//   A|english|persian        (partner line)   B|english|persian   (learner line)
//   + chunk|persian    ! bookish|casual|persian note    ~ word|how|persian    ? q|o1;o2;o3|answerIndex (optional)
import fs from "node:fs"; import path from "node:path";
const FA = /[\u0600-\u06FF]/, LAT = /[A-Za-z]/;
export const normChunk = s => String(s).toLowerCase().replace(/\(.*?\)/g, "").replace(/=.*$/, "").replace(/[^a-z' ]/g, " ").replace(/\s+/g, " ").trim();
export function parseVariants(root) {
  const dir = path.join(root, "content-src", "variants"), out = {}, errors = [];
  if (!fs.existsSync(dir)) return { out, errors };
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".txt")).sort()) {
    for (const block of fs.readFileSync(path.join(dir, f), "utf8").split(/\n(?=@ )/)) {
      const lines = block.trim().split("\n").map(s => s.trim()).filter(Boolean); if (!lines[0]?.startsWith("@ ")) continue;
      const h = lines[0].slice(2).split("|").map(s => s.trim()); const [id, n, mood, scene, partner] = h;
      const V = { n: +n, mood, scene, partner, dialogue: [], chunks: [], notes: [], sounds: [], quiz: [], src: f };
      if (h.length !== 5 || !/^(A1|A2|B1|B2|C1)-\d\d$/.test(id) || !(V.n >= 2 && V.n <= 5) || !mood || !scene || !partner) errors.push(`${f}: bad header: ${lines[0]}`);
      for (const ln of lines.slice(1)) { const p = ln.slice(2).split("|").map(s => s.trim());
        if (/^[AB]\|/.test(ln)) { const [s, en, fa, extra] = ln.split("|"); if (extra !== undefined) errors.push(`${id}#${n}: extra '|' in: ${ln}`); V.dialogue.push({ me: s === "B", en: (en || "").trim(), fa: (fa || "").trim() }); }
        else if (ln.startsWith("+ ")) { if (p.length !== 2) errors.push(`${id}#${n}: bad chunk: ${ln}`); V.chunks.push({ en: p[0], fa: p[1] }); }
        else if (ln.startsWith("! ")) { if (p.length !== 3) errors.push(`${id}#${n}: bad note: ${ln}`); V.notes.push({ book: p[0], casual: p[1], fa: p[2] }); }
        else if (ln.startsWith("~ ")) { if (p.length !== 3) errors.push(`${id}#${n}: bad sound: ${ln}`); V.sounds.push({ w: p[0], how: p[1], fa: p[2] }); }
        else if (ln.startsWith("? ")) V.quiz.push({ q: p[0], o: p[1].split(";").filter(Boolean), a: +p[2] });
        else errors.push(`${id}#${n}: bad line: ${ln}`); }
      (out[id] ||= []).push(V);
    }
  }
  return { out, errors };
}
/** Validate one lesson's variants against its base dialogue. Returns {errors, warnings}. */
export function validateLesson(L, vars, { strict = false } = {}) {
  const errors = [], warnings = [], tag = n => `${L.id}#${n}`;
  const ns = vars.map(v => v.n).sort();
  if (strict && ns.join() !== "2,3,4,5") errors.push(`${L.id}: variants ${ns.join(",") || "none"} (need 2,3,4,5)`);
  if (new Set(ns).size !== ns.length) errors.push(`${L.id}: duplicate variant numbers ${ns.join(",")}`);
  const seenChunk = new Map(L.chunks.map(c => [normChunk(c.en), 1])), seenLine = new Map(L.dialogue.map(d => [d.en.toLowerCase(), 1])), moods = new Set();
  for (const v of vars.sort((a, b) => a.n - b.n)) {
    if (moods.has(v.mood)) warnings.push(`${tag(v.n)}: same mood label as another variant (${v.mood})`); moods.add(v.mood);
    if (v.dialogue.length < 8 || v.dialogue.length > 12) errors.push(`${tag(v.n)}: ${v.dialogue.length} lines (need 8–12)`);
    if (v.chunks.length < 6 || v.chunks.length > 10) errors.push(`${tag(v.n)}: ${v.chunks.length} chunks (need 6–10)`);
    if (!v.notes.length) errors.push(`${tag(v.n)}: no کتابی/محاوره‌ای note`);
    if (!v.dialogue.some(d => d.me) || !v.dialogue.some(d => !d.me)) errors.push(`${tag(v.n)}: needs both speakers`);
    for (const x of [...v.dialogue, ...v.chunks]) {
      if (!x.en || !x.fa) errors.push(`${tag(v.n)}: empty text/translation: ${x.en || x.fa}`);
      else { if (!FA.test(x.fa)) errors.push(`${tag(v.n)}: translation not Persian: ${x.fa}`); if (FA.test(x.en) || !LAT.test(x.en)) errors.push(`${tag(v.n)}: English side invalid: ${x.en}`); }
    }
    for (const nt of v.notes) if (!nt.book || !nt.casual || !FA.test(nt.fa || "")) errors.push(`${tag(v.n)}: incomplete note`);
    for (const s of v.sounds) if (!s.w || !s.how || !s.fa) errors.push(`${tag(v.n)}: incomplete sound note`);
    for (const c of v.chunks) { const k = normChunk(c.en); if (!k) continue; if (seenChunk.has(k)) errors.push(`${tag(v.n)}: duplicate chunk in scenario: "${c.en}"`); seenChunk.set(k, 1); }
    for (const d of v.dialogue) { const k = d.en.toLowerCase(); if (k.length > 18 && seenLine.has(k)) errors.push(`${tag(v.n)}: repeated dialogue line in scenario: "${d.en}"`); seenLine.set(k, 1); }
    for (let i = 1; i < v.dialogue.length; i++) if (v.dialogue[i].me === v.dialogue[i - 1].me) warnings.push(`${tag(v.n)}: same speaker twice in a row (line ${i + 1})`);
  }
  return { errors, warnings };
}
