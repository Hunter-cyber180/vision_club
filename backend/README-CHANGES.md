# ویژن آکادمی — بکند (تکمیل‌شده)

این فایل خلاصه‌ی همه‌ی تغییراتیه که روی بکند اعمال شد: باگ‌های کد اولیه، فیچرهای جدیدی که ساخته شد، و راهنمای راه‌اندازی.

## ⚠️ قبل از هر چیز

این محیطی که کد توش نوشته شده **به اینترنت دسترسی نداشت**، پس نتونستم:
- `npm install` بزنم و پکیج‌ها رو نصب کنم
- واقعاً پروژه رو با یک دیتابیس MySQL و Redis واقعی اجرا و تست کنم

همه‌ی فایل‌ها با `node -c` از نظر **syntax** چک شدن (بدون خطا) ولی حتماً بعد از دریافت،
لوکال با دیتابیس واقعی تست کنید. اگه جایی خطای runtime دیدید (مثلاً یک association یا نام فیلد)،
احتمالاً یه تایپوی کوچیکه که راحت پیدا و فیکس می‌شه.

## راه‌اندازی

```bash
cd vision-backend
npm install
cp .env.example .env   # (یا خود .env موجود رو ویرایش کنید)
```

سپس مقادیر زیر رو توی `.env` با دیتابیس/ردیس واقعیتون پر کنید:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `REDIS_URI` (اگه سرویس ابری دارید) یا `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`
- `ZARINPAL_MERCHANT_ID` واقعی خودتون

```bash
npm run start   # nodemon server.js
```

با اجرای `server.js`:
1. اتصال به دیتابیس چک می‌شه
2. در حالت development، `sequelize.sync({ alter: true })` جدول‌ها رو خودکار می‌سازه/آپدیت می‌کنه
   (⚠️ برای production این خط رو حذف کنید و از migration واقعی استفاده کنید)
3. سرور HTTP + Socket.io بالا میاد
4. همه‌ی cron jobها فعال می‌شن

## معماری کلی

```
configs.js          -> تک منبع همه‌ی env varها
db.js                -> instance سکوئلایز (خام)
models/index.js       -> همه‌ی مدل‌ها init می‌شن + همه‌ی association ها اینجا تعریف شده
redis.js              -> اتصال Redis (برای رفرش‌توکن‌ها)
app.js                -> تعریف express app + همه‌ی route ها
server.js              -> راه‌اندازی HTTP server + Socket.io + دیتابیس + cron jobها
sockets/index.js        -> منطق Socket.io (احراز هویت، اتاق‌های چت)
jobs/                  -> ۴ تا cron job (پایین توضیح داده شده)
services/               -> منطق cron jobها (تا تست‌پذیر باشن)
```

## نقش‌ها (Role) — دقت کنید این دو مفهوم فرق دارن

1. **نوع حساب (برای JWT)**: `user` / `consultant` / `admin` — این ۳ تا جدول جدان (Users, Consultants, Admins)
2. **فیلد `role` روی جدول Users**: `user` / `student` —
   - هر کسی که ثبت‌نام می‌کنه پیش‌فرض `role = "user"` می‌گیره → پنل کاربر عادی
   - وقتی یه **مشاور** او رو با `POST /consultant/students/:userId` به لیست دانش‌آموزاش اضافه کنه،
     `role` به `"student"` تغییر می‌کنه → پنل دانش‌آموزی باز می‌شه
   - ادمین هم می‌تونه دستی این کارو با `PATCH /admin/:userId/role` انجام بده

فرانت باید بعد از لاگین `GET /auth/me` رو صدا بزنه؛ خروجی `panel: "user" | "student"` مشخص می‌کنه کدوم پنل رو نشون بده.

## ۴ تا نیازمندی اصلی که خواسته بودید

### ۱. چک شهریه ماهانه
- `jobs/tuitionPaymentJob.js` هر روز (پیش‌فرض ۰۰:۱۰، قابل تنظیم با `TUITION_PAYMENT_CRON`) اجرا می‌شه
- برای ماه شمسی جاری، اگه دانش‌آموزی رکورد شهریه نداشته باشه، یک رکورد `unpaid` می‌سازه
- مشاور با `PATCH /consultant/tuition-payments/:userId` وضعیت رو به `paid` تغییر می‌ده

### ۲. چک گزارش کار (هر ۲۴ ساعت)
- `jobs/dailyReportCheckJob.js` هر روز (پیش‌فرض ۲۱:۰۰) چک می‌کنه کدوم دانش‌آموزها گزارش امروز رو نفرستادن
- نتیجه توی `missed_daily_reports` ذخیره می‌شه، مشاور با `GET /pannel/missed-reports` می‌بینتش

### ۳. آزمون ماهانه + فرم تحلیل آزمون
- ادمین با `POST /admin/exam-schedules` تاریخ برگزاری آزمون رو ثبت می‌کنه (`ExamSchedule`)
- دانش‌آموز با `POST /user-panel/analysis-exams` فرم تحلیل رو می‌فرسته (می‌تونه `exam_schedule_id` رو هم بفرسته)
- `jobs/analysisExamCheckJob.js` (پیش‌فرض هر ساعت) چک می‌کنه: اگه از تاریخ آزمون حداقل یک روز گذشته
  ولی دانش‌آموزی برای اون آزمون فرم نفرستاده، رکورد `missed_analysis_exams` می‌سازه
- مشاور با `GET /pannel/missed-analysis-exams` می‌بینتش

### ۴. role کاربر تازه‌ثبت‌نام‌شده
بالا توضیح داده شد (بخش «نقش‌ها»).

## Redis
`redis.js` بازنویسی شد — از `REDIS_URI` کامل یا `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD` جدا پشتیبانی می‌کنه.
فقط برای ذخیره‌ی هش رفرش‌توکن‌ها استفاده می‌شه (`helpers/storeRefreshToken.js`).

## چت (کاملاً جدید)
- مدل‌های `Conversation` و `Message` (polymorphic: هر گفتگو بین هر ترکیبی از user/consultant/admin)
- `controllers/chat.js` + `routes/chat.js`:
  - `GET /chat/conversations` — لیست گفتگوهای من
  - `POST /chat/support` — شروع/باز کردن گفتگو با پشتیبانی سایت
  - `GET /chat/conversations/:id/messages`
  - `POST /chat/conversations/:id/messages` (`type: "text"|"image"`)
  - `DELETE /chat/messages/:messageId`
- **دکمه «چت با دانش‌آموز»**: `POST /consultant/students/:userId/chat` — یک `Conversation` بین مشاور و اون دانش‌آموز
  می‌سازه (یا اگه از قبل بوده، همونو برمی‌گردونه) و به لیست چت‌های مشاور اضافه می‌شه.
- **Socket.io** (`sockets/index.js`): فرانت با `io(URL, { auth: { token: accessToken } })` وصل می‌شه،
  بعد `socket.emit("joinConversation", conversationId)` برای هر گفتگویی که باز می‌کنه.
  ایونت‌های دریافتی: `newMessage`, `messageDeleted`, `newConversationActivity`, `typing`.

⚠️ توجه: فرانتی که فرستادید (`chat.js`, `chat.html`) کاملاً mock/دمو بود و به هیچ API واقعی وصل نبود.
من فقط بکندش رو کامل کردم؛ وصل کردن فرانت به این APIها (جایگزین کردن `CONVOS` هاردکد با فچ واقعی) کار جداییه که انجام ندادم چون فقط بکند خواسته بودید.

## پشتیبانی سایت
`GET /support` — همیشه یک نفر ثابت (`SUPPORT_PHONE_NUMBER` در `.env`، پیش‌فرض `09165613709`) برمی‌گردونه.
برای پیاده‌سازی «پشتیبانی فقط یک ادمینه»، همون یک ادمین (اولین ادمین ثبت‌شده در جدول) به عنوان طرف چت پشتیبانی در نظر گرفته می‌شه.

## باگ‌های مهمی که در کد اصلی پیدا و فیکس شد
- مدل `Option` اصلاً وجود نداشت (۴ کنترلر بهش نیاز داشتن)
- `models/index.js` مرکزی برای association ها اصلاً نبود
- تداخل نام مدل/جدول: `Admin` روی جدول `categories`! `Quiz`/`UserQuiz` هر دو `modelName: "Quize"`، `Course`/`Workshop` هر دو روی جدول `courses`
- `user.js`: تایپوی `INTEGER.UNSIGNEDM`، طول فیلد پسورد (۵۰) برای هش bcrypt (۶۰+ کاراکتر) کافی نبود، فیلد `consultant_id` و `role` پیش‌فرض تعریف نشده بودن
- تمام env varها با casing اشتباه خونده می‌شدن (`process.env.accessTokenSecretKey` در حالی که در `.env` بزرگ‌حروف بود)
- `helpers/storeRefreshToken.js` به‌جای `../redis`، خودِ پوشه‌ی بالاتر (`../`) رو ایمپورت می‌کرد
- `controllers/auth.js`: فیلد `password` به‌جای `user_password` ست می‌شد (register اصلاً کار نمی‌کرد) و role همیشه `"student"` بود
- بسیاری از کنترلرهای `user_panel/*` مسیر importشون اشتباه بود (`../models` به‌جای `../../models`)
- `userQuizzes.js`: `include: [{ where: QuizModel }]` باید `model: QuizModel` باشه؛ باگ `data: workshop` به‌جای `data: userQuiz`
- `userWorkshops.js` مدل: فیلد `course_id` به‌جای `workshop_id`
- `checkout.js`: `newCheckout._id` (Mongo-style) به‌جای `.id`؛ `zarinpal.js` سرویس پارامترهاش با کنترلر ناهم‌خوان بود
- `quizStatusService.js`: `sequelize.literal` صدا زده می‌شد بدون import کردن `sequelize`
- middleware ای که وضعیت آزمون‌ها رو **روی هر ریکوئست** آپدیت می‌کرد (سنگین) حذف شد؛ الان فقط cron هر دقیقه این کارو می‌کنه
- و ده‌ها باگ کوچیک‌تر (`res` به‌جای `response`، شرط‌های همیشه-true، و ...)

## چیزهایی که خارج از دامنه‌ی درخواست موند (به دلیل نبود زمان/دسترسی)
- اتصال فرانت به APIهای واقعی (فرانت فعلی همه‌جا mock/دمو هست، نه فقط چت)
- migration های واقعی سکوئلایز (فعلاً `sync({ alter: true })` در dev استفاده می‌شه)
- تست‌های خودکار (چون امکان اجرای واقعی نبود)
