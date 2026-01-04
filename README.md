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
./gradlew -x webapp    # Terminal 1 - Backend
npm start              # Terminal 2 - Frontend
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
- Node.js 22+ and npm 11+ (auto-installed)

## Configuration

Edit `src/main/resources/config/application.yml`:

```yaml
application:
  xroad:
    timeout:
      connect-ms: 60000 # 60 seconds
      read-ms: 120000 # 2 minutes
```

## Development

```bash
./gradlew test                    # Backend tests
npm test                          # Frontend tests
./gradlew checkstyleMain -x webapp  # Code style check
npm run lint                      # ESLint check
```

## Tech Stack

- **Backend**: Spring Boot 4.0, Java 25, WebFlux, MapStruct
- **Frontend**: React 19, TypeScript 5.9, Redux Toolkit, Bootstrap 5
- **Build**: Gradle 9.2, Webpack 5
