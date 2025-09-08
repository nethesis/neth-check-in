## Neth Check-in

Client and Server for Nethesis partner meeting badges 2017

The software can be run both with docker-compose in rootfull mode and podman-compose in rootless mode.

### Using podman-compose

Podman compose will run the containers in rootless mode, so you need to have podman and podman-compose installed.

To run with podman-compose:
```bash
podman-compose up -d
```

To stop and remove containers:
```bash
podman-compose down
```

### Using docker-compose

Docker will run the containers in rootfull mode, so you need to have docker and docker-compose installed.

To run with docker-compose:
```bash
docker-compose up -d
```

To stop and remove containers:
```bash
docker-compose down
```

If the database does not run, you may need to add the following inside the docker-composer:
```
ulimits:
  nofile: 1048576
```

Note: this will not work with podman-compose.

### Application access

The compose will expose the following service:
- Web UI: http://localhost:8888, websocket port: 35729
- Server: http://localhost:8080
- PHPMyAdmin: http://localhost:8081
- Printer driver: http://
