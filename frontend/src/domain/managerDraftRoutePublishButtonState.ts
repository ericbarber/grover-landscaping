export type ManagerDraftRoutePublishButtonState = {
  isDisabled: boolean;
  label: string;
};

export function getManagerDraftRoutePublishButtonState(
  canPublish: boolean,
  isPublishing: boolean,
  hasPublishHandler: boolean,
): ManagerDraftRoutePublishButtonState {
  return {
    isDisabled: !canPublish || isPublishing || !hasPublishHandler,
    label: isPublishing ? 'Publishing draft route...' : 'Publish draft route',
  };
}
