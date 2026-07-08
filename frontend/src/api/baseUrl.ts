const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL =
  configuredApiBaseUrl === undefined
    ? import.meta.env.PROD
      ? ''
      : 'http://localhost:8080'
    : configuredApiBaseUrl.replace(/\/+$/, '');

export function toBrowserUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }

  const origin = typeof window === 'undefined' ? 'http://localhost:5173' : window.location.origin;
  return new URL(pathOrUrl, origin).toString();
}
