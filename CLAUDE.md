# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a JHipster 8.11.0 generated Spring Boot + React application designed as a **generic X-Road REST API client**. The application provides a single-page interface for testing any X-Road service without requiring user authentication or login. It is configured as a monolith with no database persistence.

**Key Configuration:**

- **Package:** `com.nortal.xroad.restapi.client`
- **Build Tool:** Gradle (Wrapper included)
- **Frontend:** React 18 with TypeScript, Redux Toolkit, Axios
- **Backend:** Spring Boot 3.x, Java 17/21/24, Undertow (not Tomcat)
- **Authentication:** None - publicly accessible, no login required
- **Languages:** English, French (i18n enabled)
- **Theme:** Cosmo (Bootswatch) with light/dark/system theme modes

## Development Commands

### Running the Application

**Development mode (recommended):**

```bash
# Terminal 1 - Backend only (skips frontend build)
./gradlew -x webapp

# Terminal 2 - Frontend dev server with hot reload
npm start
# or use the wrapper: ./npmw start
```

**Combined watch mode (single command):**

```bash
npm run watch
```

**Access:** http://localhost:8080

### Building

**Development build:**

```bash
./gradlew build
```

**Production build (JAR with optimized frontend):**

```bash
./gradlew -Pprod clean bootJar
```

**Production build (WAR):**

```bash
./gradlew -Pprod -Pwar clean bootWar
```

**Run production JAR:**

```bash
java -jar build/libs/*.jar
```

### Testing

**Backend tests only:**

```bash
./gradlew test                    # Unit tests only
./gradlew integrationTest         # Integration tests only
./gradlew test integrationTest    # All backend tests
```

**Frontend tests:**

```bash
npm test                          # Run Jest tests
npm run test:watch                # Watch mode
```

**Single test (backend):**

```bash
./gradlew test --tests "ClassName.methodName"
```

**Code coverage:**

```bash
./gradlew test integrationTest jacocoTestReport
# Report: build/reports/jacoco/test/html/index.html
```

### Code Quality

**Pre-Commit Hooks:**

This project enforces code quality automatically via **Husky + lint-staged** pre-commit hooks. See [PRE-COMMIT-HOOKS.md](PRE-COMMIT-HOOKS.md) for full documentation.

On every commit, the following checks run automatically on staged files:

- **TypeScript/TSX**: ESLint (with auto-fix) → TypeScript type checking → Prettier
- **JavaScript**: ESLint (with auto-fix) → Prettier
- **Java**: Checkstyle → Prettier
- **CSS/SCSS/Markdown/JSON/YAML**: Prettier

Commits are **blocked** if any check fails. This prevents:

- Unused imports/variables
- Type errors
- Code style violations
- Formatting inconsistencies

**Linting:**

```bash
npm run lint                      # Check issues
npm run lint:fix                  # Auto-fix
```

**Formatting:**

```bash
npm run prettier:check            # Check formatting
npm run prettier:format           # Auto-format all files
```

**Checkstyle:**

```bash
./gradlew checkstyleMain checkstyleTest
```

**Java Compiler Strictness:**

The Java compiler is configured with `-Xlint:all -Werror` to treat all warnings as errors. See [JAVA-COMPILER-OPTIONS.md](JAVA-COMPILER-OPTIONS.md) for complete documentation.

Enabled checks include:

- Unused imports, variables, and methods
- Raw types and unchecked operations
- Missing @Override annotations
- Deprecated API usage
- Unsafe casts and operations

**Manual Pre-Commit Check:**

```bash
npx lint-staged                   # Test pre-commit checks on staged files
```

### Managing Dependencies

**Frontend (use npm wrapper to ensure consistent versions):**

```bash
./npmw install                    # Install/update dependencies
./npmw install --save-exact <package>
./npmw install --save-dev --save-exact @types/<package>
```

**Backend:**
Edit `build.gradle` and add dependencies, then run:

```bash
./gradlew build --refresh-dependencies
```

## Architecture

### Backend Structure

```
src/main/java/com/nortal/xroad/restapi/client/
├── XRoadExampleRestapiClientApp.java  # Spring Boot entry point
├── config/                             # All @Configuration classes
│   ├── SecurityConfiguration.java      # Spring Security setup (public access)
│   ├── WebConfigurer.java              # Web/servlet config
│   ├── ApplicationProperties.java      # Custom application properties
│   └── ...
├── web/rest/                           # REST controllers (API endpoints)
│   └── errors/                         # Exception handling & error responses
├── security/                           # Security utilities (minimal - no auth)
│   ├── AuthoritiesConstants.java       # Role/authority constants
│   └── SecurityUtils.java              # Security helper methods
└── aop/logging/                        # Aspect-oriented logging
```

**X-Road specific code should go in:**

- `com.nortal.xroad.restapi.client.service.xroad/` - X-Road client services (HTTP client, request builder)
- `com.nortal.xroad.restapi.client.web.rest/` - X-Road proxy REST endpoint for frontend
- `com.nortal.xroad.restapi.client.config/` - mTLS/SSL configuration for Security Server connections

### Frontend Structure

```
src/main/webapp/app/
├── app.tsx                       # Root React component
├── index.tsx                     # Application entry point
├── routes.tsx                    # React Router configuration (minimal - single page app)
├── config/                       # Axios, Redux store, i18n config
│   ├── axios-interceptor.ts      # HTTP interceptor for errors
│   ├── store.ts                  # Redux store setup
│   └── translation.ts            # i18n configuration
├── modules/                      # Feature modules (pages)
│   ├── home/                     # Main X-Road client interface (single page)
│   └── xroad/                    # X-Road specific components
│       ├── request-builder/      # X-Road request configuration form
│       ├── response-viewer/      # Response display (raw/JSON/visual)
│       └── theme-switcher/       # Light/dark/system theme selector
├── shared/                       # Shared components & utilities
│   ├── layout/                   # Header, menus (minimal - no auth menus)
│   ├── reducers/                 # Redux slices (theme, locale, request state)
│   ├── error/                    # Error boundary & 404 page
│   └── util/                     # Utility functions (URL encoding, header builders)
└── entities/                     # Not used (no database entities)
```

### Configuration Files

**Spring profiles:**

- `src/main/resources/config/application.yml` - Base configuration
- `src/main/resources/config/application-dev.yml` - Development overrides
- `src/main/resources/config/application-prod.yml` - Production settings

**JHipster metadata:**

- `.yo-rc.json` - JHipster generator configuration (DO NOT manually edit)
- `.jhipster/*.json` - JDL entity definitions (for future entities)

## Key Design Decisions

### No Database

This application is configured **without** a database (`databaseType: "no"`) because it's designed as a generic API client for testing X-Road services. No data persistence is required - all request configuration can be stored in browser local storage.

### No Authentication

The application is **publicly accessible** with no login or authentication required. This is intentional to provide immediate access to the X-Road testing interface without user management overhead. All endpoints are public.

### Security Model

- **All endpoints are public:** No authentication or authorization required
- **Public endpoints:** All `/api/**`, `/management/health`, static assets, Swagger UI
- **No admin restrictions:** Management endpoints may be restricted via Spring profile configuration if needed for production deployment
- **CSRF protection:** May be disabled since there's no session or authentication state to protect
- **mTLS Security:** Security is handled at the X-Road Security Server level via client certificates when connecting to X-Road infrastructure

### Build Profiles

- **dev** (default): Live reload, source maps, verbose logging
- **prod** (`-Pprod`): Minified assets, optimized bundles, production logging
- **e2e** (`-Pe2e`): End-to-end testing profile

**Note**: This application runs on **HTTP only** (port 8080). mTLS security is handled at the X-Road Security Server level via client certificates provided per-request through the UI.

### Gradle Conventions

- Main class: `com.nortal.xroad.restapi.client.XRoadExampleRestapiClientApp`
- Default task: `bootRun`
- Use `-x webapp` to skip frontend build during backend-only development
- Test tasks exclude `*IT*` and `*IntTest*` from unit tests (run separately via `integrationTest`)

## X-Road Generic REST Client Architecture

This application provides a **single-page interface** for testing any X-Road service. The architecture follows these principles:

### Backend Responsibilities

1. **HTTP Proxy Endpoint** (`web/rest/XRoadProxyResource.java`):

   - Accept generic request configuration from frontend (headers, body, method, URL)
   - Build X-Road compliant HTTP requests with proper headers (X-Road-Client, X-Road-Service, etc.)
   - Forward requests to configured X-Road Security Server
   - Return full HTTP response (status, headers, body) to frontend

2. **mTLS Configuration** (`config/XRoadClientConfiguration.java`):

   - Configure SSL context with client certificates for Security Server connections
   - Support keystore/truststore configuration via `application.yml`
   - Handle certificate-based authentication transparently

3. **Request Builder Service** (`service/xroad/XRoadRequestBuilder.java`):
   - Construct X-Road-compliant URLs: `/r1/{serviceId}/{path}?{query}`
   - Build required headers from user input (X-Road-Client from instance/class/code/subsystem)
   - Validate identifier character sets per X-Road protocol
   - URL-encode paths and query parameters per RFC 3986

### Frontend Responsibilities

1. **Request Configuration Form** (`modules/xroad/request-builder/`):

   - Input fields for all X-Road identifier components
   - HTTP method selector (GET/POST/PUT/DELETE)
   - Optional headers, query params, request body
   - Validation of required fields and character sets

2. **Response Viewer** (`modules/xroad/response-viewer/`):

   - Display HTTP status code and headers
   - Toggle between Raw and JSON display modes
   - Syntax highlighting for JSON responses
   - Visual representation (tree/graph) for complex JSON
   - Special handling for X-Road-Error headers

3. **Theme Management** (`modules/xroad/theme-switcher/`):
   - Cosmo theme with light/dark variants
   - System theme detection and following
   - Persistent theme preference in localStorage
   - Dynamic syntax highlighting color adjustment

### Configuration

Certificate and Security Server URLs should be externalized via `ApplicationProperties`:

```yaml
# application.yml
application:
  xroad:
    security-server-url: https://securityserver.example.com
    client-certificate:
      keystore-path: /path/to/keystore.p12
      keystore-password: ${KEYSTORE_PASSWORD}
      key-alias: client-cert
```

## Docker Support

**Build Docker image:**

```bash
npm run java:docker              # Standard amd64 image
npm run java:docker:arm64        # For Apple Silicon
```

**Run with Docker Compose:**

```bash
docker compose -f src/main/docker/app.yml up -d
```

**Other Docker utilities:**

- `src/main/docker/jhipster-control-center.yml` - JHipster Control Center
- `src/main/docker/monitoring.yml` - Prometheus/Grafana stack
- `src/main/docker/sonar.yml` - SonarQube code analysis

## JHipster-Specific Conventions

### Code Generation

DO NOT manually modify files with "jhipster-needle" comments. These are markers for JHipster generators to inject code. If you need to regenerate entities or add features, use JHipster sub-generators.

### Entities

To add JPA entities in the future (if database is enabled):

```bash
jhipster entity <EntityName>
```

This generates JPA entities, REST resources, React CRUD UI, and tests.

### Updating JHipster

If upgrading JHipster version, regenerate the project and carefully merge changes:

```bash
jhipster upgrade
```

## Reference Documentation

- **JHipster 8.11.0 Docs:** https://www.jhipster.tech/documentation-archive/v8.11.0
- **Spring Boot Reference:** https://docs.spring.io/spring-boot/reference/
- **React Documentation:** https://react.dev/
- **Redux Toolkit:** https://redux-toolkit.js.org/
- **X-Road REST Protocol:** https://docs.x-road.global/Protocols/pr-rest_x-road_message_protocol_for_rest.html

## Recent Changes

- 001-xroad-generic-rest-client: Added Java 17+ (Spring Boot 3.x), TypeScript 5.8.3 (React 18.3.1)
- 001-xroad-generic-rest-client: Added [if applicable, e.g., PostgreSQL, CoreData, files or N/A]

## Active Technologies

- Java 17+ (Spring Boot 3.x), TypeScript 5.8.3 (React 18.3.1) (001-xroad-generic-rest-client)
- No database - localStorage for frontend persistence, no backend persistence (001-xroad-generic-rest-client)
