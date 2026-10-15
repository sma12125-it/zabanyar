/* Zabanyar v8 — accounts + offline-first sync (Supabase Auth + PostgREST over plain fetch; no SDK).
   • Guest mode always works; progress lives in localStorage first.
   • Signed in: the whole progress JSON is stored in public.progress (one row per user, RLS: owner only).
   • Merge (both directions): sets/maps are unioned (done, steps, program tasks), per-item newest wins for SRS cards (c.u),
     max for counters (xp, per-day XP, reviews), and the newer side (S._u) wins for scalar settings and chat history.
   • Provider API keys are NEVER uploaded in plain text. With "sync keys" on, they are AES-GCM encrypted in the browser
     with a passphrase that never leaves the device (PBKDF2-SHA256, 210k iterations). */
"use strict";
const Sync = (() => {
  const CFG = () => ({ url: (S.sbUrl || window.ZY_CONFIG?.supabaseUrl || "").replace(/\/$/, ""), key: S.sbKey || window.ZY_CONFIG?.supabaseAnonKey || "" });
  const configured = () => !!(CFG().url && CFG().key);
  let sess = null; try { sess = JSON.parse(localStorage.getItem("zy-auth") || "null"); } catch (e) {}
  const setSess = s => { sess = s; s ? localStorage.setItem("zy-auth", JSON.stringify(s)) : localStorage.removeItem("zy-auth"); renderBadge(); };
  const user = () => sess?.user || null;
  const SECRET = ["gkey", "pk", "sbUrl", "sbKey", "keysEnc", "micOk", "fastFails", "liveAlt"]; // device-local
  const ERR = { "Invalid login credentials": "ایمیل/نام کاربری یا رمز عبور اشتباه است.", "User already registered": "با این ایمیل قبلاً حساب ساخته شده است.", "Email not confirmed": "ایمیل هنوز تأیید نشده؛ صندوق ایمیل (و هرزنامه) را ببینید.",
    "Password should be at least 6 characters": "رمز عبور باید حداقل ۶ نویسه باشد.", "Unable to validate email address: invalid format": "قالب ایمیل درست نیست.", "Email rate limit exceeded": "تعداد ایمیل‌های ارسالی زیاد بوده؛ کمی بعد دوباره تلاش کنید." };
  const faErr = (j, st) => { const m = j?.msg || j?.message || j?.error_description || j?.error || ""; for (const k in ERR) if (String(m).includes(k)) return ERR[k];
    return st === 0 ? "اتصال به سرور حساب کاربری برقرار نشد (اینترنت را بررسی کنید)." : st === 429 ? "درخواست‌ها زیاد بود؛ کمی بعد تلاش کنید." : "خطا" + (st ? ` (${st})` : "") + (m ? ": " + m : ""); };
  async function req(path, { method = "GET", body, auth = false, headers = {} } = {}) {
    const c = CFG(); if (!c.url) throw new Error("سرور حساب کاربری تنظیم نشده است.");
    if (auth) await ensureFresh();
    const h = { apikey: c.key, "Content-Type": "application/json", ...headers }; h.Authorization = "Bearer " + (auth && sess ? sess.access_token : c.key);
    let r; try { r = await fetch(c.url + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) }); } catch (e) { throw Object.assign(new Error(faErr(null, 0)), { status: 0 }); }
    const txt = await r.text(); let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) {}
    if (!r.ok) throw Object.assign(new Error(faErr(j, r.status)), { status: r.status, body: j }); return j; }
  const takeSession = (j, username) => { if (!j?.access_token) return false; setSess({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000,
    user: { id: j.user?.id, email: j.user?.email, username: j.user?.user_metadata?.username || username || "" } }); return true; };
  async function ensureFresh() { if (!sess || Date.now() < sess.expires_at - 60e3) return;
    try { const j = await req("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: sess.refresh_token } }); takeSession(j, sess.user?.username); }
    catch (e) { if (e.status >= 400 && e.status < 500) { setSess(null); toast("نشست حساب کاربری منقضی شد؛ دوباره وارد شوید. (پیشرفت روی دستگاه محفوظ است.)", true); } throw e; } }
  const USER_RE = /^[a-z0-9_]{3,20}$/;
  async function signUp(username, email, password) {
    username = username.trim().toLowerCase(); if (!USER_RE.test(username)) throw new Error("نام کاربری: ۳ تا ۲۰ حرف کوچک انگلیسی، عدد یا _");
    try { const ok = await req("/rest/v1/rpc/username_available", { method: "POST", body: { p_username: username } }); if (ok === false) throw Object.assign(new Error("این نام کاربری قبلاً گرفته شده است."), { taken: 1 }); } catch (e) { if (e.taken) throw e; }
    const j = await req("/auth/v1/signup", { method: "POST", body: { email: email.trim(), password, data: { username } } });
    if (takeSession(j, username)) { await syncNow(true); return "in"; } return "confirm"; }
  async function signIn(id, password) { id = id.trim(); let email = id;
    if (!id.includes("@")) { let e2 = null; try { e2 = await req("/rest/v1/rpc/login_email", { method: "POST", body: { p_username: id.toLowerCase() } }); } catch (e) {} if (!e2) throw new Error("ورود با نام کاربری در این سرور فعال نیست یا نام کاربری پیدا نشد؛ با ایمیل وارد شوید."); email = e2; }
    const j = await req("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password } }); takeSession(j); await syncNow(true); }
  const recover = email => req("/auth/v1/recover", { method: "POST", body: { email: email.trim(), ...(location.protocol.startsWith("http") ? {} : {}) }, headers: {} });
  async function signOut(wipe) { try { if (sess) await req("/auth/v1/logout", { method: "POST", auth: true, body: {} }); } catch (e) {} setSess(null);
    if (wipe) { const keep = Object.fromEntries(SECRET.map(k => [k, S[k]])); localStorage.setItem("zy3", JSON.stringify({ ...keep, v: 4 })); location.reload(); } }
  /* ---------- merge ---------- */
  const strip = s => { const o = { ...s }; for (const k of SECRET) delete o[k]; return o; };
  function merge(L, R) { if (!R) return L; const newer = (R._u || 0) > (L._u || 0) ? R : L, out = { ...L, ...strip(newer) };
    const union = k => { out[k] = { ...(R[k] || {}), ...(L[k] || {}) }; };
    union("done"); out.steps = {}; for (const k of new Set([...Object.keys(L.steps || {}), ...Object.keys(R.steps || {})])) out.steps[k] = { ...(R.steps?.[k] || {}), ...(L.steps?.[k] || {}) };
    out.cards = { ...(R.cards || {}) }; for (const [id, c] of Object.entries(L.cards || {})) { const o = out.cards[id]; if (!o || (c.u || 0) >= (o.u || 0)) out.cards[id] = c; }
    for (const k of ["days", "reviewsToday"]) { out[k] = { ...(R[k] || {}) }; for (const [d, v] of Object.entries(L[k] || {})) out[k][d] = Math.max(v, out[k][d] || 0); }
    out.xp = Math.max(L.xp || 0, R.xp || 0); out.streak = newer.streak; out.last = newer.last;
    const lp = L.program || {}, rp = R.program || {}; out.program = { start: newer.program?.start || lp.start || rp.start, tasks: {} };
    for (const d of new Set([...Object.keys(lp.tasks || {}), ...Object.keys(rp.tasks || {})])) out.program.tasks[d] = { ...(rp.tasks?.[d] || {}), ...(lp.tasks?.[d] || {}) };
    out.vsel = { ...(R.vsel || {}), ...(L.vsel || {}) };
    for (const k of SECRET) if (L[k] !== undefined) out[k] = L[k]; else delete out[k];
    out._u = Math.max(L._u || 0, R._u || 0); return out; }
  /* ---------- optional encrypted key sync ---------- */
  const enc = new TextEncoder(), dec = new TextDecoder(), b64 = u => btoa(String.fromCharCode(...new Uint8Array(u))), ub64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function kdf(pass, salt) { const k = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]); return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" }, k, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]); }
  async function sealKeys(pass) { const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)); const k = await kdf(pass, salt);
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, enc.encode(JSON.stringify({ gkey: S.gkey, pk: S.pk, proxy: S.proxy }))); return { v: 1, salt: b64(salt), iv: b64(iv), ct: b64(ct) }; }
  async function openKeys(box, pass) { const k = await kdf(pass, ub64(box.salt)); const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ub64(box.iv) }, k, ub64(box.ct)); return JSON.parse(dec.decode(pt)); }
  let keyPass = null; // session-only, never stored
  /* ---------- sync ---------- */
  let busy = false, dirtyT = null, lastSync = +(localStorage.getItem("zy-synced") || 0), lastErr = "";
  async function syncNow(first) { if (!configured() || !sess || busy || navigator.onLine === false) return; busy = true; renderBadge("⏳");
    try { const uid = sess.user.id; const rows = await req(`/rest/v1/progress?user_id=eq.${uid}&select=data,keys_enc,updated_at`, { auth: true });
      const remote = rows?.[0]; const merged = merge(JSON.parse(JSON.stringify(S)), remote?.data || null);
      Object.assign(S, merged); localStorage.setItem("zy3", JSON.stringify(S));
      if (remote?.keys_enc && !S.gkey && !Object.values(S.pk || {}).some(c => c.key)) S._pendingKeys = remote.keys_enc;
      const body = { user_id: uid, data: strip(S), updated_at: new Date().toISOString() };
      if (S.syncKeys && keyPass) body.keys_enc = await sealKeys(keyPass); else if (!S.syncKeys) body.keys_enc = null;
      await req("/rest/v1/progress?on_conflict=user_id", { method: "POST", auth: true, body, headers: { Prefer: "resolution=merge-duplicates,return=minimal" } });
      lastSync = Date.now(); localStorage.setItem("zy-synced", lastSync); lastErr = ""; if (first) { stats(); if (typeof CUR !== "undefined" && CUR !== "tutor") go(CUR); }
    } catch (e) { lastErr = e.message; } finally { busy = false; renderBadge(); } }
  const dirty = () => { if (!sess) return; clearTimeout(dirtyT); dirtyT = setTimeout(syncNow, 4000); };
  const kick = () => { if (sess) syncNow(); };
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && sess) syncNow(); });
  /* ---------- UI ---------- */
  function renderBadge(state) { const b = document.getElementById("acctBtn"); if (!b) return; b.textContent = sess ? (state || (lastErr ? "⚠️" : "👤")) : "👤";
    b.title = sess ? `${sess.user.username || sess.user.email}${lastErr ? " — همگام‌سازی ناموفق: " + lastErr : ""}` : "ورود / ثبت‌نام"; }
  const ago = t => { if (!t) return "هرگز"; const m = Math.round((Date.now() - t) / 6e4); return m < 1 ? "همین الان" : m < 60 ? fa(m) + " دقیقه پیش" : new Date(t).toLocaleString("fa-IR"); };
  function card(el) { if (!el) return;
    if (!configured()) { el.innerHTML = `<h3>👤 حساب کاربری</h3><p class=muted>حالت مهمان: پیشرفت فقط روی همین دستگاه ذخیره می‌شود.</p><div class=tip>برای فعال شدن ثبت‌نام و همگام‌سازی بین دستگاه‌ها، مدیر سایت باید پروژه‌ی رایگان Supabase بسازد و آدرس و کلید عمومی آن را در <code>config.js</code> بگذارد (راهنما: <code>docs/accounts-fa.md</code>).</div>
      <details><summary class=muted>تنظیم دستی سرور (برای آزمایش)</summary><label>Supabase URL:<input id=sbu dir=ltr value="${esc(S.sbUrl || "")}"></label><label>anon key:<input id=sbk dir=ltr value="${esc(S.sbKey || "")}"></label><button class="btn sm" id=sbs>ذخیره</button></details>`;
      el.querySelector("#sbs").onclick = () => { S.sbUrl = el.querySelector("#sbu").value.trim(); S.sbKey = el.querySelector("#sbk").value.trim(); save(true); card(el); }; return; }
    if (!sess) { el.innerHTML = `<h3>👤 حساب کاربری</h3><p class=muted>الان در حالت مهمان هستید؛ همه‌چیز روی همین دستگاه کار می‌کند. با ساخت حساب، پیشرفت، کارت‌های مرور و تنظیمات بین دستگاه‌ها همگام می‌شود (کلیدهای API نه).</p><button class="btn p" id=aIn>ورود</button><button class=btn id=aUp>ثبت‌نام</button>`;
      el.querySelector("#aIn").onclick = () => open("in"); el.querySelector("#aUp").onclick = () => open("up"); return; }
    el.innerHTML = `<h3>👤 ${esc(sess.user.username || "حساب من")}</h3><p class=muted dir=ltr style="text-align:right">${esc(sess.user.email || "")}</p><p>آخرین همگام‌سازی: ${ago(lastSync)} ${lastErr ? `<br><b class=bad>${esc(lastErr)}</b>` : ""}</p>
      <button class="btn p" id=aSync>🔄 همگام‌سازی الان</button><button class=btn id=aOut>خروج</button>
      <details><summary>🔐 همگام‌سازی کلیدهای API (اختیاری، رمزگذاری‌شده)</summary><p class=muted>به‌طور پیش‌فرض کلیدها فقط روی هر دستگاه می‌مانند. اگر فعال کنید، قبل از ارسال با یک «رمز کلیدها» روی همین دستگاه رمزگذاری می‌شوند؛ سرور و ما هرگز رمز را نمی‌بینیم. اگر رمز را فراموش کنید، کلیدها قابل بازیابی نیستند.</p>
      <label><input type=checkbox id=aKs ${S.syncKeys ? "checked" : ""}> همگام‌سازی رمزگذاری‌شده‌ی کلیدها</label><input id=aKp type=password placeholder="رمز کلیدها (حداقل ۸ نویسه)" autocomplete=new-password>
      ${S._pendingKeys ? `<div class=tip>کلیدهای رمزگذاری‌شده‌ای از دستگاه دیگر پیدا شد. <button class="btn sm" id=aKo>باز کردن با رمز</button></div>` : ""}<button class="btn sm" id=aKsv>ذخیره</button></details>`;
    el.querySelector("#aSync").onclick = async () => { await syncNow(); card(el); toast(lastErr ? lastErr : "همگام شد ✓", !!lastErr); };
    el.querySelector("#aOut").onclick = () => { modal(`<h3>خروج از حساب</h3><p>پیشرفت روی سرور محفوظ است.</p><button class="btn p" id=o1>خروج و نگه داشتن داده‌ها روی این دستگاه</button><button class=btn id=o2>خروج و پاک کردن داده‌های این دستگاه</button><button class=btn onclick="closeModal()">انصراف</button>`);
      $("#o1").onclick = async () => { closeModal(); await syncNow(); await signOut(false); go("settings"); toast("از حساب خارج شدید (حالت مهمان)."); }; $("#o2").onclick = async () => { closeModal(); await syncNow(); await signOut(true); }; };
    el.querySelector("#aKsv").onclick = async () => { const on = el.querySelector("#aKs").checked, p = el.querySelector("#aKp").value; if (on && p.length < 8) return toast("رمز کلیدها حداقل ۸ نویسه باشد.", true); S.syncKeys = on; keyPass = on ? p : null; save(); await syncNow(); card(el); toast(on ? "کلیدها رمزگذاری و همگام شدند." : "همگام‌سازی کلیدها خاموش شد و نسخه‌ی سرور حذف شد."); };
    const ko = el.querySelector("#aKo"); if (ko) ko.onclick = async () => { const p = el.querySelector("#aKp").value; try { const k = await openKeys(S._pendingKeys, p); S.gkey = k.gkey || S.gkey; S.pk = { ...(k.pk || {}), ...S.pk }; S.proxy = S.proxy || k.proxy || ""; delete S._pendingKeys; keyPass = p; S.syncKeys = true; save(); toast("کلیدها بازیابی شدند ✓"); go("settings"); } catch (e) { toast("رمز کلیدها اشتباه است.", true); } }; }
  function open(mode) {
    const f = { up: `<h3>ثبت‌نام</h3><label>نام کاربری:<input id=fU dir=ltr autocomplete=username placeholder="sara_92"></label><label>ایمیل (برای بازیابی رمز):<input id=fE dir=ltr type=email autocomplete=email></label><label>رمز عبور:<input id=fP type=password dir=ltr autocomplete=new-password></label><p class=muted>پیشرفت فعلی این دستگاه (حالت مهمان) به حساب جدید منتقل می‌شود.</p><button class="btn p" id=fGo>ساخت حساب</button><button class="btn sm" id=fSw>حساب دارم — ورود</button>`,
      in: `<h3>ورود</h3><label>ایمیل یا نام کاربری:<input id=fI dir=ltr autocomplete=username></label><label>رمز عبور:<input id=fP type=password dir=ltr autocomplete=current-password></label><button class="btn p" id=fGo>ورود</button><button class="btn sm" id=fFg>رمز را فراموش کرده‌ام</button><button class="btn sm" id=fSw>حساب ندارم — ثبت‌نام</button>`,
      fg: `<h3>بازیابی رمز عبور</h3><label>ایمیل حساب:<input id=fE dir=ltr type=email></label><button class="btn p" id=fGo>ارسال لینک بازیابی</button><button class="btn sm" id=fSw>بازگشت به ورود</button>` }[mode];
    modal(f + `<div id=fMsg aria-live=polite></div><button class="btn sm" onclick="closeModal()">بستن</button>`); const msg = (t, bad) => $("#fMsg").innerHTML = `<p class=${bad ? "bad" : "ok"}>${esc(t)}</p>`;
    $("#fSw").onclick = () => open(mode === "up" ? "in" : mode === "in" ? "up" : "in"); if ($("#fFg")) $("#fFg").onclick = () => open("fg");
    $("#fGo").onclick = async () => { const b = $("#fGo"); b.disabled = true; msg("⏳ …");
      try { if (mode === "up") { const r = await signUp($("#fU").value, $("#fE").value, $("#fP").value); if (r === "in") { closeModal(); toast("حساب ساخته شد و پیشرفت همگام شد ✓"); go(CUR); } else msg("حساب ساخته شد. لینک تأیید به ایمیل شما فرستاده شد؛ بعد از تأیید وارد شوید."); }
        else if (mode === "in") { await signIn($("#fI").value, $("#fP").value); closeModal(); toast("خوش آمدید! پیشرفت همگام شد ✓"); go(CUR); }
        else { await recover($("#fE").value); msg("اگر این ایمیل حساب داشته باشد، لینک بازیابی رمز فرستاده شد (هرزنامه را هم ببینید)."); } }
      catch (e) { msg(e.message, true); } finally { if ($("#fGo")) b.disabled = false; } }; }
  /* password-recovery / email-confirm links come back as #access_token=…&type=recovery|signup */
  async function handleRedirect() { const h = new URLSearchParams(location.hash.slice(1)); if (!h.get("access_token")) return false;
    const type = h.get("type"); history.replaceState(null, "", location.pathname);
    takeSession({ access_token: h.get("access_token"), refresh_token: h.get("refresh_token"), expires_in: +h.get("expires_in") || 3600, user: {} });
    try { const u = await req("/auth/v1/user", { auth: true }); sess.user = { id: u.id, email: u.email, username: u.user_metadata?.username || "" }; setSess(sess); } catch (e) {}
    if (type === "recovery") { modal(`<h3>رمز عبور جدید</h3><input id=nP type=password dir=ltr autocomplete=new-password><button class="btn p" id=nGo>ذخیره</button><div id=nM></div>`);
      $("#nGo").onclick = async () => { try { await req("/auth/v1/user", { method: "PUT", auth: true, body: { password: $("#nP").value } }); closeModal(); toast("رمز عبور تغییر کرد ✓"); } catch (e) { $("#nM").innerHTML = `<p class=bad>${esc(e.message)}</p>`; } }; }
    else toast("ایمیل تأیید شد ✓"); syncNow(true); return true; }
  return { configured, user, signUp, signIn, signOut, recover, syncNow, dirty, kick, merge, card, open, renderBadge, handleRedirect, sealKeys, openKeys, get session() { return sess; } };
})();
window.Sync = Sync;
