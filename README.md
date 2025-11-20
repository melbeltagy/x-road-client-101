# X-Road Generic REST Client

A web-based tool for testing X-Road services without writing code. Enter service details, send requests, and view responses - all from a single page interface.

## What It Does

- **Test any X-Road service** via REST protocol without custom client code
- **Configure requests** with client/service identifiers, HTTP methods, headers, and body
- **View responses** with formatted JSON, syntax highlighting, and response headers
- **mTLS support** for secure connections with client certificates
- **No authentication** - publicly accessible for immediate testing
- **Dark/Light themes** with automatic system preference detection

## Quick Start

### Development Mode

```bash
# Terminal 1 - Backend (Java)
./gradlew -x webapp

# Terminal 2 - Frontend with hot reload (Node.js/React)
npm start
```

Access at: http://localhost:8080

### Production Build

```bash
# Build JAR with optimized frontend
./gradlew -Pprod clean bootJar

# Run
java -jar build/libs/*.jar
```

### Build Requirements

- Java 17+ (auto-installed via Gradle wrapper)
- Node.js 22.15.0+ (auto-installed via build process)
- npm 11.3.0+ (auto-installed)

## Usage

1. **Enter Client Details**: Instance, member class/code, subsystem
2. **Enter Service Details**: Service identifier and path
3. **Configure Request**: Method (GET/POST/PUT/DELETE), headers, body
4. **Optional mTLS**: Paste PEM certificates for secure connections
5. **Send & View**: Click "Send Request" to see formatted response

## Key Features

- **X-Road REST Protocol**: Constructs proper `/r1/{serviceId}/{path}` URLs
- **Response Formats**: Toggle between raw text and formatted JSON
- **mTLS Support**: Paste security server cert, client cert, and private key
- **Self-Signed Certs**: Works with development certificates and Docker containers
- **Response Display**: Syntax highlighting, expandable JSON, header inspection
- **Theme Support**: Cosmo theme with light/dark/system modes
- **Internationalization**: English and French translations

## Development

### Code Quality

Pre-commit hooks enforce:

- ESLint + TypeScript checks for frontend
- Checkstyle for backend Java code
- Prettier formatting for all files

Run checks manually:

```bash
./gradlew checkstyleMain checkstyleTest -x webapp  # Java only
npm run lint                                        # Frontend lint
npm run prettier:format                             # Format all
```

### Testing

```bash
# Backend tests
./gradlew test integrationTest

# Frontend tests
npm test

# Coverage report
./gradlew test integrationTest jacocoTestReport
# Report: build/reports/jacoco/test/html/index.html
```

### Project Structure

```
src/main/
├── java/com/nortal/xroad/restapi/client/
│   ├── web/rest/              # REST endpoints
│   ├── service/               # Business logic, X-Road proxy
│   │   ├── dto/              # Data transfer objects
│   │   ├── mapper/           # MapStruct mappers
│   │   └── util/             # SSL/TLS utilities
│   └── config/               # Spring configuration
└── webapp/app/
    ├── modules/xroad/         # X-Road request/response UI
    ├── shared/
    │   ├── model/            # TypeScript interfaces
    │   └── services/         # API client services
    └── config/               # Theme, i18n, Redux
```

## Configuration

### Timeouts

Edit `src/main/resources/config/application.yml`:

```yaml
application:
  xroad:
    timeout:
      read-ms: 120000 # 2 minutes default
```

### SSL/TLS for Development

The application disables hostname verification and accepts self-signed certificates for development/testing. For production:

1. Use CA-signed certificates
2. Match certificate hostnames with connection URLs
3. Review `MTLSContextBuilder.java` security settings

## Technology Stack

- **Backend**: Spring Boot 3.x, Java 17+, Netty (HTTP client), MapStruct
- **Frontend**: React 18, TypeScript 5.8, Redux Toolkit, Bootstrap 5 (Cosmo theme)
- **Build**: Gradle 8.14, Webpack 5, npm 11.3.0
- **Security**: Netty SSL/TLS with mTLS support

## Documentation

- [Feature Specification](specs/001-xroad-generic-rest-client/spec.md)
- [Implementation Plan](specs/001-xroad-generic-rest-client/plan.md)
- [Task List](specs/001-xroad-generic-rest-client/tasks.md)
- [Pre-Commit Hooks](PRE-COMMIT-HOOKS.md)
- [CLAUDE.md](CLAUDE.md) - Project guidance for Claude Code

## X-Road Resources

- [X-Road REST Protocol](https://docs.x-road.global/Protocols/pr-rest_x-road_message_protocol_for_rest.html)
- [X-Road Documentation](https://docs.x-road.global/)

## License

This is a development/testing tool. Refer to your organization's policies for production use.
