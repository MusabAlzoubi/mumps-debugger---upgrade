# MUMPS Debugger Extension — Architecture + Roadmap (Full)

## 1) Executive Summary

The current extension already provides a strong baseline:
- A custom Debug Adapter for MUMPS/GT.M.
- Language tooling features (Hover, Definition, References, Symbols, Formatting, Diagnostics, Semantic Tokens, Completion).
- A launch flow that starts `MDEBUG` on GT.M then connects from VS Code. 【F:src/mumpsDebug.ts†L148-L191】

This makes it a good foundation for advanced VistA/UJO workflows (standards automation + richer debugger modes). 【F:src/extension.ts†L37-L57】

---

## 2) Current Package Hierarchy

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
   └─ build outputs
```

Build/entry wiring is defined in `package.json` (`dist/extension`, TypeScript + webpack scripts). 【F:package.json†L34-L46】【F:package.json†L66-L67】

---

## 3) Current Architecture by Responsibility

### 3.1 Activation + Wiring Layer
- `src/extension.ts` is the central bootstrap:
  - Registers commands, language providers, diagnostics triggers.
  - Registers debugger configuration provider and debug adapter factory. 【F:src/extension.ts†L22-L57】

### 3.2 Debugger Layer
- `src/mumpsDebug.ts` implements the Debug Adapter Session lifecycle:
  - initialize, launch, breakpoints, stackTrace, scopes, variables. 【F:src/mumpsDebug.ts†L102-L134】【F:src/mumpsDebug.ts†L198-L248】
- Launch flow details:
  - pick free port, create terminal, run `DO ^MDEBUG`, connect, start program. 【F:src/mumpsDebug.ts†L149-L191】
- `src/mumpsConnect.ts` handles low-level socket protocol + state machine + queued commands. 【F:src/mumpsConnect.ts†L40-L63】【F:src/mumpsConnect.ts†L66-L79】

### 3.3 Parser + Semantic Core
- `src/mumpsLineParser.ts` is the core tokenizer/parser used by many features. 【F:src/mumpsLineParser.ts†L13-L25】【F:src/mumpsLineParser.ts†L65-L77】
- `src/language-definitions.ts` stores built-in command/function metadata. 【F:src/language-definitions.ts†L15-L21】
- `src/mumpsTokenData.ts` resolves hover/signature/definition context using parser + definitions. 【F:src/mumpsTokenData.ts†L48-L56】【F:src/mumpsTokenData.ts†L70-L80】

### 3.4 Editor Productivity
- `src/mumpsFormattingHelpProvider.ts`: current formatter rules (basic structural fixes). 【F:src/mumpsFormattingHelpProvider.ts†L20-L37】
- `src/mumpsAutospace.ts`: smart Enter/Tab indentation behavior. 【F:src/mumpsAutospace.ts†L4-L13】【F:src/mumpsAutospace.ts†L50-L67】
- `src/mumpsDocumenter.ts`: template insertion for entry-point comments. 【F:src/mumpsDocumenter.ts†L38-L57】
- `src/mumpsCompExp.ts`: expand/compress command style toggling. 【F:src/mumpsCompExp.ts†L4-L13】

### 3.5 Navigation + Insight
- Hover/Definition/References/Signature/Symbols providers are modularized across `src/mumps*Provider.ts`. 【F:src/mumpsHoverProvider.ts†L3-L7】【F:src/mumpsDefinitionProvider.ts†L4-L8】【F:src/mumpsReferenceProvider.ts†L5-L13】【F:src/mumpsSignatureHelpProvider.ts†L3-L7】【F:src/mumpsDocumentSymbolProvider.ts†L5-L12】
- `src/mumpsDiagnosticsProvider.ts` performs diagnostics checks. 【F:src/mumpsDiagnosticsProvider.ts†L1-L4】

---

## 4) Gap Analysis

### Already implemented
- Launch-based debugging with MDEBUG.
- Breakpoints/stack/scopes/variables.
- Broad language tooling.
- Basic formatting.

### Missing for your target scope
- Attach/listen style debugging (RPC listener workflow).
- Direct-mode command bridge (`ZSTEP`, `ZWRITE`, etc.) from VS Code UI.
- CPRS RPC tracing and correlation UX.
- Full VistA/UJO standards rule engine.
- Enterprise formatter behavior aligned with organization policy.

---

## 5) Proposed Standards + Formatter Plan

## 5.1 Goal
Evolve from basic formatting to a policy-aware standards platform.

## 5.2 Design
1. Add standards settings in `package.json` (profile and toggles):
   - `mumps.standards.profile` (`vista | ujo | custom`)
   - `mumps.standards.namespacePrefixes`
   - `mumps.standards.enforceRoutineHeader`
   - `mumps.standards.enforcePatchBlocks`
   - `mumps.standards.enforceApiReturnConvention`

2. Introduce a dedicated rule engine (new file: `src/standardsRules.ts`).
3. Integrate rule engine inside `src/mumpsDiagnosticsProvider.ts`.
4. Add template generation engine (new file: `src/templateEngine.ts`).
5. Upgrade `src/mumpsFormattingHelpProvider.ts` to multi-stage formatting pipeline.

## 5.3 MVP Rule Set
- Routine naming constraints.
- Label length constraints.
- Mandatory header blocks.
- Patch-change comment block conventions.
- `NEW` discipline warnings.
- `^TMP($J,...)` usage checks.
- `$GET` input safety reminders.

## 5.4 Safety Principle
- Potentially semantic-changing transformations should be lint-only first (not auto-fix).

---

## 6) Proposed Debugger Plan

## 6.1 Direct Mode Commands from VS Code
Support:
- `ZBREAK`
- `ZSTEP`, `ZSTEP INTO`, `ZSTEP OUTOF`
- `ZCONTINUE`
- `ZWRITE`
- `ZSHOW`
- `ZPRINT @$ZPOSITION`

### File touchpoints
- `package.json`: new commands.
- `src/extension.ts`: register commands.
- `src/mumpsDebug.ts`: active-session command bridge.
- `src/mumpsConnect.ts`: raw command send/response parse.

## 6.2 Attach / RPC Listener Mode
Add debugger `attach` configuration alongside existing `launch`.

### File touchpoints
- `package.json`: `configurationAttributes.attach`.
- `src/mumpsConfigurationProvider.ts`: attach validation/defaults.
- `src/mumpsDebug.ts`: `attachRequest` implementation.
- `src/mumpsConnect.ts`: connect-only lifecycle path.

## 6.3 CPRS RPC Debugging
- RPC trace viewer panel.
- Break-on-RPC-entry support.
- Link RPC names to `TAG^ROUTINE` source navigation.

### File touchpoints
- New: `src/mumpsRpcTraceProvider.ts`.
- Extend: `src/mumpsDefinitionProvider.ts`, `src/mumpsReferenceProvider.ts`, `src/extension.ts`.

---

## 7) Feasibility of “Xdebug-like” Experience

## Short answer
Yes, feasible functionally; not identical architecture to PHP Xdebug.

## Why
- PHP commonly works in listen mode on a debug port.
- This extension currently launches MDEBUG via terminal and then connects internally. 【F:src/mumpsDebug.ts†L162-L190】

## Practical path to Xdebug-like behavior
1. Add “Listen/Attach for MDEBUG” mode.
2. Add session auto-attach/correlation for spawned handlers.
3. Add listener manager UI (start/stop/status/active sessions).

---

## 8) Suggested Delivery Phases

### Phase 1 (2–4 weeks)
- Standards settings scaffold.
- Template generator MVP.
- Core diagnostics standards.
- Basic direct debug commands.

### Phase 2 (4–6 weeks)
- Attach mode.
- Improved formatter pipeline.
- Better variable explorer behavior.

### Phase 3 (6–10 weeks)
- RPC trace panel.
- CPRS RPC debug workflow.
- Compliance export/reporting.

---

## 9) Success Metrics

- Reduced average debug time per defect.
- Fewer standards violations before review.
- Lower regression rate from manual formatting/policy drift.
- Better traceability for RPC-related defects.

---

## 10) Notes for Implementation Safety

- Split rules into:
  - formatting rules,
  - policy lint rules,
  - unsafe transformation suggestions.
- Default to preview/diff for sensitive fixes.
- Keep legacy-safe mode for VA baseline routines.

---

## 11) Reference Commands Used in This Analysis

- `rg --files src syntaxes images | sed -n '1,300p'`
- `for f in src/*.ts; do echo '###' $f; nl -ba $f | sed -n '1,80p'; done`
- `nl -ba package.json | sed -n '1,320p'`
- `nl -ba readme.md | sed -n '1,260p'`
- `nl -ba src/extension.ts | sed -n '1,280p'`
- `nl -ba src/mumpsDebug.ts | sed -n '1,260p'`
