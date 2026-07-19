const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

export function resolveApiBaseUrl(
  configured: string | undefined,
  production: boolean,
  browserOrigin?: string,
): string {
  const candidate = configured === undefined
    ? production ? '' : 'http://localhost:8080'
    : configured.replace(/\/+$/, '');
  if (!candidate || !browserOrigin) return candidate;

  const apiUrl = new URL(candidate);
  const browserUrl = new URL(browserOrigin);
  if (isLoopbackHost(apiUrl.hostname) && !isLoopbackHost(browserUrl.hostname)) {
    apiUrl.hostname = browserUrl.hostname;
    return apiUrl.toString().replace(/\/+$/, '');
  }
  return candidate;
}

export const API_BASE_URL = resolveApiBaseUrl(
  configuredApiBaseUrl,
  import.meta.env.PROD,
  typeof window === 'undefined' ? undefined : window.location.origin,
);

export function toBrowserUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }

  const origin = typeof window === 'undefined' ? 'http://localhost:5173' : window.location.origin;
  return new URL(pathOrUrl, origin).toString();
}
