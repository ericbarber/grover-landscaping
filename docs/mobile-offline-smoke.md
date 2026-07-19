# Mobile Offline Recovery Smoke

The Playwright mobile smoke test uses a Pixel 7 Chromium viewport against a running
frontend and API. It resets only browser-local Grover field state, then verifies:

1. the day plan loads from the API without horizontal overflow;
2. a browser network interruption produces the global offline warning;
3. a stop-progress action enters IndexedDB with visible pending state;
4. restoring connectivity triggers automatic ordered replay;
5. the queue clears only after the API confirms persistence.

Run it against the local Docker stack:

```bash
cd frontend
npm run test:e2e:mobile
```

Override `E2E_BASE_URL` to exercise the workstation's Tailscale URL from an
environment that can reach it. Install the browser once with
`npx playwright install chromium`; Linux hosts may also need
`npx playwright install-deps chromium`.

The smoke workflow intentionally uses the HTTP Tailscale address. Offline
mutation UUIDs therefore fall back from the secure-context-only
`crypto.randomUUID()` API to an RFC 4122 version 4 UUID built from
`crypto.getRandomValues()`. The test also exercises the backend's unauthenticated
CORS preflight path before replaying the JSON mutation.
