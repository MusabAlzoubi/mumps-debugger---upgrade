# دليل رفع الإضافة كـ VS Code Extension واختبار التحديثات الحالية

> هذا الملف يشرح عمليًا كيف تجهّز هذا الريبو للنشر كإضافة VS Code باسمك، وكيف تختبر التحديثات الحالية: الستاندرد، القوالب، أوامر الديبغ المباشر، وميزة attach.

> لخطة تفصيلية تجعل أوامر Direct Debug (`ZBREAK`, `ZSTEP`, `ZWRITE`, `$ZPOSITION`, `$ZSTEP`) أقرب لتجربة Xdebug في PHP، راجع: [XDEBUG_LIKE_DIRECT_DEBUG_PLAN_AR.md](./XDEBUG_LIKE_DIRECT_DEBUG_PLAN_AR.md).

> للدليل العملي التفصيلي لاختبار وتجريب الإضافة بعد كل تعديل، راجع: [VS_CODE_EXTENSION_TESTING_STEPS_AR.md](./VS_CODE_EXTENSION_TESTING_STEPS_AR.md).

---

## 1) قبل النشر باسمك

بما أن المشروع مبني على مشروع مفتوح المصدر، اتبع هذه الخطوات قبل نشر نسخة جديدة باسمك:

1. **راجع الرخصة القانونية للمشروع الأصلي** قبل النشر. إذا لم يكن هناك ملف `LICENSE` واضح في الجذر، أضفه أو احتفظ برخصة المصدر الأصلي حسب شروطه.
2. **احتفظ بحقوق المؤلف الأصلي** في ملف `NOTICE` أو `README` إذا كانت الرخصة تتطلب ذلك.
3. **غيّر هوية الإضافة** في `package.json` حتى لا تتعارض مع الإضافة الأصلية:
   - `name`
   - `displayName`
   - `publisher`
   - `description`
   - `repository.url`
   - `bugs.url`
   - `icon` لاحقًا إذا أردت علامة مختلفة؛ لا تضف ملفات binary داخل PR إذا كانت المنصة لا تدعمها.
4. **حدّث التوثيق** ليذكر أن النسخة مبنية على المشروع الأصلي مع توضيح التعديلات الجديدة.

---

## 2) تجهيز بيئة التطوير

من جذر الريبو:

```bash
npm install
npm run compile
npm run build
```

شرح الأوامر:

- `npm install`: تثبيت dependencies.
- `npm run compile`: تشغيل TypeScript compiler على `src`.
- `npm run build`: بناء bundle الإنتاج عبر webpack وتحديث `dist/extension.js`.

---

## 3) اختبار الإضافة محليًا داخل VS Code

### الطريقة الأولى: Extension Development Host

1. افتح الريبو في VS Code.
2. اضغط `F5` أو شغّل launch configuration باسم `Extension`.
3. سيفتح VS Code نافذة جديدة باسم **Extension Development Host**.
4. افتح ملف MUMPS مثل `.m` داخل النافذة الجديدة.
5. جرّب الأوامر من Command Palette:
   - `Insert Routine Header Template (MUMPS)`
   - `Insert Patch Change Block Template (MUMPS)`
   - `MUMPS: ZSTEP`
   - `MUMPS: ZWRITE`
   - `MUMPS: Send Raw Debug Command...`

> ملاحظة: أوامر `Z*` تحتاج جلسة debug نشطة من نوع `mumps` حتى يتم إرسالها إلى MDEBUG.

### الطريقة الثانية: تثبيت VSIX محليًا

```bash
npm run package
code --install-extension *.vsix
```

إذا أردت إعادة التثبيت بعد تعديل جديد:

```bash
code --uninstall-extension <publisher>.<extension-name>
code --install-extension *.vsix
```

القيم `<publisher>` و`<extension-name>` تأتي من `publisher` و`name` داخل `package.json`.

---

## 4) اختبار التحديثات الحالية

## 4.1 اختبار قوالب VistA/UJO

### Routine Header Template

1. افتح ملف `.m`.
2. نفّذ الأمر:
   - `Insert Routine Header Template (MUMPS)`
3. أدخل:
   - namespace مثل `UJO`
   - initials مثل `ABC`
   - description
4. يجب أن يتم إدراج header في أعلى الملف.

### Patch Change Block Template

1. ضع المؤشر في المكان الذي تريد إدراج block فيه.
2. نفّذ الأمر:
   - `Insert Patch Change Block Template (MUMPS)`
3. أدخل:
   - patch مثل `UJO*2.0*30`
   - initials
   - fix type
   - reason
   - scope اختياري
4. يجب إدراج block يحتوي:
   - بداية التغيير
   - TODO لتعليق الكود الأصلي
   - TODO لإضافة الكود الجديد
   - نهاية التغيير

---

## 4.2 اختبار Standards Diagnostics

افتح VS Code Settings JSON وأضف مثالًا:

```json
{
  "mumps.standards.profile": "ujo",
  "mumps.standards.enforceRoutineHeader": true,
  "mumps.standards.namespacePrefixes": ["UJO", "UJOM", "UJOA"],
  "mumps.standards.enforceLabelLength": true,
  "mumps.standards.enforceLocalVariableNames": true,
  "mumps.standards.enforceTmpGlobalSubscript": true,
  "mumps.standards.enforcePercentGlobalProtection": true
}
```

ثم جرّب ملف MUMPS يحتوي مخالفات مثل:

```mumps
TOOLONGLABEL ; missing standard ;;
 SET lowercaseVariable=1
 SET VERYLONGLOCALVARIABLE=1
 SET ^TMP("BAD",1)=1
 SET ^%BAD(1)=1
```

المتوقع:

- تحذير على label أطول من 8 أحرف.
- تنبيه على local variable يحتوي lowercase.
- تحذير على local variable أطول من 16 حرفًا.
- تحذير على `^TMP` إذا لم يكن scoped بـ `$J` أو namespace ثم `$J`.
- تحذير على عمليات `SET/KILL/READ/MERGE` ضد `^%` globals.

---

## 4.3 اختبار Launch Debug

مثال `launch.json` للتشغيل العادي:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "mumps",
      "request": "launch",
      "name": "Debug active File",
      "program": "${file}",
      "stopOnEntry": true,
      "hostname": "localhost",
      "localRoutinesPath": "/home/vista/EHR/r/",
      "port": 9000
    }
  ]
}
```

المتطلبات:

- وجود GT.M/YottaDB.
- وجود `MDEBUG.m` داخل routine path المناسب.
- ضبط `localRoutinesPath` حسب بيئتك.

---

## 4.4 اختبار Attach Debug

مثال `launch.json` للـ attach:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "mumps",
      "request": "attach",
      "name": "Attach to MDEBUG",
      "hostname": "localhost",
      "port": 9000,
      "localRoutinesPath": "/home/vista/EHR/r/",
      "stopOnEntry": false
    }
  ]
}
```

المتوقع:

- يجب أن يكون MDEBUG listener يعمل مسبقًا على نفس `host:port`.
- عند نجاح الاتصال تظهر رسالة attach.
- بعدها يمكن تجربة أوامر direct debug.

---

## 4.5 اختبار أوامر Direct Debug

بعد تشغيل جلسة debug من نوع `mumps` أو attach إلى MDEBUG، لا تعتمد على Command Palette فقط؛ جرّب المسارات الأوضح التالية:

1. افتح Run and Debug sidebar وتأكد من ظهور لوحة `MUMPS Direct Debug`.
2. من اللوحة اضغط `Direct Debug Setup` أو زر Status Bar المختصر `MDBG`.
3. اضغط `Smoke Test` أو زر Status Bar المختصر `TEST` لتجربة `$ZPOSITION`, `ZPRINT @$ZPOSITION`, `ZWRITE`, و`ZSHOW`.
4. جرّب أزرار التنفيذ مثل `Continue`, `Step Over`, `Step Into`, و`Step Out`.
5. راقب قناة `MUMPS Debug` Output Channel للتأكد من ظهور الأوامر ونتائجها.
6. جرّب عناصر اللوحة `Run Raw Direct Command`, `Open Debug Output`, `Copy Last Output`, و`Clear Debug Output` للتأكد من إدارة النتائج بدون Command Palette.

الأوامر نفسها لا تزال متاحة من Command Palette عند الحاجة:

- `MUMPS: ZSTEP`
- `MUMPS: ZSTEP INTO`
- `MUMPS: ZSTEP OUTOF`
- `MUMPS: ZCONTINUE`
- `MUMPS: ZWRITE`
- `MUMPS: ZSHOW`
- `MUMPS: ZBREAK...`
- `MUMPS: ZPRINT @$ZPOSITION`
- `MUMPS: Direct Debug Setup`
- `MUMPS: Direct Debug Smoke Test`
- `MUMPS: Send Raw Debug Command...`

أمثلة raw commands:

```text
ZWRITE
ZSHOW
ZPRINT @$ZPOSITION
ZBREAK TEST+3^KJOTEST
```

---

## 5) تجهيز النشر على Marketplace

### 5.1 تعديل هوية الإضافة

تم اختيار هوية مقترحة جديدة لا تتعارض مع الإضافة الأصلية:

```json
{
  "name": "vista-mumps-toolkit",
  "displayName": "VistA MUMPS Toolkit",
  "publisher": "MusabAlzoubi",
  "description": "VistA-focused MUMPS/GT.M debugger, standards diagnostics, templates, and direct debug commands for VS Code.",
  "repository": {
    "type": "git",
    "url": "https://github.com/MusabAlzoubi/mumps-debugger---upgrade.git"
  },
  "bugs": {
    "url": "https://github.com/MusabAlzoubi/mumps-debugger---upgrade/issues"
  }
}
```

> تم ضبط `publisher` وروابط GitHub على حسابك `MusabAlzoubi`. تأكد فقط أن Publisher ID نفسه موجود في Marketplace قبل النشر.
> ملاحظة مهمة حول الملفات الثنائية: تم حذف أيقونة PNG الجديدة من هذا التغيير لأن المنصة لا تدعم binary diffs. عند النشر النهائي يمكنك إضافة الأيقونة يدويًا أو في PR منفصل يدعم binary، وملف VSIX الناتج يبقى غير متتبع لأن `.gitignore` يحتوي `*.vsix`.

مثال عام للتعديل في `package.json`:

```json
{
  "name": "your-mumps-debugger",
  "displayName": "Your MUMPS Debugger",
  "publisher": "yourPublisherId",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-user/your-repo.git"
  },
  "bugs": {
    "url": "https://github.com/your-user/your-repo/issues"
  }
}
```

### 5.2 إنشاء Publisher في Marketplace

1. ادخل إلى Visual Studio Marketplace publisher management.
2. أنشئ Publisher ID.
3. أنشئ Personal Access Token من Azure DevOps بصلاحية Marketplace publish/manage.

### 5.3 تسجيل الدخول والنشر

```bash
npx vsce login yourPublisherId
npm run package
npx vsce publish
```

أو استخدم السكربت الموجود:

```bash
npm run publish
```

---

## 6) نسبة الإنجاز الحالية

تقدير تقريبي للوصول إلى **مرحلة MVP قابلة للاختبار الداخلي**:

| المحور | الإنجاز | المتبقي |
|---|---:|---|
| التوثيق والمعمارية | 88% | مراجعة نهائية + إبقاء دليل الاختبار محدثًا بعد كل تعديل |
| Standards Diagnostics | 45% | قواعد أكثر + quick fixes + tests |
| Templates | 60% | قوالب RPC/FileMan/Entry Point + إعدادات company/version |
| Direct Debug Commands | 93% | تشغيل لوحة MUMPS Direct Debug وزر TEST على MDEBUG الحقيقي + polish لتنسيق output |
| Attach Mode | 35% | اختبار فعلي مع listener + تحسين lifecycle |
| Packaging/Marketplace | 40% | تغيير الهوية + LICENSE/NOTICE + نشر VSIX تجريبي |

**النسبة الإجمالية التقريبية الآن: 69% من MVP داخلي قابل للاختبار بعد إضافة دليل اختبار تفصيلي للإضافة وربطه بالـ README ودليل النشر.**

للوصول إلى مرحلة اختبار داخلية جيدة نحتاج تقريبًا:

1. المحافظة على نظافة lint بعد تنظيف مشاكل `src/mumpsDebug.ts` القديمة.
2. تشغيل لوحة `MUMPS Direct Debug` وزر `TEST` على GT.M/MDEBUG حقيقي ثم polish لتنسيق output حسب النتائج.
3. إضافة test fixtures لقواعد standards.
4. اختبار attach على بيئة GT.M/MDEBUG حقيقية.
5. إعداد نسخة VSIX باسم جديد وتجربتها على VS Code نظيف.

---

## 7) Checklist سريعة قبل أول إصدار باسمك

- [ ] تأكيد الرخصة وإضافة `LICENSE` إذا كان ناقصًا.
- [ ] تحديث `publisher`, `name`, `displayName`.
- [ ] تحديث `repository` و`bugs`.
- [ ] تحديث الأيقونة إن أردت branding خاص.
- [ ] تشغيل `npm run compile`.
- [ ] تشغيل `npm run build`.
- [ ] تشغيل `npm run package`.
- [ ] تثبيت VSIX محليًا واختبار commands.
- [ ] اختبار launch/attach على بيئة GT.M.
- [ ] نشر نسخة pre-release أو private/internal أولًا.

---

## 8) سياسة الملفات الثنائية Binary Files

بما أن بعض منصات المراجعة أو الرفع لا تدعم عرض binary diffs، اتبع السياسة التالية:

- لا تضف ملفات binary جديدة داخل PR العادي مثل: `.png`, `.webm`, `.vsix`, `.ico`, `.jpg`.
- ملف VSIX الناتج من `npm run package` لا يجب رفعه إلى GitHub؛ هو مستبعد عبر `.gitignore` و`.vscodeignore`.
- الأصول الثنائية القديمة الموجودة في المشروع الأصلي لا تحتاج تعديلًا ضمن هذا المسار، لكن لا تضف أصولًا ثنائية جديدة إلا في مسار منفصل يدعم binary.
- إذا احتجت أيقونة Marketplace لاحقًا، أضفها في PR منفصل أو ارفعها يدويًا عند النشر النهائي حسب متطلبات Marketplace.
- `.vscodeignore` يستبعد ملفات الصور والفيديو وملفات VSIX من حزمة الإضافة لتخفيف الحزمة وتجنب إدخال artifacts غير ضرورية.
