# معمارية إضافة MUMPS Debugger وخارطة الطريق (نسخة عربية)

## 1) الملخص التنفيذي

الإضافة الحالية تملك أساسًا قويًا يشمل:
- Debug Adapter مخصص لـ MUMPS/GT.M.
- أدوات لغة متقدمة (Hover, Definition, References, Symbols, Formatting, Diagnostics, Semantic Tokens, Completion).
- تدفق تشغيل Debug يعتمد على تشغيل `MDEBUG` داخل GT.M ثم الاتصال من VS Code. 【F:src/mumpsDebug.ts†L148-L191】

هذا يجعل المشروع قاعدة ممتازة للتوسع نحو سيناريوهات VistA/UJO الأكثر تقدمًا (معايير ترميز + تنقيح أوسع + تكامل RPC/CPRS). 【F:src/extension.ts†L37-L57】

---

## 2) الهيكل الهرمي الحالي للحزمة

```text
mumps-debugger---upgrade/
├─ package.json
├─ readme.md
├─ language-configuration.json
├─ MDEBUG.m
├─ CHANGELOG.md
├─ src/
│  ├─ extension.ts
│  ├─ mumpsDebug.ts
│  ├─ mumpsConnect.ts
│  ├─ mumpsConfigurationProvider.ts
│  ├─ mumpsLineParser.ts
│  ├─ mumpsTokenData.ts
│  ├─ language-definitions.ts
│  ├─ mumpsHighlighter.ts
│  ├─ mumpsDiagnosticsProvider.ts
│  ├─ mumpsFormattingHelpProvider.ts
│  ├─ mumpsDocumenter.ts
│  ├─ mumpsCompExp.ts
│  ├─ mumpsAutospace.ts
│  ├─ mumpsCompletionItemProvider.ts
│  ├─ CompletionItem.ts
│  ├─ mumpsHoverProvider.ts
│  ├─ mumpsDefinitionProvider.ts
│  ├─ mumpsReferenceProvider.ts
│  ├─ mumpsSignatureHelpProvider.ts
│  ├─ mumpsEvalutableExpressionProvider.ts
│  ├─ mumpsDocumentSymbolProvider.ts
│  ├─ tsconfig.json
│  └─ tslint.json
├─ syntaxes/
│  ├─ mumps.tmLanguage
│  └─ mumps.tmTheme
├─ images/
│  ├─ mumps-debug-icon.png
│  └─ mumps-debug-icon.svg
└─ dist/
   └─ مخرجات البناء
```

تعريف البناء ونقطة الدخول موجودان في `package.json` (`dist/extension` مع TypeScript/Webpack). 【F:package.json†L34-L46】【F:package.json†L66-L67】

---

## 3) شرح المكونات حسب المسؤولية

### 3.1 طبقة التفعيل والربط
- `src/extension.ts` هو مركز تجميع الإضافة:
  - تسجيل الأوامر.
  - تسجيل مزودات اللغة.
  - ربط الـ diagnostics مع أحداث فتح/تعديل الملفات.
  - تسجيل مزود إعدادات التنقيح ومصنع debug adapter. 【F:src/extension.ts†L22-L57】

### 3.2 طبقة المنقّح Debugger
- `src/mumpsDebug.ts` ينفذ دورة حياة جلسة التنقيح:
  - `initialize`, `launch`, `setBreakpoints`, `stackTrace`, `scopes`, `variables`. 【F:src/mumpsDebug.ts†L102-L134】【F:src/mumpsDebug.ts†L198-L248】
- أثناء الإطلاق (`launch`):
  - اختيار منفذ متاح.
  - فتح Terminal.
  - تنفيذ `DO ^MDEBUG`.
  - إنشاء اتصال وتشغيل البرنامج. 【F:src/mumpsDebug.ts†L149-L191】
- `src/mumpsConnect.ts` مسؤول عن الاتصال socket، إدارة حالات الاتصال، وإرسال/استقبال أوامر البروتوكول. 【F:src/mumpsConnect.ts†L40-L63】

### 3.3 طبقة التحليل اللغوي
- `src/mumpsLineParser.ts`: المحلل الرئيسي (Tokenization/Parsing) الذي تعتمد عليه عدة ميزات. 【F:src/mumpsLineParser.ts†L13-L25】【F:src/mumpsLineParser.ts†L65-L77】
- `src/language-definitions.ts`: تعريفات أوامر ودوال M القياسية. 【F:src/language-definitions.ts†L15-L21】
- `src/mumpsTokenData.ts`: طبقة مساعدة لإنتاج معلومات hover/signature/definition بناءً على parser والتعريفات. 【F:src/mumpsTokenData.ts†L48-L56】

### 3.4 طبقة إنتاجية التحرير
- `src/mumpsFormattingHelpProvider.ts`: قواعد تنسيق أساسية. 【F:src/mumpsFormattingHelpProvider.ts†L20-L37】
- `src/mumpsAutospace.ts`: تحسين سلوك Enter/Tab لأسلوب كتابة MUMPS. 【F:src/mumpsAutospace.ts†L4-L13】【F:src/mumpsAutospace.ts†L50-L67】
- `src/mumpsDocumenter.ts`: إنشاء قالب توثيق سريع لنقاط الدخول. 【F:src/mumpsDocumenter.ts†L38-L57】
- `src/mumpsCompExp.ts`: تبديل الصيغة المختصرة/الموسعة للأوامر. 【F:src/mumpsCompExp.ts†L4-L13】

### 3.5 طبقة التنقل والاستكشاف
- مزودات منفصلة لـ Hover / Definition / References / Signature / Symbols ضمن `src/mumps*Provider.ts`. 【F:src/mumpsHoverProvider.ts†L3-L7】【F:src/mumpsDefinitionProvider.ts†L4-L8】【F:src/mumpsReferenceProvider.ts†L5-L13】【F:src/mumpsSignatureHelpProvider.ts†L3-L7】【F:src/mumpsDocumentSymbolProvider.ts†L5-L12】
- `src/mumpsDiagnosticsProvider.ts`: تنفيذ فحوصات التشخيص. 【F:src/mumpsDiagnosticsProvider.ts†L1-L4】

---

## 4) تحليل الفجوات

### الموجود حاليًا
- Launch debugging فعّال مع MDEBUG.
- Breakpoints وStack وScopes وVariables.
- أدوات لغة جيدة.
- Formatter أساسي.

### المطلوب للتطور المستقبلي
- وضع Attach/Listen مشابه لسيناريو RPC listener.
- أوامر Direct Mode (مثل ZSTEP/ZWRITE) مباشرة من VS Code.
- تتبع CPRS RPC وربطه بالمصدر.
- محرك معايير شامل لسياسات VistA/UJO.
- Formatter مؤسسي قابل للضبط حسب الستاندرد.

---

## 5) الخطة المقترحة للستاندرد والفورماتر

### 5.1 الهدف
الانتقال من تنسيق بسيط إلى منصة جودة تطبق المعايير تلقائيًا.

### 5.2 التصميم المقترح
1. إضافة إعدادات معايير جديدة في `package.json` مثل:
   - `mumps.standards.profile`
   - `mumps.standards.namespacePrefixes`
   - `mumps.standards.enforceRoutineHeader`
   - `mumps.standards.enforcePatchBlocks`
   - `mumps.standards.enforceApiReturnConvention`
2. إنشاء محرك قواعد في ملف جديد: `src/standardsRules.ts`.
3. دمج المحرك داخل `src/mumpsDiagnosticsProvider.ts`.
4. إنشاء محرك قوالب في ملف جديد: `src/templateEngine.ts`.
5. تطوير `src/mumpsFormattingHelpProvider.ts` إلى pipeline متعدد المراحل.

### 5.3 قواعد المرحلة الأولى (MVP)
- قيود أسماء الروتينات.
- قيود طول الـ labels.
- التحقق من وجود Header قياسي.
- قوالب patch comment blocks.
- فحوصات NEW discipline.
- فحوصات استخدام `^TMP($J,...)`.
- تنبيهات حول $GET لفحص المدخلات.

### 5.4 مبدأ الأمان
أي تعديل قد يؤثر على المعنى التشغيلي للكود يبدأ كـ Lint فقط (بدون Auto-fix مباشر).

---

## 6) الخطة المقترحة للـ Debugger

### 6.1 Direct Mode من VS Code
دعم الأوامر:
- `ZBREAK`
- `ZSTEP`, `ZSTEP INTO`, `ZSTEP OUTOF`
- `ZCONTINUE`
- `ZWRITE`
- `ZSHOW`
- `ZPRINT @$ZPOSITION`

**أماكن التعديل:**
- `package.json`: إضافة commands.
- `src/extension.ts`: تسجيل الأوامر.
- `src/mumpsDebug.ts`: جسر أوامر للجلسة النشطة.
- `src/mumpsConnect.ts`: إرسال أوامر خام + تحليل الردود.

### 6.2 Attach / RPC Listener
إضافة نمط `attach` بجانب `launch` الحالي.

**أماكن التعديل:**
- `package.json`: تعريف `configurationAttributes.attach`.
- `src/mumpsConfigurationProvider.ts`: التحقق من إعدادات attach.
- `src/mumpsDebug.ts`: تنفيذ `attachRequest`.
- `src/mumpsConnect.ts`: دورة اتصال مخصصة للـ attach.

### 6.3 CPRS RPC Debugging
- لوحة تتبع RPC.
- كسر عند دخول RPC entry.
- ربط RPC بـ `TAG^ROUTINE`.

**أماكن التعديل:**
- ملف جديد `src/mumpsRpcTraceProvider.ts`.
- توسيع `src/mumpsDefinitionProvider.ts` و`src/mumpsReferenceProvider.ts` و`src/extension.ts`.

---

## 7) إمكانية بناء تجربة شبيهة Xdebug

### الخلاصة
نعم، ممكن وظيفيًا، لكن ليس بنفس آلية PHP حرفيًا.

### التفسير
- في PHP/Xdebug غالبًا VS Code يعمل Listen على منفذ.
- في هذا المشروع: الإضافة تقوم بتشغيل MDEBUG ثم الاتصال داخليًا. 【F:src/mumpsDebug.ts†L162-L190】

### مسار التنفيذ المقترح
1. إضافة Listen/Attach mode.
2. دعم Auto-attach للجلسات الفرعية.
3. إنشاء Listener Manager UI (بدء/إيقاف/حالة/جلسات نشطة).

---

## 8) مراحل التنفيذ المقترحة

### المرحلة 1 (2–4 أسابيع)
- إعدادات المعايير.
- مولد قوالب MVP.
- قواعد تشخيص أساسية.
- أوامر Direct Debug أولية.

### المرحلة 2 (4–6 أسابيع)
- Attach mode.
- تطوير formatter pipeline.
- تحسين عرض المتغيرات.

### المرحلة 3 (6–10 أسابيع)
- لوحة RPC tracing.
- تدفق CPRS RPC debugging.
- تقارير التوافق/الالتزام بالمعايير.

---

## 9) مؤشرات النجاح

- تقليل زمن إصلاح العيوب عبر debug.
- تقليل مخالفات المعايير قبل المراجعة.
- تقليل الأخطاء الناتجة عن formatting/manual edits.
- تحسين تتبع مشاكل RPC من المصدر إلى التنفيذ.

---

## 10) ملاحظات تنفيذية

- فصل القواعد إلى:
  - Formatting rules
  - Policy lint rules
  - Unsafe transformation suggestions
- توفير وضع آمن للأنظمة legacy.
- تفعيل preview/diff قبل أي auto-fix حساس.

---

## 11) أوامر التحليل المستخدمة

- `rg --files src syntaxes images | sed -n '1,300p'`
- `for f in src/*.ts; do echo '###' $f; nl -ba $f | sed -n '1,80p'; done`
- `nl -ba package.json | sed -n '1,320p'`
- `nl -ba readme.md | sed -n '1,260p'`
- `nl -ba src/extension.ts | sed -n '1,280p'`
- `nl -ba src/mumpsDebug.ts | sed -n '1,260p'`
