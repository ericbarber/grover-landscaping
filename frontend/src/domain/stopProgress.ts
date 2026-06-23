export type StopProgressStatus = 'pending' | 'in_progress' | 'finished';
export type RouteProgressSyncStatus = 'local' | 'syncing' | 'synced';
export type DayPlanAmendmentType = 'add_stop' | 'remove_stop' | 'add_service';
export type DayPlanAmendmentStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type ProjectBidStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired' | 'converted';

export type StopStateMap = Record<string, StopProgressStatus>;

export type StopStatusSnapshot = {
  id: string;
  stopStatus?: StopProgressStatus;
};

export type ServiceCatalogItem = {
  id: string;
  name: string;
  description?: string;
  defaultDurationMinutes?: number;
  defaultPriceCents?: number;
  requiresManagerApproval: boolean;
};

export type DayPlanAmendmentRequest = {
  id: string;
  dayPlanId: string;
  amendmentType: DayPlanAmendmentType;
  status: DayPlanAmendmentStatus;
  requestedByCrewId: string;
  stopId?: string;
  service?: ServiceCatalogItem;
  note?: string;
};

export type ProjectBidLineItem = {
  id: string;
  service: ServiceCatalogItem;
  quantity: number;
  unitPriceCents: number;
  note?: string;
};

export type ProjectBid = {
  id: string;
  customerId: string;
  sourceAmendmentId?: string;
  status: ProjectBidStatus;
  lineItems: ProjectBidLineItem[];
  customerMessage?: string;
};

export function getNextStopStatus(currentStatus: StopProgressStatus | undefined): StopProgressStatus {
  if (currentStatus === 'pending' || currentStatus === undefined) {
    return 'in_progress';
  }

  return 'finished';
}

export function stopActionLabel(stopStatus: StopProgressStatus): string {
  if (stopStatus === 'pending') {
    return 'Start stop';
  }

  if (stopStatus === 'in_progress') {
    return 'Finish stop';
  }

  return 'Finished';
}

export function dayPlanAmendmentTypeLabel(amendmentType: DayPlanAmendmentType): string {
  if (amendmentType === 'add_stop') {
    return 'Add stop';
  }

  if (amendmentType === 'remove_stop') {
    return 'Remove stop';
  }

  return 'Add service';
}

export function amendmentRequiresBid(amendment: DayPlanAmendmentRequest): boolean {
  return amendment.amendmentType === 'add_service' && Boolean(amendment.service?.requiresManagerApproval);
}

export function projectBidTotalCents(bid: ProjectBid): number {
  return bid.lineItems.reduce((total, item) => total + item.quantity * item.unitPriceCents, 0);
}

export function projectBidCanConvertToWork(bid: ProjectBid): boolean {
  return bid.status === 'approved' && bid.lineItems.length > 0;
}

export function resolveStopStatus(
  localStatus: StopProgressStatus | undefined,
  serverStatus: StopProgressStatus | undefined,
): StopProgressStatus {
  return localStatus ?? serverStatus ?? 'pending';
}

export function syncStatusFromPersistence(persisted: boolean): RouteProgressSyncStatus {
  return persisted ? 'synced' : 'local';
}

export function countFinishedStops(stopIds: string[], stopStates: StopStateMap): number {
  return stopIds.filter((stopId) => stopStates[stopId] === 'finished').length;
}

export function countResolvedFinishedStops(stops: StopStatusSnapshot[], stopStates: StopStateMap): number {
  return stops.filter((stop) => resolveStopStatus(stopStates[stop.id], stop.stopStatus) === 'finished').length;
}

export function resetStopStates(): StopStateMap {
  return {};
}

export function syncStatusLabel(syncStatus: RouteProgressSyncStatus): string {
  if (syncStatus === 'syncing') {
    return 'syncing';
  }

  if (syncStatus === 'synced') {
    return 'synced';
  }

  return 'saved locally';
}
