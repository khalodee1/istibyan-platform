# منصة استبيان — دليل النشر السريع

## المتطلّبات
- حساب GitHub
- حساب Supabase (https://supabase.com)
- حساب Resend (https://resend.com)
- حساب Vercel (https://vercel.com)

## الخطوات السريعة

1. **ارفع هذا الكود لمستودع GitHub خاص**
2. **في Supabase**:
   - أنشئ مشروعاً جديداً
   - انسخ Connection String (pooling) ← `DATABASE_URL`
   - انسخ Direct connection ← `DIRECT_URL`
3. **في Resend**:
   - أنشئ حساباً واحصل على API Key ← `RESEND_API_KEY`
   - أضف نطاقك وتحقّق منه (أو استخدم نطاق Resend التجريبي للبداية)
4. **في Vercel**:
   - New Project → Import من GitHub
   - أضف متغيّرات البيئة:
     - DATABASE_URL
     - DIRECT_URL
     - NEXTAUTH_SECRET (توليد عبر: openssl rand -base64 32)
     - NEXTAUTH_URL = https://your-app.vercel.app
     - RESEND_API_KEY
   - Build Command: `bun run schema:prod && bun run db:push && bun run db:seed && bun run build`
5. **بعد النشر**: سجّل الدخول بـ admin@istibyan.gov.sa / Admin@123456
   - ⚠️ غيّر كلمة المرور فوراً

انظر DEPLOYMENT.md للتفاصيل الكاملة.
