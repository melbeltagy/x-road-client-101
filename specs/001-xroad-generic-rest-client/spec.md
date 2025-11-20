# Feature Specification: X-Road Generic REST Client

**Feature Branch**: `001-xroad-generic-rest-client`
**Created**: 2025-11-17
**Status**: Draft
**Input**: User description: "this application is a generic REST client that will invoke an unknown service via X-Road security server. The UI should accept the generic parts as a user input. Fields are as described in this section of the doc https://docs.x-road.global/Protocols/pr-rest_x-road_message_protocol_for_rest.html#4-message-format. UI should use Cosmo theme instead of superhero and allow the user to switch between light and dark mode or follow the system. UI should not require login. The UI page is one page where user enters the required input and then call the service. whatever the call is, response should be visible in the UI. Give the user the chance to select how to display the response (RAW message or as a JSON format) - similar to how browser's dev tools do. If JSON format is selected, then using a library to format and display the result visually should be used. A colorized, formatted output of the JSON result must always be present. Response headers should also be visible in all cases. If JSON Format is used, it would be nice to additionally display the output as an object graph or something (visual representation) using a 3rd party library, if needed."

## Table of Contents

<!-- TOC -->

- [Feature Specification: X-Road Generic REST Client](#feature-specification-x-road-generic-rest-client)
  - [Table of Contents](#table-of-contents)
  - [Clarifications](#clarifications)
    - [Session 2025-11-18](#session-2025-11-18)
  - [User Scenarios & Testing _(mandatory)_](#user-scenarios--testing-_mandatory_)
    - [User Story 1 - Basic X-Road Service Request (Priority: P1)](#user-story-1---basic-x-road-service-request-priority-p1)
    - [User Story 2 - Response Format Visualization (Priority: P2)](#user-story-2---response-format-visualization-priority-p2)
    - [User Story 3 - Advanced Request Configuration (Priority: P3)](#user-story-3---advanced-request-configuration-priority-p3)
    - [User Story 4 - Theme and Appearance Customization (Priority: P2)](#user-story-4---theme-and-appearance-customization-priority-p2)
    - [User Story 5 - No Authentication Required (Priority: P1)](#user-story-5---no-authentication-required-priority-p1)
    - [User Story 6 - Request History Management (Priority: P4)](#user-story-6---request-history-management-priority-p4)
    - [Edge Cases](#edge-cases)
  - [Requirements _(mandatory)_](#requirements-_mandatory_)
    - [Functional Requirements](#functional-requirements)
      - [Request Configuration](#request-configuration)
      - [Request Execution](#request-execution)
      - [Response Display](#response-display)
      - [User Interface and Theme](#user-interface-and-theme)
      - [Authentication and Access](#authentication-and-access)
      - [Data Persistence and History Management](#data-persistence-and-history-management)
    - [Key Entities _(include if feature involves data)_](#key-entities-_include-if-feature-involves-data_)
  - [Success Criteria _(mandatory)_](#success-criteria-_mandatory_)
  _ [Measurable Outcomes](#measurable-outcomes)
  _ [Dependencies](#dependencies)
  _ [Assumptions](#assumptions)
  _ [Out of Scope](#out-of-scope)
  <!-- TOC -->

## Clarifications

### Session 2025-11-18

- Q: For large responses (>10MB), how should the system handle display? → A: Hard limit at 1MB - reject display entirely, only show metadata (size, headers) and offer download
- Q: How should client certificates for mTLS be configured? → A: Optional collapsible textarea fields where users paste PEM contents (not file upload); support three separate fields for Security Server cert, Client cert, and Client private key; certificates are part of Client object; backend combines into bundle for mTLS
- Q: What timeout values should be used for HTTP requests to Security Server? → A: Long timeouts - 60s connect, 120s read (accommodate slow services, but longer wait on failures)
- Q: How should failed requests be handled? → A: No retry mechanism - user must manually reconfigure and resend after failures
- Q: Should the application maintain a history of sent requests and responses in localStorage? → A: Yes - keep history in localStorage with clear history button
- Q: Should the most recent request from history be auto-loaded when navigating to request page or refreshing? → A: Yes - auto-load last request from history into form fields on page load/navigation
- Q: How should the input form be organized and how can users clear data? → A: Divide input into three sections (Client, Service, Request Details) each with its own "Clear" button to clear that section only
- Q: How should users input PEM certificate contents? → A: Drag-and-drop file zone + manual paste - users can drag .pem files onto textarea or paste manually
- Q: How should users input query parameters and custom HTTP headers (key-value pairs)? → A: Dynamic input pairs with Add/Remove buttons - individual input fields for each key-value pair with + button to add rows and × button to remove rows
- Q: How should users interact with individual request history entries? → A: Three-dot menu per entry with View, Retry, and Delete actions - View displays request+response and marks entry as selected; Retry loads editable request with empty response and keeps entry selected; Delete removes entry and auto-loads latest remaining request marking it as selected
- Q: Where should the request history be displayed in the UI? → A: Side drawer/panel that slides in from right - when request is loaded from history (View, auto-load on page refresh, or manual selection), show visual indicator "This request is a history item" which is removed when user modifies fields or clicks Retry
- Q: When should validation errors be displayed to users for required fields and format validation? → A: Simple approach - all validation errors (both required and format/pattern) display only when user clicks submit; after submit, errors clear in real-time as user types valid values; all input fields MUST display placeholder text with example values when empty
- Q: How should the UI indicate that a request is in progress (loading state)? → A: Inline spinner next to Send Request button - button text changes to "Sending...", button is disabled, and spinner appears next to button while form remains visible and scrollable

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Basic X-Road Service Request (Priority: P1)

As a developer or tester, I need to quickly test X-Road services by entering service details and seeing the response, so I can verify service availability and data formats without writing custom client code.

**Why this priority**: This is the core functionality - the ability to make a single X-Road request and see results. Without this, the application has no value. This represents the minimum viable product.

**Independent Test**: Can be fully tested by entering valid X-Road service coordinates (client ID, service ID, method), clicking "Send Request", and verifying that a response is displayed with both headers and body content visible.

**Acceptance Scenarios**:

1. **Given** I am on the main page, **When** I enter valid X-Road client identifier (instance/memberClass/memberCode/subsystemCode), service identifier, HTTP GET method, and Security Server URL, and click "Send Request", **Then** I see the HTTP response with status code, headers, and body content
2. **Given** I have entered all required X-Road header fields, **When** I click "Send Request", **Then** the system constructs the proper X-Road REST URL format (/r1/{serviceId}/{path}) and includes all X-Road headers in the request
3. **Given** I receive a response from the X-Road service, **When** the response includes X-Road-specific headers (X-Road-Id, X-Road-Request-Hash), **Then** these headers are visible in the response header section
4. **Given** the X-Road Security Server returns an error, **When** the response includes an X-Road-Error header, **Then** I see a clear display of the error type, message, and detail

---

### User Story 2 - Response Format Visualization (Priority: P2)

As a user examining API responses, I need to view response data in multiple formats (raw text and formatted JSON) with syntax highlighting, so I can quickly understand the structure and content of the response.

**Why this priority**: While viewing responses is essential, the ability to switch between raw and formatted views significantly improves usability. This can be added after basic request/response functionality works.

**Independent Test**: Can be tested by making any request that returns JSON data, then toggling between "Raw" and "JSON" display modes and verifying that both show the same data with appropriate formatting.

**Acceptance Scenarios**:

1. **Given** I have received a JSON response, **When** I select "JSON Format" display mode, **Then** I see the JSON content with syntax highlighting, proper indentation, and expandable/collapsible sections
2. **Given** I am viewing a JSON response in formatted mode, **When** I switch to "Raw" display mode, **Then** I see the exact unformatted response body as received from the server
3. **Given** I have received a non-JSON response (XML, plain text, HTML), **When** I select "JSON Format" mode, **Then** the system indicates that JSON formatting is not available and displays the content in raw format
4. **Given** I am viewing a formatted JSON response, **When** I expand nested objects or arrays, **Then** I can navigate through the entire structure to examine deeply nested values
5. **Given** response headers are present, **When** viewing the response in any format, **Then** all HTTP headers are visible in a separate headers section with name-value pairs clearly displayed

---

### User Story 3 - Advanced Request Configuration (Priority: P3)

As a power user testing complex X-Road services, I need to specify optional X-Road headers (X-Road-UserId, X-Road-Issue, X-Road-Represented-Party), custom HTTP headers, query parameters, and request body content, so I can test various service scenarios and edge cases.

**Why this priority**: While basic GET requests are common, many X-Road services require POST/PUT with body content, optional headers, and query parameters. This enables complete testing capabilities but is not required for initial value delivery.

**Independent Test**: Can be tested by creating a POST request with a JSON body, adding custom headers (e.g., "Authorization: Bearer token"), adding query parameters, and verifying the request is sent with all specified components.

**Acceptance Scenarios**:

1. **Given** I am configuring a request, **When** I select POST, PUT, PATCH, or DELETE as the HTTP method and enter JSON content in the request body field, **Then** the request includes the body content with the Content-Type header set appropriately
2. **Given** I need to include optional X-Road headers, **When** I fill in X-Road-UserId, X-Road-Issue, or X-Road-Represented-Party fields, **Then** these headers are included in the outgoing request
3. **Given** I need to add query parameters, **When** I enter key-value pairs for query parameters, **Then** the system properly URL-encodes them and appends them to the request URL
4. **Given** I need to pass custom HTTP headers to the target service, **When** I add custom header entries (e.g., "Authorization", "X-Custom-Header"), **Then** these headers are included in the request along with X-Road protocol headers
5. **Given** I am entering service path segments, **When** I specify an additional path after the service code (e.g., "/users/123"), **Then** the path is appended to the service identifier in the URL

---

### User Story 4 - Theme and Appearance Customization (Priority: P2)

As a user working in different lighting conditions, I need to switch between light and dark themes (or follow system preferences), so I can reduce eye strain and work comfortably in various environments.

**Why this priority**: User experience and accessibility are important, especially for a tool that may be used extensively. This is independent of request/response functionality and can be developed in parallel.

**Independent Test**: Can be tested by toggling theme settings (Light/Dark/System) and verifying that the UI appearance changes accordingly and persists across page reloads.

**Acceptance Scenarios**:

1. **Given** I am using the application, **When** I select "Light Mode" from the theme selector, **Then** the interface displays with a light color scheme using the Cosmo theme styling
2. **Given** I am using the application, **When** I select "Dark Mode" from the theme selector, **Then** the interface displays with a dark color scheme using the Cosmo theme dark variant
3. **Given** I select "System" theme preference, **When** my operating system is set to dark mode, **Then** the application automatically uses dark theme styling
4. **Given** I have selected a theme preference, **When** I reload the page or return later, **Then** my theme preference is remembered and applied automatically
5. **Given** I am viewing a response with syntax highlighting, **When** I switch between light and dark themes, **Then** the syntax highlighting colors adjust appropriately for readability in the selected theme

---

### User Story 5 - No Authentication Required (Priority: P1)

As any user or automated system, I need to access the X-Road client interface without logging in, so I can immediately start testing services without user account management overhead.

**Why this priority**: This is a fundamental architectural decision that affects all other features. The application must be accessible without authentication from the start.

**Independent Test**: Can be tested by navigating to the application URL (/) in an incognito/private browser window and verifying that the X-Road request form is immediately displayed as the landing page without any login prompt or redirect.

**Acceptance Scenarios**:

1. **Given** I navigate to the application root URL ("/"), **When** the page loads, **Then** I am immediately presented with the X-Road request configuration form as the landing page without any login or authentication prompt
2. **Given** I am using the application, **When** I perform any action (configure request, send request, view response), **Then** no authentication or session validation occurs
3. **Given** the application is deployed, **When** automated scripts or tools access it, **Then** they can interact with all functionality without providing credentials
4. **Given** Spring Security has been removed from the application, **When** I inspect the backend configuration, **Then** there are no SecurityConfiguration beans enforcing authentication/authorization
5. **Given** the application architecture, **When** I inspect the route configuration, **Then** there is no separate "/login" route or login page component

---

### User Story 6 - Request History Management (Priority: P4)

As a frequent user of the X-Road REST Client, I need to view and manage my past requests and responses, so I can quickly retry previous requests, compare results over time, and avoid re-entering configuration details.

**Why this priority**: While history management significantly improves user experience, it is not essential for core functionality. Users can still test services effectively without history. This feature can be added after core request/response functionality is stable.

**Independent Test**: Can be tested by making several requests, clicking the History button to open the history drawer, selecting entries from history to view or retry them, and verifying that history persists across browser sessions.

**Acceptance Scenarios**:

1. **Given** I have made multiple X-Road requests, **When** I click the History button, **Then** a side drawer slides in from the right displaying all my past requests with timestamps and status codes
2. **Given** I am viewing the history drawer, **When** I click the three-dot menu on a history entry and select "View", **Then** the request and response are loaded in read-only mode with a visual indicator "This request is a history item"
3. **Given** I am viewing a history entry, **When** I click the three-dot menu and select "Retry", **Then** the request is loaded into editable form fields with the response cleared and the history item remains selected
4. **Given** I am viewing the history drawer, **When** I click the three-dot menu on an entry and select "Delete", **Then** that entry is removed and the most recent remaining request is automatically loaded
5. **Given** I have loaded a request from history, **When** I modify any field in the request form, **Then** the "This request is a history item" indicator is removed and the response is cleared
6. **Given** I have request history stored, **When** I reload the page or return to the application, **Then** the most recent request from history is automatically loaded into the form
7. **Given** I have accumulated many history entries, **When** I click "Clear History" in the history drawer, **Then** all history entries are deleted from localStorage
8. **Given** mTLS certificates were entered in a request, **When** that request is saved to history, **Then** the certificate data is NOT persisted to localStorage for security reasons
9. **Given** the history drawer is open and a history entry is selected, **When** I close and reopen the drawer, **Then** the same entry remains visually marked as selected

---

### Edge Cases

- What happens when the X-Road Security Server is unreachable or times out?

  - System MUST display a clear error message indicating connection failure (after 60s connect timeout) or read timeout (after 120s) with specific timeout reason

- What happens when users enter invalid characters in X-Road identifier fields?

  - System should validate input against allowed characters (A-Z, a-z, 0-9, '()+,-.=?) and display validation errors

- What happens when the service returns a very large response (>1MB)?

  - System MUST reject display of response body for responses exceeding 1MB, showing only metadata (status code, headers, content size) and providing a download option for the full response body

- What happens when users enter malformed JSON in the request body?

  - System should allow the request to proceed (validation is service's responsibility) but may optionally warn about JSON syntax errors

- What happens when the response content-type doesn't match the actual content?

  - System should respect the Content-Type header but allow users to force different display modes

- What happens when special characters need to be included in query parameters or path segments?

  - System must properly URL-encode all query parameters and path segments per RFC 3986

- What happens when users need to test services requiring client certificates (mTLS)?

  - System MUST provide optional collapsible textarea fields in the Client section with three separate fields: Security Server certificate, Client certificate, and Client private key; users can paste PEM certificate contents for each; backend combines all entries into a single bundle for mTLS connection; PEM contents NOT persisted to browser storage for security

- What happens when testing with self-signed certificates in development/testing environments?

  - System accepts self-signed certificates without CA validation for development/testing convenience; MTLSContextBuilder includes permissive trust manager that bypasses certificate chain validation; production deployments SHOULD use CA-signed certificates and enable proper certificate validation

- What happens when connecting to Security Server with hostname mismatch (e.g., connecting to localhost but certificate issued for container IP)?

  - System disables hostname verification for development/testing to support Docker containers and self-signed certificates; hostname verification can be re-enabled for production by modifying XRoadProxyService SSL handler configuration; this is a conscious trade-off for developer experience in local/test environments

- What happens when the X-Road service returns a redirect (3xx status code)?
  - System should display the redirect response without automatically following it (per X-Road protocol specification)

## Requirements _(mandatory)_

### Functional Requirements

#### Request Configuration

- **FR-001**: System MUST provide input fields for X-Road client identifier components: instance, memberClass, memberCode, and subsystemCode
- **FR-002**: System MUST provide optional collapsible textarea fields within the Client section with three separate fields for mTLS certificates: Security Server certificate, Client certificate, and Client private key; each field supports both drag-and-drop of .pem files and manual paste
- **FR-003**: System MUST provide input fields for X-Road service identifier components: instance, memberClass, memberCode, subsystemCode (optional), serviceCode, and optional path segments
- **FR-004**: System MUST provide a dropdown or selection mechanism for HTTP method (GET, POST, PUT, DELETE, PATCH)
- **FR-005**: System MUST provide an input field for the Security Server base URL (e.g., "https://securityserver.example.com")
- **FR-006**: System MUST construct the X-Road-Client header in the format "{instance}/{memberClass}/{memberCode}[/{subsystemCode}]" from user input
- **FR-007**: System MUST construct the request URL in the format "{baseURL}/r1/{instance}/{memberClass}/{memberCode}[/{subsystemCode}]/{serviceCode}[/{path}]\[?query]"
- **FR-008**: System MUST provide optional input fields for X-Road-Id, X-Road-UserId, X-Road-Issue, X-Road-Security-Server, and X-Road-Represented-Party headers
- **FR-009**: System MUST provide dynamic input fields with Add/Remove buttons for custom HTTP headers as key-value pairs
- **FR-010**: System MUST provide dynamic input fields with Add/Remove buttons for query parameters as key-value pairs with automatic URL encoding
- **FR-011**: System MUST provide a text area for request body content (for POST/PUT/PATCH/DELETE methods)
- **FR-012**: System MUST provide an input field for Content-Type header when request body is present
- **FR-013**: System MUST validate that required fields (client identifier components, service identifier components, HTTP method) are populated when user attempts to submit the request, displaying validation errors for any missing required fields
- **FR-014**: System MUST validate input characters against X-Road allowed character patterns for identifier fields using hybrid validation timing per Project Constitution v1.1.0 Section III:
  - **Format/pattern validation**: Display errors on blur (when field loses focus) for immediate feedback on invalid characters
  - **Required field validation**: Display errors only when user clicks submit to avoid premature error states
  - **Error clearing**: After any validation error is shown, errors must clear in real-time as user types valid values
  - **Pattern enforcement**: Use `@Pattern` annotations (backend) and regex validation (frontend) for X-Road identifier character sets
- **FR-015**: System MUST display placeholder text with example values for all input fields when empty (e.g., "DEV" for instance, "COM" for memberClass, "1234567-8" for memberCode)

#### Request Execution

- **FR-016**: System MUST send HTTP requests to the configured Security Server URL with all specified headers, query parameters, and body content
- **FR-017**: System MUST include all mandatory X-Road headers (X-Road-Client) in the request
- **FR-018**: System MUST properly encode query parameters and path segments per RFC 3986
- **FR-019**: System MUST handle network errors (timeout, connection refused, DNS failure) and display clear error messages with specific error details without automatic retry - users manually resend requests after reviewing errors
- **FR-020**: System MUST enforce a 60-second connection timeout and 120-second read timeout for requests to Security Server
- **FR-021**: System MUST support HTTPS connections to Security Servers
- **FR-022**: System MUST support three separate PEM certificate fields (Security Server cert, Client cert, Client private key) that the backend combines into a single bundle when establishing mTLS connections
- **FR-023**: System MUST handle all HTTP status codes (2xx, 3xx, 4xx, 5xx) and display them to the user
- **FR-024**: System MUST display an inline spinner next to the Send Request button during request execution, change button text to "Sending...", and disable the button while the request is in progress

#### Response Display

- **FR-025**: System MUST display the HTTP status code and status text from the response
- **FR-026**: System MUST display all HTTP response headers as name-value pairs
- **FR-027**: System MUST display the response body content
- **FR-028**: System MUST provide a toggle or selection mechanism to switch between "Raw" and "JSON Format" display modes
- **FR-029**: When "Raw" mode is selected, system MUST display the response body exactly as received without formatting
- **FR-030**: When "JSON Format" mode is selected AND response is valid JSON, system MUST display the content with syntax highlighting, proper indentation, and expandable/collapsible sections
- **FR-031**: System MUST detect whether response content is valid JSON by attempting to parse it
- **FR-032**: When JSON parsing fails or content is not JSON, system MUST display a message indicating JSON formatting is unavailable and show raw content
- **FR-033**: System MUST use colorized syntax highlighting for JSON content with distinct colors for keys, strings, numbers, booleans, and null values
- **FR-035**: System MUST display X-Road-specific response headers (X-Road-Id, X-Road-Request-Hash, X-Road-Request-Id, X-Road-Error) prominently if present
- **FR-036**: When X-Road-Error header is present, system MUST parse and display the error type, message, and detail in a user-friendly format
- **FR-037**: System MUST enforce a hard limit of 1MB for response body display - responses exceeding this size MUST NOT be displayed, showing only metadata (status code, headers, content size) and a download option

#### User Interface and Theme

- **FR-038**: System MUST organize input form into three distinct sections: Client (client identifier fields + optional mTLS certificates), Service (service identifier fields), and Request Details (method, path, headers, body, etc.)
- **FR-039**: System MUST provide a "Clear" button for each input section (Client, Service, Request Details) that clears only the fields within that specific section
- **FR-040**: System MUST use the Cosmo theme for styling instead of Superhero theme
- **FR-041**: System MUST provide a theme selector with three options: Light Mode, Dark Mode, and System (follow OS preference)
- **FR-042**: When Light Mode is selected, system MUST apply light color scheme styling
- **FR-043**: When Dark Mode is selected, system MUST apply dark color scheme styling
- **FR-044**: When System preference is selected, system MUST detect operating system theme preference and apply corresponding theme
- **FR-045**: System MUST persist user's theme selection and apply it on subsequent visits
- **FR-046**: System MUST adjust syntax highlighting colors appropriately for the selected theme to ensure readability using Cosmo theme CSS variables
  - Light mode: Use Cosmo light theme variables (`--bs-body-color`, `--bs-primary`, `--bs-success`, `--bs-info`, `--bs-warning`, `--bs-danger`)
  - Dark mode: Use Cosmo dark theme variables (automatically applied via `data-bs-theme="dark"`)
  - JSON syntax highlighting colors: keys (primary), strings (success), numbers (info), booleans (warning), null (secondary)
  - Implementation: CSS classes in `src/main/webapp/content/scss/_syntax-highlighting.scss` that reference Bootstrap 5 CSS custom properties
- **FR-047**: System MUST present all functionality on a single page without requiring navigation to different pages
- **FR-048**: System MUST support internationalization (i18n) for all user-facing text (labels, buttons, validation messages, placeholders)
- **FR-049**: System MUST provide complete translations for all supported languages (English and French)
- **FR-050**: When adding new UI components or text, developers MUST add corresponding translation keys to all language files in `src/main/webapp/i18n/[lang]/`
- **FR-051**: System MUST use `<Translate>` component for JSX text content and `translate()` function for string attributes (placeholders, validation messages)
- **FR-052**: System MUST NOT include hardcoded English or French text in React components - all text MUST reference i18n translation keys

#### Authentication and Access

- **FR-053**: System MUST NOT require user login or authentication to access any functionality
- **FR-054**: System MUST NOT implement session management or user account features
- **FR-055**: System MUST be immediately accessible when navigating to the application URL
- **FR-056**: System MUST NOT include Spring Security authentication/authorization (no login page, no user accounts, all endpoints public)
- **FR-057**: System MUST render the X-Road request form as the landing page (root path "/") without requiring navigation to separate routes

#### Data Persistence and History Management

- **FR-058**: System MUST persist request and response history in browser localStorage (excluding sensitive data like credentials and certificates)
- **FR-059**: System MUST automatically load the most recent request from history into the form fields when the request page loads, marking it as selected in the history
- **FR-060**: System MUST NOT persist mTLS certificate contents (Security Server cert, Client cert, Client private key) in browser storage for security reasons
- **FR-061**: System MUST provide a "Clear History" button to delete all stored request/response history from localStorage
- **FR-062**: System MAY limit the number of stored history entries to prevent excessive localStorage usage
- **FR-063**: System MUST display request history in a side drawer/panel that slides in from the right when user clicks History button
- **FR-064**: System MUST provide a three-dot menu for each history entry with actions: View, Retry, and Delete
- **FR-065**: When user clicks View on a history entry, system MUST load both request and response data, mark the entry as selected in history, and display a visual indicator "This request is a history item"
- **FR-066**: When user clicks Retry on a history entry, system MUST load the request into editable form fields with empty response, keep the entry marked as selected in history, and remove the "history item" indicator
- **FR-067**: When user clicks Delete on a history entry, system MUST remove the entry from history, automatically load the latest remaining request from history, and mark it as selected
- **FR-068**: When a request is loaded from history (via View, auto-load, or selection) and user modifies any field, system MUST clear the response data and remove the "history item" visual indicator
- **FR-069**: System MUST maintain a visual "selected" state for the currently active history entry that persists across drawer open/close actions

### Key Entities _(include if feature involves data)_

- **Request Configuration**: Represents a complete X-Road service request specification including:

  - **Client**: subsystem identifier (instance, memberClass, memberCode, subsystemCode), Security Server URL, and optional mTLS certificates with three separate fields (Security Server cert, Client cert, Client private key)
  - **Service**: service identifier (instance, memberClass, memberCode, subsystemCode, serviceCode, path)
  - **Request Details**: HTTP method (GET/POST/PUT/DELETE/PATCH), path (mandatory), query parameters, custom headers, request body content, Content-Type, and optional X-Road headers (X-Road-Id, X-Road-UserId, X-Road-Issue, X-Road-Represented-Party)

  The client may include three separate certificate fields that form the mTLS configuration for Security Server authentication.

- **Response Data**: Represents the complete HTTP response from an X-Road service including HTTP status code, response headers (including X-Road-specific headers: X-Road-Id, X-Road-Request-Hash, X-Road-Request-Id, X-Road-Error), response body content, and metadata about content type and size

- **Theme Preference**: Represents user's selected theme mode (Light, Dark, or System) for UI appearance customization

- **Request History Entry**: Represents a stored request/response pair including the complete Request Configuration, Response Data, timestamp, and optional user-assigned label for easy identification

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can construct and send a basic X-Road GET request in under 90 seconds from page load
- **SC-002**: System displays all response headers and body content within 2 seconds of receiving the response from the Security Server (excluding network latency)
- **SC-003**: Users can successfully test X-Road services without reading documentation, with 80% of first-time users completing a request on their first attempt
- **SC-004**: JSON responses up to 1MB are formatted and displayed with syntax highlighting in under 1 second
- **SC-005**: Theme switching occurs instantly (under 200ms) without page reload
- **SC-006**: System correctly handles and displays 100% of valid X-Road protocol headers in both requests and responses
- **SC-007**: Users can identify X-Road infrastructure errors (X-Road-Error header present) within 5 seconds of viewing the response
- **SC-008**: Application loads and is interactive in under 3 seconds on standard broadband connections
- **SC-009**: Request configuration persists across browser sessions, allowing users to return and resume testing without re-entering all details

### Dependencies

- **DEP-001**: Access to an X-Road Security Server for testing (can be development, test, or production instance)
- **DEP-002**: Valid X-Road member credentials (instance/memberClass/memberCode) for the client identifier
- **DEP-003**: Knowledge of target X-Road service identifiers to test against
- **DEP-004**: Network connectivity to the X-Road Security Server
- **DEP-005**: For mTLS scenarios: Valid Security Server certificate, client certificate, and client private key in PEM format issued by appropriate certificate authority, available to paste into textarea fields

### Assumptions

- **ASM-001**: Users have basic understanding of HTTP concepts (methods, headers, status codes)
- **ASM-002**: Users have been provided with valid X-Road identifiers for their organization and target services
- **ASM-003**: X-Road Security Server is configured to accept requests from the client organization
- **ASM-004**: Maximum response size for display is 1MB (hard limit) - larger responses show only metadata and download option
- **ASM-005**: Users primarily test JSON-based services, though XML and other content types are supported
- **ASM-006**: The application will be used primarily by developers, testers, and technical staff familiar with REST APIs
- **ASM-007**: Modern web browser (Chrome, Firefox, Safari, Edge) released within the last 2 years is being used
- **ASM-008**: JavaScript is enabled in the user's browser
- **ASM-009**: For production use, the application will be deployed on HTTPS to support secure Security Server connections
- **ASM-010**: Request/response data does not need to be persisted long-term (no database storage required)

### Out of Scope

- **OOS-001**: User authentication and authorization management (Spring Security completely removed - application is publicly accessible)
- **OOS-002**: Server-side request logging or persistent storage beyond browser localStorage
- **OOS-003**: Automated testing or request scheduling capabilities
- **OOS-004**: Collaborative features (sharing requests between users)
- **OOS-005**: Export of responses to file formats (CSV, Excel, etc.)
- **OOS-006**: Batch or bulk request capabilities
- **OOS-007**: Request/response comparison tools
- **OOS-008**: Performance testing or load generation
- **OOS-009**: X-Road service discovery or catalog browsing
- **OOS-010**: Integration with CI/CD pipelines or test automation frameworks
