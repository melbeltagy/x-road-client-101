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
docker compose -f docker/docker-compose.yml up -d --build
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

Frontend settings are configured via environment variables at build time:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_MAX_HISTORY_ENTRIES` | 25 | Maximum number of requests to keep in history |

**Development:**
```bash
VITE_MAX_HISTORY_ENTRIES=50 pnpm build
```

**Docker:**
```bash
docker compose -f docker/docker-compose.yml build --build-arg VITE_MAX_HISTORY_ENTRIES=50
```

Or edit `docker/docker-compose.yml` to change the default value.

## Development

```bash
# Backend tests
./gradlew test
# Frontend tests
cd src/main/webapp && pnpm test
# Code style check
./gradlew checkstyleMain -x webapp
# ESLint check
cd src/main/webapp && pnpm lint
```

## Tech Stack

- **Backend**: Spring Boot 4.0, Java 25, WebFlux, MapStruct
- **Frontend**: Vue 3, TypeScript 5, Vuetify 4, Pinia, Vite
- **Build**: Gradle 9.2, Vite 6
