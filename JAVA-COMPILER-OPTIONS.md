# Java Compiler Options

This project uses strict Java compiler settings to catch errors early and enforce code quality.

## Configuration Location

**File:** `build.gradle`

```groovy
tasks.withType(JavaCompile).configureEach {
    options.compilerArgs += [
        '-Xlint:all',           // Enable all recommended warnings
        '-Xlint:-processing',   // Disable annotation processing warnings
        '-Xlint:-serial',       // Disable serialization warnings
        '-Werror'               // Treat all warnings as errors
    ]

    options.deprecation = true
    options.encoding = 'UTF-8'
    options.incremental = true
}
```

## What Gets Checked

### `-Xlint:all` - Enable All Recommended Warnings

This enables comprehensive compile-time checks for common issues. The following categories are included:

#### 1. **cast** - Unnecessary or unsafe casts

```java
// ❌ Will fail compilation
String s = (String) "hello"; // Unnecessary cast

// ✅ Correct
String s = "hello";

```

#### 2. **classfile** - Issues reading class files

- Detects corrupted or incompatible class files
- Version mismatches between compiled classes

#### 3. **deprecation** - Use of deprecated APIs

```java
// ❌ Will fail compilation
Date d = new Date(2024, 1, 1); // Constructor deprecated

// ✅ Correct
LocalDate d = LocalDate.of(2024, 1, 1);

```

#### 4. **divzero** - Division by zero

```java
// ❌ Will fail compilation
int x = 10 / 0; // Constant division by zero

// ✅ Correct
int x = 10 / y; // Only checked at runtime

```

#### 5. **empty** - Empty statements

```java
// ❌ Will fail compilation
if (condition);  // Empty statement
    doSomething();

// ✅ Correct
if (condition) {
    doSomething();
}
```

#### 6. **fallthrough** - Switch case fallthrough

```java
// ❌ Will fail compilation
switch (x) {
    case 1:
        doOne();
        // Missing break - falls through to case 2
    case 2:
        doTwo();
        break;
}

// ✅ Correct
switch (x) {
    case 1:
        doOne();
        break;
    case 2:
        doTwo();
        break;
}
```

#### 7. **finally** - Finally blocks that don't complete normally

```java
// ❌ Will fail compilation
try {
    return 1;
} finally {
    return 2;  // Finally block overrides return value
}

// ✅ Correct
try {
    return 1;
} finally {
    cleanup();  // No control flow statements
}
```

#### 8. **module** - Module system issues

- Module path problems
- Module-info.java errors

#### 9. **opens** - Module opens directives

- Issues with module accessibility

#### 10. **options** - Problematic compiler options

- Detects incompatible or deprecated compiler flags

#### 11. **overloads** - Varargs method overloading issues

```java
// ❌ Will fail compilation
void method(Object... args) {}

void method(String... args) {} // Ambiguous overload

// ✅ Correct
void method(Object... args) {}

void methodForStrings(String... args) {}

```

#### 12. **overrides** - Missing @Override annotations

```java
// ❌ Will fail compilation
class Child extends Parent {

  public void doSomething() { // Missing @Override
    // ...
  }
}

// ✅ Correct
class Child extends Parent {

  @Override
  public void doSomething() {
    // ...
  }
}

```

#### 13. **path** - Classpath/modulepath issues

- Missing dependencies
- Duplicate classes
- Invalid path entries

#### 14. **rawtypes** - Raw type usage

```java
// ❌ Will fail compilation
List list = new ArrayList(); // Raw type

// ✅ Correct
List<String> list = new ArrayList<>();

```

#### 15. **removal** - Use of APIs marked for removal

```java
// ❌ Will fail compilation
@Deprecated(forRemoval=true)
void oldMethod() {}

// Usage triggers error
oldMethod();
```

#### 16. **requires-automatic** - Automatic modules in requires directives

- Warns about unstable automatic module dependencies

#### 17. **requires-transitive-automatic** - Transitive automatic modules

- Warns about transitive dependencies on automatic modules

#### 18. **static** - Static access issues

```java
// ❌ Will fail compilation
instance.staticMethod();  // Accessing static via instance

// ✅ Correct
ClassName.staticMethod();
```

#### 19. **try** - Try-with-resources issues

```java
// ❌ Will fail compilation
try (Resource r = null) {  // Null resource
    // ...
}

// ✅ Correct
try (Resource r = new Resource()) {
    // ...
}
```

#### 20. **unchecked** - Unchecked operations

```java
// ❌ Will fail compilation
List<String> list = new ArrayList();
list.add("test");  // Unchecked operation

// ✅ Correct
List<String> list = new ArrayList<>();
list.add("test");
```

#### 21. **varargs** - Varargs with non-reifiable types

```java
// ❌ Will fail compilation
@SafeVarargs // Missing for generic varargs
void method(List<String>... lists) {}

// ✅ Correct
@SafeVarargs
final void method(List<String>... lists) {}

```

#### 22. **preview** - Preview language features

- Warns when using --enable-preview features

### Disabled Checks

#### `-Xlint:-processing` - Annotation Processing

**Why disabled:** MapStruct and other annotation processors generate warnings that we can't control.

```java
// MapStruct generates code that might trigger processing warnings
@Mapper(componentModel = "spring")
public interface XRoadResponseMapper {
  // Annotation processor generates implementation
}

```

#### `-Xlint:-serial` - Serialization

**Why disabled:** Not critical for this REST API project. We don't serialize Java objects directly.

```java
// This would trigger serialization warnings if enabled
public class CustomException extends RuntimeException {
  // Missing serialVersionUID - OK for our use case
}

```

### `-Werror` - Treat Warnings as Errors

**Impact:** Any warning from enabled lint checks will **fail the build**.

**Benefits:**

- Forces immediate fixes
- Prevents warning accumulation
- Ensures consistent code quality
- Catches issues during development, not in production

**Example:**

```bash
# Before -Werror:
warning: [unchecked] unchecked call to add(E)
BUILD SUCCESSFUL

# After -Werror:
error: warnings found and -Werror specified
BUILD FAILED
```

## Additional Compiler Options

### `options.deprecation = true`

Shows detailed information about deprecated API usage, including:

- Which deprecated API is being used
- Where it's declared
- When it was deprecated

### `options.encoding = 'UTF-8'`

Ensures all source files are read as UTF-8, preventing encoding issues across different systems.

### `options.incremental = true`

Enables incremental compilation for faster builds by only recompiling changed files.

## Impact on Development

### What Breaks the Build

The following will now **fail compilation**:

```java
// ✗ Unused imports
import java.util.HashMap; // Not used anywhere

// ✗ Unnecessary casts
String s = (String) "hello";

// ✗ Raw types
List list = new ArrayList();

// ✗ Missing @Override
public void toString() {
  return "";
}

// ✗ Deprecated APIs
Date d = new Date(2024, 1, 1);

// ✗ Unchecked operations
List<String> list = new ArrayList();

```

### What Passes Compilation

```java
// ✓ No unused imports
import java.util.List;

// ✓ No unnecessary casts
String s = "hello";

// ✓ Generic types specified
List<String> list = new ArrayList<>();

// ✓ @Override annotation
@Override
public String toString() {
  return "";
}

// ✓ Modern APIs
LocalDate d = LocalDate.of(2024, 1, 1);

// ✓ Type-safe operations
List<String> list = new ArrayList<>();

```

## Testing

### Verify Strict Compilation

```bash
# Clean build with strict checks
./gradlew clean build

# Should fail if any warnings exist
# Should succeed if code is warning-free
```

### Common Fixes

**Unused imports:**

```bash
# Most IDEs can auto-remove
IntelliJ: Code → Optimize Imports (Ctrl+Alt+O)
```

**Raw types:**

```java
// Before
List list = new ArrayList();

// After
List<String> list = new ArrayList<>();

```

**Missing @Override:**

```java
// Before
public void method() {}

// After
@Override
public void method() {}

```

**Deprecated APIs:**

```bash
# Check deprecation details
./gradlew compileJava --warning-mode all
```

## CI Integration

These compiler options ensure that:

1. **Local builds match CI builds** - Same strictness everywhere
2. **No warnings accumulate** - Build fails immediately
3. **Code quality is enforced** - Not optional

## Disabling for Specific Code (Not Recommended)

If absolutely necessary, you can suppress specific warnings:

```java
@SuppressWarnings("unchecked")
public void legacyMethod() {
  // Unchecked operations allowed here
}

```

**⚠️ Use sparingly!** Suppressions bypass the safety net these checks provide.

## Recommended Workflow

1. **Write code** in your IDE with auto-import and auto-format
2. **Build locally** - `./gradlew build`
3. **Fix warnings immediately** - Don't let them accumulate
4. **Commit** - Pre-commit hooks will catch any missed warnings
5. **Push** - CI will verify strict compilation

## Benefits

✅ **Catches bugs early** - Many runtime errors become compile errors
✅ **Enforces best practices** - Modern Java idioms required
✅ **Consistent codebase** - Everyone follows the same rules
✅ **Self-documenting** - @Override makes intent clear
✅ **Future-proof** - No deprecated API usage
✅ **Type-safe** - No raw types or unchecked operations

## References

- [Java Compiler Options](https://docs.oracle.com/en/java/javase/17/docs/specs/man/javac.html)
- [Xlint Options Explained](https://docs.oracle.com/en/java/javase/17/docs/specs/man/javac.html#option-Xlint)
- [Oracle Java Warnings Guide](https://docs.oracle.com/javase/tutorial/java/generics/gentypes.html)
