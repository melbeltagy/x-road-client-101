# Data Model: X-Road Generic REST Client

**Date**: 2025-11-18
**Branch**: 001-xroad-generic-rest-client
**Purpose**: Define entities, DTOs, and validation rules

---

## Table of Contents

<!-- TOC -->

- [Data Model: X-Road Generic REST Client](#data-model-x-road-generic-rest-client)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [1. Backend DTOs (Java)](#1-backend-dtos-java)
    - [1.1 SubsystemIdDto](#11-subsystemiddto)
    - [1.2 ClientDto](#12-clientdto)
    - [1.3 ServiceIdDto](#13-serviceiddto)
    - [1.4 RequestDetailsDto](#14-requestdetailsdto)
    - [1.5 XRoadRequestDTO](#15-xroadrequestdto)
    - [1.6 XRoadResponseDTO](#16-xroadresponsedto)
    - [1.7 XRoadErrorDTO](#17-xroaderrordto)
  - [2. Frontend TypeScript Interfaces](#2-frontend-typescript-interfaces)
    - [2.1 SubsystemId](#21-subsystemid)
    - [2.2 Client](#22-client)
    - [2.3 ServiceId](#23-serviceid)
    - [2.4 RequestDetails](#24-requestdetails)
    - [2.5 XRoadRequest](#25-xroadrequest)
    - [2.6 XRoadResponse](#26-xroadresponse)
    - [2.7 RequestHistoryEntry](#27-requesthistoryentry)
    - [2.8 ThemeState](#28-themestate)
    - [2.9 ResponseViewMode](#29-responseviewmode)
  - [3. Validation Rules](#3-validation-rules)
    - [3.1 Backend Validation (Bean Validation)](#31-backend-validation-bean-validation)
    - [3.2 Frontend Validation (React Hook Form)](#32-frontend-validation-react-hook-form)
  - [4. localStorage Schema](#4-localstorage-schema)
    - [4.1 Form Draft](#41-form-draft)
    - [4.2 Request History](#42-request-history)
    - [4.3 Theme Preference](#43-theme-preference)
  - [5. State Transitions](#5-state-transitions)
    - [5.1 Request Lifecycle](#51-request-lifecycle)
    - [5.2 Theme Mode Transitions](#52-theme-mode-transitions)
  - [6. Entity Relationships](#6-entity-relationships)
  - [7. MapStruct Mappers](#7-mapstruct-mappers)
    - [7.1 Gradle Configuration](#71-gradle-configuration)
    - [7.2 XRoadResponseMapper](#72-xroadresponsemapper)
    - [7.3 Usage in Service Layer](#73-usage-in-service-layer)
    - [7.4 Benefits of MapStruct Approach](#74-benefits-of-mapstruct-approach)
  - [8. Data Flow](#8-data-flow)
    - [Request Flow](#request-flow)
  - [Summary](#summary)
  _ [Backend Entities (Java Records)](#backend-entities-java-records)
  _ [Frontend Models (TypeScript)](#frontend-models-typescript)
  _ [Persistence](#persistence)
  _ [Validation](#validation) \* [Conversion/Mapping](#conversionmapping)
  <!-- TOC -->

---

## Overview

This application has **no database persistence** (JHipster configured with `databaseType: "no"`). All data structures are ephemeral or persisted in browser localStorage. The data model consists of DTOs for request/response handling and client-side state management.

---

## 1. Backend DTOs (Java)

### 1.1 SubsystemIdDto

**Package**: `com.nortal.xroad.restapi.client.service.dto`

**Purpose**: Reusable X-Road subsystem identifier (used for both client and service)

**Fields**:

| Field           | Type   | Required | Validation                    | Description                                |
| --------------- | ------ | -------- | ----------------------------- | ------------------------------------------ |
| `instanceId`    | String | Yes      | Pattern: `^[A-Za-z0-9-]{2,}$` | X-Road instance (e.g., "DEV", "PROD")      |
| `memberClass`   | String | Yes      | Pattern: `^[A-Za-z0-9-]+$`    | Member classification (e.g., "GOV", "COM") |
| `memberCode`    | String | Yes      | Pattern: `^[A-Za-z0-9-]+$`    | Member identifier (e.g., "1234567-8")      |
| `subsystemCode` | String | Yes      | Pattern: `^[A-Za-z0-9-]+$`    | Subsystem identifier                       |

**Java Implementation**:

```java
package com.nortal.xroad.restapi.client.service.dto;

import jakarta.validation.constraints.*;

public record SubsystemIdDto(
  @NotBlank(message = "Instance ID is required")
  @Pattern(regexp = "^[A-Za-z0-9-]{2,}$", message = "Must be alphanumeric or hyphen (min 2 chars)")
  String instanceId,

  @NotBlank(message = "Member class is required")
  @Pattern(regexp = "^[A-Za-z0-9-]+$", message = "Must be alphanumeric or hyphen")
  String memberClass,

  @NotBlank(message = "Member code is required")
  @Pattern(regexp = "^[A-Za-z0-9-]+$", message = "Must be alphanumeric or hyphen")
  String memberCode,

  @NotBlank(message = "Subsystem code is required")
  @Pattern(regexp = "^[A-Za-z0-9-]+$", message = "Must be alphanumeric or hyphen")
  String subsystemCode
) {}

```

---

### 1.2 ClientDto

**Package**: `com.nortal.xroad.restapi.client.service.dto`

**Purpose**: Client identifier (who is making the request) including Security Server URL and optional mTLS certificates

**Fields**:

| Field               | Type           | Required | Validation                                                                                           | Description                                                                               |
| ------------------- | -------------- | -------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `subsystem`         | SubsystemIdDto | Yes      | -                                                                                                    | Client subsystem identifier                                                               |
| `securityServerUrl` | String         | Yes      | Custom validator using Java URI class (RFC 3986): validates HTTP/HTTPS protocol, rejects underscores | Security Server URL (http or https with domain, IP address, or localhost)                 |
| `pemCertificates`   | List<String>   | No       | -                                                                                                    | Optional list of PEM-formatted certificate contents for mTLS (supports certificate chain) |

**Java Implementation**:

```java
package com.nortal.xroad.restapi.client.service.dto;

import com.nortal.xroad.restapi.client.service.dto.validation.ValidSecurityServerUrl;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.Collections;
import java.util.List;

public record ClientDto(
  @NotNull(message = "Client subsystem is required") @Valid SubsystemIdDto subsystem,

  @NotBlank(message = "Security Server URL is required") @ValidSecurityServerUrl String securityServerUrl,

  List<String> pemCertificates // Optional PEM certificates for mTLS (certificate chain support)
) {
  // Compact constructor for default values
  public ClientDto {
    if (pemCertificates == null) {
      pemCertificates = Collections.emptyList();
    }
  }
}

```

---

### 1.3 ServiceIdDto

**Package**: `com.nortal.xroad.restapi.client.service.dto`

**Purpose**: Service identifier (which service to call)

**Fields**:

| Field            | Type           | Required | Validation                       | Description                                  |
| ---------------- | -------------- | -------- | -------------------------------- | -------------------------------------------- |
| `subsystem`      | SubsystemIdDto | Yes      | -                                | Service subsystem identifier                 |
| `serviceCode`    | String         | Yes      | Pattern: `^[A-Za-z0-9_-]+$`      | Service name (e.g., "getInfo", "list_users") |
| `serviceVersion` | String         | No       | Pattern: `^v?[0-9]+(\.[0-9]+)*$` | Service version (e.g., "v1")                 |

**Java Implementation**:

```java
package com.nortal.xroad.restapi.client.service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record ServiceIdDto(
    @NotNull(message = "Service subsystem is required")
    @Valid
    SubsystemIdDto subsystem,

    @NotBlank(message = "Service code is required")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Must be alphanumeric, underscore, or hyphen")
    String serviceCode,

    @Pattern(regexp = "^v?[0-9]+(\.[0-9]+)*$", message = "Invalid version format (e.g., v1, 1.2.3)")
    String serviceVersion
) {}
```

---

### 1.4 RequestDetailsDto

**Package**: `com.nortal.xroad.restapi.client.service.dto`

**Purpose**: HTTP request configuration

**Fields**:

| Field         | Type                | Required | Validation                    | Description                          |
| ------------- | ------------------- | -------- | ----------------------------- | ------------------------------------ |
| `method`      | HttpMethod          | Yes      | -                             | HTTP method (GET, POST, PUT, DELETE) |
| `path`        | String              | Yes      | Pattern: `^/[A-Za-z0-9/_-]*$` | URI path starting with /             |
| `queryParams` | Map<String, String> | No       | -                             | URL query parameters                 |
| `headers`     | Map<String, String> | No       | -                             | Custom HTTP headers                  |
| `body`        | String              | No       | -                             | Request body (JSON, XML, etc.)       |

**Java Implementation**:

```java
package com.nortal.xroad.restapi.client.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.Collections;
import java.util.Map;
import org.springframework.http.HttpMethod;

public record RequestDetailsDto(
  @NotNull(message = "HTTP method is required") HttpMethod method,

  @NotBlank(message = "Path is required")
  @Pattern(regexp = "^/[A-Za-z0-9/_-]*$", message = "Must be valid URI path starting with /")
  String path,

  Map<String, String> queryParams,

  Map<String, String> headers,

  String body
) {
  // Compact constructor for default values
  public RequestDetailsDto {
    if (queryParams == null) {
      queryParams = Collections.emptyMap();
    }
    if (headers == null) {
      headers = Collections.emptyMap();
    }
  }
}

```

---

### 1.5 XRoadRequestDTO

**Package**: `com.nortal.xroad.restapi.client.service.dto`

**Purpose**: Top-level X-Road request DTO (composition of client, service, and request details)

**Fields**:

| Field     | Type              | Required | Description                                   |
| --------- | ----------------- | -------- | --------------------------------------------- |
| `client`  | ClientDto         | Yes      | Client identifier (who is making the request) |
| `service` | ServiceIdDto      | Yes      | Service identifier (which service to call)    |
| `request` | RequestDetailsDto | Yes      | HTTP request configuration                    |

**Derived Values**:

- `X-Road-Client` header: Built from `client.subsystem` fields → `{instanceId}/{memberClass}/{memberCode}/{subsystemCode}`
- Request URL: Built using `client.securityServerUrl` + `/r1/{service.subsystem.instanceId}/{service.subsystem.memberClass}/{service.subsystem.memberCode}/{service.subsystem.subsystemCode}/{service.serviceCode}[/{service.serviceVersion}]{request.path}?{request.queryParams}`

**Java Implementation**:

```java
package com.nortal.xroad.restapi.client.service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record XRoadRequestDTO(
  @NotNull(message = "Client identifier is required") @Valid ClientDto client,

  @NotNull(message = "Service identifier is required") @Valid ServiceIdDto service,

  @NotNull(message = "Request details are required") @Valid RequestDetailsDto request
) {}

```

---

### 1.6 XRoadResponseDTO

**Package**: `com.nortal.xroad.restapi.client.service.dto`

**Purpose**: Returns X-Road response data to frontend

**Fields**:

| Field              | Type                      | Required | Description                                  |
| ------------------ | ------------------------- | -------- | -------------------------------------------- |
| `statusCode`       | Integer                   | Yes      | HTTP status code (200, 400, 500, etc.)       |
| `statusText`       | String                    | Yes      | HTTP status text ("OK", "Bad Request", etc.) |
| `headers`          | Map<String, List<String>> | Yes      | All HTTP response headers                    |
| `body`             | String                    | No       | Response body (raw text)                     |
| `contentType`      | String                    | No       | Content-Type header value                    |
| `contentLength`    | Long                      | No       | Content-Length in bytes                      |
| `xroadId`          | String                    | No       | X-Road-Id header value                       |
| `xroadRequestHash` | String                    | No       | X-Road-Request-Hash header value             |
| `xroadRequestId`   | String                    | No       | X-Road-Request-Id header value               |
| `xroadError`       | XRoadErrorDTO             | No       | Parsed X-Road-Error header (if present)      |
| `timestamp`        | Instant                   | Yes      | Response received timestamp                  |

**Java Implementation**:

```java
package com.nortal.xroad.restapi.client.service.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record XRoadResponseDTO(
  Integer statusCode,
  String statusText,
  Map<String, List<String>> headers,
  String body,
  String contentType,
  Long contentLength,
  String xroadId,
  String xroadRequestHash,
  String xroadRequestId,
  XRoadErrorDTO xroadError,
  Instant timestamp
) {}

```

**Conversion Note**: Use **MapStruct** mapper in the service layer to convert from WebClient `ClientResponse` to `XRoadResponseDTO`. See section 8 for mapper configuration.

---

### 1.7 XRoadErrorDTO

**Package**: `com.nortal.xroad.restapi.client.service.dto`

**Purpose**: Represents parsed X-Road error from X-Road-Error header

**Fields**:

| Field         | Type   | Required | Description                                                                   |
| ------------- | ------ | -------- | ----------------------------------------------------------------------------- |
| `type`        | String | Yes      | Error type (e.g., "Client.InvalidRequest", "Server.ServerProxy.NetworkError") |
| `message`     | String | Yes      | Human-readable error message                                                  |
| `detail`      | String | No       | Additional error details or UUID for tracking                                 |
| `faultCode`   | String | No       | SOAP fault code (if applicable)                                               |
| `faultString` | String | No       | SOAP fault string (if applicable)                                             |

**Java Implementation**:

```java
package com.nortal.xroad.restapi.client.service.dto;

public record XRoadErrorDTO(String type, String message, String detail, String faultCode, String faultString) {}

```

**Conversion Note**: Parse X-Road-Error header JSON in the service layer using Jackson `ObjectMapper` or MapStruct custom mapping method.

---

## 2. Frontend TypeScript Interfaces

### 2.1 SubsystemId

**File**: `src/main/webapp/app/modules/xroad/models/subsystem-id.model.ts`

**Purpose**: Reusable X-Road subsystem identifier (mirrors Java SubsystemIdDto)

**Interface**:

```typescript
export interface SubsystemId {
  instanceId: string; // e.g., "DEV", "PROD"
  memberClass: string; // e.g., "COM", "GOV"
  memberCode: string; // e.g., "1234567-8"
  subsystemCode: string; // e.g., "TestClient", "DataService"
}
```

---

### 2.2 Client

**File**: `src/main/webapp/app/modules/xroad/models/client.model.ts`

**Purpose**: Client identifier including Security Server URL and optional mTLS certificates (mirrors Java ClientDto)

**Interface**:

```typescript
import { SubsystemId } from './subsystem-id.model';

export interface Client {
  subsystem: SubsystemId;
  securityServerUrl: string; // Security Server URL (http or https protocol only)
  pemCertificates?: string[]; // Optional array of PEM certificate contents for mTLS chain
}
```

---

### 2.3 ServiceId

**File**: `src/main/webapp/app/modules/xroad/models/service-id.model.ts`

**Purpose**: Service identifier (mirrors Java ServiceIdDto)

**Interface**:

```typescript
import { SubsystemId } from './subsystem-id.model';

export interface ServiceId {
  subsystem: SubsystemId;
  serviceCode: string; // e.g., "getInfo"
  serviceVersion?: string; // e.g., "v1" (optional)
}
```

---

### 2.4 RequestDetails

**File**: `src/main/webapp/app/modules/xroad/models/request-details.model.ts`

**Purpose**: HTTP request configuration (mirrors Java RequestDetailsDto)

**Interface**:

```typescript
export interface RequestDetails {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string; // Required path (can be empty string)
  queryParams: Record<string, string>;
  headers: Record<string, string>;
  body?: string;
}
```

---

### 2.5 XRoadRequest

**File**: `src/main/webapp/app/modules/xroad/models/xroad-request.model.ts`

**Purpose**: Top-level X-Road request (mirrors Java XRoadRequestDTO)

**Interface**:

```typescript
import { Client } from './client.model';
import { ServiceId } from './service-id.model';
import { RequestDetails } from './request-details.model';

export interface XRoadRequest {
  client: Client;
  service: ServiceId;
  request: RequestDetails;
}

export const DEFAULT_XROAD_REQUEST: XRoadRequest = {
  client: {
    subsystem: {
      instanceId: 'DEV',
      memberClass: 'COM',
      memberCode: '',
      subsystemCode: '',
    },
    securityServerUrl: 'https://localhost:8443', // Default Security Server URL
    pemCertificates: [], // Empty array for optional mTLS certificates
  },
  service: {
    subsystem: {
      instanceId: 'DEV',
      memberClass: 'GOV',
      memberCode: '',
      subsystemCode: '',
    },
    serviceCode: '',
    serviceVersion: '',
  },
  request: {
    method: 'GET',
    path: '/', // Default root path
    queryParams: {},
    headers: {},
    body: '',
  },
};
```

---

### 2.6 XRoadResponse

**File**: `src/main/webapp/app/modules/xroad/models/xroad-response.model.ts`

**Purpose**: Response data from backend

**Interface**:

```typescript
export interface XRoadResponse {
  statusCode: number;
  statusText: string;
  headers: Record<string, string[]>;
  body?: string;
  contentType?: string;
  contentLength?: number;
  xroadId?: string;
  xroadRequestHash?: string;
  xroadRequestId?: string;
  xroadError?: XRoadError;
  timestamp: string; // ISO 8601 datetime
}

export interface XRoadError {
  type: string;
  message: string;
  detail?: string;
  faultCode?: string;
  faultString?: string;
}
```

---

### 2.7 RequestHistoryEntry

**File**: `src/main/webapp/app/shared/reducers/xroad-history.ts`

**Purpose**: Stored request/response pair in history

**Interface**:

```typescript
import { XRoadRequest } from '../modules/xroad/models/xroad-request.model';
import { XRoadResponse } from '../modules/xroad/models/xroad-response.model';

export interface RequestHistoryEntry {
  id: string; // Unique ID (nanoid)
  timestamp: number; // Unix timestamp (milliseconds)
  request: XRoadRequest;
  response: XRoadResponse;
  label?: string; // Optional user-assigned label
}

export interface XRoadHistoryState {
  entries: RequestHistoryEntry[];
  maxEntries: number; // Default: 10
}
```

---

### 2.8 ThemeState

**File**: `src/main/webapp/app/shared/reducers/theme.ts`

**Purpose**: Theme preference state

**Interface**:

```typescript
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeState {
  mode: ThemeMode;
}
```

---

### 2.9 ResponseViewMode

**File**: `src/main/webapp/app/modules/xroad/models/response-view.model.ts`

**Purpose**: Response display mode

**Enum**:

```typescript
export enum ResponseViewMode {
  RAW = 'raw', // Plain text display
  JSON = 'json', // Formatted JSON with syntax highlighting
}
```

---

## 3. Validation Rules

### 3.1 Backend Validation (Bean Validation)

**Annotations**:

- `@NotBlank`: Field required and non-empty
- `@NotNull`: Field required (can be empty string)
- `@Pattern`: Regex pattern matching
- `@Size`: String length constraints

**Custom Validators**:

```java
// Validate X-Road identifier character set (A-Z, a-z, 0-9, '()+,-.=?)
@Constraint(validatedBy = XRoadIdentifierValidator.class)
@Target({ ElementType.FIELD })
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidXRoadIdentifier {
  String message() default "Invalid X-Road identifier (allowed: A-Z, a-z, 0-9, '()+,-.=?)";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};
}

```

---

### 3.2 Frontend Validation (React Hook Form)

**Validation Mode**: `mode: 'onSubmit', reValidateMode: 'onChange'` (validate all fields when submit button is clicked, then clear errors in real-time as user types)

**Pattern Constants** (embedded in xroad-request-form.tsx):

```typescript
// Instance ID - alphanumeric or hyphen, min 2 chars
pattern: {
  value: /^[A-Za-z0-9-]{2,}$/,
  message: 'Must be alphanumeric or hyphen (min 2 chars)',
}

// Member Class, Member Code, Subsystem Code - alphanumeric or hyphen
pattern: {
  value: /^[A-Za-z0-9-]+$/,
  message: 'Must be alphanumeric or hyphen',
}

// Service Code - alphanumeric, underscore, or hyphen
pattern: {
  value: /^[A-Za-z0-9_-]+$/,
  message: 'Must be alphanumeric, underscore, or hyphen',
}

// Service Version - optional version format
pattern: {
  value: /^v?[0-9]+(\.[0-9]+)*$/,
  message: 'Invalid version format (e.g., v1, 1.2.3)',
}

// Security Server URL - HTTP/HTTPS with hostname/IP and optional numeric port
pattern: {
  value: /^https?:\/\/[a-zA-Z0-9.-]+(:[0-9]{1,5})?(\/.*)?$/,
  message: 'Must be valid HTTP/HTTPS URL (e.g., https://localhost:8443)',
}

// Path - URI path starting with /
pattern: {
  value: /^\/[A-Za-z0-9\/_-]*$/,
  message: 'Must be valid URI path starting with / (alphanumeric, /, _, -)',
}
```

**Validation Rules Example**:

```typescript
<input
  id="instanceId"
  type="text"
  className={`form-control ${errors.client?.subsystem?.instanceId ? 'is-invalid' : ''}`}
  {...register('client.subsystem.instanceId', {
    required: 'Instance ID is required',
    pattern: {
      value: /^[A-Za-z0-9-]{2,}$/,
      message: 'Must be alphanumeric or hyphen (min 2 chars)',
    },
  })}
  placeholder="e.g., DEV, PROD, FI-TEST"
/>
{errors.client?.subsystem?.instanceId && (
  <div className="invalid-feedback d-block">{errors.client?.subsystem?.instanceId?.message}</div>
)}
```

---

## 4. localStorage Schema

### 4.1 Form Draft

**Key**: `xroad-form-draft`

**Value**: JSON string of `Partial<XRoadRequest>`

**Example**:

```json
{
  "client": {
    "subsystem": {
      "instanceId": "DEV",
      "memberClass": "COM",
      "memberCode": "1234567-8",
      "subsystemCode": "TestClient"
    },
    "securityServerUrl": "https://localhost:8443",
    "pemCertificates": []
  },
  "service": {
    "subsystem": {
      "instanceId": "DEV",
      "memberClass": "GOV",
      "memberCode": "9876543-2",
      "subsystemCode": "DataService"
    },
    "serviceCode": "getInfo",
    "serviceVersion": "v1"
  },
  "request": {
    "method": "GET",
    "path": "/users/123",
    "queryParams": { "format": "json" },
    "headers": { "Accept": "application/json" }
  }
}
```

---

### 4.2 Request History

**Key**: `xroad-history`

**Value**: JSON string of `RequestHistoryEntry[]`

**Example**:

```json
[
  {
    "id": "abc123xyz",
    "timestamp": 1700000000000,
    "request": {
      /* XRoadRequest with nested client/service/request */
    },
    "response": {
      /* XRoadResponse */
    },
    "label": "Test getInfo service"
  }
]
```

**Max Size**: 10 entries (FIFO, oldest removed first)

---

### 4.3 Theme Preference

**Key**: `app-theme`

**Value**: `"light"` | `"dark"` | `"system"`

**Example**:

```json
"dark"
```

---

## 5. State Transitions

### 5.1 Request Lifecycle

```
IDLE
  ↓ (user fills form)
FORM_VALID
  ↓ (user clicks Send Request)
SUBMITTING
  ↓ (backend call)
  ├─→ SUCCESS → RESPONSE_RECEIVED → (add to history) → IDLE
  └─→ ERROR → ERROR_DISPLAYED → IDLE
```

### 5.2 Theme Mode Transitions

```
SYSTEM
  ↓ (user selects Light)
LIGHT (stored in localStorage)
  ↓ (user selects Dark)
DARK (stored in localStorage)
  ↓ (user selects System)
SYSTEM (follows OS preference)
  ↓ (OS changes theme)
AUTO_SWITCH (Light ↔ Dark)
```

---

## 6. Entity Relationships

```
XRoadRequest (1) ──sent to backend──> (1) XRoadRequestDTO
   ↓                                        ↓
   contains ClientDto                 (validates nested records)
   contains ServiceIdDto                    ↓
   contains RequestDetailsDto         (extracts client.securityServerUrl)
                                            ↓
                              (sends to Security Server using WebClient)
                                            ↓
                                  (1) XRoadResponseDTO
                                            ↓
XRoadRequest (1) ──combined with──> (1) XRoadResponse
                                            ↓
                              (stored as) RequestHistoryEntry
                                            ↓
                      (persisted in) localStorage (excluding pemCertificates)
```

---

## 7. MapStruct Mappers

### 7.1 Gradle Configuration

Add MapStruct dependency to `build.gradle`:

```gradle
dependencies {
    implementation 'org.mapstruct:mapstruct:1.5.5.Final'
    annotationProcessor 'org.mapstruct:mapstruct-processor:1.5.5.Final'
    testAnnotationProcessor 'org.mapstruct:mapstruct-processor:1.5.5.Final'
}
```

### 7.2 XRoadResponseMapper

**Package**: `com.nortal.xroad.restapi.client.service.mapper`

**Purpose**: Convert WebClient `ClientResponse` to `XRoadResponseDTO`

**Interface**:

```java
package com.nortal.xroad.restapi.client.service.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nortal.xroad.restapi.client.service.dto.XRoadErrorDTO;
import com.nortal.xroad.restapi.client.service.dto.XRoadResponseDTO;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ClientResponse;

@Mapper(componentModel = "spring")
public interface XRoadResponseMapper {
  @Mapping(target = "statusCode", expression = "java(response.statusCode().value())")
  @Mapping(target = "statusText", expression = "java(response.statusCode().getReasonPhrase())")
  @Mapping(target = "headers", expression = "java(mapHeaders(response))")
  @Mapping(target = "body", source = "body")
  @Mapping(target = "contentType", expression = "java(mapContentType(response))")
  @Mapping(target = "contentLength", expression = "java(mapContentLength(response))")
  @Mapping(target = "xroadId", expression = "java(extractHeader(response, \"X-Road-Id\"))")
  @Mapping(target = "xroadRequestHash", expression = "java(extractHeader(response, \"X-Road-Request-Hash\"))")
  @Mapping(target = "xroadRequestId", expression = "java(extractHeader(response, \"X-Road-Request-Id\"))")
  @Mapping(target = "xroadError", expression = "java(parseXRoadError(response))")
  @Mapping(target = "timestamp", expression = "java(java.time.Instant.now())")
  XRoadResponseDTO toDto(ClientResponse response, String body);

  default Map<String, List<String>> mapHeaders(ClientResponse response) {
    return response
      .headers()
      .asHttpHeaders()
      .toSingleValueMap()
      .entrySet()
      .stream()
      .collect(Collectors.toMap(Map.Entry::getKey, e -> List.of(e.getValue())));
  }

  default String mapContentType(ClientResponse response) {
    return response.headers().contentType().map(MediaType::toString).orElse(null);
  }

  default Long mapContentLength(ClientResponse response) {
    return response.headers().contentLength().orElse(null);
  }

  default String extractHeader(ClientResponse response, String headerName) {
    return response.headers().header(headerName).stream().findFirst().orElse(null);
  }

  default XRoadErrorDTO parseXRoadError(ClientResponse response) {
    String errorHeader = extractHeader(response, "X-Road-Error");
    if (errorHeader == null) {
      return null;
    }

    try {
      ObjectMapper mapper = new ObjectMapper();
      return mapper.readValue(errorHeader, XRoadErrorDTO.class);
    } catch (JsonProcessingException e) {
      // Fallback: treat as plain text message
      return new XRoadErrorDTO("Unknown", errorHeader, null, null, null);
    }
  }
}

```

### 7.3 Usage in Service Layer

**Example Service**:

```java
package com.nortal.xroad.restapi.client.service;

import com.nortal.xroad.restapi.client.service.dto.XRoadRequestDTO;
import com.nortal.xroad.restapi.client.service.dto.XRoadResponseDTO;
import com.nortal.xroad.restapi.client.service.mapper.XRoadResponseMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class XRoadClientService {

    private final WebClient.Builder webClientBuilder;
    private final XRoadResponseMapper responseMapper;

    public XRoadClientService(
        WebClient.Builder webClientBuilder,
        XRoadResponseMapper responseMapper
    ) {
        this.webClientBuilder = webClientBuilder;
        this.responseMapper = responseMapper;
    }

    public Mono<XRoadResponseDTO> executeRequest(XRoadRequestDTO request) {
        // Build WebClient with mTLS configuration from request.client.pemCertificates
        WebClient client = configureWebClient(request);

        // Construct X-Road URL and headers
        String url = buildXRoadUrl(request);

        return client
            .method(request.request().method())
            .uri(url)
            .headers(headers -> buildXRoadHeaders(headers, request))
            .bodyValue(request.request().body() != null ? request.request().body() : "")
            .exchangeToMono(response ->
                response.bodyToMono(String.class)
                    .defaultIfEmpty("")
                    .map(body -> responseMapper.toDto(response, body))
            );
    }

    private WebClient configureWebClient(XRoadRequestDTO request) {
        // Configure WebClient with client.securityServerUrl and optional mTLS
        // Implementation details...
        return webClientBuilder.baseUrl(request.client().securityServerUrl()).build();
    }

    private String buildXRoadUrl(XRoadRequestDTO request) {
        // Build /r1/{instance}/{memberClass}/... URL
        // Implementation details...
        return "/r1/" + /* ... */;
    }

    private void buildXRoadHeaders(
        org.springframework.http.HttpHeaders headers,
        XRoadRequestDTO request
    ) {
        // Add X-Road-Client header from request.client.subsystem
        // Implementation details...
    }
}
```

### 7.4 Benefits of MapStruct Approach

- **Separation of Concerns**: DTOs remain pure data carriers
- **Type Safety**: Compile-time verification of mappings
- **Performance**: No reflection, generated code is as fast as hand-written
- **Maintainability**: Centralized mapping logic in dedicated mapper classes
- **Testability**: Easy to unit test mappers independently
- **Flexibility**: Custom mapping methods for complex conversions (like X-Road-Error header parsing)

---

## 8. Data Flow

### Request Flow

```
React Form (nested structure: client.subsystem.*, client.securityServerUrl, service.subsystem.*, request.*)
  ↓ (React Hook Form onSubmit)
Frontend Service (executeXRoadRequest)
  ↓ (Axios POST /api/xroad/execute with nested XRoadRequest)
Spring Controller (XRoadProxyResource)
  ↓ (validate XRoadRequestDTO with @Valid on nested ClientDto, ServiceIdDto, RequestDetailsDto)
Spring Service (XRoadClientService)
  ↓ (extract client.subsystem for X-Road-Client header)
  ↓ (extract client.securityServerUrl for Security Server connection)
  ↓ (extract client.pemCertificates for mTLS configuration if present)
  ↓ (extract service.subsystem + serviceCode for URL construction)
  ↓ (extract request.method, path, queryParams, headers, body)
WebClient (mTLS with optional client certificates)
  ↓ (HTTPS request to client.securityServerUrl)
X-Road Security Server
  ↓ (response ClientResponse + body String)
XRoadResponseMapper (MapStruct)
  ↓ (convert ClientResponse → XRoadResponseDTO)
  ↓ (parse X-Road-Error header if present)
XRoadResponseDTO
  ↓ (JSON response)
Frontend Service
  ↓ (update Redux state)
Redux Store (addRequestToHistory)
  ↓ (persist to localStorage as nested structure, excluding pemCertificates)
Response Viewer Component
```

---

## Summary

### Backend Entities (Java Records)

1. **SubsystemIdDto** - Reusable X-Road subsystem identifier (record)
2. **ClientDto** - Client identifier with Security Server URL and optional PEM certificates (List<String>) for mTLS certificate chain (record)
3. **ServiceIdDto** - Service identifier (subsystem + serviceCode + serviceVersion) (record)
4. **RequestDetailsDto** - HTTP request configuration with mandatory path field (record)
5. **XRoadRequestDTO** - Top-level request DTO (composition of above) (record)
6. **XRoadResponseDTO** - Outgoing response data (record)
7. **XRoadErrorDTO** - Parsed X-Road error (record)

### Frontend Models (TypeScript)

1. **SubsystemId** - Reusable subsystem identifier (mirrors Java)
2. **Client** - Client identifier with securityServerUrl and optional pemCertificates array for mTLS certificate chain (mirrors Java ClientDto)
3. **ServiceId** - Service identifier
4. **RequestDetails** - HTTP request configuration with mandatory path field
5. **XRoadRequest** - Top-level request (mirrors Java XRoadRequestDTO)
6. **XRoadResponse** - Response data
7. **RequestHistoryEntry** - History entry
8. **ThemeState** - Theme preference
9. **ResponseViewMode** - Display mode enum

### Persistence

- **No database** - All ephemeral or localStorage
- **localStorage keys**: `xroad-form-draft`, `xroad-history`, `app-theme`
- **PEM certificates NOT persisted** - Security requirement

### Validation

- **Backend**: Bean Validation on Java Records (@NotBlank, @Pattern, @Valid for nested records)
- **Frontend**: React Hook Form validation rules (supports nested paths, validates securityServerUrl format)

### Conversion/Mapping

- **MapStruct**: Type-safe DTO mapping with compile-time code generation
- **XRoadResponseMapper**: Converts WebClient `ClientResponse` to `XRoadResponseDTO`
- **Service Layer**: Handles all conversion logic, DTOs remain pure data carriers

---

**Document Status**: Complete
**Last Updated**: 2025-11-18
**Next Phase**: Implementation Planning
