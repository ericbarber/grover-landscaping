import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from './baseUrl';

describe('API base URL resolution', () => {
  it('uses the browser host when a loopback Docker API is opened remotely', () => {
    expect(resolveApiBaseUrl(
      'http://localhost:8080',
      false,
      'http://100.88.21.105:5173',
    )).toBe('http://100.88.21.105:8080');
    expect(resolveApiBaseUrl(
      'http://127.0.0.1:8080/',
      false,
      'http://grover-workstation:5173',
    )).toBe('http://grover-workstation:8080');
  });

  it('preserves loopback for workstation use and explicit hosted APIs', () => {
    expect(resolveApiBaseUrl(
      'http://localhost:8080',
      false,
      'http://localhost:5173',
    )).toBe('http://localhost:8080');
    expect(resolveApiBaseUrl(
      'https://api.example.com/',
      true,
      'https://app.example.com',
    )).toBe('https://api.example.com');
  });

  it('keeps a production same-origin API base empty', () => {
    expect(resolveApiBaseUrl(undefined, true, 'https://app.example.com')).toBe('');
  });
});
