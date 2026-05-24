# X-Road Client 101 - Docker Image

A web-based tool for testing X-Road REST services.

## Docker Run

```bash
docker pull ghcr.io/melbeltagy/x-road-client-101:latest
docker run -p 8080:8080 ghcr.io/melbeltagy/x-road-client-101:latest
```

Open http://localhost:8080

## Docker Compose

See [docker-compose.yml](docker-compose.yml) for the full configuration.

```bash
docker compose -f docker/docker-compose.yml up -d
```

Open http://localhost:8080

## Connecting to a Local Security Server

If your Security Server is running in Docker, you have two options:

**Option 1: Same network + container name**

Add the client to the Security Server's network and use the container name as the URL:

```bash
docker run -p 8080:8080 --network <ss-network> ghcr.io/melbeltagy/x-road-client-101:latest
```

Then use `http://<ss-container-name>:8080/` as the Security Server URL in the UI.

**Option 2: Use the Security Server's IP address**

Find the Security Server container's IP:

```bash
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' <ss-container-name>
```

Then use `http://<ip-address>:8080/` as the Security Server URL in the UI.

## Configuration

| Variable              | Default | Description                              |
|-----------------------|---------|------------------------------------------|
| `MAX_HISTORY_ENTRIES` | 15      | Maximum requests kept in browser history |

```bash
docker run -p 8080:8080 -e MAX_HISTORY_ENTRIES=50 ghcr.io/melbeltagy/x-road-client-101:latest
```

### Application Properties

Override Spring Boot properties via environment variables:

```bash
docker run -p 8080:8080 \
  -e APPLICATION_XROAD_TIMEOUT_CONNECT_MS=30000 \
  -e APPLICATION_XROAD_TIMEOUT_READ_MS=60000 \
  ghcr.io/melbeltagy/x-road-client-101:latest
```

## Building Locally

```bash
# From repository root
docker build -f docker/Dockerfile -t xroad-rest-client .

# Run the locally built image
docker run -p 8080:8080 xroad-rest-client
```

## Tags

| Tag          | Description                       |
|--------------|-----------------------------------|
| `latest`     | Latest release from main branch   |
| `vX.Y.Z`     | Specific version release          |
| `sha-XXXXXX` | Specific commit build             |

## Health Check

The container exposes a health endpoint at `/actuator/health`.
