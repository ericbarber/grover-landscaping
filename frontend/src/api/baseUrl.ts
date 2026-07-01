const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL =
  configuredApiBaseUrl === undefined
    ? import.meta.env.PROD
      ? ''
      : 'http://localhost:8080'
    : configuredApiBaseUrl.replace(/\/+$/, '');
