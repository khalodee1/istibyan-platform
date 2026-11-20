# دليل نشر منصة استبيان للإنتاج

هذا الدليل يشرح كيفية نشر المنصة على **Vercel + Supabase (PostgreSQL) + Resend** في خطوات واضحة وقابلة للتنفيذ.

---

## البنية الموصى بها للإنتاج

```
┌────────────────────────────────────────────────────────────┐
│  Vercel (Next.js 16 + Standalone build)                    │
│  - استضافة التطبيق                                          │
│  - HTTPS تلقائي                                             │
│  - Edge Network CDN                                         │
└────────────────────────────────────────────────────────────┘
              │
              ├──→ PostgreSQL (Supabase)
              │    - قاعدة البيانات الأساسية
              │    - نسخ احتياطي تلقائي يومي
              │    - اتصال مباشر + pooled
              │
              └──→ Resend (بريد إلكتروني)
                   - إرسال دعوات الاستبيان
                   - إشعارات بريدية
```

---

## المرحلة 1: إعداد قاعدة البيانات (Supabase)

### 1.1 إنشاء مشروع Supabase
1. اذهب إلى https://supabase.com وقم بإنشاء حساب
2. أنشئ مشروعاً جديداً (New Project)
3. اختر اسماً وكلمة مرور قوية لقاعدة البيانات
4. اختر المنطقة الأقرب (Europe West أو US East حسب جمهورك)
5. انتظر حتى يكتمل الإعداد (~2 دقيقة)

### 1.2 الحصول على رابط الاتصال
1. في لوحة Supabase: Project Settings → Database
2. انسخ **Connection string** (الـ pooling):
   ```
   postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
3. انسخ أيضاً **Direct connection** (للـ migrations):
   ```
   postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
   ```

### 1.3 تبديل schema Prisma إلى PostgreSQL
```bash
# من جذر المشروع
./scripts/switch-schema.sh prod

# هذا سيستبدل prisma/schema.prisma بـ prisma/schema.production.prisma
```

### 1.4 إنشاء قاعدة البيانات (push schema)
```bash
# أنشئ ملف .env.production (انظر .env.production.example)
# ثم شغّل:
DATABASE_URL="postgresql://..." DIRECT_URL="postgresql://..." bun run db:push
```

---

## المرحلة 2: إعداد البريد (Resend)

### 2.1 إنشاء حساب Resend
1. اذهب إلى https://resend.com
2. سجّل بحساب GitHub أو بريدك
3. أضف نطاقك (Domains → Add Domain) واتبع تعليمات DNS
4. بعد التحقّق، احصل على API Key من https://resend.com/api-keys

### 2.2 إعداد متغيّرات البريد
في `.env.production`:
```bash
RESEND_API_KEY="re_xxxxxxxxxxxxx"
EMAIL_FROM_NAME="منصة استبيان"
EMAIL_FROM_ADDRESS="noreply@your-domain.com"
```

---

## المرحلة 3: النشر على Vercel

### 3.1 إعداد المشروع على Vercel
1. اذهب إلى https://vercel.com وسجّل دخولك
2. New Project → استورد مستودع Git الخاص بك
3. اترك إعدادات البناء الافتراضية (Vercel يكتشف Next.js تلقائياً)
4. **متغيّرات البيئة** (Environment Variables) — أضف التالي:

| المتغيّر | القيمة |
|---|---|
| `DATABASE_URL` | رابط Supabase Pooling (مع `?pgbouncer=true&connection_limit=1`) |
| `DIRECT_URL` | رابط Supabase المباشر (للـ migrations) |
| `NEXTAUTH_SECRET` | توليد عبر `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` (أو نطاقك المخصّص) |
| `RESEND_API_KEY` | مفتاح Resend |
| `EMAIL_FROM_NAME` | `منصة استبيان` |
| `EMAIL_FROM_ADDRESS` | `noreply@your-domain.com` |

### 3.2 إعداد Build Command
في Vercel project settings → Build & Development Settings:
- **Build Command**: `bun run db:push && bun run db:seed && bun run build`
  - هذا يدفع الـ schema لـ PostgreSQL ثم يبذره ثم يبني

### 3.3 النشر الأول
1. اضغط Deploy
2. انتظر حتى يكتمل البناء (~3-5 دقائق)
3. اختبر: https://your-project.vercel.app/login
4. سجّل الدخول بـ `admin@istibyan.gov.sa` / `Admin@123456`
5. **غيّر كلمة المرور فوراً** من صفحة المستخدم

---

## المرحلة 4: نطاق مخصّص (اختياري لكن موصى به)

1. في Vercel: Project Settings → Domains
2. أضف نطاقك (مثلاً `istibyan.your-domain.gov.sa`)
3. أضف سجلّ DNS CNAME يشير إلى `cname.vercel-dns.com`
4. انتظر حتى يتأكّد Vercel من النطاق
5. حدّث `NEXTAUTH_URL` ليتطابق مع النطاق الجديد

---

## المرحلة 5: التحقّق من النشر

### 5.1 اختبار التطبيق
- [ ] تسجيل الدخول يعمل
- [ ] إنشاء قسم جديد يعمل
- [ ] إنشاء استبيان يعمل
- [ ] إرسال دعوة يُنشئ دعوة في قاعدة البيانات
- [ ] فتح رابط دعوة `/s/[token]` يعمل
- [ ] تقديم رد يحفظ البيانات ويوجّه لصفحة الشكر
- [ ] لوحة التحليلات تعرض المخططات

### 5.2 اختبار الأمان
- [ ] الـ headers الأمان تُرسل:
  ```bash
  curl -I https://your-domain.com | grep -E "X-Frame|Strict-Transport|X-Content"
  ```
- [ ] Rate limiting يعمل (إرسال 11 رداً في دقيقة → الرد 11 يجب أن يرجع 429)
- [ ] كلمات المرور مشفّرة بـ bcrypt (تحقق في قاعدة البيانات: `SELECT email, password_hash FROM "User" LIMIT 5` — يجب أن تبدأ بـ `$2b$`)

### 5.3 نسخ احتياطي
- Supabase يأخذ نسخاً احتياطية يومية تلقائياً في الخطة المجانية
- للنسخ اليدوي: Supabase Dashboard → Database → Backups → Create backup

---

## استكشاف الأخطاء الشائعة

### خطأ: `PrismaClientInitializationError`
- تحقّق أنّ `DATABASE_URL` صحيح ويتصل بـ Supabase
- تحقّق أنّ `DIRECT_URL` موجود للـ migrations (في pgbouncer mode)

### خطأ: `Email not sent`
- تحقّق أنّ `RESEND_API_KEY` صحيح
- تحقّق أنّ النطاق مُوثّق في Resend (Domains → Verified)
- راجع سجلّات Vercel: Functions → Logs

### خطأ: `NEXTAUTH_SECRET missing`
- أضف `NEXTAUTH_SECRET` كمتغيّر بيئة في Vercel
- أعد نشر المشروع بعد الإضافة

### خطأ: `Database connection limit reached`
- استخدم Pooling URL (منفذ 6543) بدلاً من Direct URL للـ app
- أضف `?pgbouncer=true&connection_limit=1` لـ `DATABASE_URL`

---

## خطوات ما بعد النشر (موصى بها)

1. **تغيير كلمة مرور الـ admin** فوراً
2. **إضافة مستخدمين حقيقيين** عبر لوحة مدير النظام
3. **إنشاء قسمك الأول** الفعلي
4. **اختبار دعوة حقيقية** لمستخدم تجريبي ببريد حقيقي
5. **إعداد تنبيهات Vercel** للوقت الميت (Uptime monitoring)
6. **ربط Sentry** لتتبّع أخطاء الإنتاج (اختياري)

---

## التكلفة المتوقّعة

| الخدمة | الخطة المجانية | الاستخدام المتوقّع |
|---|---|---|
| Vercel | Hobby (مجاني) | كافٍ حتى ~100 ألف زيارة شهرياً |
| Supabase | Free (مجاني) | 500MB DB + 50K MAU |
| Resend | Free (مجاني) | 100 إيميل/يوم، 3000/شهر |

**الخلاصة**: يمكن تشغيل المنصة مجاناً حتى ~3000 دعوة بريدية شهرياً، ثم الترقية عند الحاجة.

---

## تحديث المنصة بعد النشر

عند تحديث الكود:
1. ا push التغييرات إلى Git
2. Vercel سيبني وينشر تلقائياً
3. إذا كانت هناك تغييرات على schema:
   ```bash
   bun run db:push  # يدفع التغييرات لقاعدة البيانات
   ```
4. تحقّق من السجلّات في Vercel Dashboard → Functions → Logs
