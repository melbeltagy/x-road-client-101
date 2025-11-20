<!--
Sync Impact Report:
- Version change: Initial → 1.0.0
- Ratification: 2025-11-18 (initial adoption)
- Principles established: 5 core + 2 supplementary sections
- Templates requiring updates:
  ✅ constitution.md (created)
  ⚠ plan-template.md (review for constitution compliance checks)
  ⚠ spec-template.md (add constitution reference section)
  ⚠ tasks-template.md (ensure task categories align with principles)
- Follow-up TODOs: None - all placeholders filled
-->

# X-Road Generic REST Client Constitution

## Core Principles

### I. Pure Data Transfer Objects (Records)

All Data Transfer Objects (DTOs) MUST be implemented as immutable Java Records with NO business logic, conversion methods, or factory methods. DTOs serve exclusively as data carriers.

**Non-Negotiable Rules:**

- DTOs contain only fields and validation annotations
- NO static factory methods (e.g., `fromEntity()`, `toDto()`)
- NO instance methods beyond record defaults
- Conversion logic belongs in the service layer via MapStruct mappers

**Rationale:** Separation of concerns ensures DTOs remain pure data structures while keeping conversion/mapping logic testable, maintainable, and centralized in dedicated mapper classes. Java Records provide immutability and reduce boilerplate.

### II. No Database Persistence

This application MUST NOT use any database or JPA persistence. All data is ephemeral or persisted in browser localStorage only.

**Non-Negotiable Rules:**

- JHipster configuration: `databaseType: "no"`
- NO JPA entities, repositories, or database configuration
- NO server-side persistence beyond in-memory caching
- Browser localStorage for form drafts, request history, theme preference
- Sensitive data (PEM certificates, credentials) MUST NOT be persisted

**Rationale:** Application is a stateless REST client tool. Database persistence adds unnecessary complexity, deployment dependencies, and security risks without providing value for the use case.

### III. Validation Standards

All user inputs MUST follow hybrid validation timing and display standardized placeholder examples.

**Non-Negotiable Rules:**

- **Format/pattern validation:** Display errors on blur (when field loses focus)
- **Required field validation:** Display errors only on form submit
- **Placeholder text:** ALL input fields MUST show example values when empty
- **X-Road identifier patterns:** Strictly enforced via `@Pattern` annotations and frontend regex

**X-Road Identifier Patterns:**

```regex
instanceId:     ^[A-Z0-9]{2,}$
memberClass:    ^[A-Z0-9]+$
memberCode:     ^[A-Z0-9-]+$
subsystemCode:  ^[A-Za-z0-9]+$
serviceCode:    ^[A-Za-z0-9]+$
serviceVersion: ^v?[0-9]+(\.[0-9]+)*$
securityServerUrl: ^https?://.*$
```

**Rationale:** Hybrid validation reduces user friction (format errors caught early, required errors deferred until intentional submit). Placeholders improve discoverability and reduce documentation dependency. X-Road patterns ensure protocol compliance.

### IV. Security First

Security-sensitive data MUST be handled with explicit protections. Credentials and certificates MUST NOT be persisted beyond the current session.

**Non-Negotiable Rules:**

- PEM certificates and private keys NEVER persisted to localStorage or any client storage
- Security Server URLs MUST validate protocol (http/https only via regex `^https?://.*$`)
- mTLS configuration is optional and user-provided per request
- NO authentication required for application access (public tool)
- All X-Road requests use user-specified Security Server URL (no hardcoded endpoints)

**Rationale:** Application handles sensitive X-Road credentials. Persisting certificates creates security risk. Per-request mTLS configuration allows testing multiple environments without credential storage. No authentication simplifies deployment and usage for testing/development scenarios.

### V. UI/UX Consistency

User interface MUST follow consistent patterns for forms, theming, loading states, and data organization.

**Non-Negotiable Rules:**

- **Theme:** Cosmo (Bootswatch) with three modes: Light, Dark, System (persisted to localStorage)
- **Form Organization:** Logical sections with individual "Clear" buttons per section
- **Key-Value Inputs:** Dynamic input pairs with Add (+) and Remove (×) buttons
- **File Inputs:** Drag-and-drop zone + manual paste (not file upload dialogs)
- **Loading States:** Inline spinner next to action button, button text changes to "...ing", button disabled
- **Validation Feedback:** Errors displayed inline below field with red styling

**Rationale:** Consistency reduces cognitive load. Users learn patterns once and apply them throughout. Cosmo theme provides excellent light/dark mode support. Inline loading states keep form visible and don't block user review. Drag-and-drop improves UX for certificate/file inputs.

## Tech Stack & Architecture

### Backend

**MUST use:**

- **JHipster:** 8.11.0 (generator baseline)
- **Java:** 17+ (21 or 24 recommended for newer language features)
- **Spring Boot:** 3.x (as provided by JHipster)
- **Build Tool:** Gradle with wrapper (`./gradlew`)
- **Web Server:** Undertow (NOT Tomcat)
- **HTTP Client:** WebClient (reactive, NOT RestTemplate)
- **DTO Mapping:** MapStruct 1.5.5.Final with Spring component model
- **Validation:** Jakarta Bean Validation (JSR 380)
- **JSON Processing:** Jackson (Spring Boot default)

**MUST NOT use:**

- JPA, Hibernate, or any ORM
- RestTemplate (deprecated, use WebClient)
- Manual DTO mapping (use MapStruct)

### Frontend

**MUST use:**

- **React:** 18.3.1 with TypeScript 5.8.3
- **State Management:** Redux Toolkit
- **Form Handling:** React Hook Form (supports nested paths with dot notation)
- **HTTP Client:** Axios with interceptors
- **Styling:** Bootstrap 5.3+ with Cosmo theme (Bootswatch)
- **Theme Toggle:** Custom implementation with localStorage persistence

**MUST NOT use:**

- Class components (function components with hooks only)
- Inline styles (use CSS/SCSS modules or Bootstrap classes)
- Direct localStorage access outside Redux middleware

### Build & Development

**MUST follow:**

- **Development Mode:** Two terminals (backend: `./gradlew -x webapp`, frontend: `npm start`)
- **Code Formatting:** Prettier for frontend, Checkstyle for backend
- **Linting:** ESLint with TypeScript support
- **Testing:** Jest (frontend), JUnit 5 (backend), Jacoco for coverage
- **Git Hooks:** Pre-commit for linting/formatting (optional but recommended)

## Data Model Standards

### Record Structure

All DTOs MUST follow this pattern:

```java
public record ExampleDto(
  @NotBlank String requiredField,
  @Pattern(regexp = "^pattern$") String validatedField,
  @Valid NestedDto nested,
  String optionalField
) {
  // Compact constructor ONLY for default value initialization
  public ExampleDto {
    if (optionalField == null) {
      optionalField = "default";
    }
  }
}

```

### Nested Validation

Nested DTOs MUST use `@Valid` annotation to enable cascading validation:

```java
public record ParentDto(
  @NotNull @Valid ChildDto child // Validates child fields
) {}

```

### MapStruct Mappers

All DTO conversions MUST use MapStruct with Spring component model:

```java
@Mapper(componentModel = "spring")
public interface ExampleMapper {
  ExampleDto toDto(SourceType source);

  // Custom mapping methods as default methods when needed
  default String customMapping(ComplexType complex) {
    // conversion logic
  }
}

```

**Service Layer Integration:**

```java
@Service
public class ExampleService {

  private final ExampleMapper mapper;

  public ExampleService(ExampleMapper mapper) {
    this.mapper = mapper;
  }

  public ExampleDto convert(SourceType source) {
    return mapper.toDto(source);
  }
}

```

### TypeScript Interfaces

Frontend interfaces MUST mirror backend DTO structure exactly:

```typescript
// Mirrors Java ExampleDto
export interface Example {
  requiredField: string;
  validatedField: string;
  nested: NestedDto;
  optionalField?: string;
}
```

**Naming Convention:**

- Java: `*Dto` suffix (e.g., `XRoadRequestDTO`)
- TypeScript: No suffix, PascalCase (e.g., `XRoadRequest`)

## Documentation Standards

All project documentation MUST follow consistent formatting and organizational standards to ensure maintainability and discoverability.

### Table of Contents Requirement

**All Markdown files MUST include a table of contents** when they contain more than 3 sections (## headings).

**Non-Negotiable Rules:**

- Use `<!-- TOC -->` markers to denote TOC boundaries (IDE-compatible format)
- TOC MUST appear after the document header and before the first content section
- TOC MUST use hierarchical bullet structure with anchor links
- TOC entries MUST match actual heading text and levels
- Templates (`spec-template.md`, `plan-template.md`, `tasks-template.md`) already include TOCs - use as reference

**Format:**

```markdown
# Document Title

**Metadata fields**

## Table of Contents

<!-- TOC -->

- [Document Title](#document-title)
  - [Table of Contents](#table-of-contents)
  - [Section 1](#section-1)
    - [Subsection 1.1](#subsection-11)
  - [Section 2](#section-2)
  <!-- TOC -->

---

## Section 1

...
```

**Rationale:** Table of contents improves navigation in long documents, provides document structure at a glance, and enables IDE/editor outline features. Consistent TOC format across all documentation reduces cognitive load.

**Exceptions:**

- README.md files shorter than 100 lines may omit TOC
- Single-section documents (< 4 headings) may omit TOC
- Auto-generated API documentation

## Governance

### Constitution Authority

This constitution supersedes all other development practices, coding standards, and architectural decisions. When conflicts arise between this document and other guidance:

1. Constitution takes precedence
2. Update conflicting documentation to align with constitution
3. If constitution is wrong, amend it first, then update implementation

### Amendment Process

**Minor amendments** (clarifications, examples, non-semantic wording):

1. Propose change in PR description
2. Update constitution.md with PATCH version bump
3. Update `LAST_AMENDED_DATE` to today
4. Merge requires 1 approval

**Major amendments** (new principles, removing principles, breaking changes):

1. Create RFC document explaining rationale and migration impact
2. Team discussion/approval required
3. Update constitution.md with MAJOR or MINOR version bump
4. Update all dependent templates, specs, and documentation
5. Create migration tasks for affected features
6. Merge requires team consensus

### Compliance Verification

**All feature specs MUST:**

- Reference this constitution in the header (`**Follows**: Project Constitution v1.0.0`)
- Explicitly justify any deviations (with rationale and approval)
- Align functional requirements with established principles

**All code reviews MUST verify:**

- DTOs are pure records (no business logic)
- MapStruct used for conversions
- Validation patterns match constitution standards
- Security principles followed (no credential persistence)
- UI/UX patterns consistent with established standards

**Pull request checklist:**

- [ ] No DTO conversion methods (use MapStruct)
- [ ] No database dependencies added
- [ ] Validation follows hybrid timing (format on blur, required on submit)
- [ ] Sensitive data not persisted to localStorage
- [ ] UI patterns match established standards (theme, forms, loading states)
- [ ] TypeScript interfaces mirror Java DTOs
- [ ] All markdown files include TOC (if > 3 sections)

### Development Guidance

For runtime development guidance and AI agent instructions, see `CLAUDE.md`. This file provides:

- Project overview and context
- Development commands and workflows
- Architecture patterns and package structure
- JHipster-specific conventions

**Version**: 1.1.0 | **Ratified**: 2025-11-18 | **Last Amended**: 2025-11-18
