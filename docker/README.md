# X-Road Client 101 - Docker Image

A web-based tool for testing X-Road REST services.

## Docker Run

```bash
docker pull ghcr.io/melbeltagy/x-road-client-101:latest
docker network create xrd-client-101   # one-time; skip if it already exists
docker run -p 8080:8080 --network xrd-client-101 ghcr.io/melbeltagy/x-road-client-101:latest
```

Open <http://localhost:8080>

## Docker Compose

See [docker-compose.yml](docker-compose.yml) for the full configuration.

```bash
docker compose -f docker/docker-compose.yml up -d
```

Open <http://localhost:8080>

## Connecting to a Local Security Server

The client and the Security Server need to share a Docker network so they can reach each other by container name.
Both the `docker run` command above and the compose file place the client on a network named `xrd-client-101`.

To be able to communicate to the Security Server, attach its container to the same network (this will not affect your existing setup):

```bash
docker network connect xrd-client-101 <ss-container-name>
```

Then use `http://<ss-container-name>:<ss-port>/` as the Security Server URL in the UI.

To detach later:

```bash
docker network disconnect xrd-client-101 <ss-container-name>
```

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
