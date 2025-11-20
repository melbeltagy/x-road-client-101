# Quick Start Guide: X-Road Generic REST Client

**Date**: 2025-11-17
**Branch**: 001-xroad-generic-rest-client
**Purpose**: Get developers started quickly

## Table of Contents

<!-- TOC -->

- [Quick Start Guide: X-Road Generic REST Client](#quick-start-guide-x-road-generic-rest-client)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [1. Clone and Install](#1-clone-and-install)
  - [2. Configuration (Optional)](#2-configuration-optional)
  - [3. Running the Application](#3-running-the-application)
    - [Development Mode (Two Terminals)](#development-mode-two-terminals)
    - [Single Command (Watch Mode)](#single-command-watch-mode)
    - [Access the Application](#access-the-application)
  - [4. Testing Without X-Road Server (Mock Mode)](#4-testing-without-x-road-server-mock-mode)
    - [Option A: WireMock](#option-a-wiremock)
    - [Option B: Use HTTP Mock Server (No mTLS)](#option-b-use-http-mock-server-no-mtls)
  - [5. Using the Application](#5-using-the-application)
    - [Step 1: Configure Security Server](#step-1-configure-security-server)
    - [Step 2: Fill X-Road Client Details](#step-2-fill-x-road-client-details)
    - [Step 3: Fill X-Road Service Details](#step-3-fill-x-road-service-details)
    - [Step 4: Configure Request Details](#step-4-configure-request-details)
    - [Step 5: Send Request](#step-5-send-request)
    - [Step 6: View Response](#step-6-view-response)
  - [6. Theme Switching](#6-theme-switching)
  - [7. Request History](#7-request-history)
  - [8. Troubleshooting](#8-troubleshooting)
    - [Backend Won't Start](#backend-wont-start)
    - [Frontend Won't Compile](#frontend-wont-compile)
    - [CORS Errors](#cors-errors)
    - [X-Road Connection Refused](#x-road-connection-refused)
    - [Certificate/mTLS Errors](#certificatemtls-errors)
  - [9. Production Deployment](#9-production-deployment)
    - [Build Production JAR](#build-production-jar)
    - [Configure Production (Optional)](#configure-production-optional)
    - [Run Production JAR](#run-production-jar)
    - [Docker Deployment](#docker-deployment)
  - [10. Testing](#10-testing)
    - [Run Backend Tests](#run-backend-tests)
    - [Run Frontend Tests](#run-frontend-tests)
    - [Code Coverage](#code-coverage)
  - [11. Development Workflow](#11-development-workflow)
    - [Make Code Changes](#make-code-changes)
    - [Hot Reload](#hot-reload)
    - [Format Code](#format-code)
    - [Commit Changes](#commit-changes)
  - [12. Useful Commands](#12-useful-commands)
  - [13. Resources](#13-resources)
  - [14. Next Steps](#14-next-steps)
  <!-- TOC -->

---

## Prerequisites

- Java 17+ (or 21/24)
- Node.js 20.x
- npm 10.x
- Access to an X-Road Security Server (dev/test/prod)
- X-Road client certificate (PEM format) for mTLS - **submitted via UI per request**

---

## 1. Clone and Install

```bash
# Navigate to project
cd /media/xrduser/mcn/x-road-example-restapi-client

# Checkout feature branch
git checkout 001-xroad-generic-rest-client

# Install frontend dependencies
npm install

# Or use wrapper for consistency
./npmw install
```

---

## 2. Configuration (Optional)

**No server-side configuration required!**

This application uses a **zero-persistence** architecture aligned with the project constitution:

- **Security Server URL**: Submitted per request via UI
- **mTLS Certificates**: Optional PEM certificates submitted per request via UI (drag-and-drop or paste)
- **X-Road Identifiers**: All identifiers entered in the UI form

You can optionally configure application properties for convenience (not required):

```yaml
# src/main/resources/config/application-dev.yml (optional defaults)
application:
  xroad:
    connect-timeout: 30000 # 30 seconds
    read-timeout: 60000 # 60 seconds
```

**Security Note**: Per constitution principle IV (Security First), certificates and credentials are NEVER persisted to disk or localStorage.

---

## 3. Running the Application

### Development Mode (Two Terminals)

**Terminal 1 - Backend**:

```bash
./gradlew -x webapp
# Backend runs at http://localhost:8080
```

**Terminal 2 - Frontend (with hot reload)**:

```bash
npm start
# Frontend dev server runs at http://localhost:9000
# Proxies API calls to backend at :8080
```

### Single Command (Watch Mode)

```bash
npm run watch
# Starts both backend and frontend in watch mode
```

### Access the Application

Open browser: **http://localhost:8080** (or :9000 for dev server)

---

## 4. Testing Without X-Road Server (Mock Mode)

For testing UI without a real X-Road Security Server:

### Option A: WireMock

```bash
# Install WireMock
npm install --save-dev wiremock

# Create mock responses
mkdir -p src/test/resources/wiremock/mappings
```

Create `src/test/resources/wiremock/mappings/xroad-get-info.json`:

```json
{
  "request": {
    "method": "GET",
    "urlPathPattern": "/r1/DEV/COM/.*"
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json",
      "X-Road-Id": "550e8400-e29b-41d4-a716-446655440000",
      "X-Road-Request-Hash": "mockHashValue=="
    },
    "jsonBody": {
      "id": 123,
      "name": "Mock User",
      "email": "mock@example.com"
    }
  }
}
```

### Option B: Use HTTP Mock Server (No mTLS)

Run a simple mock server (no configuration changes needed):

```bash
# Using json-server
npx json-server --watch mock-data.json --port 8081 --routes routes.json
```

---

## 5. Using the Application

### Step 1: Configure Security Server

1. **Security Server URL**: `https://securityserver.example.com:8443`
2. **mTLS Certificates** (optional): Drag-and-drop or paste PEM certificates
   - Client certificate with private key
   - Intermediate CA certificates (if needed)

### Step 2: Fill X-Road Client Details

1. **Instance**: `DEV` (or your instance)
2. **Member Class**: `COM` (Government, Commercial, etc.)
3. **Member Code**: `1234567-8` (your organization code)
4. **Subsystem**: `TestClient` (your subsystem code)

### Step 3: Fill X-Road Service Details

1. **Service Instance**: `DEV`
2. **Service Member Class**: `GOV`
3. **Service Member Code**: `9876543-2`
4. **Service Subsystem**: `DataService`
5. **Service Code**: `getInfo`
6. **Service Version**: `v1` (optional)

### Step 4: Configure Request Details

- **HTTP Method**: `GET`, `POST`, `PUT`, or `DELETE`
- **Path**: `/users/123` (required, can be empty string)
- **Query Parameters**: Add key-value pairs (e.g., `format=json`)
- **Headers**: Add custom headers (e.g., `Accept: application/json`)
- **Request Body**: For POST/PUT requests (JSON, XML, etc.)

### Step 5: Send Request

Click **Send Request** button

### Step 6: View Response

Toggle between view modes:

- **Raw**: Plain text response
- **JSON**: Formatted JSON with syntax highlighting

---

## 6. Theme Switching

Click the theme toggle in the header:

- **Light Mode**: Cosmo light theme
- **Dark Mode**: Cosmo dark theme
- **System**: Follow OS preference

---

## 7. Request History

- Last 10 requests are saved automatically
- Click on history entry to reload the request
- Export/import requests as JSON files

---

## 8. Troubleshooting

### Backend Won't Start

**Error**: Check console logs for Spring Boot startup errors

**Solution**: Verify Java version and Gradle build

```bash
# Check Java version (need 17+)
java -version

# Clean and rebuild
./gradlew clean build
```

### Frontend Won't Compile

**Error**: `Module not found: react-json-view-lite`

**Solution**: Install dependencies

```bash
npm install
# or
./npmw install
```

### CORS Errors

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**: Ensure using same-origin (frontend and backend on :8080)

**Development**: Use `npm start` which proxies to backend

**Production**: Deploy as single WAR/JAR (no CORS issues)

### X-Road Connection Refused

**Error**: `Connection refused to Security Server`

**Solution**:

1. Verify Security Server URL is correct in the UI form
2. Check network connectivity: `curl -v https://your-security-server:8443`
3. Verify firewall allows outbound HTTPS
4. If using mTLS, check that PEM certificates are valid and not expired

### Certificate/mTLS Errors

**Error**: SSL/TLS handshake failure

**Solution**:

1. Verify PEM certificates are properly formatted (should include `-----BEGIN CERTIFICATE-----`)
2. Ensure private key is included in the client certificate
3. Check certificate chain is complete (client cert + intermediate CAs)
4. Verify certificates are not expired: `openssl x509 -in cert.pem -noout -dates`
5. Test certificate chain: `openssl verify -CAfile ca.pem client-cert.pem`

**Note**: Certificates are submitted via UI drag-and-drop or paste - never stored server-side

---

## 9. Production Deployment

### Build Production JAR

```bash
./gradlew -Pprod clean bootJar

# JAR created at: build/libs/xRoadExampleRestapiClient-0.0.1-SNAPSHOT.jar
```

### Configure Production (Optional)

**No certificate configuration needed** - all values submitted via UI per request.

Optional environment variables for default timeouts:

```bash
export XROAD_CONNECT_TIMEOUT=30000
export XROAD_READ_TIMEOUT=60000
```

### Run Production JAR

```bash
java -jar build/libs/xRoadExampleRestapiClient-0.0.1-SNAPSHOT.jar \
  --spring.profiles.active=prod
```

### Docker Deployment

```bash
# Build Docker image
npm run java:docker

# Run container
docker run -d \
  -p 8080:8080 \
  xroadexamplerestapiclient:latest

# With optional custom timeouts
docker run -d \
  -p 8080:8080 \
  -e XROAD_CONNECT_TIMEOUT=30000 \
  -e XROAD_READ_TIMEOUT=60000 \
  xroadexamplerestapiclient:latest
```

**Note**: Certificates are submitted via UI - no volume mounts needed for certificates

---

## 10. Testing

### Run Backend Tests

```bash
./gradlew test                    # Unit tests
./gradlew integrationTest         # Integration tests
./gradlew test integrationTest    # All tests
```

### Run Frontend Tests

```bash
npm test                          # Jest tests
npm run test:watch                # Watch mode
```

### Code Coverage

```bash
./gradlew test integrationTest jacocoTestReport
# Report: build/reports/jacoco/test/html/index.html
```

---

## 11. Development Workflow

### Make Code Changes

1. **Backend**: Edit Java files in `src/main/java/`
2. **Frontend**: Edit TypeScript/React files in `src/main/webapp/app/`
3. **Styles**: Edit SCSS in `src/main/webapp/content/scss/`

### Hot Reload

- **Backend**: Restart Gradle task (`./gradlew -x webapp`)
- **Frontend**: Automatic reload (`npm start` watches files)

### Format Code

```bash
# Frontend
npm run prettier:format

# Backend
./gradlew checkstyleMain checkstyleTest
```

### Commit Changes

```bash
git add .
git commit -m "feat: add X-Road request form"
git push origin 001-xroad-generic-rest-client
```

---

## 12. Useful Commands

```bash
# Clean build
./gradlew clean build

# Run with specific profile
./gradlew -Pprod bootRun

# Frontend production build
npm run webapp:prod

# Lint frontend code
npm run lint
npm run lint:fix

# Update dependencies
./npmw update
./gradlew build --refresh-dependencies

# Docker build
npm run java:docker
npm run java:docker:arm64  # For Apple Silicon
```

---

## 13. Resources

- **X-Road REST Protocol**: https://docs.x-road.global/Protocols/pr-rest_x-road_message_protocol_for_rest.html
- **JHipster Docs**: https://www.jhipster.tech/documentation-archive/v8.11.0
- **Spring Boot SSL Bundles**: https://docs.spring.io/spring-boot/reference/features/ssl.html
- **React Hook Form**: https://react-hook-form.com/
- **Bootstrap Dark Mode**: https://getbootstrap.com/docs/5.3/customize/color-modes/

---

## 14. Next Steps

1. Customize theme colors in `src/main/webapp/content/scss/global.scss`
2. Add custom validation rules for your organization's X-Road identifiers
3. Configure production Security Server URLs
4. Set up CI/CD pipeline (GitHub Actions, Jenkins, etc.)
5. Configure monitoring (Prometheus, Grafana)

---

**Happy Coding!** 🚀

If you encounter issues, check:

1. This quickstart guide
2. `CLAUDE.md` for project-specific guidance
3. GitHub Issues: https://github.com/your-org/x-road-client/issues
