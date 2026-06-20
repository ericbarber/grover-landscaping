import type { ManagerActivitySource, ManagerActivityTone } from './managerActivity';

export function managerActivitySourceLabel(source: ManagerActivitySource): string {
  if (source === 'route') {
    return 'Route';
  }

  if (source === 'job') {
    return 'Job';
  }

  if (source === 'photo') {
    return 'Photo';
  }

  return 'Sync';
}

export function managerActivityToneLabel(tone: ManagerActivityTone): string {
  if (tone === 'warning') {
    return 'Warning';
  }

  if (tone === 'success') {
    return 'Success';
  }

  return 'Info';
}

export function managerActivityFilterSummary(
  source: ManagerActivitySource | 'all',
  tone: ManagerActivityTone | 'all',
): string {
  return [
    source === 'all' ? 'All sources' : `${managerActivitySourceLabel(source)} source`,
    tone === 'all' ? 'all tones' : `${managerActivityToneLabel(tone)} tone`,
  ].join(' · ');
}
