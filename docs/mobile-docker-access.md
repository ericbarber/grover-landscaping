# Mobile Docker Access

The local Docker stack is reachable from another device by opening the
workstation's Tailscale host on frontend port 5173.

Vite still receives `http://localhost:8080` as its workstation-friendly API
default. At runtime, when the frontend is opened from a non-loopback host, the
client replaces only that loopback hostname with the page hostname and retains
API port 8080. For example:

```text
http://100.88.21.105:5173 -> http://100.88.21.105:8080
```

The Compose local default leaves `CORS_ALLOWED_ORIGIN` empty, selecting the
backend's existing permissive non-production CORS policy. Hosted environments
must continue to set an explicit allowed origin. An explicitly configured
non-loopback API URL is never rewritten.

Protected API authorization bypasses only `OPTIONS` requests so the CORS layer
can answer browser preflight without a bearer principal. The actual GET, POST,
PUT, and DELETE request remains fully authenticated and authorized. Read-only
client requests omit an unnecessary JSON content-type header to avoid needless
preflight traffic.

Compose health checks probe PostgreSQL, the backend `/health` endpoint, and the
Vite root page. Backend and frontend watchdogs allow extended cold-start setup,
then exit their container after three consecutive runtime readiness failures.
The `unless-stopped` restart policy brings the failed service back without
restarting it after an intentional operator stop.

Check phone-stack readiness with:

```bash
docker compose ps
curl --fail http://localhost:8080/health
curl --fail --head http://localhost:5173/
```

All three services should report `healthy` before mobile validation.
