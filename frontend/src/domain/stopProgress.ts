export type StopProgressStatus = 'pending' | 'in_progress' | 'finished';

export type StopStateMap = Record<string, StopProgressStatus>;

export function getNextStopStatus(currentStatus: StopProgressStatus | undefined): StopProgressStatus {
  if (currentStatus === 'pending' || currentStatus === undefined) {
    return 'in_progress';
  }

  return 'finished';
}

export function countFinishedStops(stopIds: string[], stopStates: StopStateMap): number {
  return stopIds.filter((stopId) => stopStates[stopId] === 'finished').length;
}

export function resetStopStates(): StopStateMap {
  return {};
}
