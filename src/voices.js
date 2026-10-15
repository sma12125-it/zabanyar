/* Zabanyar — shared voice/audio helpers. Loaded by the app (window.ZYV) and by scripts/gen-audio.mjs (globalThis.ZYV),
   so prebuilt audio keys match exactly. Voice names: Gemini TTS prebuilt voices (ai.google.dev/gemini-api/docs/speech-generation). */
(function (g) {
  const VOICES = [ // [name, gender, Persian description]
    ["Kore", "f", "زن — محکم و شفاف"], ["Aoede", "f", "زن — راحت و نسیم‌وار"], ["Leda", "f", "زن — جوان"], ["Zephyr", "f", "زن — روشن"],
    ["Despina", "f", "زن — نرم"], ["Sulafat", "f", "زن — گرم"], ["Laomedeia", "f", "زن — پرانرژی"], ["Vindemiatrix", "f", "زن — ملایم"],
    ["Puck", "m", "مرد — شاد و سرزنده"], ["Achird", "m", "مرد — دوستانه"], ["Charon", "m", "مرد — آموزشی و واضح"], ["Umbriel", "m", "مرد — خونسرد"],
    ["Zubenelgenubi", "m", "مرد — خودمانی"], ["Algieba", "m", "مرد — نرم"], ["Iapetus", "m", "مرد — شفاف"], ["Sadachbia", "m", "مرد — سرزنده"]
  ];
  const PF = ["Aoede", "Leda", "Despina", "Laomedeia", "Sulafat", "Zephyr"], PM = ["Puck", "Achird", "Umbriel", "Zubenelgenubi", "Sadachbia", "Algieba"];
  const FN = new Set("Mia Emily Kate Hannah Lisa Olivia Zoe Megan Jess Ava Sophie Chloe Emma Grace Nina Priya Charlotte Sister".split(" "));
  const MN = new Set("Jake Tom Leo Daniel Chris Ryan Mark Alex Ben Kevin Noah Liam Jordan Sam Josh Ethan Oliver".split(" "));
  const h = s => { let x = 0x811c9dc5; for (const c of String(s)) { x ^= c.codePointAt(0); x = Math.imul(x, 0x01000193) >>> 0; } return x; };
  const partnerVoice = name => { name = name || "Partner"; const f = FN.has(name) ? true : MN.has(name) ? false : h(name) % 2 === 0; const pool = f ? PF : PM; return pool[h(name + "#v") % pool.length]; };
  const learnerVoice = name => PF.includes(partnerVoice(name)) ? "Achird" : "Kore"; // always the opposite gender of the partner, so the two speakers are easy to tell apart
  const clean = t => String(t ?? "").replace(/[\u0600-\u06FF\u200c]+/g, " ").replace(/\s+/g, " ").trim();
  const cleanPhrase = s => clean(String(s).replace(/\(.*?\)|=.*$/g, "").replace(/\.\.\./g, ""));
  const audioKey = (text, voice, slow) => { const t = clean(text), a = `${voice}|${slow ? 1 : 0}|${t}`; return "a" + h(a).toString(16).padStart(8, "0") + h(a + "#2").toString(16).padStart(8, "0"); };
  g.ZYV = {
    VOICES, partnerVoice, learnerVoice, clean, cleanPhrase, audioKey,
    NARRATOR: "Kore", TUTOR: "Aoede",
    SLOW: "speaking slowly and clearly, like a teacher modelling pronunciation",
    NORMAL: "natural, relaxed conversational pace",
    TTS_MODELS: ["gemini-3.8-flash-tts", "gemini-3.8-flash-lite-tts"], LIVE_MODELS: ["gemini-3.8-live"],
    DEFAULT_TTS: "gemini-3.8-flash-tts", TUTOR_TTS: "gemini-3.8-flash-tts", LIVE: "gemini-3.8-live"
  };
})(typeof window !== "undefined" ? window : globalThis);
