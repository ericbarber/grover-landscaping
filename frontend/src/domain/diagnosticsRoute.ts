export function isDiagnosticsPath(pathname: string): boolean {
  return pathname.replace(/\/+$/, '') === '/diagnostics';
}
