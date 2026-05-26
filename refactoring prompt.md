# Refactoring audit prompt

Audit the frontend codebase at `src/main/webapp/src/` for refactoring opportunities. Scope is **frontend only** — do not touch the backend (`src/main/java/`, etc.).

Apply this lens to every candidate, and rank by impact:

1. **Readability** — can a new contributor make sense of the file top-to-bottom?
2. **Reviewability** — can a reviewer hold the file in working memory during a PR review?
3. **Maintainability** — when a domain rule changes, is there one obvious place to edit?
4. **Best practice** — does it follow Vue 3 / Vuetify / TypeScript idioms (composables for stateful logic, components for rendering, types over `any`, etc.)?
5. **Common sense** — does the structure pass the smell test (no copy-pasted near-duplicates, no god-functions, no unused exports)?
6. **Testability** — can the logic be unit-tested in isolation, or does it require mounting a component?
7. **Reusability** — is there logic worth extracting because more than one consumer wants it (only if genuinely applicable; don't force this)?

Cover at least:

- All files in `src/views/` (top-level orchestrators).
- All files in `src/components/` (look for: components > ~150 LOC, deeply nested template logic, prop-drilling, repeated patterns across siblings).
- All files in `src/composables/` (look for: composables doing too many things, overlapping responsibilities, missing tests).
- All files in `src/stores/` (look for: store actions doing too much, derived state that should be `computed` getters, missing tests).
- All files in `src/utils/` and `src/services/` (look for: pure-function candidates buried inside components, large utility files that should split).

**Deliverable:** a ranked list of refactor candidates with one line per item: file path, what to extract/refactor, which objectives it improves, estimated complexity (small / medium / large). Do not make any code changes — just produce the list. We'll then pick which ones to do.

**Ignore:** anything with explicit TODOs deferred to later, anything in `__tests__/`, anything currently behind a feature flag.
