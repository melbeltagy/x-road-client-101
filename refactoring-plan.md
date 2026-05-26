# Frontend refactoring plan

Scope: `src/main/webapp/src/` only. Baseline audit identified 18 candidates plus P0 (`useDebounce`). **All items complete.**

**Final state:** 242/242 tests passing, type-check clean, production build clean.

---

## Summary

| Phase | Items | Status |
|-------|-------|--------|
| Initial (in-line w/ audit) | #14, #15, #5, #2a, #13, #9 | ✅ |
| Phase 1 — trivial cleanups | #17, #10, #16 | ✅ |
| Phase 2 — cross-cutting primitive | P0 (`useDebounce`) | ✅ |
| Phase 3 — pure-logic split | #3 (curl-parser) | ✅ |
| Phase 4 — paired component reshape | #7, #8 | ✅ |
| Phase 5 — state-juggling cleanups | #4, #6 | ✅ |
| Phase 6 — single-consumer primitives | #11, #12, #18 | ✅ |
| Phase 7 — biggest refactors last | #2b, #1 | ✅ |

---

## Files added

### Utilities (`src/utils/`)
- `http-methods.ts` — `HTTP_METHODS`, `HttpMethod`, `BODY_METHODS`, `methodAllowsBody`, `METHOD_COLORS`, `methodColor`
- `shell-quote.ts` — `shellSingleQuote`
- `axios-error.ts` — `coerceAxiosError`, `pickErrorMessage`
- `safe-local-storage.ts` — `safeLocalStorage` adapter + `drainStorageError` / `peekStorageError`
- `curl-parser/` (directory) — `normalize.ts`, `tokenize.ts`, `parse.ts`, `index.ts`

### Composables (`src/composables/`)
- `useFormCompleteness.ts` — atomic "is this section filled?" booleans
- `useKeyValueList.ts` — generic key/value list factory
- `useDebounce.ts` — generic debounce with onUnmount cleanup
- `useServicesLoader.ts` — debounced (security-server, client, service) services fetcher
- `useFileDrop.ts` — drag/drop/file-input plumbing
- `useFormStepNavigation.ts` — expand-accordion + scroll + focus dispatch

### Components
- `components/common/TextareaWithErrorHighlight.vue` — textarea + range underline overlay
- `components/xroad/form/SubsystemField.vue` — combobox-or-text-field per suggestions
- `components/xroad/form/FormSection.vue` — accordion panel wrapper with chip slot
- `components/xroad/history/StatusTile.vue` — icon + label tile
- `components/xroad/history/IdentifierRow.vue` — labeled identifier row with optional warning

---

## What landed per item

### Audit items 1-18 + P0

**#1 — `XRoadRequestForm.vue` (473→241 LOC)** — Six expansion-panel blocks → `<FormSection>` rendered 6× with chip-slot per section. `navigateToStep` 35-line switch → `useFormStepNavigation` composable driven by a `STEP_DESTINATIONS` lookup table.

**#2a — `useKeyValueList(idPrefix)`** — Generic factory; queryParams + customHeaders use it. Shipped first as a slice of #2.

**#2b — `useXRoadForm` decomposition** — Dropped the `pendingFormChange` queue and `setupFormChangeWatcher`/`watchInitialRequest`/`initializeAfterMount` setup helpers. All callbacks now captured at construction (`options.onFormChange`, `options.errorsGetter`, `options.initialRequestGetter`, etc.); watchers wire up immediately. `getCurrentInstance()` guards `onMounted` so the composable still works under unit tests.

**#3 — `curl-parser` split** — Was a single 458-LOC file. Now `curl-parser/normalize.ts` (line continuations + index map), `curl-parser/tokenize.ts` (quote/escape state machine), `curl-parser/parse.ts` (X-Road URL + header semantics), `curl-parser/index.ts` (public surface). All consumers still `import { parseCurlCommand } from '@/utils/curl-parser'`.

**#4 — `ServiceSection.vue` fetcher lifted** — Inline debounced fetcher → `useServicesLoader` composable consumed by `XRoadRequestForm`. ServiceSection became a pure renderer receiving `availableServices` as a prop. Mirror state at `XRoadRequestForm.vue:62-63` deleted entirely. Uses P0 (`useDebounce`).

**#5 — `useFormCompleteness`** — Atomic completeness booleans now shared by `RequestProgressIndicator` and `RequestStatusPanel`. Each consumer composes the atoms it needs.

**#6 — `SubsystemField`** — Four near-identical 22-line combobox/text-field blocks in `SubsystemIdFields` → one `<SubsystemField>` rendered 4× from props. Cascading suggestion filters also collapsed via a `filterSuggestions(filters)` helper.

**#7 — `StatusTile` + `IdentifierRow`** — Three indicator tiles → `<StatusTile>` rendered via a `tiles` config array (plus a separate request-status tile, since it's tri-state). Two identifier rows → `<IdentifierRow>`.

**#8 — `XRoadView` dedup** — `buildCurrentRequest()` (23 lines of type laundering) → `currentRequestForPanel` computed (5 lines: cast `formData.value as XRoadRequest`, merge `certificates` if present). The hand-projected `<RequestStatusPanel>` props (lines 184-213) → straight passes with empty-object defaults.

**#9 — `coerceAxiosError` + `pickErrorMessage`** — Pure utilities pulled out of `useRequestExecutor.buildErrorResponse`; the executor now reads as orchestration.

**#10 — `CertificateSection` ternary** — The two nested ternaries computed `certificateLabel`/`certificateDescription` props that the modal never used. Both props deleted from modal and parent. Net delete.

**#11 — `useFileDrop`** — All 6 drag/drop/file-input handlers from `CertificateUploadModal` extracted. Modal script went from 100 lines to 55.

**#12 — `<TextareaWithErrorHighlight>`** — Three-segment highlight (`before`/`bad`/`after`) + textarea overlay CSS extracted into a reusable component. `CurlImportDialog` script went from 100 lines to 75.

**#13 — `safeLocalStorage` + `withStorageGuard`** — Adapter moved to `utils/safe-local-storage.ts`. Store-local `withStorageGuard(op, fn)` helper collapses the try/catch+drain pattern; add/delete/clear in `xroad-history` each became 3-4 lines.

**#14 — Shared cURL primitives** — `HTTP_METHODS`, `HttpMethod`, `BODY_METHODS`, `methodAllowsBody`, `shellSingleQuote`. Eliminated 4 sites with literal `'GET' | 'POST' | ...` arrays. Also fixed an unescaped single-quote bug in cURL header/URL interpolation.

**#15 — `METHOD_COLORS`** — 4-deep ternary collapsed; `methodColor()` available for any future method-chip surface.

**#16 — `setLocale` split** — 27-line function with 3 independent try/catch blocks → 5-line `setLocale` + module-level `persistLocale`, `applyDayjsLocale`, store-level `ensureLocaleLoaded` helpers.

**#17 — Composables barrel** — `composables/index.ts` now `export *`s all 11 composables. Five deep-path imports across the codebase flipped to the barrel. Also deduped `AlertType` (was identical in two composables; the executor now imports from notifications, a prerequisite for the `export *`).

**#18 — `HistoryList` alert pattern** — Two repeated mutation blocks collapsed into `runHistoryMutation(mutate, successKey, onSuccess?)`.

**P0 — `useDebounce(fn, ms)`** — Generic composable with onUnmount cleanup. Used by `useServiceDiscovery` (replacing its inline pattern) and `useServicesLoader` (#4).

---

## Composables surface (final)

11 composables exported via `@/composables`:

- `useCurlImport` (existed)
- `useDebounce` (new, P0)
- `useFileDrop` (new, #11)
- `useFormCompleteness` (new, #5)
- `useFormStepNavigation` (new, #1)
- `useKeyValueList` (new, #2a)
- `useNotifications` (existed)
- `useRequestExecutor` (existed)
- `useServiceDiscovery` (existed, refactored to use `useDebounce`)
- `useServicesLoader` (new, #4)
- `useXRoadForm` (existed, simplified via #2b)
- `useXRoadValidation` (existed)

## Utilities surface (final)

8 modules in `src/utils/`:

- `axios-error.ts` (new, #9)
- `curl-generator.ts` (existed, refactored via #14)
- `curl-parser/` (split via #3, was single file)
- `format.ts` (existed, untouched)
- `http-methods.ts` (new, #14 + #15)
- `safe-local-storage.ts` (new, #13)
- `shell-quote.ts` (new, #14)
- `xroad-url.ts` (existed, untouched)

---

## Verification gates passed throughout

After every single landed item:
- `pnpm type-check` → clean
- `pnpm test:run` → 242/242 passing
- Final `pnpm build` → clean

No test was modified or skipped. All existing behavior preserved; one latent bug fixed (#14 single-quote escape in cURL generator).
