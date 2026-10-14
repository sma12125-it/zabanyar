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
