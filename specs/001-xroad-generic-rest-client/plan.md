# Implementation Plan: X-Road Generic REST Client

**Branch**: `001-xroad-generic-rest-client` | **Date**: 2025-11-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-xroad-generic-rest-client/spec.md`

## Table of Contents

<!-- TOC -->

- [Implementation Plan: X-Road Generic REST Client](#implementation-plan-x-road-generic-rest-client)
  - [Table of Contents](#table-of-contents)
  - [Summary](#summary)
  - [Technical Context](#technical-context)
  - [Constitution Check](#constitution-check)
  - [Project Structure](#project-structure)
    - [Documentation (this feature)](#documentation-this-feature)
    - [Source Code (repository root)](#source-code-repository-root)
  - [Complexity Tracking](#complexity-tracking)
  - [Phase 0: Research Findings](#phase-0-research-findings)
    - [Key Decisions](#key-decisions)
  - [Phase 1: Design Artifacts](#phase-1-design-artifacts)
    - [Data Model](#data-model)
    - [API Contracts](#api-contracts)
    - [Developer Quick Start](#developer-quick-start)
  - [Phase 2: Implementation Plan](#phase-2-implementation-plan)
    - [Prerequisites](#prerequisites)
    - [Implementation Phases](#implementation-phases)
    - [Implementation Order Summary](#implementation-order-summary)
  - [Testing Strategy](#testing-strategy)
    - [Unit Tests (Backend)](#unit-tests-backend)
    - [Integration Tests (Backend)](#integration-tests-backend)
    - [Component Tests (Frontend)](#component-tests-frontend)
    - [E2E Tests (Optional)](#e2e-tests-optional)
  - [Deployment](#deployment)
    - [Development](#development)
    - [Production](#production)
    - [Docker](#docker)
  - [Monitoring & Observability](#monitoring--observability)
  - [Security Considerations](#security-considerations)
  - [Performance Optimization](#performance-optimization)
  - [Next Steps After Implementation](#next-steps-after-implementation)
  <!-- TOC -->

---

## Summary

Build a single-page generic X-Road REST client that allows users to test any X-Road service without authentication. The application provides a form-based interface for constructing X-Road requests, displays responses in multiple formats (Raw/JSON/Tree), and supports light/dark theme switching. Backend proxies requests to X-Road Security Server with mTLS support.

**Key Features**:

- No authentication required (publicly accessible)
- Form-based X-Road request configuration
- Spring Boot proxy with mTLS to Security Server
- Response viewing: Raw text, formatted JSON
- Cosmo theme with light/dark/system modes
- Request history with localStorage persistence

---

## Technical Context

**Language/Version**: Java 17+ (Spring Boot 3.x), TypeScript 5.8.3 (React 18.3.1)
**Primary Dependencies**:

- **Backend**: Spring Boot 3.x, Spring WebFlux (WebClient), Spring Boot SSL Bundles, Undertow
- **Frontend**: React 18.3.1, Redux Toolkit 2.8.0, React Hook Form 7.56.2, react-json-view-lite 2.4.1, Reactstrap 9.2.3, Axios 1.9.0
  **Storage**: No database - localStorage for frontend persistence, no backend persistence
  **Testing**: JUnit 5, Mockito, Jest, React Testing Library
  **Target Platform**: Web (JHipster monolith - Spring Boot + React SPA)
  **Project Type**: web (backend + frontend monolith)
  **Performance Goals**: <90s to construct request, <2s response display, <1s JSON formatting for 1MB
  **Constraints**: No authentication, mTLS required for Security Server, <200ms theme switching
  **Scale/Scope**: Single-page app, 10-100 concurrent users, support responses up to 10MB

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

This feature MUST comply with **Project Constitution v1.1.0** (`.specify/memory/constitution.md`):

**Core Principles:**

- ✅ **Pure DTOs (Records)**: All DTOs are Java Records with NO business logic, MapStruct for conversions
- ✅ **No Database**: Uses localStorage only, no JPA/database persistence
- ✅ **Validation Standards**: Simple timing (all validation on submit, errors clear on change), placeholders with examples
- ✅ **Security First**: No credential/certificate persistence, http/https URL validation, PEM certs via UI
- ✅ **UI/UX Consistency**: Cosmo theme, logical sections, inline loading states

**Tech Stack Compliance:**

- ✅ Backend: Spring Boot 3.x, Java 17+, WebClient (not RestTemplate), MapStruct
- ✅ Frontend: React 18, TypeScript 5.8, React Hook Form, Redux Toolkit, Axios
- ✅ DTOs: TypeScript interfaces mirror Java DTOs exactly

**Documentation Compliance:**

- ✅ All markdown files include TOC (spec.md, plan.md, research.md, data-model.md, quickstart.md)

**Violations:**

- None - All constitution principles followed

**Status**: ✅ PASSED - Full compliance with Project Constitution v1.1.0

---

## Project Structure

### Documentation (this feature)

```text
specs/001-xroad-generic-rest-client/
├── plan.md              # This file (/speckit.plan output)
├── spec.md              # Feature specification
├── research.md          # Technical decisions (/speckit.plan output)
├── data-model.md        # Entities and DTOs (/speckit.plan output)
├── quickstart.md        # Developer guide (/speckit.plan output)
├── contracts/           # API specifications (/speckit.plan output)
│   └── xroad-proxy-api.yaml
└── checklists/          # Validation checklists
    └── requirements.md
```

### Source Code (repository root)

#### Backend Structure

```text
src/main/java/com/nortal/xroad/restapi/client/
├── XRoadExampleRestapiClientApp.java
├── config/
│   ├── XRoadSecurityServerProperties.java  # NEW: X-Road config properties
│   ├── XRoadWebClientConfiguration.java    # NEW: WebClient with mTLS
│   ├── ApplicationProperties.java
│   └── WebConfigurer.java
├── web/
│   └── rest/
│       ├── XRoadProxyResource.java         # NEW: Proxy controller
│       ├── dto/
│       │   ├── XRoadRequestDTO.java        # NEW: Request DTO
│       │   ├── XRoadResponseDTO.java       # NEW: Response DTO
│       │   └── XRoadErrorDTO.java          # NEW: Error DTO
│       └── errors/
│           └── XRoadErrorHandler.java      # NEW: X-Road error handling
├── service/
│   └── xroad/
│       ├── XRoadClientService.java         # NEW: X-Road HTTP client service
│       └── XRoadHeaderBuilder.java         # NEW: Header construction utility

**IMPORTANT**: Spring Security has been completely removed from the application. There is no `SecurityConfiguration.java`, no `security/` package, no `AccountResource.java`, and no authentication/authorization logic. All endpoints are public.

src/test/java/com/nortal/xroad/restapi/client/
├── config/
│   └── XRoadWebClientConfigurationIT.java  # NEW: mTLS integration test
├── web/rest/
│   ├── XRoadProxyResourceIT.java           # NEW: Controller integration test
│   └── XRoadProxyResourceTest.java         # NEW: Controller unit test
└── service/xroad/
    ├── XRoadClientServiceTest.java         # NEW: Service unit test
    └── XRoadHeaderBuilderTest.java         # NEW: Header builder test
```

#### Frontend Structure

```text
src/main/webapp/app/
├── app.tsx                                 # UPDATED: Remove auth routes/providers
├── index.tsx                               # UPDATED: Init theme before render
├── routes.tsx                              # UPDATED: Remove login/account routes
├── config/
│   ├── store.ts                            # UPDATED: Add theme & history reducers
│   ├── theme-config.ts                     # NEW: Theme utilities
│   └── axios-interceptor.ts                # UPDATED: Remove auth interceptor
├── modules/
│   ├── home/
│   │   └── home.tsx                        # UPDATED: Landing page - renders X-Road client interface (no separate /xroad route)
│   └── xroad/                              # NEW: X-Road module (components used by home.tsx)
│       ├── xroad-request-form.tsx          # NEW: Request configuration form
│       ├── xroad-response-viewer.tsx       # NEW: Response display component
│       ├── components/
│       │   ├── request-builder/            # NEW: Form components
│       │   │   ├── service-identifier-inputs.tsx
│       │   │   ├── request-config-inputs.tsx
│       │   │   └── optional-headers-inputs.tsx
│       │   ├── response-viewer/            # NEW: Response components
│       │   │   ├── response-header-view.tsx
│       │   │   ├── response-raw-view.tsx
│       │   │   ├── response-json-view.tsx
│       │   │   └── response-tree-view.tsx
│       │   └── request-history/            # NEW: History sidebar
│       │       ├── history-list.tsx
│       │       └── history-entry.tsx
│       ├── models/
│       │   ├── xroad-form-data.model.ts    # NEW: Form data interface
│       │   ├── xroad-response.model.ts     # NEW: Response interface
│       │   └── response-view.model.ts      # NEW: View mode enum
│       └── services/
│           └── xroad-api.service.ts        # NEW: API service (axios calls)
├── shared/
│   ├── layout/
│   │   └── header/
│   │       ├── header.tsx                  # UPDATED: Add theme toggle
│   │       └── theme-toggle.tsx            # NEW: Theme toggle dropdown
│   ├── reducers/
│   │   ├── index.ts                        # UPDATED: Add new reducers
│   │   ├── theme.ts                        # NEW: Theme state reducer
│   │   └── xroad-history.ts                # NEW: Request history reducer
│   └── util/
│       ├── xroad-storage.ts                # NEW: localStorage helpers
│       └── xroad-validation.ts             # NEW: Validation patterns
└── content/
    └── scss/
        ├── global.scss                     # UPDATED: Import Cosmo theme
        └── _bootswatch.scss                # UPDATED: Cosmo variables

src/test/javascript/spec/app/
├── modules/xroad/
│   ├── xroad-request-form.spec.tsx         # NEW: Form component test
│   ├── xroad-response-viewer.spec.tsx      # NEW: Response viewer test
│   └── components/
│       └── theme-toggle.spec.tsx           # NEW: Theme toggle test
└── shared/reducers/
    ├── theme.spec.ts                       # NEW: Theme reducer test
    └── xroad-history.spec.ts               # NEW: History reducer test
```

#### Configuration Files

```text
src/main/resources/config/
├── application.yml                         # UPDATED: Add X-Road default timeouts (optional)
├── application-dev.yml                     # UPDATED: Dev X-Road timeouts (optional)
├── application-prod.yml                    # UPDATED: Prod X-Road timeouts (optional)
```

**Structure Decision**: This is a web application (JHipster monolith) with backend and frontend in a single repository. Backend serves API and static frontend assets. Structure follows JHipster conventions with clear separation:

- **Backend**: Java packages under `com.nortal.xroad.restapi.client.*`
- **Frontend**: React/TypeScript under `src/main/webapp/app/`
- **Tests**: Mirrored structure under `src/test/`

---

## Complexity Tracking

**No violations** - Using standard JHipster patterns

---

## Phase 0: Research Findings

**Status**: ✅ Complete - See [research.md](./research.md)

### Key Decisions

| Decision    | Choice                       | Rationale                                               |
| ----------- | ---------------------------- | ------------------------------------------------------- |
| JSON Viewer | react-json-view-lite 2.4.1   | 11KB, zero deps, TypeScript native, React 18 compatible |
| Theme       | Bootstrap 5.3+ data-bs-theme | Native dark mode, no CSS-in-JS                          |
| mTLS        | Spring Boot 3.1+ SSL Bundles | Modern abstraction, externalized config                 |
| HTTP Client | WebClient (Netty)            | Non-blocking, reactive, not in maintenance mode         |
| Form        | React Hook Form 7.56.2       | Already included, best performance                      |
| Persistence | localStorage + Redux         | Auto-save, request history                              |

---

## Phase 1: Design Artifacts

### Data Model

**Status**: ✅ Complete - See [data-model.md](./data-model.md)

**Key Entities**:

1. **XRoadRequestDTO** (Java) - Request configuration from frontend
2. **XRoadResponseDTO** (Java) - Response data to frontend
3. **XRoadErrorDTO** (Java) - Parsed X-Road error
4. **XRoadFormData** (TypeScript) - Form state
5. **RequestHistoryEntry** (TypeScript) - History entry

**No Database** - All data ephemeral or in localStorage

### API Contracts

**Status**: ✅ Complete - See [contracts/xroad-proxy-api.yaml](./contracts/xroad-proxy-api.yaml)

**Endpoints**:

- `POST /api/xroad/execute` - Execute X-Road request

**Request**:

```json
{
  "instanceId": "DEV",
  "memberClass": "COM",
  "memberCode": "1234567-8",
  "subsystemCode": "TestClient",
  "serviceCode": "getInfo",
  "method": "GET",
  "queryParams": { "format": "json" },
  "headers": { "Accept": "application/json" }
}
```

**Response**:

```json
{
  "statusCode": 200,
  "statusText": "OK",
  "headers": { "Content-Type": ["application/json"] },
  "body": "{\"id\": 123, \"name\": \"John\"}",
  "xroadId": "550e8400-...",
  "timestamp": "2025-11-17T10:30:00Z"
}
```

### Developer Quick Start

**Status**: ✅ Complete - See [quickstart.md](./quickstart.md)

---

## Phase 2: Implementation Plan

### Prerequisites

1. Install dependencies:

```bash
npm install --save-exact react-json-view-lite@2.4.1
npm install --save-dev --save-exact @types/d3@7.4.3
```

2. Generate SSL certificates for development:

```bash
mkdir -p src/main/resources/config/tls
# Copy or generate development certificates
```

---

### Implementation Phases

#### Phase 2.1: Foundation & Configuration (P1)

**Priority**: Critical (must complete first)

**Backend Tasks**:

1. **Verify Spring Security removal**

   - Confirm SecurityConfiguration.java has been deleted
   - Confirm security/ package has been removed
   - Confirm AccountResource.java has been deleted
   - Verify all endpoints are public (no auth filters)

2. **Create XRoadSecurityServerProperties.java**

   - `@ConfigurationProperties(prefix = "application.xroad")`
   - Properties: Security Server URL, SSL bundle name, timeouts (optional - can be per-request via UI)
   - Validation annotations (@NotBlank, @Pattern)

3. **Create XRoadWebClientConfiguration.java**

   - Create `WebClient` bean for HTTP requests
   - Configure Netty HTTP client with default timeouts (60s connect, 120s read)
   - Note: SSL context created dynamically per-request from PEM certs (not via SslBundles)

4. **Update application.yml (optional)**

   - Add default X-Road timeouts: `application.xroad.connect-timeout: 60000`, `application.xroad.read-timeout: 120000`
   - Note: Security Server URL and certificates submitted per-request via UI (not in config)

5. **Update application-dev.yml (optional)**
   - Dev X-Road timeouts if different from defaults

**Frontend Tasks**:

6. **Update app.scss**

   - Replace Superhero theme import with Cosmo
   - Import Cosmo variables and bootswatch
   - Test light/dark theme rendering

7. **Create theme-config.ts**

   - `ThemeMode` type ('light' | 'dark' | 'system')
   - `getSystemTheme()` function
   - `applyTheme()` function
   - localStorage helpers

8. **Create theme.reducer.ts**

   - Redux slice for theme state
   - `setTheme` action
   - Persist to localStorage on change
   - Initialize from localStorage

9. **Update index.tsx**

   - Apply theme before React renders (prevent FOUC)
   - Add system theme change listener
   - Initialize theme from localStorage or default

10. **Update store.ts**
    - Import and add theme reducer
    - Configure Redux DevTools

**Testing**:

- ✅ Backend starts without authentication
- ✅ WebClient configured with mTLS (verify with unit test)
- ✅ Theme switching works (light/dark/system)
- ✅ Theme persists across page reloads

**Acceptance**: User can access app without login, theme toggles work, backend loads SSL config

---

#### Phase 2.2: Backend API & X-Road Integration (P1)

**Priority**: Critical (core functionality)

**Backend Tasks**:

11. **Create XRoadRequestDTO.java**

    - All fields from data model
    - Bean Validation annotations
    - Helper methods: `buildXRoadClientHeader()`, `buildRequestPath()`

12. **Create XRoadResponseDTO.java**

    - All fields from data model
    - Static factory method: `fromWebClientResponse()`
    - Parse X-Road headers

13. **Create XRoadErrorDTO.java**

    - Parse X-Road-Error header JSON
    - Fallback for plain text errors

14. **Create XRoadClientService.java**

    - Inject WebClient bean
    - `executeRequest()` method
    - Build X-Road headers (X-Road-Client, X-Road-Service, X-Road-Id)
    - Handle query params and body
    - Error handling with reactive streams

15. **Create XRoadHeaderBuilder.java**

    - Utility class for building X-Road headers
    - URL construction: `/r1/{serviceId}/{path}?{query}`
    - URL encoding per RFC 3986

16. **Create XRoadProxyResource.java**
    - `@RestController @RequestMapping("/api/xroad")`
    - `@PostMapping("/execute")`
    - Validate `@RequestBody @Valid XRoadRequestDTO`
    - Call `XRoadClientService.executeRequest()`
    - Return `Mono<ResponseEntity<XRoadResponseDTO>>`
    - Error handling with `@ExceptionHandler`

**Testing**:

- Unit tests for XRoadHeaderBuilder (URL construction, encoding)
- Unit tests for XRoadClientService (mock WebClient)
- Integration test for XRoadProxyResource (WireMock X-Road server)
- Verify X-Road headers are correctly set
- Test error scenarios (network failure, X-Road errors)

**Acceptance**: Backend can proxy requests to Security Server with proper X-Road headers

---

#### Phase 2.3: Frontend Request Form (P1)

**Priority**: Critical (user input)

**Frontend Tasks**:

17. **Create xroad-form-data.model.ts**

    - `XRoadFormData` interface
    - Default values
    - Validation patterns

18. **Create xroad-validation.ts**

    - Regex patterns for X-Road identifiers
    - Validation messages
    - Helper functions for validation

19. **Create xroad-api.service.ts**

    - `executeXRoadRequest()` function
    - Axios POST to `/api/xroad/execute`
    - Type-safe request/response
    - Error handling

20. **Create xroad-request-form.tsx**

    - React Hook Form setup
    - Input fields for all XRoadFormData properties
    - Validation rules with `react-hook-form`
    - Form submission handler
    - Auto-save to localStorage on change
    - Integrate with Reactstrap components (Form, FormGroup, Input, Label)

21. **Create service-identifier-inputs.tsx**

    - Sub-component for service identifier fields
    - Instance, MemberClass, MemberCode, Subsystem, ServiceCode
    - Pattern validation and error display

22. **Create request-config-inputs.tsx**

    - HTTP method dropdown
    - Path input
    - Query params editor (key-value pairs)
    - Custom headers editor
    - Request body textarea

23. **Update home.tsx**
    - Import and render XRoadRequestForm as the main content
    - This is the landing page at "/" - no separate /xroad route needed
    - Replace placeholder content
    - Add title and instructions

**Testing**:

- Component test for xroad-request-form
- Test form validation (invalid inputs show errors)
- Test localStorage auto-save
- Test form submission calls API service
- Test Reactstrap integration

**Acceptance**: User can fill form, validation works, request is sent to backend

---

#### Phase 2.4: Response Viewer (P2)

**Priority**: Important (core UX)

**Frontend Tasks**:

24. **Create xroad-response.model.ts**

    - `XRoadResponse` interface
    - `XRoadError` interface
    - `ResponseViewMode` enum

25. **Install JSON viewer dependencies**

    ```bash
    npm install --save-exact react-json-view-lite@2.4.1
        npm install --save-dev --save-exact @types/d3@7.4.3
    ```

26. **Create xroad-response-viewer.tsx**

    - Accept `XRoadResponse` prop
    - View mode toggle (Raw/JSON/Tree)
    - Render appropriate view based on mode
    - Display status code and headers

27. **Create response-header-view.tsx**

    - Display all HTTP headers in table format
    - Highlight X-Road specific headers
    - Show X-Road-Error in alert if present

28. **Create response-raw-view.tsx**

    - Display body as plain text in `<pre><code>`
    - Syntax highlighting for common formats (optional)

29. **Create response-json-view.tsx**

    - Use react-json-view-lite
    - Detect if body is valid JSON
    - Show "Not JSON" message if parsing fails
    - Apply theme-aware styles (light/dark)
    - Collapsible sections

30. **Create response-tree-view.tsx**

    - Transform JSON to tree data structure
    - Interactive tree diagram
    - Handle non-JSON gracefully

31. **Update xroad-request-form.tsx**
    - Add state for response data
    - Render XRoadResponseViewer when response received
    - Show loading spinner during request

**Testing**:

- Component test for each viewer mode
- Test JSON parsing (valid/invalid JSON)
- Test view mode switching
- Test theme integration (light/dark styles)
- Test D3 tree rendering

**Acceptance**: User can view response in Raw, JSON, and Tree modes

---

#### Phase 2.5: Theme Toggle Component (P2)

**Priority**: Important (UX)

**Frontend Tasks**:

32. **Create theme-toggle.tsx**

    - Dropdown with Light/Dark/System options
    - FontAwesome icons (sun/moon/desktop)
    - Dispatch `setTheme` action on click
    - Show current theme active state
    - Integrate with Reactstrap Dropdown

33. **Update header.tsx**

    - Import and render ThemeToggle
    - Position in navbar (right side)
    - Responsive design (mobile/desktop)

34. **Update response-json-view.tsx**
    - Subscribe to theme state from Redux
    - Apply correct styles based on theme
    - Handle system theme detection

**Testing**:

- Component test for ThemeToggle
- Test theme changes reflected in UI
- Test localStorage persistence
- Test system theme detection

**Acceptance**: User can toggle theme, preference persists, JSON viewer adapts

---

#### Phase 2.6: Request History (P4)

**Priority**: Enhancement (improves UX, not essential for MVP)

**Frontend Tasks**:

35. **Create xroad-history.reducer.ts**

    - `RequestHistoryEntry` interface
    - `addRequestToHistory` action
    - `clearHistory` action
    - `loadFromHistory` action
    - `selectHistoryEntry` action
    - `deleteHistoryEntry` action
    - Persist to localStorage (max 10 entries)
    - Exclude PEM certificates from persisted history

36. **Create history-list.tsx**

    - Display list of past requests
    - Show timestamp, service code, status code
    - Three-dot menu per entry (View/Retry/Delete)
    - Visual "selected" state for active entry

37. **Create history-entry.tsx**

    - Single history item component
    - Truncated display of request/response
    - Three-dot menu component
    - Selected state styling

38. **Update xroad-request-form.tsx**

    - Dispatch `addRequestToHistory` after successful response
    - Add "History" button to open side drawer
    - Auto-load most recent request on page load
    - Display "This request is a history item" indicator
    - Clear indicator when fields are modified
    - Handle View/Retry/Delete actions from history

39. **Create xroad-storage.ts**
    - `saveFormDraft()`, `loadFormDraft()`, `clearFormDraft()`
    - History persistence helpers
    - Security filter to exclude PEM certificates

**Testing**:

- Redux reducer test (add/clear/load/select/delete history)
- Component test for history list and drawer
- Test localStorage persistence
- Test PEM certificate exclusion from history
- Test View/Retry/Delete actions
- Test auto-load on page refresh

**Acceptance**: User can view history drawer, select entries with View/Retry/Delete, history persists across sessions, certificates excluded from history

---

#### Phase 2.7: Error Handling & Polish (P3)

**Priority**: Nice-to-have (robustness)

**Backend Tasks**:

40. **Create XRoadErrorHandler.java**

    - `@ControllerAdvice` for global error handling
    - Handle `WebClientResponseException`
    - Handle validation errors (`MethodArgumentNotValidException`)
    - Return consistent error response format

41. **Enhance XRoadClientService**
    - Retry logic with `retryWhen()`
    - Circuit breaker (optional, Resilience4j)
    - Request/response logging
    - Metrics (Micrometer)

**Frontend Tasks**:

42. **Update axios-interceptor.ts**

    - Handle X-Road-Error header
    - Show toast notifications for errors
    - Network error handling

43. **Add error boundaries**

    - Catch React errors
    - Show user-friendly error page

44. **Add loading states**
    - Spinner during request
    - Disable form during submission
    - Progress indicators

**Testing**:

- Error handling integration tests
- Test network failures
- Test X-Road error responses
- Test validation errors

**Acceptance**: Errors are handled gracefully with clear messages

---

### Implementation Order Summary

1. **Phase 2.1**: Foundation (theme, SSL, security) - **3-5 days**
2. **Phase 2.2**: Backend API (proxy, DTOs, service) - **3-4 days**
3. **Phase 2.3**: Request Form (input, validation) - **3-4 days**
4. **Phase 2.4**: Response Viewer (Raw/JSON/Tree) - **4-5 days**
5. **Phase 2.5**: Theme Toggle (UI integration) - **1-2 days**
6. **Phase 2.6**: Request History (localStorage, Redux, drawer UI) - **2-3 days**
7. **Phase 2.7**: Error Handling & Polish - **2-3 days**

**Total Estimated Time**: 18-26 days (3.5-5 weeks)

---

## Testing Strategy

### Unit Tests (Backend)

```java
// XRoadHeaderBuilderTest.java
@Test
void shouldBuildCorrectServiceId() {
  String serviceId = builder.buildServiceId("DEV", "COM", "123", "Sub", "getInfo");
  assertEquals("DEV/COM/123/Sub/getInfo", serviceId);
}

@Test
void shouldEncodeQueryParams() {
  String url = builder.buildUrl("/r1/DEV/COM/123/getInfo", Map.of("name", "John Doe"));
  assertTrue(url.contains("name=John%20Doe"));
}

```

### Integration Tests (Backend)

```java
// XRoadProxyResourceIT.java
@SpringBootTest
@AutoConfigureMockMvc
class XRoadProxyResourceIT {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void shouldExecuteXRoadRequest() throws Exception {
    mockMvc
      .perform(post("/api/xroad/execute").contentType(MediaType.APPLICATION_JSON).content("{...}"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.statusCode").value(200));
  }
}

```

### Component Tests (Frontend)

```typescript
// xroad-request-form.spec.tsx
describe('XRoadRequestForm', () => {
  it('should validate required fields', async () => {
    render(<XRoadRequestForm />);
    fireEvent.click(screen.getByText('Send Request'));
    expect(await screen.findByText('Instance is required')).toBeInTheDocument();
  });

  it('should submit valid form', async () => {
    const mockExecute = jest.fn();
    render(<XRoadRequestForm onExecute={mockExecute} />);
    // Fill form...
    fireEvent.click(screen.getByText('Send Request'));
    await waitFor(() => expect(mockExecute).toHaveBeenCalled());
  });
});
```

### E2E Tests (Optional)

```typescript
// xroad-client.e2e.spec.ts
describe('X-Road Client E2E', () => {
  it('should complete full request flow', () => {
    cy.visit('/');
    cy.get('[name="instanceId"]').type('DEV');
    cy.get('[name="serviceCode"]').type('getInfo');
    cy.get('[type="submit"]').click();
    cy.contains('200 OK').should('be.visible');
  });
});
```

---

## Deployment

### Development

```bash
./gradlew -x webapp        # Backend only
npm start                  # Frontend dev server
```

### Production

```bash
./gradlew -Pprod clean bootJar
java -jar build/libs/*.jar --spring.profiles.active=prod
```

### Docker

```bash
npm run java:docker
docker run -p 8080:8080 xroadexamplerestapiclient:latest

# With optional custom timeouts
docker run -p 8080:8080 \
  -e XROAD_CONNECT_TIMEOUT=30000 \
  -e XROAD_READ_TIMEOUT=60000 \
  xroadexamplerestapiclient:latest
```

**Note**: Per constitution (no persistence), certificates are submitted via UI - no volume mounts or environment variables needed for certificates

---

## Monitoring & Observability

- **Metrics**: Micrometer with Prometheus endpoint `/management/prometheus`
- **Health**: Spring Boot Actuator `/management/health`
- **Logs**: Logback with JSON format for structured logging
- **Tracing**: (Optional) Spring Cloud Sleuth for distributed tracing

---

## Security Considerations

1. **No Authentication**: Spring Security completely removed - application is publicly accessible. Deploy behind firewall/VPN if needed for production.
2. **mTLS**: Client certificates and private keys submitted per-request via UI (PEM textarea). SSL context created dynamically in backend via MTLSContextBuilder. Certificates NEVER persisted to localStorage or database.
3. **Self-Signed Certificates**: MTLSContextBuilder includes permissive trust manager that accepts self-signed certificates without CA validation for development/testing convenience. **Production Warning**: Replace with proper certificate validation for production deployments.
4. **Hostname Verification**: Disabled in development/testing to support Docker containers and localhost connections with certificate hostname mismatches. XRoadProxyService SSL handler sets `endpointIdentificationAlgorithm` to null. **Production Warning**: Re-enable hostname verification for production by removing the handlerConfigurator in XRoadProxyService.
5. **Input Validation**: Bean Validation on backend, React Hook Form on frontend with simple validation timing (validate on submit, clear on change)
6. **CORS**: Not an issue for monolith (same origin)
7. **Rate Limiting**: Consider adding if exposed to internet (Spring Cloud Gateway or Nginx)
8. **Secrets Management**: No server-side secrets for certificates (all submitted via UI). Use environment variables for any optional default timeouts.

---

## Performance Optimization

1. **WebClient**: Non-blocking I/O for better throughput
2. **React Lazy Loading**: Code-split JSON viewer libraries
3. **Memoization**: Use React.memo for expensive components
4. **Debounce**: Auto-save to localStorage with debounce (500ms)
5. **Virtual Scrolling**: For large JSON responses (react-window)

---

## Next Steps After Implementation

1. Run `/speckit.tasks` to generate detailed task breakdown
2. Run `/speckit.implement` to execute implementation
3. Deploy to dev environment for testing
4. Gather user feedback
5. Iterate based on feedback

---

**Document Status**: Complete
**Last Updated**: 2025-11-17
**Ready for**: `/speckit.tasks` command
