export function getManagerDraftRoutePublishMessage(disabledReason: string | null): string {
  return disabledReason ?? 'This draft route has the minimum review details needed for publishing.';
}
