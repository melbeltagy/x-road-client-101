# X-Road Generic REST Client

A web-based tool for testing X-Road REST services. Configure client/service identifiers, send requests, and view responses with formatted JSON and syntax highlighting.

## Quick Start

```bash
./gradlew
```

Open http://localhost:8080

## Build & Run

### Development (with hot reload)

```bash
# Backend only
./gradlew -x webapp
# Frontend (in separate terminal) - hot reload
cd src/main/webapp && pnpm dev
```

### Production

```bash
./gradlew -Pprod clean bootJar
java -jar build/libs/*.jar
```

### Docker

```bash
docker compose -f docker/docker-compose.yml up -d
```

## Requirements

- Java 25
- Node.js 22+ and pnpm 10+

## Configuration

### Backend

Edit `src/main/resources/config/application.yml`:

```yaml
application:
  xroad:
    timeout:
      connect-ms: 60000 # 60 seconds
      read-ms: 120000 # 2 minutes
```

### Frontend

Frontend settings are configured via environment variables at runtime:

| Variable              | Default | Description                                   |
|-----------------------|---------|-----------------------------------------------|
| `MAX_HISTORY_ENTRIES` | 15      | Maximum number of requests to keep in history |

**Docker:**
```bash
docker run -p 8080:8080 -e MAX_HISTORY_ENTRIES=50 ghcr.io/melbeltagy/x-road-example-restapi-client:latest
```

## Testing

### Backend Tests

```bash
# Run unit tests
./gradlew test

# Run integration tests
./gradlew integrationTest

# Run all tests with coverage report
./gradlew test jacocoTestReport

# Run tests with coverage verification (fails if coverage < 80%)
./gradlew check
```

**Coverage reports:** `build/reports/jacoco/test/html/index.html`

### Frontend Tests

```bash
cd src/main/webapp

# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with coverage report
pnpm test:coverage
```

**Coverage reports:** `src/main/webapp/coverage/index.html`

### Code Quality

```bash
# Backend: Checkstyle
./gradlew checkstyleMain -x webapp

# Frontend: ESLint
cd src/main/webapp && pnpm lint

# Frontend: TypeScript check
cd src/main/webapp && pnpm type-check
```

## Tech Stack

- **Backend**: Spring Boot 4.0, Java 25, WebFlux, MapStruct
- **Frontend**: Vue 3, TypeScript 5, Vuetify 4, Pinia, Vite
- **Build**: Gradle 9.2, Vite 6
