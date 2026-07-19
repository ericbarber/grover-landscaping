export interface DiagnosticsReportInput {
  checkedAt: Date;
  origin: string;
  apiBaseUrl: string;
  online: boolean;
  apiReady: boolean;
  secureContext: boolean;
  workerSupported: boolean;
  workerControlsPage: boolean;
  installedMode: boolean;
  userAgent: string;
}

export function buildDiagnosticsReport(input: DiagnosticsReportInput): string {
  return [
    'Grover Field mobile diagnostics',
    `Checked: ${input.checkedAt.toISOString()}`,
    `App origin: ${input.origin}`,
    `API origin: ${input.apiBaseUrl}`,
    `Browser network: ${input.online ? 'online' : 'offline'}`,
    `API: ${input.apiReady ? 'ready' : 'unavailable'}`,
    `Secure context: ${input.secureContext ? 'yes' : 'no'}`,
    `Service worker supported: ${input.workerSupported ? 'yes' : 'no'}`,
    `Service worker controlling page: ${input.workerControlsPage ? 'yes' : 'no'}`,
    `Display mode: ${input.installedMode ? 'installed' : 'browser'}`,
    `Browser: ${input.userAgent}`,
  ].join('\n');
}
