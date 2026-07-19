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
