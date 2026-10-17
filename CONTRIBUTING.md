# Contributing <!-- omit in toc -->

Conventions for working on this repo. For user-facing docs (what the app does, how to run the published image),
see [README.md](README.md).

## Table of Contents <!-- omit in toc -->

* [Prerequisites](#prerequisites)
* [Workflow](#workflow)
* [Local development](#local-development)
* [Testing](#testing)
  * [Backend](#backend)
  * [Frontend](#frontend)
  * [Code quality](#code-quality)
* [Pre-commit hooks](#pre-commit-hooks)
* [Commit messages](#commit-messages)
* [CI](#ci)
* [Dependencies](#dependencies)
* [Reporting issues](#reporting-issues)
* [License](#license)

<!-- TOC -->

## Prerequisites

- Java 25 (Temurin recommended)
- Node.js 24+ and pnpm 12+
- Docker (optional, for container builds)

## Workflow

1. Fork or branch off `main`.
2. Install pre-commit hooks before your first commit (see below).
3. Keep each PR focused; prefer small, atomic commits.
4. Open a PR against `main`, fill in the template, let CI pass.

## Local development

Hot-reload setup:

```bash
# Backend
./gradlew -x webapp

# Frontend (separate terminal)
cd src/main/webapp && pnpm dev
```

Open <http://localhost:9000> (frontend runs on 9000 in hot-reload mode).

Production build:

```bash
./gradlew -Pprod clean bootJar
java -jar build/libs/*.jar
```

## Testing

### Backend

```bash
./gradlew test                   # unit tests
./gradlew integrationTest        # integration tests
./gradlew test jacocoTestReport  # with coverage report
./gradlew check                  # tests + coverage >= 80% + checkstyle + spotbugs
```

Coverage report: `build/reports/jacoco/test/html/index.html`

### Frontend

```bash
cd src/main/webapp
pnpm test                # watch mode
pnpm test:run            # single run
pnpm test:coverage       # with coverage
```

Coverage report: `src/main/webapp/coverage/index.html`

### Code quality

```bash
# Backend (included in ./gradlew check)
./gradlew check

# Frontend
cd src/main/webapp
pnpm lint          # ESLint
pnpm lint:fix      # ESLint auto-fix
pnpm format:check  # Prettier check
pnpm format        # Prettier auto-format
pnpm type-check    # TypeScript
```

## Pre-commit hooks

[lefthook](https://lefthook.dev) runs lint and format checks on changed files before each commit. One-time setup:

```bash
brew install lefthook   # or your preferred installer
lefthook install
```

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/) is enforced on PR titles. Allowed types:

`feat` `fix` `chore` `refactor` `docs` `test` `ci` `build` `perf` `style` `revert`

Format:

```
<type>(<optional scope>): <short description>
```

Examples:

```
fix(gradle): mark gradlew scripts as -text to prevent CRLF regressions
chore(deps): bump javascript-minor-patch group
ci: add concurrency group
```

PR titles are validated by `.github/workflows/pr-title.yml`.

## CI

Two required status checks:

- `ci-success` aggregates backend/frontend lint, build, test, audit.
- `codeql-success` aggregates CodeQL static analysis.

Both skip gracefully for doc/meta-only PRs via internal path filtering.

A weekly schedule runs OWASP Dependency-Check (Mondays 09:00 UTC) and pnpm audit for CVEs disclosed between PRs.

## Dependencies

Dependabot opens weekly PRs for:

- Gradle plugins and libraries (grouped by minor/patch; Spring is its own group).
- npm packages in `src/main/webapp` (grouped by minor/patch).
- GitHub Actions, both workflow files and composite actions under `.github/actions/` (grouped by minor/patch).

Major-version bumps come as separate PRs; review before merging.

## Reporting issues

Open a GitHub issue with:

- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Java version, Node version, how you ran the app)
- Relevant logs

## License

By contributing you agree your contributions are licensed under the project's [MIT license](LICENSE).
