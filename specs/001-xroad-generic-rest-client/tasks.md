# Tasks: X-Road Generic REST Client

**Input**: Design documents from `/specs/001-xroad-generic-rest-client/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in specification - tasks focus on implementation only.
**Note**: Phase 9 documents retrospective completions (work completed during implementation but not originally tasked).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Table of Contents

<!-- TOC -->

- [Tasks: X-Road Generic REST Client](#tasks-x-road-generic-rest-client)
  - [Table of Contents](#table-of-contents)
  - [Format: `[ID] [P?] [Story] Description`](#format-id-p-story-description)
  - [Path Conventions](#path-conventions)
  - [Phase 1: Setup (Shared Infrastructure)](#phase-1-setup-shared-infrastructure)
  - [Phase 2: Foundational (Blocking Prerequisites)](#phase-2-foundational-blocking-prerequisites)
  - [Phase 3: User Story 1 + 5 - Basic X-Road Request & No Authentication (Priority: P1) 🎯 MVP](#phase-3-user-story-1--5---basic-x-road-request--no-authentication-priority-p1--mvp)
    - [Implementation for User Story 1 + 5](#implementation-for-user-story-1--5)
  - [Phase 4: User Story 2 - Response Format Visualization (Priority: P2)](#phase-4-user-story-2---response-format-visualization-priority-p2)
    - [Implementation for User Story 2](#implementation-for-user-story-2)
  - [Phase 5: User Story 3 - Advanced Request Configuration (Priority: P3)](#phase-5-user-story-3---advanced-request-configuration-priority-p3)
    - [Implementation for User Story 3](#implementation-for-user-story-3)
  - [Phase 6: User Story 4 - Theme and Appearance Customization (Priority: P2)](#phase-6-user-story-4---theme-and-appearance-customization-priority-p2)
    - [Implementation for User Story 4](#implementation-for-user-story-4)
  - [Phase 7: User Story 6 - Request History Management (Priority: P4)](#phase-7-user-story-6---request-history-management-priority-p4)
    - [Implementation for User Story 6](#implementation-for-user-story-6)
  - [Phase 8: Polish & Cross-Cutting Concerns](#phase-8-polish--cross-cutting-concerns)
  - [Dependencies & Execution Order](#dependencies--execution-order)
    - [Phase Dependencies](#phase-dependencies)
    - [User Story Dependencies](#user-story-dependencies)
    - [Within Each User Story](#within-each-user-story)
    - [Parallel Opportunities](#parallel-opportunities)
  - [Implementation Strategy](#implementation-strategy)
    - [MVP First (User Stories 1 + 5 Only)](#mvp-first-user-stories-1--5-only)
    - [Incremental Delivery](#incremental-delivery)
    - [Parallel Team Strategy](#parallel-team-strategy)
  - [Notes](#notes)
  <!-- TOC -->

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

**JHipster Monolith (Web App)**:

- **Backend**: `src/main/java/com/nortal/xroad/restapi/client/`
- **Frontend**: `src/main/webapp/app/`
- **Config**: `src/main/resources/config/`
- **Tests**: `src/test/java/` and `src/main/webapp/app/*.spec.tsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify JHipster 8.11.0 project structure and dependencies - **COMPLETED**
- [x] T002 Add MapStruct 1.5.5.Final to build.gradle with annotation processor configuration - **COMPLETED**
- [x] T003 [P] Add react-json-view-lite (2.4.1) to package.json - **COMPLETED**
- [x] T005 [P] Install frontend dependencies via npm install - **COMPLETED**

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Constitution Compliance**: All foundational infrastructure MUST align with project constitution v1.1.0

**Note**: Spring Security has been completely removed (authentication completely removed). UI cleanup extended beyond security removal to eliminate all authentication, admin, and entity management components. The application is now a clean, publicly accessible X-Road REST client.

- [x] T008 Update application.yml with X-Road default timeouts (connect: 60000ms, read: 120000ms) in src/main/resources/config/application.yml - **COMPLETED**
- [x] T009 [P] Create SubsystemIdDto as Java Record with validation annotations in src/main/java/com/nortal/xroad/restapi/client/service/dto/SubsystemIdDto.java - **COMPLETED**
- [x] T010 [P] Create ClientDto as Java Record with securityServerUrl and pemCertificates fields in src/main/java/com/nortal/xroad/restapi/client/service/dto/ClientDto.java - **COMPLETED**
- [x] T011 [P] Create ServiceIdDto as Java Record with validation annotations in src/main/java/com/nortal/xroad/restapi/client/service/dto/ServiceIdDto.java - **COMPLETED**
- [x] T012 [P] Create RequestDetailsDto as Java Record with mandatory path field in src/main/java/com/nortal/xroad/restapi/client/service/dto/RequestDetailsDto.java - **COMPLETED**
- [x] T013 [P] Create XRoadRequestDTO as Java Record in src/main/java/com/nortal/xroad/restapi/client/service/dto/XRoadRequestDTO.java - **COMPLETED**
- [x] T014 [P] Create XRoadResponseDTO as Java Record in src/main/java/com/nortal/xroad/restapi/client/service/dto/XRoadResponseDTO.java - **COMPLETED**
- [x] T015 [P] Create XRoadErrorDTO as Java Record in src/main/java/com/nortal/xroad/restapi/client/service/dto/XRoadErrorDTO.java - **COMPLETED**
- [x] T016 Create XRoadResponseMapper MapStruct interface with @Mapper(componentModel = "spring") in src/main/java/com/nortal/xroad/restapi/client/service/mapper/XRoadResponseMapper.java - **COMPLETED**
- [x] T017 Replace Superhero theme with Cosmo theme in src/main/webapp/app/app.scss - **COMPLETED**
- [x] T018 [P] Create TypeScript interface SubsystemId mirroring Java SubsystemIdDto in src/main/webapp/app/shared/model/subsystem-id.model.ts - **COMPLETED**
- [x] T019 [P] Create TypeScript interface Client mirroring Java ClientDto in src/main/webapp/app/shared/model/client.model.ts - **COMPLETED**
- [x] T020 [P] Create TypeScript interface ServiceId mirroring Java ServiceIdDto in src/main/webapp/app/shared/model/service-id.model.ts - **COMPLETED**
- [x] T021 [P] Create TypeScript interface RequestDetails mirroring Java RequestDetailsDto in src/main/webapp/app/shared/model/request-details.model.ts - **COMPLETED**
- [x] T022 [P] Create TypeScript interface XRoadRequest mirroring Java XRoadRequestDTO in src/main/webapp/app/shared/model/xroad-request.model.ts - **COMPLETED**
- [x] T023 [P] Create TypeScript interface XRoadResponse mirroring Java XRoadResponseDTO in src/main/webapp/app/shared/model/xroad-response.model.ts - **COMPLETED**
- [x] T024 [P] Create TypeScript interface XRoadError mirroring Java XRoadErrorDTO in src/main/webapp/app/shared/model/xroad-error.model.ts - **COMPLETED**
- [x] T025 Verify NO database dependencies added to build.gradle (constitution: no persistence) - **COMPLETED**

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 + 5 - Basic X-Road Request & No Authentication (Priority: P1) 🎯 MVP

**Goal**: Minimum viable product - users can make basic X-Road GET requests and see responses without authentication

**Independent Test**: Navigate to app URL without login, enter X-Road service details (client ID, service ID, method), Security Server URL, click "Send Request", verify response displays with headers and body

### Implementation for User Story 1 + 5

- [x] T026 [P] [US1] Create MTLSContextBuilder for parsing PEM certificates and creating SSL context with separate fields (security server cert, client cert, private key) in src/main/java/com/nortal/xroad/restapi/client/service/util/MTLSContextBuilder.java - **COMPLETED** (Refactored from PEMCertificateUtil to use separate certificate fields; includes permissive trust manager for self-signed certificates and disabled hostname verification for development/testing)
- [x] T027 [P] [US1] Create XRoadHeaderBuilder for constructing X-Road protocol headers in src/main/java/com/nortal/xroad/restapi/client/service/util/XRoadHeaderBuilder.java - **COMPLETED**
- [x] T028 [US1] Create XRoadProxyService with executeRequest method using WebClient in src/main/java/com/nortal/xroad/restapi/client/service/XRoadProxyService.java - **COMPLETED**
- [x] T029 [US1] Implement dynamic SSL context creation from PEM certificates in XRoadProxyService with hostname verification disabled for self-signed certificates - **COMPLETED** (Configured SSL handler to disable endpoint identification for development/testing with Docker containers)
- [x] T030 [US1] Implement X-Road URL construction (/r1/{serviceId}/{path}) in XRoadProxyService - **COMPLETED**
- [x] T031 [US1] Implement X-Road header injection (X-Road-Client) in XRoadProxyService - **COMPLETED**
- [x] T032 [US1] Implement timeout enforcement (60s connect, 120s read) in XRoadProxyService - **COMPLETED**
- [x] T033 [US1] Implement response mapping using XRoadResponseMapper in XRoadProxyService - **COMPLETED**
- [x] T034 [US1] Create XRoadProxyResource REST controller with POST /api/xroad/execute endpoint in src/main/java/com/nortal/xroad/restapi/client/web/rest/XRoadProxyResource.java - **COMPLETED**
- [x] T035 [US1] Add @Valid annotation to XRoadRequestDTO parameter for request validation in XRoadProxyResource - **COMPLETED**
- [x] T036 [US1] Implement error handling for timeout, connection refused, and SSL errors in XRoadProxyResource - **COMPLETED**
- [x] T037 [P] [US1] Create XRoadRequestForm React component with three sections (Client, Service, Request Details) in src/main/webapp/app/modules/xroad/xroad-request-form.tsx - **COMPLETED**
- [x] T038 [P] [US1] Implement Client section with instance, memberClass, memberCode, subsystemCode fields in XRoadRequestForm - **COMPLETED**
- [x] T039 [P] [US1] Implement securityServerUrl input field with pattern validation (^https?://.\*$) in XRoadRequestForm - **COMPLETED**
- [x] T040 [P] [US1] Implement optional collapsible PEM certificate textarea with drag-and-drop support in XRoadRequestForm - **COMPLETED**
- [x] T041 [P] [US1] Implement Service section with service identifier fields in XRoadRequestForm - **COMPLETED**
- [x] T042 [P] [US1] Implement Request Details section with method dropdown and mandatory path field in XRoadRequestForm - **COMPLETED**
- [x] T043 [US1] Integrate React Hook Form with simple validation timing (all validation on submit, errors clear on change) in XRoadRequestForm - **COMPLETED**
- [x] T044 [US1] Add placeholder text with examples to all input fields in XRoadRequestForm - **COMPLETED**
- [x] T045 [US1] Add "Clear" button for each section (Client, Service, Request Details) in XRoadRequestForm - **COMPLETED**
- [x] T046 [US1] Implement "Send Request" button with inline spinner and "Sending..." state in XRoadRequestForm - **COMPLETED**
- [x] T047 [US1] Create Axios service for POST /api/xroad/execute in src/main/webapp/app/shared/services/xroad-proxy.service.ts - **COMPLETED**
- [x] T048 [P] [US1] Create XRoadResponseViewer React component for displaying responses in src/main/webapp/app/modules/xroad/xroad-response-viewer.tsx - **COMPLETED**
- [x] T049 [US1] Implement status code and headers display in XRoadResponseViewer - **COMPLETED**
- [x] T050 [US1] Implement raw response body display in XRoadResponseViewer - **COMPLETED**
- [x] T051 [US1] Implement X-Road-Error header parsing and display in XRoadResponseViewer - **COMPLETED**
- [x] T052 [US1] Implement 1MB response size limit check with download option in XRoadResponseViewer - **COMPLETED**
- [x] T053 [US1] Update home.tsx to integrate XRoadRequestForm and XRoadResponseViewer as the landing page - **COMPLETED**: Created xroad.tsx as main component, integrated as index route in routes.tsx

**Checkpoint**: At this point, MVP should be fully functional - users can send basic X-Road GET requests without authentication and see responses

---

## Phase 4: User Story 2 - Response Format Visualization (Priority: P2)

**Goal**: Users can toggle between raw text and formatted JSON with syntax highlighting for better response analysis

**Independent Test**: Make request returning JSON, toggle between "Raw" and "JSON Format" modes, verify syntax highlighting and expandable/collapsible sections work

### Implementation for User Story 2

- [x] T063 [P] [US2] Add format toggle buttons (Raw / JSON Format) to XRoadResponseViewer in src/main/webapp/app/modules/xroad/xroad-response-viewer.tsx - **COMPLETED**
- [x] T064 [US2] Implement JSON parsing and validation in XRoadResponseViewer - **COMPLETED**
- [x] T065 [US2] Integrate react-json-view-lite for formatted JSON display in XRoadResponseViewer - **COMPLETED**
- [x] T066 [US2] Implement syntax highlighting with theme-aware colors in XRoadResponseViewer - **COMPLETED**
- [x] T067 [US2] Implement expandable/collapsible sections for nested JSON objects in XRoadResponseViewer - **COMPLETED**
- [x] T068 [US2] Display message when JSON parsing fails and fallback to raw display in XRoadResponseViewer - **COMPLETED**

**Checkpoint**: Response format switching should work for both JSON and non-JSON content

---

## Phase 5: User Story 3 - Advanced Request Configuration (Priority: P3)

**Goal**: Power users can configure complex requests with custom headers, query parameters, optional X-Road headers, and request bodies

**Independent Test**: Create POST request with JSON body, add custom headers, add query parameters, verify all components sent correctly

### Implementation for User Story 3

- [x] T069 [P] [US3] Add dynamic key-value input pairs for query parameters with Add/Remove buttons in XRoadRequestForm (src/main/webapp/app/modules/xroad/xroad-request-form.tsx) - **COMPLETED**
- [x] T070 [P] [US3] Add dynamic key-value input pairs for custom HTTP headers with Add/Remove buttons in XRoadRequestForm - **COMPLETED**
- [x] T071 [P] [US3] Add optional X-Road header fields (X-Road-Id, X-Road-UserId, X-Road-Issue, X-Road-Represented-Party) in XRoadRequestForm - **COMPLETED**
- [x] T072 [P] [US3] Add request body textarea for POST/PUT/DELETE methods in XRoadRequestForm - **COMPLETED**: Basic textarea exists at xroad-request-form.tsx:460-471
- [x] T073 [P] [US3] Add Content-Type input field shown when body is present in XRoadRequestForm - **COMPLETED**
- [x] T074 [US3] Implement query parameter URL encoding in XRoadProxyService (src/main/java/com/nortal/xroad/restapi/client/service/XRoadProxyService.java) - **COMPLETED**: Line 107-109
- [x] T075 [US3] Implement custom header forwarding in XRoadProxyService - **COMPLETED**: Line 66-68
- [x] T076 [US3] Implement optional X-Road header inclusion in XRoadProxyService - **COMPLETED**
- [x] T077 [US3] Implement request body transmission for POST/PUT/DELETE in XRoadProxyService - **COMPLETED**: Line 70

**Checkpoint**: Advanced request configuration should work independently for complex service testing scenarios

---

## Phase 6: User Story 4 - Theme and Appearance Customization (Priority: P2)

**Goal**: Users can switch between light/dark/system themes for comfortable viewing in different environments

**Independent Test**: Toggle theme selector (Light/Dark/System), verify UI changes accordingly, reload page and verify theme persists

### Implementation for User Story 4

- [x] T056 [P] [US4] Create ThemeContext with light/dark/system modes in src/main/webapp/app/config/theme-context.tsx - **COMPLETED**
- [x] T057 [US4] Implement localStorage persistence for theme preference in ThemeContext - **COMPLETED**
- [x] T058 [US4] Implement system theme detection using matchMedia in ThemeContext - **COMPLETED**
- [x] T059 [US4] Apply data-bs-theme attribute to HTML element based on active theme in ThemeContext - **COMPLETED**
- [x] T060 [P] [US4] Create ThemeToggle dropdown component with three options in src/main/webapp/app/shared/layout/header/theme-toggle.tsx - **COMPLETED**
- [x] T061 [US4] Integrate ThemeToggle into header component in src/main/webapp/app/shared/layout/header/header.tsx - **COMPLETED**
- [x] T062 [US4] Update syntax highlighting colors for Cosmo theme dark mode in src/main/webapp/app/modules/xroad/xroad-syntax-highlighting.scss - **COMPLETED**

**Checkpoint**: Theme switching should work independently across entire application

---

## Phase 7: User Story 6 - Request History Management (Priority: P4)

**Goal**: Users can view, manage, and reuse past requests and responses for improved productivity

**Independent Test**: Make several requests, open history drawer, use View/Retry/Delete actions, reload page to verify auto-load and persistence

### Implementation for User Story 6

- [x] T084 [P] [US6] Create xroad-history.reducer.ts with RequestHistoryEntry interface and actions in src/main/webapp/app/shared/reducers/xroad-history.ts
- [x] T085 [US6] Implement addRequestToHistory action that excludes PEM certificates from persisted history in xroad-history.reducer.ts
- [x] T086 [US6] Implement selectHistoryEntry and deleteHistoryEntry actions with persistence to localStorage in xroad-history.reducer.ts
- [x] T087 [US6] Implement localStorage persistence with 10-entry limit in xroad-history.reducer.ts
- [x] T088 [P] [US6] Create history-list.tsx component with side drawer layout in src/main/webapp/app/modules/xroad/components/history-list.tsx
- [x] T089 [P] [US6] Create history-entry.tsx with three-dot menu (View/Retry/Delete) in src/main/webapp/app/modules/xroad/components/history-entry.tsx
- [x] T090 [US6] Add visual "selected" state styling to history entries in history-entry.tsx
- [x] T091 [US6] Implement "Clear History" button in history-list.tsx
- [x] T092 [US6] Add "History" button to xroad.tsx that toggles history drawer visibility
- [x] T093 [US6] Implement auto-load of most recent request on page load in xroad.tsx
- [x] T094 [US6] Implement "This request is a history item" visual indicator in xroad-request-form.tsx
- [x] T095 [US6] Implement indicator removal when user modifies any field in xroad-request-form.tsx
- [x] T096 [US6] Implement View action handler (load request + response in read-only mode) in xroad.tsx
- [x] T097 [US6] Implement Retry action handler (load request in editable mode, clear response) in xroad.tsx
- [x] T098 [US6] Implement Delete action handler (remove entry, auto-load latest) in xroad.tsx
- [x] T099 [US6] Dispatch addRequestToHistory after successful response in xroad.tsx

**Checkpoint**: History management should work independently with complete View/Retry/Delete workflows and secure certificate handling

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and overall quality

- [x] T100 [P] Add error boundary component for graceful error handling in src/main/webapp/app/shared/error/error-boundary.tsx - **COMPLETED**: JHipster default, exists and integrated via error-boundary-routes.tsx
- [x] T101 [P] Implement proper error messages for network timeouts, connection errors, and SSL failures in src/main/webapp/app/modules/xroad/xroad.tsx - **COMPLETED**: Lines 32-44 with toast notifications and error response display
- [x] T102 [P] Add loading states for all async operations across components - **COMPLETED**: Loading state in xroad.tsx:12,16,46 and passed to XRoadRequestForm
- [x] T103 [P] Verify all validation patterns match constitution requirements (simple timing: submit only, placeholders) - **COMPLETED**: React Hook Form with onSubmit validation, all fields have placeholders
- [x] T104 [P] Run Prettier formatting on all modified frontend files - **COMPLETED**: `npm run prettier:check` passed - all files properly formatted
- [x] T105 [P] Run Checkstyle on all modified backend files - **COMPLETED**: `./gradlew checkstyleMain checkstyleTest` passed - no violations
- [x] T106 Add inline documentation for complex functions (PEM parsing, SSL context creation, URL construction) - **COMPLETED**: Javadoc exists in MTLSContextBuilder, XRoadProxyService, XRoadHeaderBuilder
- [x] T107 Verify TypeScript interfaces exactly mirror Java DTOs (naming conventions and field types) - **COMPLETED**: All 7 TypeScript models mirror Java DTOs
- [x] T108 Test application end-to-end with real X-Road Security Server connection - **COMPLETED**: Manually tested by user
- [x] T109 Verify all markdown documentation files have TOCs (constitution compliance) - **COMPLETED**: All 6 docs (spec.md, data-model.md, tasks.md, quickstart.md, plan.md, research.md) have `## Table of Contents` and `<!-- TOC -->` markers

---

## Phase 9: Retrospective Completions

**Purpose**: Document work completed during implementation that was not explicitly tasked

- [x] T110 **[US1+US2+US3+US4]** Implement complete internationalization (i18n) for all UI text - **COMPLETED 2025-11-18**

  - Added translation keys to `src/main/webapp/i18n/en/global.json` and `fr/global.json` for global UI elements
  - Added translation keys to `src/main/webapp/i18n/en/xroad.json` and `fr/xroad.json` for X-Road specific components
  - Updated all React components to use `<Translate>` component for JSX text and `translate()` function for string attributes
  - Implemented placeholder translations for all form fields
  - Removed all hardcoded English/French text from components
  - **Satisfies**: FR-048 to FR-052 (Complete i18n support)

- [x] T111 **[Polish]** Fix PEM certificate null handling in form submission - **COMPLETED 2025-11-18**

  - Created `handleFormSubmit` wrapper in `xroad-request-form.tsx` that filters out null/empty PEM certificates
  - Implementation: `data.client.pemCertificates.filter(cert => cert != null && cert.trim() !== '')`
  - Prevents backend error when empty certificate field submitted
  - **Location**: `src/main/webapp/app/modules/xroad/xroad-request-form.tsx`

- [x] T112 **[Polish]** Remove footer message and clean up translation files - **COMPLETED 2025-11-18**

  - Removed "This is your footer" message from `footer.tsx`
  - Removed `"footer"` key from `en/global.json` and `fr/global.json`
  - **Location**: `src/main/webapp/app/shared/layout/footer/footer.tsx`

- [x] T113 **[US5]** Complete removal of entities module from UI - **COMPLETED 2025-11-18**

  - Deleted `/app/entities/` directory (menu.tsx, routes.tsx, reducers.ts)
  - Deleted `/app/shared/layout/menus/entities.tsx`
  - Updated `header.tsx`: `EntitiesMenu` import and usage
  - Updated `menus/index.ts`: exports updated
  - Updated `routes.tsx`: `EntitiesRoutes` import and route handled
  - Updated `header.spec.tsx`: EntitiesMenu test assertions handled
  - **Extends**: no authentication by removing entity management UI

- [x] T114 **[US5]** Complete removal of administration and authentication UI components - **COMPLETED 2025-11-18**

  - Deleted `/app/modules/administration/` - entire admin module
  - Deleted `/app/shared/auth/` - all authentication components
  - Deleted `/app/shared/layout/password/` - password strength components
  - Deleted `/app/shared/layout/menus/admin.tsx` - admin menu
  - Deleted `/app/shared/layout/menus/account.spec.tsx` - account test
  - Deleted `/app/shared/model/user.model.ts` - user model
  - Deleted `/app/shared/reducers/authentication.ts` and `.spec.ts`
  - Updated `routes.tsx`: admin routes removed, simplified to only XRoad and 404
  - Updated `header.tsx`: admin menu removed, authentication props removed (isAuthenticated, isAdmin, isOpenAPIEnabled)
  - Updated `menus/index.ts`: only exports locale menu now
  - Updated `app.tsx`: authentication session management removed
  - Updated `reducers/index.ts`: only locale and applicationProfile remain
  - Updated `header.spec.tsx`: simplified tests without authentication checks
  - Updated `index.tsx`: authentication import and clearAuthentication binding removed
  - **Result**: Clean public application with no authentication, admin, or entity management UI
  - **Satisfies**: FR-053 to FR-057 (No authentication required)

- [x] T115 **[US4]** Update header theme from white to blue primary (Cosmo theme) - **COMPLETED 2025-11-18**

  - Changed `header.tsx` line 47: `light` prop to `dark`, `className="bg-light"` to `className="bg-primary"`
  - Result: Blue navbar matching Cosmo theme instead of white navbar
  - **Location**: `src/main/webapp/app/shared/layout/header/header.tsx:47`
  - **Satisfies**: FR-040 (Use Cosmo theme)

- [x] T116 **[i18n]** Update application brand name to "X-Road REST Client" with translations - **COMPLETED 2025-11-18**

  - Updated `en/global.json`: `"title": "X-Road REST Client"`
  - Updated `fr/global.json`: `"title": "Client REST X-Road"`
  - Updated `header-components.tsx`: default text in `<Translate>` to "X-Road REST Client"
  - **Location**: `src/main/webapp/i18n/*/global.json`, `src/main/webapp/app/shared/layout/header/header-components.tsx:18`
  - **Satisfies**: FR-048 to FR-052 (i18n for all UI text)

- [x] T117 **[Code Quality]** Configure comprehensive pre-commit hooks with Husky and lint-staged - **COMPLETED 2025-11-18**

  - Enhanced `.lintstagedrc.cjs` to run ESLint, TypeScript checking, Checkstyle, and Prettier on staged files
  - Updated `eslint.config.mjs` to enable `@typescript-eslint/no-unused-vars` error detection
  - Created `PRE-COMMIT-HOOKS.md` documentation with complete usage guide
  - Updated `CLAUDE.md` with pre-commit hooks section
  - **Pre-commit checks**: TypeScript (ESLint → tsc → Prettier), JavaScript (ESLint → Prettier), Java (Checkstyle → Prettier)
  - **Blocks commits** on: unused imports/variables, type errors, checkstyle violations, formatting issues
  - **Location**: `.lintstagedrc.cjs`, `eslint.config.mjs`, `PRE-COMMIT-HOOKS.md`, `CLAUDE.md`

- [x] T118 **[Code Quality]** Fix IntelliJ code analysis warnings - **COMPLETED 2025-11-18**

  - Fixed unused imports in `footer.tsx`, `XRoadProxyResource.java`, `XRoadResponseMapper.java`
  - Fixed unused `reset` variable in `xroad-request-form.tsx`
  - Fixed deprecated `UriComponentsBuilder.fromHttpUrl()` to `fromUriString()` in `XRoadProxyService.java`
  - Fixed potential NullPointerException in `XRoadResponseMapper.java` by caching `HttpStatus.resolve()`
  - Removed obsolete `-moz-box-sizing` vendor prefixes from `app.scss`
  - Fixed `Optional.ofNullable(null)` to `Optional.empty()` in `ExceptionTranslator.java`
  - Updated deprecated Gradle task syntax from `task name(type:)` to `tasks.register("name", Type)` in `build.gradle`
  - Removed missing logo file reference in `header-components.tsx`
  - Removed orphaned Spring Security test files (SecurityUtilsUnitTest, ExceptionTranslatorIT, etc.)
  - **Result**: Clean IntelliJ code analysis with all critical warnings resolved

- [x] T119 **[Code Quality]** Configure strict Java compiler lint checks with -Werror - **COMPLETED 2025-11-18**
  - Added `tasks.withType(JavaCompile).configureEach` block in `build.gradle`
  - Enabled `-Xlint:all` for comprehensive compile-time warnings (22 check categories)
  - Disabled `-Xlint:-processing` (MapStruct warnings) and `-Xlint:-serial` (not critical)
  - Added `-Werror` to treat all warnings as compilation errors
  - Enabled `options.deprecation = true` for detailed deprecation info
  - Created `JAVA-COMPILER-OPTIONS.md` with comprehensive documentation of all 22 lint checks
  - Updated `PRE-COMMIT-HOOKS.md` and `CLAUDE.md` with Java compiler strictness sections
  - **Catches**: unused imports, raw types, unchecked operations, missing @Override, deprecated APIs, unsafe casts
  - **Verified**: `./gradlew clean build` passes successfully with strict checks
  - **Location**: `build.gradle:102-115`, `JAVA-COMPILER-OPTIONS.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - User stories CAN proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 + US5 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories - **MVP**
- **US4 (P2)**: Can start after Foundational (Phase 2) - Independent of US1
- **US2 (P2)**: Depends on US1 for XRoadResponseViewer component - Extends response viewing
- **US3 (P3)**: Depends on US1 for XRoadRequestForm and XRoadProxyService - Extends request configuration
- **US6 (P4)**: Depends on US1 for request/response data structures - Adds history management

### Within Each User Story

- DTO creation tasks can run in parallel
- MapStruct mapper after DTOs
- Services after DTOs and mappers
- REST controllers after services
- React components can be developed in parallel with backend
- Integration happens after both backend and frontend components ready

### Parallel Opportunities

- **Phase 1 (Setup)**: All tasks except T001 can run in parallel
- **Phase 2 (Foundational)**: Tasks T009-T015 (DTOs) can run in parallel, T018-T024 (TypeScript interfaces) can run in parallel
- **Phase 3 (US1+US6)**: Tasks T026-T027 (utilities) can run in parallel, T037-T042 (form sections) can run in parallel, T048 can run parallel with backend work
- **Phase 4 (US5)**: Tasks T056, T060 can run in parallel
- **Phase 5 (US2)**: Tasks T063, T064 can start in parallel
- **Phase 6 (US3)**: Tasks T069-T073 (form enhancements) can run in parallel
- **Phase 7 (Polish)**: Most tasks can run in parallel (T084-T098)

**Total parallel-capable tasks**: 45 out of 100 tasks marked with [P]

---

## Implementation Strategy

### MVP First (User Stories 1 + 5 Only)

1. Complete Phase 1: Setup → **~5 tasks, ~2 hours**
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories) → **~20 tasks, ~8 hours**
3. Complete Phase 3: User Story 1 + 5 → **~30 tasks, ~16 hours**
4. **STOP and VALIDATE**: Test MVP independently with real Security Server
5. Deploy/demo if ready → **Total MVP: ~26 hours**

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (~10 hours)
2. Add User Story 1 + 5 → Test independently → Deploy/Demo (**MVP! ~26 hours total**)
3. Add User Story 4 (Theme) → Test independently → Deploy/Demo (~4 hours more)
4. Add User Story 2 (Response Formats) → Test independently → Deploy/Demo (~3 hours more)
5. Add User Story 3 (Advanced Config) → Test independently → Deploy/Demo (~4 hours more)
6. Add User Story 6 (History Management) → Test independently → Deploy/Demo (~8 hours more)
7. Add Polish (Error Handling, Documentation) → Final release (~4 hours more)

**Total estimated effort**: ~49 hours (6 developer days)

### Parallel Team Strategy

With 3 developers:

1. **Team completes Setup + Foundational together** (~10 hours)
2. **Once Foundational is done:**
   - **Developer A**: User Story 1 + 5 (MVP backend + frontend core) - ~16 hours
   - **Developer B**: User Story 4 (Theme system) - ~4 hours, then US2 (Response formats) - ~3 hours
   - **Developer C**: Start on US3 prep work, then US6 (History) - ~12 hours
3. **Stories complete and integrate independently**

**Parallel completion time**: ~2-3 days instead of 6 days

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Constitution compliance verified in Phase 2 (Foundational) and Phase 8 (Polish)
- Tests not included per specification - implementation-focused workflow
- Stop at any checkpoint to validate story independently before proceeding
- All DTOs follow Java Record pattern with NO business logic (constitution compliance)
- TypeScript interfaces mirror Java DTOs exactly (naming convention: no suffix vs Dto suffix)
- No database persistence - localStorage only (constitution compliance)
- Security Server URL and certificates submitted per-request via UI (constitution compliance)
- **Spring Security completely removed** - no SecurityConfiguration, no AccountResource, all endpoints public
- **X-Road form is the landing page** at "/" (home.tsx) - no separate /xroad route needed
