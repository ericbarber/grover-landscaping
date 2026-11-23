export function isAllowedStudyOrigin(value: string | undefined): boolean {
  if (!value) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  const octets = url.hostname.split('.').map(Number);
  const tailscaleHost = octets.length === 4
    && octets.every((octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255)
    && octets[0] === 100
    && octets[1] >= 64
    && octets[1] <= 127;
  return url.protocol === 'http:'
    && url.port === '5174'
    && (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || tailscaleHost)
    && url.pathname === '/'
    && !url.search
    && !url.hash;
}
