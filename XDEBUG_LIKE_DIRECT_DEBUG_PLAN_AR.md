# خطة Direct Debug شبيهة Xdebug لأوامر GT.M/MUMPS

> الهدف من هذه الوثيقة هو تحويل أوامر Direct Mode في GT.M/MUMPS إلى تجربة استخدام داخل VS Code تشبه تجربة Xdebug في PHP: أزرار واضحة في شريط الديبغ، أوامر Step/Continue/Stop، ونافذة Output تعرض نتيجة أوامر مثل `ZWRITE`, `ZSHOW`, و`ZPRINT`.

---

## 1) الهدف العام

نريد أن يشعر المطور أن جلسة MUMPS debug تعمل مثل جلسة Xdebug في PHP:

- يبدأ المطور جلسة debug من launch الموجود حاليًا.
- تظهر أدوات التحكم المعتادة في VS Code Debug Toolbar.
- كل زر أو command في VS Code يقابله أمر GT.M/MUMPS واضح.
- تظهر نتائج أوامر Direct Mode في Output Channel مخصص بدل أن تضيع داخل terminal أو socket.
- يمكن للمطور الانتقال بين الأسطر والدوال والروتينات باستخدام أوامر مألوفة مثل Step Into وStep Out وContinue.

هذه الخطة لا تستبدل launch الحالي؛ بل تبني فوقه. launch الحالي يعتبر جاهزًا كنقطة بدء، والعمل المطلوب يتركز على تحسين UX وربط أوامر GT.M/MUMPS بتجربة VS Code.

---

## 2) نطاق الأوامر المطلوبة

الوثيقة المرجعية تركز على أوامر Direct Mode التالية:

| أمر GT.M/MUMPS | الاختصار | المعنى العملي داخل VS Code |
|---|---|---|
| `ZBREAK` | `ZB` | إنشاء breakpoint مؤقت أو مباشر على `TAG+OFFSET^ROUTINE`. |
| `ZCONTINUE` | `ZC` | متابعة التنفيذ بعد التوقف. |
| `ZWRITE` | `ZWR` | عرض local variables وقيمها الحالية. |
| `ZPRINT` | `ZP` | طباعة أسطر الكود حسب argument أو حسب `$ZPOSITION`. |
| `ZSHOW` | `ZSH` | عرض حالة stack وبيئة GT.M. |
| `ZSTEP` | `ZST` | تنفيذ السطر الحالي والانتقال للسطر التالي. |
| `ZSTEP INTO` | — | الدخول داخل routine أو `DO` المستدعى من السطر الحالي. |
| `ZSTEP OUTOF` | — | الخروج من المستوى الحالي والعودة للمستوى الأعلى في stack. |

كما يجب دعم special variables التالية:

| المتغير | المعنى | الاستخدام المطلوب |
|---|---|---|
| `$ZPOSITION` / `$ZPOS` | يمثل موقع التنفيذ الحالي مثل `TAG+LINE^ROUTINE`. | استخدامه مع `ZPRINT @$ZPOSITION` وعرضه في status/output. |
| `$ZSTEP` / `$ZST` | يحدد ماذا يفعل `ZSTEP` عند الاستدعاء. | توفير command لضبطه على طباعة السطر الحالي أثناء step. |

---

## 3) تشبيه Xdebug داخل VS Code

الصورة المرجعية لشريط Xdebug/PHP تعرض أزرارًا مثل:

- Pause
- Step Over
- Step Into
- Step Out
- Restart
- Stop

في MUMPS/GT.M نريد mapping قريبًا كالتالي:

| زر/سلوك Xdebug | أمر GT.M/MUMPS المقترح | الحالة الحالية | المطلوب |
|---|---|---:|---|
| Continue / Resume | `ZCONTINUE` | موجود كـ command | ربط أوضح مع toolbar/command UX وإظهار نتيجة التنفيذ. |
| Step Over | `ZSTEP` أو `ZSTEP OVER` عند دعمه | موجود `ZSTEP` | توحيد السلوك وتوثيق الفرق بين step عادي وstep over. |
| Step Into | `ZSTEP INTO` | موجود كـ command | تحسين feedback وإظهار الموقع الجديد. |
| Step Out | `ZSTEP OUTOF` | موجود كـ command | تحسين feedback وإظهار stack/location. |
| Breakpoint | `ZBREAK TAG+N^ROUTINE` | موجود عبر input | تحسين input validation وحفظ آخر targets. |
| Inspect Variables | `ZWRITE` | موجود كـ command | عرض النتائج في Output Channel أو Variables view. |
| Show Stack/Environment | `ZSHOW` | موجود كـ command | تنسيق النتائج داخل Output Channel. |
| Print Current Line | `ZPRINT @$ZPOSITION` | موجود كـ command | إظهاره تلقائيًا بعد step أو عبر زر/command مستقل. |
| Configure Step Printing | `SET $ZSTEP="ZPRINT @$ZPOSITION BREAK"` | غير مكتمل | إضافة command مخصص لضبط `$ZSTEP`. |
| Stop | Debug Adapter `disconnect` + MDEBUG reset | موجود جزئيًا | تنظيف lifecycle والتأكد من إيقاف terminal/socket بشكل آمن. |

> ملاحظة تنفيذية: تم تقليل الاعتماد على Command Palette بإضافة أزرار Status Bar تظهر تلقائيًا أثناء جلسة MUMPS debug، وإضافة مساهمات في `debug/toolBar` لأوامر MUMPS المباشرة. تبقى Command Palette كمسار احتياطي فقط.

---

## 4) تجربة المستخدم المطلوبة

### 4.1 بدء الجلسة

1. يفتح المطور ملف MUMPS.
2. يشغل launch الجاهز من VS Code.
3. الإضافة تبدأ MDEBUG أو تتصل به حسب الإعداد الحالي.
4. تظهر رسالة واضحة أن جلسة MUMPS Debug جاهزة.
5. يتم إنشاء Output Channel باسم مثل: `MUMPS Debug`.

### 4.2 ضبط تجربة Step مثل Xdebug

بعد بدء الجلسة، يستطيع المطور تنفيذ command:

```mumps
SET $ZSTEP="ZPRINT @$ZPOSITION BREAK"
```

المطلوب داخل VS Code:

- Command باسم: `MUMPS: Configure ZSTEP Line Printing`.
- عند تنفيذه، ترسل الإضافة أمر `SET $ZSTEP="ZPRINT @$ZPOSITION BREAK"` إلى MDEBUG/GT.M.
- تظهر رسالة في Output Channel تؤكد ضبط `$ZSTEP`.

### 4.3 وضع Breakpoint مباشر

يستطيع المطور تنفيذ:

```mumps
ZBREAK TEST+3^KJOTEST
```

المطلوب داخل VS Code:

- Command باسم: `MUMPS: ZBREAK...`.
- Input box يقبل `TAG+OFFSET^ROUTINE`.
- Validation بسيط للصيغة.
- حفظ آخر 5 breakpoints كـ quick pick لاحقًا.

### 4.4 التنقل أثناء التوقف

عند التوقف على breakpoint، يستخدم المطور:

| Action | Command |
|---|---|
| التالي | `ZSTEP` |
| دخول routine مستدعى | `ZSTEP INTO` |
| الخروج من routine الحالي | `ZSTEP OUTOF` |
| متابعة التنفيذ | `ZCONTINUE` |

المطلوب:

- كل command يعرض في Output Channel:
  - الأمر المرسل.
  - الوقت.
  - `$ZPOSITION` بعد التنفيذ إن أمكن.
  - نتيجة `ZPRINT @$ZPOSITION` إن أمكن.

### 4.5 فحص المتغيرات والبيئة

| Action | Command | المطلوب |
|---|---|---|
| عرض المتغيرات | `ZWRITE` | إرسال النتائج إلى Output Channel، ولاحقًا تحويلها إلى Variables tree. |
| عرض stack/environment | `ZSHOW` | تنسيق output في sections قابلة للقراءة. |
| طباعة موقع التنفيذ | `ZPRINT @$ZPOSITION` | عرض السطر الحالي بعد كل step أو عند الطلب. |

---

## 5) الملفات المتوقع تعديلها

| الملف | نوع التعديل |
|---|---|
| `package.json` | إضافة commands/keybindings/settings إذا لزم. |
| `src/extension.ts` | تسجيل commands الجديدة وربطها بالـ subscriptions. |
| `src/mumpsDirectDebugCommands.ts` | توسيع direct commands، إضافة `$ZSTEP`, `$ZPOSITION`, output channel. |
| `src/mumpsDebug.ts` | تحسين `customRequest`, وربما إرجاع output أو events من MDEBUG. |
| `src/mumpsConnect.ts` | دعم إرسال الأمر مع انتظار/تجميع الرد إن أمكن. |
| `src/mumpsConfigurationProvider.ts` | إضافة إعدادات اختيارية لتفعيل direct-mode UX عند launch. |
| ملف جديد محتمل `src/mumpsDebugOutput.ts` | عزل Output Channel formatting. |
| ملف جديد محتمل `src/mumpsDebugCommandHistory.ts` | حفظ آخر أوامر/breakpoints. |

---

## 6) TODO List تفصيلية

### المرحلة 1: إكمال Direct Commands الأساسية

- [x] إضافة command: `MUMPS: Configure ZSTEP Line Printing`.
- [x] إرسال الأمر: `SET $ZSTEP="ZPRINT @$ZPOSITION BREAK"`.
- [x] إضافة command: `MUMPS: Show $ZPOSITION`.
- [x] إضافة command: `MUMPS: ZPRINT...` مع input target اختياري.
- [x] تحسين `ZBREAK...` بإضافة validation لـ `TAG+N^ROUTINE` وحفظ آخر targets داخل الجلسة.
- [x] إضافة keybindings اختيارية للأوامر الجديدة.

**نسبة الإنجاز الحالية لهذه المرحلة:** 90% بعد إضافة أوامر `$ZSTEP`, `$ZPOSITION`, و`ZPRINT...` وتحسين `ZBREAK`. المتبقي هو اختبارها على GT.M/MDEBUG فعلي.

### المرحلة 2: Output Channel وتجربة شبيهة Xdebug

- [x] إنشاء Output Channel باسم `MUMPS Debug`.
- [x] طباعة كل أمر مرسل إلى Output Channel.
- [x] طباعة نتائج `ZWRITE`, `ZSHOW`, `ZPRINT` في Output Channel عبر أمر `DIRECT` في MDEBUG.
- [x] إضافة timestamps للأوامر.
- [x] فصل output العملي حسب كل أمر مرسل مع timestamp ونتيجة مستقلة.
- [x] إظهار رسالة واضحة عند عدم وجود active MUMPS debug session.
- [x] إضافة setting مثل `mumps.debug.showOutputOnCommand`.

**نسبة الإنجاز الحالية لهذه المرحلة:** 85% بعد إضافة أمر `DIRECT` في MDEBUG والتقاط نتائج الأوامر داخل Output Channel. المتبقي هو smoke test على GT.M/MDEBUG فعلي وتحسين تنسيق النتائج.

### المرحلة 3: ربط أفضل مع VS Code Debug UX

- [x] إضافة أزرار Status Bar تظهر أثناء جلسة MUMPS debug لتقليل الاعتماد على Command Palette.
- [x] توفير زر Status Bar مباشر لـ `ZSTEP INTO`.
- [x] توفير زر Status Bar مباشر لـ `ZSTEP OUTOF`.
- [x] توفير زر Status Bar مباشر لـ `ZCONTINUE`.
- [ ] دراسة Step Over وهل يكون `ZSTEP` أو `ZSTEP OVER` حسب دعم GT.M/MDEBUG.
- [x] إظهار `$ZPOSITION` في Status Bar عند وصول موقع جديد من MDEBUG.
- [x] توفير زر Status Bar مباشر لإعادة طباعة السطر الحالي عبر `ZPRINT @$ZPOSITION`.

**نسبة الإنجاز الحالية لهذه المرحلة:** 90% بعد إضافة أزرار Status Bar، مساهمات `debug/toolBar`، ولوحة جانبية داخل Run and Debug باسم `MUMPS Direct Debug` تعرض نفس الأوامر كقائمة واضحة قابلة للنقر، مع أدوات فتح/نسخ/تنظيف output. المتبقي هو smoke test فعلي وتحسين عرض الموقع عند commands التي لا توقف التنفيذ.

### المرحلة 4: تحسين MDEBUG protocol/output

- [x] تعديل `mumpsConnect` ليعيد response للأوامر الخام بدل `writeln` فقط.
- [x] إضافة queue/correlation عملي يمنع تداخل أوامر `DIRECT` ويعيد نتيجة كل أمر للطلب الصحيح.
- [x] التقاط output حتى marker واضح `***ENDDIRECT`.
- [x] تحديث MDEBUG.m بإضافة أمر `DIRECT` وmarkers `***STARTDIRECT`/`***ENDDIRECT`.
- [x] إضافة timeout قابل للإعداد عبر `mumps.debug.directCommandTimeoutMs` ورسالة واضحة عند انتهاء المهلة.

**نسبة الإنجاز الحالية لهذه المرحلة:** 85% لأن `sendRawCommand` صار يعيد output مباشرًا من MDEBUG عبر markers، مع queue لمنع التداخل وtimeout قابل للإعداد. المتبقي hardening بعد smoke test حقيقي.

### المرحلة 5: اختبارات وتوثيق

- [ ] إضافة دليل استخدام Direct Debug شبيه Xdebug داخل README أو ملف مستقل.
- [ ] إضافة سيناريو اختبار: `ZBREAK` ثم `$ZSTEP` ثم `DO TAG^ROUTINE` ثم `ZSTEP`.
- [ ] إضافة fixtures أو mock tests للأوامر التي لا تحتاج GT.M.
- [x] إضافة smoke test شبه يدوي من داخل VS Code عبر زر `TEST` يجرب `$ZPOSITION`, `ZPRINT`, `ZWRITE`, و`ZSHOW` ويعرض النتائج في Output Channel. يبقى تشغيله على GT.M/MDEBUG حقيقي مطلوبًا.
- [ ] توثيق الفرق بين MDEBUG launch وDirect Mode commands.
- [ ] توثيق known limitations.

**نسبة الإنجاز الحالية لهذه المرحلة:** 55% بعد إضافة زر smoke test داخل VS Code وتوثيق السيناريو. المتبقي تشغيله على GT.M/MDEBUG حقيقي وتسجيل النتائج.

---

## 7) النسبة الإجمالية المقترحة

| المحور | نسبة الإنجاز الحالية | السبب |
|---|---:|---|
| أوامر `Z*` الأساسية | 80% | معظم commands موجودة، وتمت إضافة `ZPRINT...` وتحسين `ZBREAK`. |
| `$ZPOSITION` و`$ZSTEP` | 75% | تمت إضافة commands لضبط `$ZSTEP` وعرض `$ZPOSITION` وتحديث زر `$ZPOS` عند تغيّر الموقع. |
| Output Channel | 93% | تمت إضافة قناة `MUMPS Debug` مع تنسيق نتائج مستقل لكل أمر والتقاط نتائج MDEBUG الفعلية عبر `DIRECT` markers، وأوامر فتح/نسخ آخر نتيجة/تنظيف القناة من اللوحة، والمتبقي smoke test وpolish. |
| تجربة شبيهة Xdebug | 90% | تمت إضافة Status Bar controls وDebug Toolbar menu entries ولوحة Run and Debug جانبية `MUMPS Direct Debug` وزر setup `MDBG` وزر smoke test `TEST` وأدوات output، والمتبقي اختبار فعلي وتحسين polish. |
| MDEBUG protocol للأوامر الخام | 85% | تمت إضافة أمر `DIRECT` في MDEBUG والتقاط output بين markers مع queue وtimeout قابل للإعداد، والمتبقي hardening بعد الاختبار الفعلي. |
| التوثيق والاختبارات | 68% | تمت إضافة زر smoke test داخل VS Code ودليل اختبار تفصيلي مستقل، لكن تشغيله وتوثيق نتائجه على GT.M/MDEBUG الحقيقي لا يزال مطلوبًا. |

**النسبة الإجمالية الحالية لتنفيذ تجربة Direct Debug شبيهة Xdebug:** حوالي **90%** بعد إضافة لوحة `MUMPS Direct Debug` داخل Run and Debug إلى جانب زر smoke test `TEST` وزر setup `MDBG` وأدوات output والـ queue/timeout وتنسيق النتائج.

بعد smoke test على GT.M/MDEBUG وتحسين تنسيق النتائج يمكن أن ترتفع النسبة إلى حوالي **93%** وتصبح التجربة مناسبة لاختبار داخلي أوسع.

---

## 8) معيار القبول MVP

نعتبر MVP لهذا المسار مكتملًا عندما يتحقق التالي:

- [ ] تشغيل launch الحالي بدون كسر السلوك الموجود.
- [ ] تنفيذ `ZBREAK`, `ZCONTINUE`, `ZWRITE`, `ZSHOW`, `ZSTEP`, `ZSTEP INTO`, `ZSTEP OUTOF` من VS Code.
- [ ] تنفيذ `ZPRINT @$ZPOSITION` من VS Code.
- [ ] تنفيذ command لضبط `$ZSTEP`.
- [ ] ظهور نتائج `ZWRITE`, `ZSHOW`, و`ZPRINT` في Output Channel.
- [ ] عرض `$ZPOSITION` بعد step أو عند الطلب.
- [ ] توثيق workflow كامل يشبه Xdebug:
  1. Start Debug
  2. Set Breakpoint
  3. Configure `$ZSTEP`
  4. Step Into/Out/Continue
  5. Inspect Variables
  6. Stop

---

## 9) ملاحظات أمان وتشغيل

- لا يجب إرسال أوامر raw خطرة دون توضيح للمستخدم.
- يجب تمييز أوامر القراءة مثل `ZWRITE`, `ZSHOW`, `ZPRINT` عن أوامر قد تغير التنفيذ.
- يجب عدم تنفيذ auto-fix أو تغييرات على الكود أثناء debugging.
- يجب التعامل بحذر مع بيئات production VistA/GT.M.
- يفضل أن تكون تجربة Direct Mode مفعلة فقط أثناء active debug session من نوع `mumps`.

---

## 10) توصية التنفيذ التالية

أقصر مسار لإظهار قيمة واضحة للمستخدم:

1. بناء `MUMPS Debug` Output Channel.
2. توسيع `sendDebugCommand` ليطبع الأمر والنتيجة.
3. إضافة command لضبط `$ZSTEP`.
4. إضافة command لعرض `$ZPOSITION`.
5. تحسين `ZBREAK` و`ZPRINT` بمدخلات أوضح.
6. اختبار السيناريو يدويًا على GT.M/MDEBUG.

بهذا تصبح التجربة أقرب لما يراه المستخدم في Xdebug/PHP، حتى لو بقيت بعض التفاصيل التقنية مختلفة بسبب اختلاف GT.M/MUMPS عن PHP/Xdebug.

---

## 11) تحديث تنفيذ 2026-06-01

تم البدء بتنفيذ الخطة عبر:

- إضافة أوامر `MUMPS: Configure $ZSTEP Line Printing`, `MUMPS: Show $ZPOSITION`, و`MUMPS: ZPRINT...`.
- إضافة Output Channel باسم `MUMPS Debug` يسجل الأوامر المرسلة والقبول أو الأخطاء.
- تحسين `ZBREAK...` بإضافة تحقق أولي من صيغة `TAG+OFFSET^ROUTINE` وحفظ آخر خمسة targets داخل الجلسة.
- إضافة setting باسم `mumps.debug.showOutputOnCommand` للتحكم في إظهار قناة المخرجات عند إرسال أوامر Direct Debug.
- إضافة acknowledgement من Debug Adapter عند استقبال `mumps.rawCommand`.

**النسبة بعد هذا التنفيذ الأول:** 55% تقريبًا من تجربة Direct Debug الشبيهة بـ Xdebug.

**المتبقي الأقرب:** التقاط نتائج MDEBUG الحقيقية لأوامر `ZWRITE`, `ZSHOW`, و`ZPRINT` بدل الاكتفاء بتسجيل الأمر والقبول.

---

## 12) تحديث تنفيذ إضافي 2026-06-01

استجابةً لعدم الرغبة بالاعتماد على Command Palette فقط، تمت إضافة طبقة UX أوضح:

- أزرار Status Bar تظهر تلقائيًا عند وجود جلسة debug نشطة من نوع `mumps`: `ZC`, `ZST`, `INTO`, `OUT`, `ZB`, `ZP`, `ZWR`, `ZSH`, `$ZSTEP`, و`$ZPOS`.
- مساهمات `debug/toolBar` لأوامر `ZBREAK`, `ZPRINT @$ZPOSITION`, `ZWRITE`, `ZSHOW`, `$ZSTEP`, و`$ZPOSITION` حتى تكون أقرب لمنطقة التحكم بالديبغ.
- أصبح Command Palette مسارًا احتياطيًا فقط، بينما الاستخدام اليومي يمكن أن يتم من أزرار ظاهرة أثناء جلسة debug.

**النسبة بعد هذا التنفيذ الإضافي:** 62% تقريبًا من تجربة Direct Debug الشبيهة بـ Xdebug.

**المتبقي الأقرب:** تشغيل smoke test على GT.M/MDEBUG حقيقي، ثم تحسين formatting للنتائج وإضافة correlation أقوى للأوامر المتزامنة.

---

## 13) تحديث تنفيذ إضافي لالتقاط output

تمت إضافة الجزء الأهم لتقليل الفجوة مع Xdebug:

- إضافة أمر `DIRECT` داخل `MDEBUG.m` لتنفيذ أوامر مثل `ZWRITE`, `ZSHOW`, `ZPRINT`, `WRITE $ZPOSITION`, و`SET $ZSTEP=...` وإرجاع نتائجها بين markers واضحة.
- تحديث `src/mumpsConnect.ts` لقراءة `***STARTDIRECT` و`***ENDDIRECT` وتجميع output الحقيقي وإرجاعه للـ Debug Adapter.
- تحديث `mumps.rawCommand` ليعيد النص الناتج من MDEBUG بدل acknowledgement فقط.
- تحديث زر `$ZPOS` في Status Bar عند وصول موقع تنفيذ جديد من MDEBUG.

**النسبة بعد هذا التنفيذ:** 75% تقريبًا من تجربة Direct Debug الشبيهة بـ Xdebug.

**المتبقي الأقرب:** smoke test فعلي على GT.M/MDEBUG، ثم تحسينات polish مثل تصنيف مخرجات `ZWRITE`/`ZSHOW` بصريًا داخل Output Channel.

---

## 14) تحديث تنفيذ إضافي للـ queue والمهلة

تمت إضافة hardening لمسار الأوامر المباشرة:

- منع تداخل أوامر `DIRECT` عبر queue داخل `MumpsConnect` بحيث ينتظر كل أمر نتيجة الأمر السابق قبل الإرسال.
- إضافة setting باسم `mumps.debug.directCommandTimeoutMs` لتحديد مهلة انتظار output من MDEBUG.
- تحسين تنسيق Output Channel بحيث تظهر نتيجة كل أمر داخل section مستقل يحتوي اسم الأمر والناتج ونهاية واضحة.

**النسبة بعد هذا التنفيذ:** 80% تقريبًا من تجربة Direct Debug الشبيهة بـ Xdebug.

**المتبقي الأقرب:** smoke test فعلي على GT.M/MDEBUG وتجميل عرض نتائج `ZWRITE` و`ZSHOW` عند الحاجة.

---

## 15) تحديث تنفيذ إضافي لتسهيل البدء

لتقليل عدد الخطوات اليدوية أكثر، تمت إضافة زر/أمر setup واحد:

- زر Status Bar باسم `MDBG` يظهر أثناء جلسة MUMPS debug.
- أمر `MUMPS: Direct Debug Setup` ينفذ تسلسلًا سريعًا: ضبط `$ZSTEP`، عرض `$ZPOSITION`، وطباعة السطر الحالي عبر `ZPRINT @$ZPOSITION`.
- تمت إضافة الزر أيضًا إلى `debug/toolBar` وkeybinding اختياري `ctrl+alt+shift+d`.

**النسبة بعد هذا التنفيذ:** 83% تقريبًا من تجربة Direct Debug الشبيهة بـ Xdebug.

**المتبقي الأقرب:** smoke test فعلي على GT.M/MDEBUG وتجميل عرض النتائج بعد رؤية output حقيقي من بيئة GT.M.

---

## 16) تحديث تنفيذ إضافي لاختبار Smoke من داخل VS Code

تمت إضافة زر/أمر smoke test لتقليل الحاجة لاختبارات يدوية مشتتة:

- زر Status Bar باسم `TEST` يظهر أثناء جلسة MUMPS debug.
- أمر `MUMPS: Direct Debug Smoke Test` يجرب الأوامر: `WRITE $ZPOSITION`, `ZPRINT @$ZPOSITION`, `ZWRITE`, و`ZSHOW`.
- يعرض الاختبار المتوقع لكل خطوة، ثم النتيجة الفعلية في `MUMPS Debug` Output Channel، ويعطي ملخص نجاح/تحذير في النهاية.
- تمت إضافة keybinding اختياري `ctrl+alt+shift+t` ومساهمة في `debug/toolBar`.

**النسبة بعد هذا التنفيذ:** 86% تقريبًا من تجربة Direct Debug الشبيهة بـ Xdebug.

**المتبقي الأقرب:** تشغيل زر `TEST` على بيئة GT.M/MDEBUG حقيقية وتوثيق أي فروقات في output.


## 17) تحديث تنفيذ إضافي للوحة Run and Debug

تمت إضافة لوحة جانبية أوضح داخل Run and Debug لتقليل الاعتماد أكثر على Command Palette وStatus Bar فقط:

- View باسم `MUMPS Direct Debug` داخل Debug sidebar عند جلسة `mumps` النشطة.
- تعرض أوامر Direct Debug كقائمة قابلة للنقر: Smoke Test, Setup, Continue, Step Over, Step Into, Step Out, ZBREAK, ZPRINT, ZWRITE, ZSHOW, `$ZSTEP`, و`$ZPOSITION`.
- تستخدم نفس الأوامر المسجلة، لذلك أي تحسين في command handler ينعكس على Status Bar وDebug Toolbar واللوحة الجانبية معًا.
- يتم تحديث وصف عنصر `$ZPOSITION` داخل اللوحة عند وصول موقع جديد من MDEBUG أو عند التقاطه من ناتج `WRITE $ZPOSITION`.

**النسبة بعد هذا التنفيذ:** 89% تقريبًا من تجربة Direct Debug الشبيهة بـ Xdebug.

**المتبقي الأقرب:** تشغيل اللوحة وزر `TEST` على بيئة GT.M/MDEBUG حقيقية، ثم تحسين تنسيق output حسب النتائج الفعلية.


## 18) تحديث تنفيذ إضافي لأدوات Output داخل اللوحة

تمت إضافة أدوات عملية في لوحة `MUMPS Direct Debug` لإدارة نتائج الأوامر بدون الرجوع إلى Command Palette:

- `Run Raw Direct Command`: تشغيل أمر مباشر مخصص مثل `ZWRITE` أو `ZSHOW` من اللوحة.
- `Open Debug Output`: فتح قناة `MUMPS Debug` مباشرة.
- `Copy Last Output`: نسخ آخر نتيجة Direct Debug إلى clipboard مع اسم الأمر.
- `Clear Debug Output`: تنظيف قناة output وإعادة ضبط آخر نتيجة محفوظة.
- هذه الأدوات تظهر في اللوحة الجانبية فقط حتى لا تزدحم أزرار Status Bar.

**النسبة بعد هذا التنفيذ:** 90% تقريبًا من تجربة Direct Debug الشبيهة بـ Xdebug.

**المتبقي الأقرب:** تشغيل اللوحة كاملة على GT.M/MDEBUG حقيقي، ثم تحسين عرض النتائج بناءً على output الفعلي.


## 19) تحديث توثيق الاختبار بعد كل تعديل

تمت إضافة دليل عملي مستقل باسم `VS_CODE_EXTENSION_TESTING_STEPS_AR.md` ليكون مرجع الاختبار بعد كل تعديل على الإضافة:

- يشرح اختبار Extension Development Host وVSIX.
- يغطي اختبار القوالب والـ diagnostics بدون MDEBUG.
- يغطي اختبار Direct Debug خطوة بخطوة: setup، smoke test، step controls، `ZBREAK`, `ZPRINT`, `ZWRITE`, `ZSHOW`, `$ZPOSITION`, وأدوات output.
- يحتوي checklist قبل PR وجدول آخر نتائج اختبار موثقة.
- القاعدة الجديدة: عند كل تعديل على الإضافة يجب تحديث هذا الدليل إذا تغيرت خطوات الاختبار أو النتائج المتوقعة.

**النسبة بعد هذا التنفيذ:** التوثيق والاختبارات ارتفعت إلى 68% تقريبًا، والـ MVP الداخلي العام إلى 69% تقريبًا.

**المتبقي الأقرب:** ملء جدول نتائج الاختبار بنتائج تشغيل فعلية على GT.M/MDEBUG وبيئة VS Code نظيفة.
