# X-Road Generic REST Client - Technical Research

**Date**: 2025-11-17
**Branch**: 001-xroad-generic-rest-client
**Purpose**: Document technical decisions and rationale for implementation

## Table of Contents

<!-- TOC -->

- [X-Road Generic REST Client - Technical Research](#x-road-generic-rest-client---technical-research)
  - [Table of Contents](#table-of-contents)
  - [Project Context](#project-context)
  - [1. JSON Formatting & Visualization Libraries](#1-json-formatting--visualization-libraries)
    - [Decision: react-json-view-lite](#decision-react-json-view-lite)
  - [2. Theme Switching with Cosmo](#2-theme-switching-with-cosmo)
    - [Decision: Bootstrap 5.3+ data-bs-theme + Context API + localStorage](#decision-bootstrap-53-data-bs-theme--context-api--localstorage)
  - [3. Spring Boot mTLS Configuration](#3-spring-boot-mtls-configuration)
    - [Decision: Spring Boot 3.1+ SSL Bundles with WebClient](#decision-spring-boot-31-ssl-bundles-with-webclient)
  - [4. HTTP Client Architecture](#4-http-client-architecture)
    - [Decision: Spring Boot Backend Proxy](#decision-spring-boot-backend-proxy)
  - [5. Form State Management](#5-form-state-management)
    - [Decision: React Hook Form + localStorage + Redux History](#decision-react-hook-form--localstorage--redux-history)
  - [Summary of Key Decisions](#summary-of-key-decisions)
  - [Implementation Priority](#implementation-priority)
    - [Phase 1 - Foundation](#phase-1---foundation)
    - [Phase 2 - Core Features](#phase-2---core-features)
    - [Phase 3 - Enhanced Visualization](#phase-3---enhanced-visualization)
    - [Phase 4 - Polish](#phase-4---polish)
  - [Dependencies to Add](#dependencies-to-add)
  - [Configuration Changes Needed](#configuration-changes-needed)
    - [1. Update app.scss](#1-update-appscss)
    - [2. Simplify Configuration](#2-simplify-configuration)
    - [3. Remove Authentication](#3-remove-authentication)
  - [Testing Strategy](#testing-strategy)
    - [Unit Tests](#unit-tests)
    - [Integration Tests](#integration-tests)
    - [Component Tests](#component-tests)
  - [Next Steps](#next-steps)
  <!-- TOC -->

---

## Project Context

**Application Stack:**

- JHipster 8.11.0 generated Spring Boot 3.x + React 18 application
- Backend: Java 17+, Gradle, Undertow server
- Frontend: React 18.3.1, TypeScript 5.8.3, Redux Toolkit 2.8.0, Reactstrap 9.2.3
- Current Theme: Bootswatch Superhero (Dark theme) - **will be replaced with Cosmo**
- Existing: React Hook Form 7.56.2, Axios 1.9.0

---

## 1. JSON Formatting & Visualization Libraries

### Decision: react-json-view-lite

#### Primary JSON Viewer: react-json-view-lite

**Version**: 2.4.1

**Rationale**:

- **Minimal bundle size**: ~11KB minified (vs 135KB for react-json-view, 300KB+ for @textea/json-viewer)
- **Zero dependencies**: No transitive dependency bloat
- **TypeScript native**: Written in TypeScript, excellent type safety
- **React 18 compatible**: Fully supports React 18.3.1
- **Fast performance**: Optimized for large JSON payloads
- **JHipster compatible**: No conflicts with existing Bootstrap/Reactstrap

**Alternatives Considered**:

1. **@textea/json-viewer** - Requires Material-UI + Emotion (~300KB total), style conflicts with Bootstrap
2. **react-json-view** - Unmaintained since 2021, 135KB bundle, React 18 warnings
3. **@uiw/react-json-view** - 200KB+ bundle, editing features we don't need
4. **jsoncrack-react** - Beautiful but ~1MB+ bundle, requires paid API

**Integration**:

```bash
npm install --save-exact react-json-view-lite@2.4.1
```

```typescript
import { JsonView, darkStyles, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

<JsonView
  data={responseData}
  shouldInitiallyExpand={(level) => level < 2}
  style={isDarkTheme ? darkStyles : defaultStyles}
/>
```

---

## 2. Theme Switching with Cosmo

### Decision: Bootstrap 5.3+ data-bs-theme + Context API + localStorage

**Implementation Approach**:

- Use Bootstrap 5.3's native dark mode via `data-bs-theme` attribute
- React Context API for global theme state
- localStorage for persistence across sessions
- `prefers-color-scheme` media query for system detection
- Cosmo theme from Bootswatch 5.3.5 (already in package.json)

**Rationale**:

1. **Bootstrap 5.3+ Native Dark Mode**:

   - Built-in `data-bs-theme="dark"` support
   - Bootswatch 5.3.5 Cosmo has both light/dark variants
   - No custom CSS overrides needed
   - Simple attribute toggle on root element

2. **Minimal JavaScript**:

   - No CSS-in-JS libraries required (no styled-components, no emotion)
   - Works seamlessly with existing SCSS setup
   - Zero runtime overhead for theme switching
   - No FOUC (Flash of Unstyled Content)

3. **System Theme Detection**:

   - `window.matchMedia('(prefers-color-scheme: dark)')` API
   - Automatic switching when OS theme changes
   - Event listener for real-time updates

4. **Persistence**:
   - localStorage stores user choice ('light', 'dark', 'system')
   - Priority: localStorage > system preference > default (light)
   - Synchronous load before React renders (prevents flash)

**Alternatives Considered**:

1. **styled-components/emotion** - Adds 50KB+, conflicts with SCSS, runtime overhead
2. **CSS Variable Toggle** - Need to manually redefine all Bootswatch variables
3. **Separate CSS Imports** - Causes FOUC, webpack complexity

**Integration**:

```typescript
// theme-config.ts
export type ThemeMode = 'light' | 'dark' | 'system';

export const getSystemTheme = (): 'light' | 'dark' => (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

export const applyTheme = (mode: ThemeMode): void => {
  const effectiveTheme = mode === 'system' ? getSystemTheme() : mode;
  document.documentElement.setAttribute('data-bs-theme', effectiveTheme);
};
```

```typescript
// Redux theme slice
export const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: getStoredTheme() || 'system' },
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      localStorage.setItem('app-theme', action.payload);
      applyTheme(action.payload);
    },
  },
});
```

**Theme Toggle Component**:

```typescript
<UncontrolledDropdown nav>
  <DropdownToggle nav caret>
    <FontAwesomeIcon icon={currentTheme === 'dark' ? faMoon : faSun} />
  </DropdownToggle>
  <DropdownMenu end>
    <DropdownItem onClick={() => dispatch(setTheme('light'))}>Light</DropdownItem>
    <DropdownItem onClick={() => dispatch(setTheme('dark'))}>Dark</DropdownItem>
    <DropdownItem onClick={() => dispatch(setTheme('system'))}>System</DropdownItem>
  </DropdownMenu>
</UncontrolledDropdown>
```

---

## 3. Spring Boot mTLS Configuration

### Decision: Spring Boot 3.1+ SSL Bundles with WebClient

**Implementation Approach**:

- Spring Boot 3.1+ SSL bundle abstraction
- Support both PKCS12/JKS and PEM formats
- Externalize certificate paths via application.yml
- WebClient (not RestTemplate) for reactive, non-blocking HTTP

**Rationale**:

1. **Spring Boot 3.1+ SSL Bundles** (introduced June 2023):

   - Centralized SSL configuration management
   - No manual `SSLContext` creation needed
   - Type-safe configuration via properties
   - Supports certificate rotation with `reload-on-update`

2. **WebClient over RestTemplate**:
   - RestTemplate is in maintenance mode (Spring 5.0+)
   - Better performance with non-blocking I/O (Netty)
   - Reactive error handling and retry logic
   - Better for large responses (streaming support)
   - Modern Spring ecosystem integration

**Alternatives Considered**:

1. **RestTemplate with Manual SSLContext** - Legacy, verbose, maintenance mode
2. **Apache HttpClient 5** - Extra boilerplate, doesn't leverage Spring Boot
3. **OkHttp** - Another dependency, manual Spring integration
4. **Hardcoded Paths** - Violates 12-factor app principles, security risk

**Integration**:

```yaml
# application.yml
application:
  xroad:
    connect-timeout: 30000 # Default timeout for X-Road requests
    read-timeout: 60000 # Default read timeout
```

**Note**: Per constitution (no database/no persistence), all X-Road configuration is submitted per-request:

- Security Server URL (submitted via UI)
- Client certificates (PEM format, submitted via UI drag-and-drop or paste)
- X-Road identifiers (all entered in UI form)

```java
@Bean
public WebClient.Builder xroadWebClientBuilder() {
  // WebClient builder is configured per-request with:
  // - Security Server URL from ClientDto.securityServerUrl
  // - mTLS certificates from ClientDto.mtlsCertificates (3 separate fields: securityServerCert, clientCert, clientPrivateKey)
  // - Dynamic SSL context creation from PEM certificates per request

  return WebClient.builder().defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
}

```

**No Environment Variables Needed**: All configuration is per-request via UI

---

## 4. HTTP Client Architecture

### Decision: Spring Boot Backend Proxy

**Architecture**:

```
React SPA → Spring Boot (/api/xroad/*) → X-Road Security Server (mTLS)
```

**Rationale**:

1. **CORS Limitations**:

   - Browsers block cross-origin requests without CORS headers
   - X-Road Security Servers typically don't enable CORS
   - Preflight OPTIONS requests fail
   - Cannot add custom headers (X-Road-Client, X-Road-Service) to external servers

2. **Certificate Management**:

   - Browser JavaScript cannot manage client certificates directly
   - PEM certificates submitted via UI per request (never persisted)
   - Backend creates SSL context dynamically from PEM certificates
   - Private keys processed server-side only (never stored to disk)

3. **Request Transformation**:

   - Server validates and sanitizes requests
   - Adds/modifies X-Road headers safely
   - Handles X-Road error responses consistently
   - Centralized audit logging

4. **Security**:
   - API keys and sensitive config stay server-side
   - Rate limiting and request validation
   - Protection against malicious requests

**Alternatives Considered**:

1. **Direct Frontend → Security Server** - Not feasible due to CORS and certificates
2. **NGINX Reverse Proxy** - Extra infrastructure, no business logic
3. **API Gateway (Spring Cloud Gateway)** - Over-engineered for monolith
4. **Simple CORS Proxy** - No validation, limited error handling

**Integration**:

```java
@RestController
@RequestMapping("/api/xroad")
public class XRoadProxyResource {

  @PostMapping("/execute")
  public Mono<ResponseEntity<String>> executeXRoadRequest(@RequestBody @Valid XRoadRequestDTO request) {
    return xroadClientService
      .executeRequest(request.getServiceId(), request.getPath(), request.getMethod(), request.getHeaders(), request.getBody())
      .map(ResponseEntity::ok)
      .onErrorResume(this::handleXRoadError);
  }
}

```

```typescript
// Frontend service
export const executeXRoadRequest = async (request: XRoadRequest): Promise<XRoadResponse> => {
  const response = await axios.post<string>('/api/xroad/execute', request);
  return {
    data: response.data,
    headers: response.headers as Record<string, string>,
    status: response.status,
  };
};
```

**Error Handling**:

```java
private Mono<ResponseEntity<String>> handleXRoadError(Throwable error) {
  if (error instanceof WebClientResponseException ex) {
    String xroadError = ex.getHeaders().getFirst("X-Road-Error");
    if (xroadError != null) {
      return Mono.just(ResponseEntity.status(ex.getStatusCode()).header("X-Road-Error", xroadError).body(ex.getResponseBodyAsString()));
    }
  }
  return Mono.error(error);
}

```

---

## 5. Form State Management

### Decision: React Hook Form + localStorage + Redux History

**Implementation Approach**:

- React Hook Form for form state (already in package.json 7.56.2)
- localStorage for auto-save draft values
- Redux Toolkit for request history (last 10 requests)
- Optional Zod for advanced validation

**Rationale**:

1. **React Hook Form Already Included**:

   - Zero additional bundle cost
   - v7.56.2 already in package.json
   - Best performance (uncontrolled components)
   - Excellent TypeScript support

2. **Performance**:

   - 13% faster than Formik, 25% faster than Redux Form
   - Isolated input updates (no full form re-render)
   - Critical for large X-Road request forms with many fields

3. **Simple API**:

   - `useForm()` hook provides everything
   - Built-in validation
   - Easy Reactstrap integration
   - Watch field changes efficiently

4. **localStorage for Persistence**:

   - Auto-save draft on field change
   - Restore form state on reload
   - Export/import request templates
   - Pre-fill from URL parameters

5. **Redux for History**:
   - Store last 10 submitted requests
   - Quick recall of previous calls
   - Enables undo/redo
   - Separate concern from form state

**Alternatives Considered**:

1. **Formik** - More re-renders, larger bundle, slower performance
2. **Redux Form** - Deprecated, terrible performance, overkill
3. **Final Form** - Extra dependency, less React-idiomatic
4. **Plain React State** - No validation, lots of boilerplate

**Integration**:

```typescript
const {
  control,
  handleSubmit,
  watch,
  formState: { errors, isSubmitting },
} = useForm<XRoadFormData>({
  defaultValues: loadFromLocalStorage() || defaultValues,
});

// Auto-save to localStorage
const watchedValues = watch();
useEffect(() => {
  localStorage.setItem('xroad-form-draft', JSON.stringify(watchedValues));
}, [watchedValues]);

const onSubmit = async (data: XRoadFormData) => {
  const response = await executeXRoadRequest(data);
  dispatch(addRequestToHistory({ request: data, response }));
};
```

**Request History Redux Slice**:

```typescript
export const xroadHistorySlice = createSlice({
  name: 'xroadHistory',
  initialState: { entries: [], maxEntries: 10 },
  reducers: {
    addRequestToHistory: (state, action) => {
      state.entries.unshift({
        id: nanoid(),
        timestamp: Date.now(),
        request: action.payload.request,
        response: action.payload.response,
      });
      if (state.entries.length > state.maxEntries) {
        state.entries = state.entries.slice(0, state.maxEntries);
      }
      localStorage.setItem('xroad-history', JSON.stringify(state.entries));
    },
  },
});
```

**Validation**:

```typescript
const validationRules = {
  instanceId: {
    required: 'Instance is required',
    pattern: {
      value: /^[A-Z0-9]{2,}$/,
      message: 'Instance must be uppercase alphanumeric',
    },
  },
  memberCode: {
    required: 'Member code is required',
    pattern: {
      value: /^[0-9]{7}-[0-9]$/,
      message: 'Format: 1234567-8',
    },
  },
};
```

---

## Summary of Key Decisions

| Area               | Decision                     | Version | Rationale                                               |
| ------------------ | ---------------------------- | ------- | ------------------------------------------------------- |
| JSON Viewer        | react-json-view-lite         | 2.4.1   | 11KB, zero deps, TypeScript native, React 18 compatible |
| Theme Switching    | Bootstrap 5.3+ data-bs-theme | -       | Native dark mode, zero overhead, Context API            |
| mTLS Config        | Spring Boot 3.1+ SSL Bundles | -       | Modern abstraction, externalized config                 |
| HTTP Client        | WebClient with Netty         | -       | Non-blocking, reactive, not in maintenance mode         |
| Proxy Architecture | Spring Boot Backend Proxy    | -       | Solves CORS, handles mTLS, centralized logging          |
| Form Management    | React Hook Form (existing)   | 7.56.2  | Best performance, zero cost, already included           |
| State Persistence  | localStorage + Redux         | -       | Auto-save drafts, request history                       |

---

## Implementation Priority

### Phase 1 - Foundation

1. Theme switching (Context API + localStorage)
2. Spring Boot SSL bundle configuration
3. WebClient mTLS setup with dev certificates
4. Update SCSS to use Cosmo theme

### Phase 2 - Core Features

5. React Hook Form for X-Road request form
6. Backend proxy controller (`/api/xroad/execute`)
7. Basic raw response display
8. Error handling for network failures

### Phase 3 - Enhanced Visualization

9. Integrate react-json-view-lite for JSON view
10. Add view mode toggle (Raw/JSON)
11. Theme-aware syntax highlighting

### Phase 4 - Polish

12. Request history persistence (Redux + localStorage)
13. Export/import functionality
14. Response header display
15. X-Road-Error header parsing

---

## Dependencies to Add

```bash
# Frontend
npm install --save-exact react-json-view-lite@2.4.1

# Backend (none - using Spring Boot 3 built-ins)
```

---

## Configuration Changes Needed

### 1. Update app.scss

```scss
// Replace Superhero with Cosmo
@import 'bootswatch/dist/cosmo/variables';
@import 'bootstrap/scss/bootstrap';
@import 'bootswatch/dist/cosmo/bootswatch';
```

### 2. Simplify Configuration

**No SSL bundle configuration needed** - certificates submitted via UI per request

```yaml
# Optional default timeouts only
application:
  xroad:
    connect-timeout: 30000
    read-timeout: 60000
```

### 3. Remove Authentication

- Update SecurityConfiguration to permit all requests
- Remove login/logout endpoints
- Remove session management

---

## Testing Strategy

### Unit Tests

- PEM certificate parsing and SSL context creation
- X-Road header construction (validate format)
- Theme toggle logic (all three modes)
- Form validation rules (X-Road identifier patterns)
- DTO validation (Java Records with Bean Validation)

### Integration Tests

- WebClient mTLS connection to mock server
- Full request/response cycle through proxy
- localStorage persistence across reloads
- Theme switching with system preference changes

### Component Tests

- XRoadRequestForm submission
- ResponseViewer mode switching
- ThemeToggle dropdown interaction
- JSON tree expansion/collapse

---

## Next Steps

1. ✅ Create this research.md file
2. Update plan.md with implementation phases
3. Create data-model.md with entities
4. Generate API contracts (OpenAPI spec)
5. Create quickstart.md for developers
6. Update CLAUDE.md with technology choices

---

**Document Status**: Complete
**Last Updated**: 2025-11-17
**Next Phase**: Phase 1 - Data Model Design
