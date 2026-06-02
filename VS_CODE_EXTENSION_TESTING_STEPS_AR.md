# دليل اختبار وتجريب إضافة VistA MUMPS Toolkit داخل VS Code

> الهدف من هذا الملف أن يكون **المرجع العملي بعد كل تعديل على الإضافة**. بعد أي تغيير في `src/`, `package.json`, `MDEBUG.m`, أو `dist/` يجب تحديث هذا الملف إذا تغيرت خطوات الاختبار أو ظهرت نتيجة/ملاحظة جديدة.

---

## 1) متى أستخدم هذا الدليل؟

استخدم هذا الدليل في الحالات التالية:

1. بعد تعديل أوامر الإضافة أو مساهمات VS Code داخل `package.json`.
2. بعد تعديل Debug Adapter أو الاتصال بـ MDEBUG داخل `src/mumpsConnect.ts` أو `src/mumpsDebug.ts`.
3. بعد تعديل أوامر Direct Debug داخل `src/mumpsDirectDebugCommands.ts`.
4. بعد تعديل `MDEBUG.m` أو بروتوكول socket/markers.
5. قبل إنشاء VSIX أو PR جديد.
6. عند اختبار نسخة مثبتة على VS Code نظيف أو Extension Development Host.

---

## 2) تجهيز بيئة الاختبار من جذر الريبو

نفّذ الأوامر التالية من جذر المشروع:

```bash
npm install
npm run compile
npm run eslint
npm run build
```

المتوقع:

- `npm run compile`: لا توجد أخطاء TypeScript.
- `npm run eslint`: لا توجد أخطاء lint داخل `src/**/*.ts`.
- `npm run build`: يتم إنشاء/تحديث `dist/extension.js` و`dist/extension.js.map`.

> ملاحظة: قد يظهر تحذير npm مثل `Unknown env config "http-proxy"` حسب البيئة، وهذا ليس فشلًا وظيفيًا في الإضافة.

---

## 3) اختبار الإضافة بطريقة Extension Development Host

هذه أسرع طريقة أثناء التطوير:

1. افتح الريبو في VS Code.
2. تأكد أن dependencies مثبتة:
   ```bash
   npm install
   ```
3. اضغط `F5` من VS Code أو شغّل launch configuration الخاص بالإضافة.
4. ستفتح نافذة جديدة باسم **Extension Development Host**.
5. افتح مجلد يحتوي ملفات MUMPS مثل `.m`, `.int`, أو `.mps`.
6. افتح ملف MUMPS وتأكد من تفعيل اللغة `MUMPS` في شريط الحالة.

المتوقع:

- تعمل أوامر القوالب والـ diagnostics بدون الحاجة إلى MDEBUG.
- أوامر Direct Debug تحتاج جلسة debug نشطة من نوع `mumps`.

---

## 4) اختبار الإضافة كملف VSIX مثبت محليًا

استخدم هذه الطريقة لمحاكاة تجربة المستخدم النهائي:

```bash
npm run package
code --install-extension vista-mumps-toolkit-1.0.2.vsix --force
```

إذا كان اسم الملف مختلفًا، استخدم اسم ملف `.vsix` الناتج من الأمر.

المتوقع:

- يتم إنشاء ملف VSIX في جذر المشروع.
- قد يظهر تحذير `LICENSE, LICENSE.md, or LICENSE.txt not found` من `vsce`؛ هذا تحذير نشر/امتثال وليس فشل بناء.

لإزالة النسخة المثبتة وإعادة تثبيتها:

```bash
code --uninstall-extension MusabAlzoubi.vista-mumps-toolkit
code --install-extension vista-mumps-toolkit-1.0.2.vsix --force
```

---

## 5) إعداد MDEBUG وملف launch.json

### 5.1 تثبيت MDEBUG على بيئة GT.M/YottaDB

1. انسخ `MDEBUG.m` إلى مجلد routines في بيئة GT.M/YottaDB.
2. تأكد أن `localRoutinesPath` في VS Code يشير إلى نفس مجلد routines محليًا.
3. تأكد أن المنفذ المستخدم متاح، مثل `9000`.

### 5.2 مثال launch.json

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "mumps",
      "request": "launch",
      "name": "Debug active M routine",
      "program": "${file}",
      "hostname": "localhost",
      "port": 9000,
      "localRoutinesPath": "/home/vista/EHR/r/",
      "stopOnEntry": true
    },
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

---

## 6) اختبار أساسيات الإضافة بدون MDEBUG

### 6.1 اختبار قوالب VistA/UJO

1. افتح ملف MUMPS.
2. افتح Command Palette.
3. نفذ:
   - `Insert Routine Header Template (MUMPS)`
   - `Insert Patch Change Block Template (MUMPS)`
4. أدخل القيم المطلوبة في prompts.

المتوقع:

- يتم إدراج header أو patch block بدون أخطاء.
- لا يتغير تنسيق الملف بطريقة غير مقصودة.

### 6.2 اختبار Standards Diagnostics

أضف إعدادات اختبار في Settings JSON:

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

جرّب ملفًا يحتوي مخالفات مثل:

```mumps
TOOLONGLABEL ; missing standard ;;
 SET lowercaseVariable=1
 SET VERYLONGLOCALVARIABLE=1
 SET ^TMP("BAD",1)=1
 SET ^%BAD(1)=1
```

المتوقع:

- تظهر Diagnostics على label الطويل، المتغيرات غير المطابقة، واستخدام globals المخالف.

---

## 7) اختبار Direct Debug الشبيه بـ Xdebug

> هذه الخطوات تحتاج جلسة debug نشطة من نوع `mumps` واتصالًا فعليًا مع MDEBUG.

### 7.1 بدء الجلسة

1. افتح ملف routine الذي تريد اختباره.
2. شغّل Debug من VS Code عبر `F5` أو استخدم attach حسب بيئتك.
3. تأكد من ظهور جلسة debug نشطة من نوع `mumps`.
4. افتح Run and Debug sidebar.
5. تأكد من ظهور لوحة **MUMPS Direct Debug**.

المتوقع:

- تظهر أزرار Status Bar مثل `TEST`, `MDBG`, `ZC`, `ZST`, `INTO`, `OUT`, `ZB`, `ZP`, `ZWR`, `ZSH`, `$ZSTEP`, `$ZPOS`.
- تظهر لوحة **MUMPS Direct Debug** داخل Run and Debug.

### 7.2 تشغيل Setup السريع

من لوحة **MUMPS Direct Debug** أو Status Bar:

1. اضغط `Direct Debug Setup` أو `MDBG`.
2. افتح Output Channel باسم `MUMPS Debug`.

الأوامر التي يرسلها setup:

```text
SET $ZSTEP="ZPRINT @$ZPOSITION BREAK"
WRITE $ZPOSITION
ZPRINT @$ZPOSITION
```

المتوقع:

- يظهر كل أمر داخل `MUMPS Debug` مع timestamp.
- تظهر نتائج MDEBUG بين sections واضحة.
- يتم تحديث `$ZPOS` إذا رجع output صالح من `$ZPOSITION`.

### 7.3 تشغيل Smoke Test

1. اضغط `Smoke Test` أو زر `TEST`.
2. راقب قناة `MUMPS Debug`.

الأوامر التي يجربها Smoke Test:

```text
WRITE $ZPOSITION
ZPRINT @$ZPOSITION
ZWRITE
ZSHOW
```

المتوقع:

- يظهر ملخص في نهاية الاختبار مثل `4/4 commands returned output without direct-command errors` إذا نجحت كل الأوامر.
- إذا ظهر `***DIRECTERR` أو timeout، تظهر رسالة warning ويجب توثيقها في قسم آخر نتائج الاختبار أدناه.

### 7.4 اختبار أزرار الحركة

جرّب الأزرار التالية من اللوحة أو Status Bar:

| الزر | الأمر المتوقع |
|---|---|
| Continue | `ZCONTINUE` / flow continue |
| Step Over | `ZSTEP` |
| Step Into | `ZSTEP INTO` |
| Step Out | `ZSTEP OUTOF` |

المتوقع:

- تتحرك جلسة debug كما هو متوقع.
- يتغير موقع التنفيذ في stack/editor عند توفره.
- يتم تحديث `$ZPOS` عند وصول موقع جديد من MDEBUG.

### 7.5 اختبار الفحص والطباعة

جرّب:

| الإجراء | الأمر |
|---|---|
| Print Current Line | `ZPRINT @$ZPOSITION` |
| Inspect Variables | `ZWRITE` |
| Show Stack/Environment | `ZSHOW` |
| Show Current Position | `WRITE $ZPOSITION` |
| Configure Step Printing | `SET $ZSTEP="ZPRINT @$ZPOSITION BREAK"` |

المتوقع:

- تظهر نتائج كل أمر في `MUMPS Debug`.
- لا تتداخل نتائج الأوامر؛ كل نتيجة تظهر تحت section مستقل.

### 7.6 اختبار ZBREAK

1. اضغط `Set Breakpoint` أو زر `ZB`.
2. أدخل target مثل:

```text
TEST+3^KJOTEST
```

المتوقع:

- إذا كان target بالشكل الصحيح، يُرسل `ZBREAK TEST+3^KJOTEST`.
- إذا كان الشكل غير مألوف، تظهر رسالة تأكيد قبل الإرسال.
- آخر targets تظهر في history داخل الجلسة.

### 7.7 اختبار Run Raw Direct Command

من لوحة **MUMPS Direct Debug**:

1. اضغط `Run Raw Direct Command`.
2. جرّب الأوامر التالية واحدًا واحدًا:

```text
ZWRITE
ZSHOW
ZPRINT @$ZPOSITION
WRITE $ZPOSITION
```

المتوقع:

- كل أمر يرجع output مستقل.
- لا يحدث interleaving بين النتائج بسبب queue داخل adapter.

### 7.8 اختبار أدوات Output

من لوحة **MUMPS Direct Debug**:

1. اضغط `Open Debug Output`.
   - المتوقع: فتح قناة `MUMPS Debug`.
2. بعد تشغيل أي command، اضغط `Copy Last Output`.
   - المتوقع: نسخ آخر نتيجة مع اسم الأمر إلى clipboard.
3. اضغط `Clear Debug Output`.
   - المتوقع: تنظيف القناة وظهور رسالة `MUMPS Debug output cleared.`.

---

## 8) اختبار attach mode

1. شغّل MDEBUG listener في بيئة GT.M/YottaDB.
2. استخدم configuration من نوع `attach`.
3. تأكد أن `hostname`, `port`, و`localRoutinesPath` صحيحة.
4. بعد الاتصال، نفذ خطوات Direct Debug من القسم 7.

المتوقع:

- VS Code يتصل بالجلسة بدون تشغيل routine جديد إذا كانت attach معدة لذلك.
- أوامر Direct Debug تعمل مثل launch mode.

---

## 9) Checklist قبل كل PR أو تسليم

نفّذ هذه القائمة قبل commit/PR:

```bash
npm run compile
npm run eslint
npm run build
npm run package
git diff --check
```

ثم راجع يدويًا:

- [ ] هل `dist/extension.js` و`dist/extension.js.map` محدثان بعد أي تعديل TypeScript؟
- [ ] هل `package.json` يحتوي أي commands/views/keybindings جديدة؟
- [ ] هل تم تحديث هذا الملف إذا تغيرت طريقة الاختبار؟
- [ ] هل تم تحديث `VS_CODE_EXTENSION_PUBLISH_AND_TEST_AR.md` إذا تغيرت نسب الإنجاز أو خطوات النشر؟
- [ ] هل تم تحديث `XDEBUG_LIKE_DIRECT_DEBUG_PLAN_AR.md` إذا تغيرت خطة Direct Debug أو نسبتها؟
- [ ] هل تم اختبار Extension Development Host أو VSIX حسب نوع التعديل؟
- [ ] هل تم توثيق أي warning معروف مثل تحذير LICENSE من `vsce`؟

---

## 10) آخر نتائج اختبار موثقة

| التاريخ | التعديل | الأوامر/الاختبارات | النتيجة | ملاحظات |
|---|---|---|---|---|
| 2026-06-02 | إضافة هذا الدليل وتحديث روابط الاختبار | `npm run compile`, `npm run eslint`, `npm run build`, `npm run package`, `git diff --check` | نجحت checks والبناء والتغليف | ظهر تحذير معروف من `vsce` بسبب عدم وجود ملف LICENSE؛ يلزم اختبار Direct Debug لاحقًا على GT.M/MDEBUG حقيقي. |

---

## 11) قاعدة تحديث هذا الملف بعد كل تعديل

بعد أي تعديل جديد على الإضافة:

1. أضف أو عدّل خطوات الاختبار المتأثرة في الأقسام أعلاه.
2. أضف صفًا جديدًا في **آخر نتائج اختبار موثقة** بتاريخ التعديل.
3. إذا أضفت command جديدًا، أضفه إلى أقسام Direct Debug أو القوالب أو diagnostics حسب مكانه.
4. إذا أضفت view/keybinding/menu contribution جديدًا، وثّق مكان ظهوره وطريقة اختباره.
5. إذا فشل اختبار بسبب البيئة وليس بسبب الكود، اكتب ذلك بوضوح في خانة الملاحظات.
