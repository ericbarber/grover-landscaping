# Production Service Worker Strategy

Grover Field registers `/sw.js` only in production builds. Local Vite development
does not register a worker, so source edits and Docker mobile review continue to
refresh directly.

The worker uses a versioned shell cache with these boundaries:

- Navigations are network-first and fall back to the cached application shell.
- Same-origin scripts, styles, images, fonts, and the manifest are cache-first.
- API requests, mutations, and cross-origin requests are never intercepted or
  cached.
- Navigation URLs are not used as cache keys, preventing invitation, report, or
  bid tokens from being retained in cache metadata.
- Activation removes older Grover shell cache versions.

The service worker improves shell recovery and repeat loading. It does not claim
that mutations work offline. Offline data queues remain a separate planned phase
and must preserve tenant, actor, ordering, and conflict semantics before launch.

When shell behavior changes incompatibly, increment `CACHE_NAME` in
`frontend/public/sw.js`. Validate with:

```bash
node --check frontend/public/sw.js
npm --prefix frontend run build
```
