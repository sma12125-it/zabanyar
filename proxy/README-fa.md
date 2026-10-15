# سرور واسط (پروکسی) Gemini برای زبان‌یار

**چرا؟** ۱) کلید API در مرورگر/اپ کاربران دیده نمی‌شود. ۲) Gemini کاربران ایران را مسدود می‌کند؛ اگر سرور واسط **خارج از ایران** باشد، درخواست از آنجا به گوگل می‌رود و کاربر فقط به سرور شما وصل می‌شود.

> ⚠️ صادقانه: دامنه‌های `*.workers.dev` و برخی سرورهای خارجی ممکن است در ایران فیلتر باشند. برای دسترسی پایدار، یک **دامنه‌ی اختصاصی** روی Worker بگذارید یا از یک VPS خارجی با دامنه‌ی خودتان استفاده کنید. استفاده از این سرور باید با قوانین و شرایط استفاده‌ی گوگل سازگار باشد؛ مسئولیت آن با راه‌انداز سرور است.

برنامه فقط مسیر `/v1beta/models/<مدل‌های مجاز>:generateContent` را عبور می‌دهد، Origin را بررسی می‌کند، محدودیت نرخ ساده (پیش‌فرض ۳۰ درخواست در دقیقه برای هر IP) و سقف حجم ۴ مگابایت (برای صدا) دارد.

## روش ۱: Cloudflare Worker (رایگان برای مصرف کم)
```
cd proxy
npm i -g wrangler        # یا npx wrangler
wrangler login
wrangler secret put GEMINI_API_KEY     # کلید را از aistudio.google.com/apikey بچسبانید
# ALLOWED_ORIGINS را در wrangler.toml به دامنه‌ی سایت خودتان تغییر دهید (برای اپ اندروید https://localhost هم بماند)
wrangler deploy
```
آدرس خروجی (مثلاً `https://zabanyar-proxy.<you>.workers.dev`) را در اپ: تنظیمات ← سرویس: «Gemini از طریق سرور واسط» ← آدرس سرور واسط وارد کنید.

## روش ۲: Node.js روی VPS
```
GEMINI_API_KEY=AIza... ALLOWED_ORIGINS=https://zabanyar.example.com,https://localhost PORT=8787 node node-server.mjs
```
- بدون وابستگی (Node 18+). پشت nginx یا Caddy با HTTPS قرار دهید.
- اگر `STATIC_DIR=../dist` بدهید، خود اپ را هم سرو می‌کند (اپ و پروکسی روی یک دامنه).
- برای اجرای دائمی: `pm2 start node-server.mjs` یا یک سرویس systemd.

## نکات امنیتی
- `ALLOWED_ORIGINS="*"` نگذارید؛ وگرنه هر کسی می‌تواند از سهمیه‌ی شما استفاده کند.
- در Google AI Studio برای کلید محدودیت مصرف/بودجه تعیین کنید.
- محدودیت نرخ داخلی ساده است؛ برای مقیاس بالا از Cloudflare Rate Limiting یا احراز هویت کاربر استفاده کنید.


## نسخه ۶: صدای طبیعی و گفتگوی زنده
هر دو نمونه (Cloudflare Worker و Node) حالا این مسیرها را هم دارند:
- `POST /v1beta/interactions` — Gemini TTS (مدل داخل بدنه باید در فهرست مجاز باشد؛ حالت stream بسته است).
- `WS /ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent` — Gemini Live؛ برنامه بدون کلید وصل می‌شود و سرور کلید را اضافه و داده‌ها را دوطرفه عبور می‌دهد. بررسی Origin انجام می‌شود.
- `POST /live-token` — (اختیاری) ساخت توکن موقت یک‌بارمصرف ۳۰ دقیقه‌ای (`/v1beta/auth_tokens`) قفل‌شده روی مدل Live، برای اتصال مستقیم برنامه به Google (فقط وقتی Google در دسترس کاربر است؛ در ایران همان عبور WebSocket از سرور واسط بهتر است).
- فهرست پیش‌فرض مدل‌های مجاز: `gemini-3.8-flash, gemini-3.5-flash-lite, gemini-flash-latest, gemini-3.8-flash-tts, gemini-3.8-flash-lite-tts, gemini-3.8-live` (با `ALLOWED_MODELS` قابل تغییر). محدودیت پیش‌فرض: ۶۰ درخواست در دقیقه برای هر IP.
- اگر پشت nginx هستید، برای WebSocket این‌ها را اضافه کنید: `proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; proxy_read_timeout 3600s;`

## سرویس‌های دیگر از طریق پراکسی (نسخه ۸)
همه‌ی سرویس‌های OpenAI-سازگار (Groq، OpenRouter، Mistral، Cerebras، xAI) خودشان CORS مرورگر را مجاز کرده‌اند، پس معمولاً پراکسی لازم نیست. پراکسی فقط وقتی لازم است که سرویس از ایران مسدود باشد یا نخواهید کلید روی گوشی کاربر باشد.
- کلیدها را فقط روی سرور بگذارید: `GROQ_API_KEY`، `OPENROUTER_API_KEY`، `MISTRAL_API_KEY`، `CEREBRAS_API_KEY`، `XAI_API_KEY` (در Cloudflare: `wrangler secret put GROQ_API_KEY` و …).
- مسیرها: `POST /p/<سرویس>/chat/completions`، `/p/groq/audio/transcriptions` (Whisper) و `/p/groq/audio/speech` (صدای Orpheus). فقط سرویس‌هایی که کلیدشان روی سرور تنظیم شده پاسخ می‌دهند.
- در برنامه: تنظیمات ← سرویس‌های هوش مصنوعی ← هر سرویس ← «از طریق پراکسی» را تیک بزنید (کلید را خالی بگذارید).
- `GEMINI_API_KEY` در نسخه‌ی Node اکنون اختیاری است (اگر فقط Groq و … را می‌خواهید).
- فهرست پیش‌فرض مدل‌های Gemini مجاز اکنون `gemini-3.1-flash-lite` (پیش‌فرض ارزان معلم) را هم دارد.
