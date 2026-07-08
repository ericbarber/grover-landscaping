export function sharedReportTokenFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/report-view\/([^/]+)\/?$/);
  if (!match?.[1]) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}
