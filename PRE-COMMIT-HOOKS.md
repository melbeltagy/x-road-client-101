# Pre-Commit Hooks Configuration

This project uses **Husky** and **lint-staged** to enforce code quality checks before commits are allowed.

## What Runs on Every Commit

When you run `git commit`, the following checks are **automatically executed** on staged files:

### TypeScript/TSX Files (`*.ts`, `*.tsx`)

1. **ESLint** - Linting with auto-fix enabled
   - Catches unused imports, unused variables, code style issues
   - Fails on warnings (`--max-warnings=0`)
2. **TypeScript Type Checking** - Compiles without emitting files
   - Validates types across the entire project
   - Catches type errors that IDE might miss
3. **Prettier** - Code formatting
   - Ensures consistent code style

### JavaScript Files (`*.js`, `*.cjs`, `*.mjs`)

1. **ESLint** - Linting with auto-fix enabled
2. **Prettier** - Code formatting

### Java Files (`*.java`)

1. **Checkstyle** - Java code quality checks
   - Runs `./gradlew checkstyleMain checkstyleTest`
   - Validates Google Java Style conventions
2. **Prettier** - Code formatting (with Java plugin)

**Additional Java Compiler Strictness:**

The Java compiler is configured with strict lint checks that treat warnings as errors:

- `-Xlint:all` - Enable all recommended warnings
- `-Werror` - Treat all warnings as errors
- Catches: unused imports, unchecked operations, deprecated API usage, missing overrides, etc.
- These checks run during `compileJava` and `compileTestJava` tasks

### CSS/SCSS Files (`*.css`, `*.scss`)

1. **Prettier** - Code formatting only

### Other Files (`*.md`, `*.json`, `*.yml`, `*.html`)

1. **Prettier** - Code formatting only

## How It Works

### Pre-Commit Hook

Location: `.husky/pre-commit`

```bash
lint-staged
```

This runs the lint-staged tool which processes staged files according to the rules in `.lintstagedrc.cjs`.

### Lint-Staged Configuration

Location: `.lintstagedrc.cjs`

Defines which tools run on which file types:

- TypeScript/TSX: ESLint → TypeScript → Prettier
- JavaScript: ESLint → Prettier
- Java: Checkstyle → Prettier
- CSS/SCSS: Prettier only
- Other: Prettier only

### ESLint Configuration

Location: `eslint.config.mjs`

Key rules enforced:

- **No unused variables** - `@typescript-eslint/no-unused-vars: error`
- **No unused imports** - Automatically detected and flagged
- **Prefer const** - Variables that aren't reassigned must use `const`
- **No console.log** - Only `console.warn` and `console.error` allowed
- **Complexity limit** - Functions over complexity 40 trigger warnings

## Bypassing Hooks (Not Recommended)

In emergency situations, you can bypass pre-commit hooks:

```bash
git commit --no-verify -m "Emergency commit message"
```

**⚠️ Warning**: This should only be used in exceptional circumstances. All bypassed commits should be cleaned up immediately after the emergency.

## Manual Validation

You can manually run the same checks that pre-commit hooks run:

### Check All Files (Not Just Staged)

```bash
# Frontend linting
npm run lint

# Frontend linting with auto-fix
npm run lint:fix

# Prettier check
npm run prettier:check

# Prettier auto-format
npm run prettier:format

# Java Checkstyle
./gradlew checkstyleMain checkstyleTest

# TypeScript type checking
npx tsc --noEmit
```

### Test Pre-Commit Hook Manually

```bash
npx lint-staged
```

This runs lint-staged on currently staged files without committing.

## Common Issues and Fixes

### Issue: "ESLint found too many warnings"

**Cause**: ESLint is configured with `--max-warnings=0`, so any warning blocks the commit.

**Fix**: Run `npm run lint:fix` to auto-fix issues, then manually fix remaining warnings.

### Issue: "TypeScript compilation errors"

**Cause**: Type errors in your code that IDE might not have caught.

**Fix**:

1. Run `npx tsc --noEmit` to see all type errors
2. Fix type errors in your code
3. Stage the fixes and commit again

### Issue: "Checkstyle violations"

**Cause**: Java code doesn't follow Google Java Style conventions.

**Fix**:

1. Run `./gradlew checkstyleMain checkstyleTest` to see violations
2. Fix violations manually or use IntelliJ's "Reformat Code" with Google Java Style
3. Stage the fixes and commit again

### Issue: "Prettier wants to format files differently"

**Cause**: Code doesn't match Prettier's formatting rules.

**Fix**: Run `npm run prettier:format` to auto-format all files.

## Configuration Files

- **`.husky/pre-commit`** - Husky pre-commit hook script
- **`.lintstagedrc.cjs`** - Lint-staged configuration (what runs on which files)
- **`eslint.config.mjs`** - ESLint rules and settings
- **`.prettierrc`** - Prettier formatting rules (if exists)
- **`config/checkstyle/checkstyle.xml`** - Java Checkstyle rules

## Disabling Hooks Temporarily

If you need to disable hooks while developing:

```bash
# Disable hooks
git config core.hooksPath /dev/null

# Re-enable hooks
git config core.hooksPath .husky
```

**⚠️ Important**: Always re-enable hooks before pushing code!

## Benefits

✅ **Catches errors early** - Before code review, not after
✅ **Consistent code style** - Automated formatting ensures team consistency
✅ **Reduces CI failures** - Same checks run locally and in CI
✅ **Faster code reviews** - Reviewers focus on logic, not style
✅ **Prevents bad commits** - Type errors and unused code caught immediately

## CI Integration

The same checks run in CI pipelines. Pre-commit hooks ensure you won't push code that fails CI checks.

**CI Equivalents:**

- Frontend CI: `npm run ci:frontend:test` (includes lint + tests)
- Backend CI: `npm run ci:backend:test` (includes checkstyle + tests)

## Troubleshooting

### Hooks not running

1. Verify husky is installed: `npm run prepare`
2. Check hook file exists: `ls -la .husky/pre-commit`
3. Ensure hook is executable: `chmod +x .husky/pre-commit`
4. Verify git hooks path: `git config core.hooksPath` (should show `.husky`)

### Hooks running but failing unexpectedly

1. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
2. Clear Gradle cache: `./gradlew clean`
3. Verify you're on latest dependencies: `npm install`

### Performance issues (hooks too slow)

If pre-commit hooks are taking too long:

1. Use partial commits: `git add -p` to stage only specific changes
2. Ensure your IDE isn't running competing background processes
3. Consider increasing TypeScript's `incremental` compilation setting

## Questions?

For issues with pre-commit hooks, check:

1. This documentation
2. Husky docs: https://typicode.github.io/husky/
3. lint-staged docs: https://github.com/okonet/lint-staged
