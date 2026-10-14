"use strict";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],app=$("#app");
const LEVELS=["A1","A2","B1","B2","C1"],LVNAME={A1:"مبتدی",A2:"پایه",B1:"متوسط",B2:"بالاتر از متوسط",C1:"پیشرفته"};
const DEF={xp:0,streak:0,last:null,level:null,done:{},steps:{},cards:{},provider:"gemini",gkey:"",gmodel:"gemini-3.8-flash",key:"",api:"https://api.openai.com/v1",model:"gpt-4o-mini",dark:false,accent:"en-US",chats:{},days:{}};
const S=Object.assign({},DEF,JSON.parse(localStorage.getItem("zy2")||"{}"));
const save=()=>{localStorage.setItem("zy2",JSON.stringify(S));stats()};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const today=()=>new Date().toLocaleDateString("en-CA");
const fa=n=>Number(n).toLocaleString("fa-IR");
function addXP(n){S.xp+=n;const t=today();S.days[t]=(S.days[t]||0)+n;if(S.last!==t){const y=new Date(Date.now()-864e5).toLocaleDateString("en-CA");S.streak=S.last===y?S.streak+1:1;S.last=t}save()}
function stats(){$("#stats").innerHTML=`<span class=pill>🔥 ${fa(S.streak)}</span><span class=pill>⭐ ${fa(S.xp)}</span>`}
/* ---------- Speech ---------- */
let voices=[];const loadV=()=>voices=window.speechSynthesis?speechSynthesis.getVoices():[];if(window.speechSynthesis){loadV();speechSynthesis.onvoiceschanged=loadV}
function speak(t,rate=1,onend){if(!window.speechSynthesis){onend&&onend();return}const u=new SpeechSynthesisUtterance(t);u.lang=S.accent;u.rate=rate;const v=voices.find(v=>v.lang===S.accent)||voices.find(v=>v.lang.startsWith("en"));if(v)u.voice=v;u.onend=()=>onend&&onend();u.onerror=()=>onend&&onend();speechSynthesis.cancel();speechSynthesis.speak(u)}
function speakSeq(lines,rate=1,i=0,done){if(i>=lines.length)return done&&done();speak(lines[i],rate,()=>setTimeout(()=>speakSeq(lines,rate,i+1,done),350))}
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
function listen(cb){if(!SR)return cb(null);try{const r=new SR();r.lang=S.accent;r.interimResults=false;let got=false;r.onresult=e=>{got=true;cb(e.results[0][0].transcript)};r.onerror=()=>{if(!got)cb(null)};r.onend=()=>{if(!got)cb(null);got=true};r.start()}catch(e){cb(null)}}
const EXP={"gonna":"going to","wanna":"want to","gotta":"got to","kinda":"kind of","i'm":"i am","you're":"you are","it's":"it is","that's":"that is","what's":"what is","don't":"do not","can't":"cannot","won't":"will not","i'll":"i will","i'd":"i would","i've":"i have","we're":"we are","let's":"let us","there's":"there is","isn't":"is not","didn't":"did not","doesn't":"does not","that'd":"that would","u":"you","ya":"you"};
const norm=s=>s.toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9' ]/g," ").split(/\s+/).filter(Boolean).flatMap(w=>(EXP[w]||w).split(" "));
function sim(said,target){const a=norm(said),b=norm(target);if(!b.length)return 0;const m=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)m[i][j]=a[i-1]===b[j-1]?m[i-1][j-1]+1:Math.max(m[i-1][j],m[i][j-1]);return m[a.length][b.length]/b.length}
/* ---------- SRS (SM-2 variant) ---------- */
function grade(id,q){const c=S.cards[id]||{ef:2.5,n:0,iv:0,due:0};if(q<3){c.n=0;c.iv=0}else{c.n++;c.iv=c.n==1?1:c.n==2?(q==5?4:3):Math.round(c.iv*c.ef*(q==5?1.3:q==3?.8:1))}c.ef=Math.max(1.3,c.ef+.1-(5-q)*(.08+(5-q)*.02));c.due=Date.now()+(c.iv?c.iv*864e5:6e4);S.cards[id]=c;save()}
const allCards=()=>LESSONS.flatMap(l=>l.chunks.map((c,i)=>({id:l.id+"-"+i,l,en:c.en,fa:c.fa})));
const dueCards=()=>allCards().filter(c=>S.cards[c.id]&&S.cards[c.id].due<=Date.now());
/* ---------- Views ---------- */
const V={
home(){const done=Object.keys(S.done).length,learned=Object.keys(S.cards).length,due=dueCards().length;
const rec=LESSONS.find(l=>!S.done[l.id]&&LEVELS.indexOf(l.level)>=LEVELS.indexOf(S.level||"A1"))||LESSONS.find(l=>!S.done[l.id]);
const week=[...Array(7)].map((_,i)=>{const d=new Date(Date.now()-(6-i)*864e5).toLocaleDateString("en-CA");return S.days[d]||0}),mx=Math.max(20,...week);
app.innerHTML=`<div class=card><h2>سلام! 👋 آماده‌ی حرف زدنی؟</h2><p class=muted>روش زبان‌یار: اول گفتگو، بعد قواعد. عبارت‌های واقعی را بشنو، تکرار کن، نقش بازی کن.</p>
${S.level?`<p>سطح شما: <span class=badge>${S.level}</span> ${LVNAME[S.level]}</p>`:`<button class="btn p" onclick="go('placement')">🎯 آزمون تعیین سطح (۲ دقیقه)</button>`}</div>
${rec?`<div class=card><span class=muted>درس پیشنهادی بعدی</span><h3>${rec.icon} ${rec.title} <span class=badge>${rec.level}</span></h3><p class=muted>${rec.scene}</p><button class="btn p" onclick="lesson(${rec.id})">شروع ▶</button></div>`:""}
<div class="card grid"><div class=stat><b>${fa(done)}/${fa(LESSONS.length)}</b>درس</div><div class=stat><b>${fa(learned)}</b>عبارت آموخته</div><div class=stat><b>${fa(due)}</b>آماده‌ی مرور</div><div class=stat><b>${fa(S.streak)}🔥</b>روز پیاپی</div></div>
<div class=card><b>فعالیت ۷ روز اخیر (XP)</b><div style="display:flex;align-items:flex-end;gap:6px;height:90px;margin-top:8px">${week.map(v=>`<div style="flex:1;background:var(--pri2);opacity:${v?1:.2};height:${Math.max(4,v/mx*85)}px;border-radius:6px 6px 0 0" title="${v}"></div>`).join("")}</div></div>
<div class=card><b>پیشرفت در هر سطح</b>${LEVELS.map(lv=>{const ls=LESSONS.filter(l=>l.level==lv),d=ls.filter(l=>S.done[l.id]).length;return`<div style="margin:6px 0"><span class=badge>${lv}</span> <span class=muted>${fa(d)} از ${fa(ls.length)}</span><div class=bar><i style="width:${d/ls.length*100}%"></i></div></div>`}).join("")}</div>`},
map(){app.innerHTML=`<div class=card><h2>🗺️ مسیر یادگیری</h2><p class=muted>${fa(LESSONS.length)} سناریوی واقعی از A1 تا C1. هر سناریو: گفتگو، عبارت‌ها، کتابی در برابر محاوره‌ای، سایه‌روی، نقش‌آفرینی و شنیداری.</p></div>`+
LEVELS.map(lv=>`<div class=lvl-h><span class=badge>${lv}</span><b>${LVNAME[lv]}</b></div><div class=grid>${LESSONS.filter(l=>l.level==lv).map(l=>`<div class="node ${S.done[l.id]?"done":""} ${S.level==lv&&!S.done[l.id]?"rec":""}" onclick="lesson(${l.id})"><div class=ic>${l.icon}</div><b>${l.title}</b><div class=muted>${S.done[l.id]?"✅ کامل":fa(Object.keys(S.steps[l.id]||{}).length)+"/۶ بخش"}</div></div>`).join("")}</div>`).join("")},
placement(){let i=0;const sc={};const step=()=>{if(i>=PLACEMENT.length){let lvl="A1";for(const l of LEVELS){const tot=PLACEMENT.filter(p=>p.l==l).length;if((sc[l]||0)/tot>=.67)lvl=LEVELS[Math.min(LEVELS.indexOf(l)+1,4)];else break}
if(!(sc.A1>=3))lvl="A1";S.level=lvl;addXP(20);app.innerHTML=`<div class=card style=text-align:center><div class=big>🎯</div><h2>سطح پیشنهادی: <span class=badge>${lvl}</span> ${LVNAME[lvl]}</h2><p class=muted>می‌توانید هر درسی را باز کنید؛ درس‌های سطح شما در مسیر مشخص شده‌اند.</p><button class="btn p" onclick="go('map')">رفتن به مسیر</button></div>`;return}
const p=PLACEMENT[i];app.innerHTML=`<div class=card><div class=bar><i style="width:${i/PLACEMENT.length*100}%"></i></div><p class=muted>سؤال ${fa(i+1)} از ${fa(PLACEMENT.length)}</p><p class="big ${/[a-z]{3}/.test(p.q)&&!/[\u0600-\u06FF]/.test(p.q)?"en":""}">${esc(p.q)}</p>${p.o.map((o,j)=>`<button class="btn ${/[\u0600-\u06FF]/.test(o)?"":"en"}" style="display:block;width:100%" data-j=${j}>${esc(o)}</button>`).join("")}<button class="btn sm" id=skip>نمی‌دانم</button></div>`;
$$("[data-j]").forEach(b=>b.onclick=()=>{if(+b.dataset.j==p.a)sc[p.l]=(sc[p.l]||0)+1;i++;step()});$("#skip").onclick=()=>{i++;step()}};step()},
review(){const q=dueCards();if(!q.length){const n=Object.keys(S.cards).length;app.innerHTML=`<div class=card style=text-align:center><div class=big>🎉</div><h3>فعلاً مروری نمانده</h3><p class=muted>${n?"کارت‌ها طبق الگوریتم تکرار فاصله‌دار در زمان مناسب برمی‌گردند.":"با کامل کردن بخش «عبارت‌ها» در هر درس، کارت جدید اضافه می‌شود."}</p></div>`;return}
const c=q[0];const rev=Math.random()<.5;app.innerHTML=`<div class=card style=text-align:center><p class=muted>باقی‌مانده: ${fa(q.length)} · ${c.l.icon} ${c.l.title}</p><p class="big ${rev?"en":""}">${esc(rev?c.en:c.fa)}</p><p class=muted>${rev?"معنی را به یاد بیاورید":"عبارت انگلیسی را بلند بگویید، بعد ببینید"}</p><button class="btn p" id=show>نمایش پاسخ</button><div id=ans></div></div>`;
if(rev)speak(c.en);$("#show").onclick=()=>{speak(c.en);$("#ans").innerHTML=`<p class="big ${rev?"":"en"}">${esc(rev?c.fa:c.en)}</p><button class="btn sm" id=say>🔊</button><hr style="border:0;border-top:1px solid var(--line)"><button class=btn data-q=1>🔁 دوباره</button><button class=btn data-q=3>😓 سخت</button><button class=btn data-q=4>🙂 خوب</button><button class=btn data-q=5>😎 آسان</button>`;
$("#say").onclick=()=>speak(c.en);$$("[data-q]").forEach(b=>b.onclick=()=>{grade(c.id,+b.dataset.q);addXP(2);V.review()})}},
tutor(){if(!activeKey()){app.innerHTML=`<div class=card><h2>🤖 معلم و نقش‌آفرینی هوش مصنوعی</h2><p>با یک «شخصیت بومی» در سناریوهای واقعی گفتگو کنید؛ اشتباهاتتان با مهربانی به فارسی توضیح داده می‌شود.</p><p class=muted>این بخش اختیاری است و به کلید رایگان Google Gemini (یا API سازگار با OpenAI) نیاز دارد که فقط در مرورگر شما ذخیره می‌شود.</p><button class="btn p" onclick="go('settings')">وارد کردن کلید در تنظیمات</button></div>`;return}
const sc=+(sessionStorage.zyScen||0);app.innerHTML=`<div class=card><h3>🤖 نقش‌آفرینی با AI</h3><select id=scen><option value=0>گپ آزاد با معلم</option>${LEVELS.map(lv=>`<optgroup label="${lv}">${LESSONS.filter(l=>l.level==lv).map(l=>`<option value=${l.id} ${l.id==sc?"selected":""}>${l.icon} ${l.title}</option>`).join("")}</optgroup>`).join("")}</select>
<div id=log style="max-height:55vh;overflow:auto"></div><div style="display:flex;gap:6px;align-items:center"><input id=msg class=en placeholder="Say something in English..."><button class="btn" id=mic title="گفتن">🎤</button><button class="btn p" id=send>ارسال</button></div><button class="btn sm" id=clr>شروع دوباره</button></div>`;
const key=()=>$("#scen").value,chat=()=>S.chats[key()]=S.chats[key()]||[];
const draw=()=>{if(!$("#log"))return;$("#log").innerHTML=chat().map(m=>`<div class="bubble ${m.role=="user"?"me":"them"}"><div class=who>${m.role=="user"?"شما":"🤖"}</div><div style="white-space:pre-wrap" dir=auto>${esc(m.content)}</div>${m.role!="user"?`<button class="btn sm" onclick="speak(this.parentNode.children[1].innerText.split('\\n')[0])">🔊</button>`:""}</div>`).join("");$("#log").scrollTop=1e9};
const sys=()=>{const l=LESSONS.find(x=>x.id==key());return`You are a friendly native English speaker helping a Persian (Farsi) speaker practice REAL spoken English. Learner CEFR level: ${l?l.level:S.level||"A2"}.
${l?`ROLEPLAY: You play "${l.partner}" in this scenario: ${l.scene} (topic: ${l.dialogue[0].en}). Stay in character, start the scene if the chat is empty, and keep the conversation moving with a question.`:"Have a casual chat about the learner's life, keep asking follow-up questions."}
Speak like a real native in casual everyday conversation: contractions, phrasal verbs, common idioms, natural fillers (you know, like, kinda, gonna) appropriate to the level. Keep each reply short (1-3 sentences).
After your in-character reply, if the learner's last message had errors or sounded textbook/unnatural, add a new line starting with "💡" and give ONE gentle correction in Persian, showing the more natural native version in English. If it was good, sometimes praise briefly in Persian. Never lecture.`};
const ask=async()=>{const m=chat();try{m.push({role:"assistant",content:await callAI(sys(),m.length?m.slice(-14):[{role:"user",content:"(start the scene)"}])});addXP(3)}catch(e){m.push({role:"assistant",content:"⚠️ "+e.message})}save();draw()};
const send=()=>{const t=$("#msg").value.trim();if(!t)return;chat().push({role:"user",content:t});$("#msg").value="";draw();ask()};
$("#send").onclick=send;$("#msg").onkeydown=e=>{if(e.key=="Enter")send()};$("#scen").onchange=()=>{sessionStorage.zyScen=key();draw();if(!chat().length&&key()!="0")ask()};
$("#clr").onclick=()=>{S.chats[key()]=[];save();draw();if(key()!="0")ask()};
$("#mic").onclick=()=>{if(!SR)return alert("تشخیص گفتار در این مرورگر در دسترس نیست؛ تایپ کنید.");$("#mic").textContent="⏺";listen(t=>{$("#mic").textContent="🎤";if(t){$("#msg").value=t;send()}})};
draw();if(!chat().length&&key()!="0")ask()},
settings(){app.innerHTML=`<div class=card><h3>🔈 لهجه‌ی صدا</h3><select id=acc><option value=en-US>آمریکایی (en-US)</option><option value=en-GB>بریتانیایی (en-GB)</option></select><p class=muted>صداها از سیستم‌عامل/مرورگر شما می‌آیند. ${SR?"تشخیص گفتار: ✅ در دسترس":"تشخیص گفتار: ❌ در این مرورگر نیست (حالت تایپی فعال می‌شود)"}</p></div>
<div class=card><h3>🤖 معلم هوش مصنوعی (اختیاری)</h3>سرویس:<select id=prov><option value=gemini>Google Gemini (پیش‌فرض)</option><option value=openai>سازگار با OpenAI</option></select>
<div id=gem><div class=tip>🔑 کلید رایگان Gemini را از <a href="https://aistudio.google.com/apikey" target=_blank rel=noopener>Google AI Studio</a> بگیرید (ورود با حساب گوگل ← Create API key). ⚠️ سرویس Gemini از داخل ایران مسدود است؛ ممکن است به VPN نیاز داشته باشید.</div>
کلید Gemini:<input id=gkey class=en type=password value="${esc(S.gkey)}" placeholder="AIza...">مدل:<input id=gmodel class=en list=gm value="${esc(S.gmodel)}"><datalist id=gm><option value=gemini-3.8-flash><option value=gemini-3.5-flash-lite><option value=gemini-flash-latest><option value=gemini-3.6-flash><option value=gemini-2.5-flash></datalist><p class=muted>gemini-3.8-flash: هوشمندتر · gemini-3.5-flash-lite: سریع‌تر و ارزان‌تر</p></div>
<div id=oai>آدرس API:<input id=api class=en value="${esc(S.api)}">مدل:<input id=model class=en value="${esc(S.model)}">کلید API:<input id=key class=en type=password value="${esc(S.key)}"></div>
<p class=muted>کلید فقط در همین مرورگر ذخیره و مستقیم به سرویس انتخاب‌شده فرستاده می‌شود.</p><button class="btn p" id=sv>ذخیره</button> <button class=btn id=tst>🧪 آزمایش اتصال</button><div id=tr></div></div>
<div class=card><h3>داده‌ها</h3><button class=btn id=ex>⬇️ خروجی پشتیبان</button><button class=btn id=rs>🗑️ پاک کردن همه‌ی پیشرفت</button><button class=btn onclick="go('placement')">🎯 آزمون تعیین سطح دوباره</button></div>`;
$("#acc").value=S.accent;$("#acc").onchange=e=>{S.accent=e.target.value;save()};
const pv=()=>{$("#gem").classList.toggle("hidden",$("#prov").value!="gemini");$("#oai").classList.toggle("hidden",$("#prov").value=="gemini")};$("#prov").value=S.provider;$("#prov").onchange=pv;pv();
const store=()=>{S.provider=$("#prov").value;S.gkey=$("#gkey").value.trim();S.gmodel=$("#gmodel").value.trim()||"gemini-3.8-flash";S.api=$("#api").value.trim();S.model=$("#model").value.trim();S.key=$("#key").value.trim();save()};
$("#sv").onclick=()=>{store();$("#tr").innerHTML="<b class=ok>✔ ذخیره شد</b>"};
$("#tst").onclick=async()=>{store();$("#tr").textContent="در حال آزمایش...";try{const r=await callAI("Reply with just: OK",[{role:"user",content:"ping"}]);$("#tr").innerHTML=`<b class=ok>✔ اتصال برقرار است:</b> <span class=en>${esc(r.slice(0,60))}</span>`}catch(e){$("#tr").innerHTML=`<b class=bad>${esc(e.message)}</b>`}};
$("#ex").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify({...S,key:""})],{type:"application/json"}));a.download="zabanyar-backup.json";a.click()};
$("#rs").onclick=()=>{if(confirm("همه‌ی پیشرفت پاک شود؟")){localStorage.removeItem("zy2");location.reload()}}}
};
/* ---------- AI providers ---------- */
const activeKey=()=>S.provider=="gemini"?S.gkey:S.key;
function aiErr(status,msg){msg=msg||"";const m=msg.toLowerCase();
if(status==400&&/api key|api_key/.test(m)||status==401||status==403&&/key/.test(m))return"کلید API نامعتبر است. کلید را از Google AI Studio دوباره کپی کنید.";
if(/location|region|country|not supported for your|user location/.test(m))return"سرویس در منطقه‌ی شما در دسترس نیست (Gemini از ایران مسدود است). با VPN امتحان کنید.";
if(status==429||/quota|rate|exhausted/.test(m))return"سهمیه یا محدودیت تعداد درخواست تمام شده. چند دقیقه صبر کنید یا مدل سبک‌تری (مثلاً gemini-3.5-flash-lite) انتخاب کنید.";
if(status==404||/not found|is not supported/.test(m))return"نام مدل پیدا نشد. در تنظیمات مدل دیگری انتخاب کنید.";
if(status==403)return"دسترسی رد شد (۴۰۳). ممکن است کلید محدود یا منطقه مسدود باشد.";
if(status>=500)return"سرور هوش مصنوعی موقتاً در دسترس نیست. دوباره تلاش کنید.";
return"خطا ("+status+"): "+msg}
async function callAI(system,msgs){if(!activeKey())throw new Error("ابتدا کلید API را در تنظیمات وارد کنید.");let r,j;
try{if(S.provider=="gemini"){r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(S.gmodel||"gemini-3.8-flash")}:generateContent`,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":S.gkey},
body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:(msgs[0]&&msgs[0].role!="user"?[{role:"user",content:"(start the scene)"},...msgs]:msgs).map(x=>({role:x.role=="user"?"user":"model",parts:[{text:x.content}]})),generationConfig:{temperature:.8,maxOutputTokens:1024}})})}
else r=await fetch(S.api.replace(/\/$/,"")+"/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+S.key},body:JSON.stringify({model:S.model,temperature:.8,messages:[{role:"system",content:system},...msgs]})});
j=await r.json().catch(()=>({}))}catch(e){throw new Error("اتصال به سرور برقرار نشد. اینترنت را بررسی کنید؛ Gemini از ایران بدون VPN در دسترس نیست.")}
if(!r.ok)throw new Error(aiErr(r.status,j.error?.message||j.error?.status));
if(S.provider=="gemini"){const c=j.candidates?.[0];if(!c){if(j.promptFeedback?.blockReason)throw new Error("پیام به دلیل سیاست‌های ایمنی مسدود شد.");throw new Error("پاسخ خالی از Gemini.")}
const t=(c.content?.parts||[]).filter(p=>!p.thought).map(p=>p.text||"").join("").trim();if(!t)throw new Error(c.finishReason=="SAFETY"?"پاسخ به دلیل سیاست‌های ایمنی مسدود شد.":"پاسخ خالی از Gemini ("+(c.finishReason||"?")+").");return t}
const t=j.choices?.[0]?.message?.content;if(!t)throw new Error("پاسخ خالی از سرور.");return t}
/* ---------- Lesson ---------- */
const STEPS=[["dlg","💬 گفتگو"],["chunks","🧩 عبارت‌ها"],["notes","📚 کتابی/محاوره"],["shadow","🔁 سایه‌روی"],["role","🎭 نقش‌آفرینی"],["listen","🎧 شنیداری"]];
function markStep(l,k){S.steps[l.id]=S.steps[l.id]||{};if(!S.steps[l.id][k]){S.steps[l.id][k]=1;addXP(5)}if(STEPS.every(([s])=>S.steps[l.id][s])&&!S.done[l.id]){S.done[l.id]=1;addXP(20);toast("🎉 سناریو کامل شد! +۲۰ XP")}save()}
function toast(t){const d=document.createElement("div");d.textContent=t;d.style.cssText="position:fixed;top:70px;left:50%;transform:translateX(-50%);background:#16a34a;color:#fff;padding:10px 18px;border-radius:12px;z-index:9;box-shadow:0 4px 12px #0003";document.body.appendChild(d);setTimeout(()=>d.remove(),2500)}
function lesson(id,tab="dlg"){const l=LESSONS.find(x=>x.id==id);if(window.speechSynthesis)speechSynthesis.cancel();
app.innerHTML=`<div class=card><button class="btn sm" onclick="go('map')">→ مسیر</button><h2>${l.icon} ${l.title} <span class=badge>${l.level}</span></h2><p class=muted>${l.scene} · طرف گفتگو: <b class=en>${l.partner}</b></p>
<div class=seg>${STEPS.map(([k,n])=>`<button data-t=${k} class="${k==tab?"on":""}">${n}${(S.steps[l.id]||{})[k]?" ✓":""}</button>`).join("")}</div></div><div id=pane></div>`;
$$("[data-t]").forEach(b=>b.onclick=()=>lesson(id,b.dataset.t));P[tab](l,$("#pane"));window.scrollTo(0,0)}
const nextBtn=(l,k)=>{const i=STEPS.findIndex(s=>s[0]==k);return i<STEPS.length-1?`<button class="btn p" onclick="markStep(LESSONS[${l.id-1}],'${k}');lesson(${l.id},'${STEPS[i+1][0]}')">ادامه: ${STEPS[i+1][1]} ←</button>`:`<button class="btn p" onclick="markStep(LESSONS[${l.id-1}],'${k}');go('map')">پایان ✓</button>`};
const P={
dlg(l,el){el.innerHTML=`<div class=card><button class="btn p" id=play>▶ پخش کل گفتگو</button><button class=btn id=tg>👁️ ترجمه</button>
${l.dialogue.map((d,i)=>`<div class="bubble ${d.me?"me":"them"}"><div class=who>${d.me?"شما":esc(l.partner)}</div><div class=en>${esc(d.en)} <button class="btn sm" data-i=${i}>🔊</button></div><div class="fa tr">${esc(d.fa)}</div></div>`).join("")}</div><div class=card>${nextBtn(l,"dlg")}</div>`;
$$("[data-i]").forEach(b=>b.onclick=()=>speak(l.dialogue[b.dataset.i].en));$("#play").onclick=()=>speakSeq(l.dialogue.map(d=>d.en));$("#tg").onclick=()=>$$(".tr").forEach(x=>x.classList.toggle("hidden"))},
chunks(l,el){el.innerHTML=`<div class=card><p class=muted>عبارت‌ها را تکه‌تکه (chunk) یاد بگیرید، نه کلمه‌به‌کلمه. همه‌ی این‌ها به فلش‌کارت‌های مرور اضافه می‌شوند.</p>${l.chunks.map((c,i)=>`<div class=chunk><div><div class=en><b>${esc(c.en)}</b></div><div class=muted>${esc(c.fa)}</div></div><button class="btn sm" data-i=${i}>🔊</button></div>`).join("")}</div>
<div class=card><h3>⚡ تمرین سریع معنی</h3><div id=qz></div></div><div class=card>${nextBtn(l,"chunks")}</div>`;
$$("[data-i]").forEach(b=>b.onclick=()=>speak(l.chunks[b.dataset.i].en));l.chunks.forEach((c,i)=>{if(!S.cards[l.id+"-"+i])S.cards[l.id+"-"+i]={ef:2.5,n:0,iv:0,due:Date.now()}});save();
const pool=l.chunks.slice().sort(()=>Math.random()-.5).slice(0,5);let k=0,score=0;const q=()=>{if(!$("#qz"))return;if(k>=pool.length){$("#qz").innerHTML=`<p>امتیاز: <b>${fa(score)}/${fa(pool.length)}</b></p>`;return}const c=pool[k],opts=[c,...l.chunks.filter(x=>x!==c).sort(()=>Math.random()-.5).slice(0,2)].sort(()=>Math.random()-.5);
$("#qz").innerHTML=`<p class="en big">${esc(c.en)}</p>${opts.map((o,j)=>`<button class=btn style="display:block;width:100%" data-o=${j}>${esc(o.fa)}</button>`).join("")}<div id=qf></div>`;
$$("[data-o]").forEach(b=>b.onclick=()=>{const ok=opts[b.dataset.o]===c;if(ok){score++;addXP(1)}$("#qf").innerHTML=ok?"<b class=ok>✔ درست</b>":`<b class=bad>✘ ${esc(c.fa)}</b>`;$$("[data-o]").forEach(x=>x.disabled=true);setTimeout(()=>{k++;q()},ok?600:1400)})};q()},
notes(l,el){el.innerHTML=`<div class=card><h3>📚 کتابی در برابر محاوره‌ای</h3>${l.notes.map(n=>`<div class=cmp><div class=book><small>❌ کتابی/غیرطبیعی</small><div class=en>${esc(n.book)}</div></div><div class=casual><small>✅ محاوره‌ای بومی</small><div class=en>${esc(n.casual)} <button class="btn sm" onclick="speak(this.parentNode.firstChild.textContent)">🔊</button></div></div></div><div class=tip>💡 ${esc(n.fa)}</div>`).join("")}</div>
<div class=card><h3>🗣️ گفتار پیوسته و تلفظ</h3>${l.sounds.map(s=>`<div class=chunk><div><b class=en>${esc(s.w)}</b> ← <b>«${esc(s.how)}»</b><div class=muted>${esc(s.fa)}</div></div><span><button class="btn sm" data-w="${esc(s.w)}" data-r=.6>🐢</button><button class="btn sm" data-w="${esc(s.w)}" data-r=1>🔊</button></span></div>`).join("")}
<div class=tip>نکته‌ی عمومی برای فارسی‌زبانان: صداهای th، تفاوت w و v، و بدون مصوت اضافه گفتن خوشه‌ها (street نه «اِستریت») را تمرین کنید.</div></div><div class=card>${nextBtn(l,"notes")}</div>`;
$$("[data-w]").forEach(b=>b.onclick=()=>speak(b.dataset.w,+b.dataset.r))},
shadow(l,el){let i=0,rate=1;const r=()=>{const d=l.dialogue[i];el.innerHTML=`<div class=card style=text-align:center><p class=muted>سایه‌روی: جمله را بشنوید و هم‌زمان یا بلافاصله با همان آهنگ تکرار کنید. (${fa(i+1)}/${fa(l.dialogue.length)})</p>
<div class=seg style="max-width:260px;margin:auto"><button data-r=.6 class="${rate<1?"on":""}">🐢 آهسته</button><button data-r=1 class="${rate==1?"on":""}">🐇 عادی</button></div>
<p class="en big">${esc(d.en)}</p><p class=muted>${esc(d.fa)}</p><button class="btn p" id=pl>🔊 پخش</button><button class=btn id=rec>🎤 تکرار و ارزیابی</button><div id=fb></div>
<div><button class=btn id=pv ${i==0?"disabled":""}>→ قبلی</button><button class=btn id=nx ${i==l.dialogue.length-1?"disabled":""}>بعدی ←</button></div></div><div class=card>${nextBtn(l,"shadow")}</div>`;
$$("[data-r]").forEach(b=>b.onclick=()=>{rate=+b.dataset.r;r();speak(d.en,rate)});$("#pl").onclick=()=>speak(d.en,rate);$("#pv").onclick=()=>{i--;r();speak(l.dialogue[i].en,rate)};$("#nx").onclick=()=>{i++;r();speak(l.dialogue[i].en,rate)};
$("#rec").onclick=()=>evalSpeech(d.en,$("#fb"))};r()},
role(l,el){let i=0,tot=0,n=0;const log=[];
const r=()=>{if(!el.isConnected)return;const d=l.dialogue[i];el.innerHTML=`<div class=card><p class=muted>🎭 شما نقش «شما» را بازی می‌کنید. جمله‌ی طرف مقابل پخش می‌شود؛ سپس جمله‌ی خود را بگویید (یا تایپ کنید). راهنمای فارسی کمکتان می‌کند.</p><div id=rl>${log.join("")}</div><div id=turn></div></div>`;
const turn=$("#turn");if(!d){const avg=n?Math.round(tot/n*100):0;turn.innerHTML=`<div class=tip>پایان نقش‌آفرینی! میانگین دقت: <b>${fa(avg)}٪</b></div><button class=btn onclick="lesson(${l.id},'role')">🔁 دوباره</button> ${nextBtn(l,"role")}`;return}
if(!d.me){log.push(`<div class="bubble them"><div class=who>${esc(l.partner)}</div><div class=en>${esc(d.en)}</div></div>`);speak(d.en,1,()=>{});i++;setTimeout(r,Math.min(4000,600+d.en.length*55));$("#rl").innerHTML=log.join("");return}
turn.innerHTML=`<div class="bubble me"><div class=who>نوبت شما — به انگلیسی بگویید:</div><div>«${esc(d.fa)}»</div><div class="en hidden" id=hint>${esc(d.en)}</div></div>
<button class="btn p" id=mic ${SR?"":"disabled"}>🎤 بگویید</button><button class=btn id=hb>💡 نمایش جمله</button><div style="display:flex;gap:6px"><input id=typ class=en placeholder="یا تایپ کنید..."><button class=btn id=ok>✓</button></div><div id=fb></div>`;
const done=(said)=>{const s=sim(said,d.en);tot+=s;n++;if(s>=.7)addXP(2);log.push(`<div class="bubble me"><div class=who>شما · <b class=${s>=.7?"ok":"bad"}>${fa(Math.round(s*100))}٪</b></div><div class=en>${esc(said)}</div>${s<1?`<div class="fa en">✅ ${esc(d.en)}</div>`:""}</div>`);i++;r()};
$("#hb").onclick=()=>{$("#hint").classList.toggle("hidden");speak(d.en,.8)};$("#ok").onclick=()=>{const t=$("#typ").value.trim();if(t)done(t)};$("#typ").onkeydown=e=>{if(e.key=="Enter")$("#ok").click()};
$("#mic").onclick=()=>{$("#fb").textContent="⏺ در حال گوش دادن...";listen(t=>{if(t)done(t);else $("#fb").textContent="صدایی دریافت نشد؛ دوباره امتحان کنید یا تایپ کنید."})}};r()},
listen(l,el){el.innerHTML=`<div class=card><h3>🎧 درک شنیداری</h3><p class=muted>متن پنهان است. گفتگو را گوش دهید (می‌توانید چند بار پخش کنید) و به سؤال‌ها جواب دهید.</p><button class="btn p" id=p1>▶ پخش عادی</button><button class=btn id=p2>🐢 پخش آهسته</button>
<div id=qs>${l.quiz.map((q,i)=>`<div style="margin-top:12px"><b>${fa(i+1)}. ${esc(q.q)}</b><div>${q.o.map((o,j)=>`<button class=btn data-q=${i} data-j=${j}>${esc(o)}</button>`).join("")}</div><div id=f${i}></div></div>`).join("")}</div>
<div style="margin-top:12px"><b>${fa(l.quiz.length+1)}. دیکته: جمله‌ای را که می‌شنوید بنویسید</b> <button class="btn sm" id=dp>🔊</button><input id=dc class=en><button class=btn id=dk>بررسی</button><div id=df></div></div>
<button class="btn sm" id=st>📜 نمایش متن</button><div id=tx class=hidden>${l.dialogue.map(d=>`<p class=en>${esc(d.en)}</p>`).join("")}</div></div><div class=card>${nextBtn(l,"listen")}</div>`;
const lines=l.dialogue.map(d=>d.en);$("#p1").onclick=()=>speakSeq(lines,1);$("#p2").onclick=()=>speakSeq(lines,.7);$("#st").onclick=()=>$("#tx").classList.toggle("hidden");
$$("[data-q]").forEach(b=>b.onclick=()=>{const q=l.quiz[b.dataset.q],ok=+b.dataset.j==q.a;$("#f"+b.dataset.q).innerHTML=ok?"<b class=ok>✔ درست</b>":`<b class=bad>✘ پاسخ: ${esc(q.o[q.a])}</b>`;if(ok)addXP(2);$$(`[data-q="${b.dataset.q}"]`).forEach(x=>x.disabled=true)});
const dl=l.dialogue.filter(d=>d.me)[0].en;$("#dp").onclick=()=>speak(dl,.85);$("#dk").onclick=()=>{const s=sim($("#dc").value,dl);$("#df").innerHTML=`<b class=${s>=.8?"ok":"bad"}>${fa(Math.round(s*100))}٪</b> — <span class=en>${esc(dl)}</span>`;if(s>=.8)addXP(2)}}
};
function evalSpeech(target,fb){if(!SR){fb.innerHTML=`<p class=muted>تشخیص گفتار در این مرورگر نیست (Chrome/Edge). بلند تکرار کنید و خودتان مقایسه کنید.</p>`;return}fb.textContent="⏺ در حال گوش دادن...";
listen(t=>{if(!t){fb.textContent="صدایی دریافت نشد.";return}const s=sim(t,target),tw=norm(target),said=norm(t);fb.innerHTML=`<p>شنیده شد: <span class=en>${esc(t)}</span></p><p class=en>${tw.map(w=>`<span class=${said.includes(w)?"ok":"bad"}>${esc(w)}</span>`).join(" ")}</p><b class=${s>=.7?"ok":"bad"}>${fa(Math.round(s*100))}٪ ${s>=.9?"عالی! 🌟":s>=.7?"خوب 👍":"دوباره امتحان کنید"}</b>`;if(s>=.7)addXP(2)})}
/* ---------- Boot ---------- */
function go(v){if(window.speechSynthesis)speechSynthesis.cancel();$$(".tabs button").forEach(b=>b.classList.toggle("on",b.dataset.v==v));V[v]();window.scrollTo(0,0)}
function theme(){document.documentElement.classList.toggle("dark",S.dark);$("#theme").textContent=S.dark?"☀️":"🌙"}
$("#theme").onclick=()=>{S.dark=!S.dark;save();theme()};
$$(".tabs button").forEach(b=>b.onclick=()=>go(b.dataset.v));
if(localStorage.getItem("zy2")===null&&window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches)S.dark=true;
stats();theme();go("home");
if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js").catch(()=>{});
