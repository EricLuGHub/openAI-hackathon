# openAI-hackathon

## Local Nacos

This repository includes a standalone Nacos 3.2.1 environment for local
development. It uses embedded storage, persists its data in Docker volumes,
enables authentication, and only exposes ports on `127.0.0.1`.

### Start

1. Start Docker Desktop.
2. Review the local credentials in `.env`.
3. Run:

   ```sh
   docker compose up -d
   docker compose ps
   ```

The first start can take roughly a minute. The `nacos-init` one-shot container
initializes the `nacos` administrator account automatically.

- Console: <http://127.0.0.1:8080/index.html>
- Server/API address: `127.0.0.1:8848`
- Username: `nacos`
- Password: the `NACOS_PASSWORD` value in `.env`

For `nacos-mcp-router`, use:

```sh
export NACOS_ADDR=127.0.0.1:8848
export NACOS_USERNAME=nacos
export NACOS_PASSWORD="$(sed -n 's/^NACOS_PASSWORD=//p' .env)"
uvx nacos-mcp-router@latest
```

### Operate

```sh
# Follow logs
docker compose logs -f nacos

# Stop while preserving data
docker compose down

# Stop and delete all local Nacos data
docker compose down -v
```

The checked-in `.env.example` contains placeholders. The working `.env` is
git-ignored and is intended only for local development. Do not expose this
standalone instance to a public network or reuse these credentials in a shared
or production deployment.
