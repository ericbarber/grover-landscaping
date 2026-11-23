import { useCallback, useEffect, useRef, useState } from 'react';
import type { WorkspaceView } from './types';

export function resolveAuthorizedWorkspaceView(
  requestedView: WorkspaceView,
  availableViews: readonly WorkspaceView[],
  defaultView: WorkspaceView,
): WorkspaceView {
  return availableViews.includes(requestedView) ? requestedView : defaultView;
}

export function workspaceViewScrollTop(
  savedPositions: Partial<Record<WorkspaceView, number>>,
  destination: WorkspaceView,
  resetDestination = false,
): number {
  if (resetDestination) return 0;
  return Math.max(0, savedPositions[destination] ?? 0);
}

export function useWorkspaceViewNavigation(
  defaultView: WorkspaceView,
  availableViews: readonly WorkspaceView[],
) {
  const [view, setView] = useState(defaultView);
  const scrollPositions = useRef<Partial<Record<WorkspaceView, number>>>({});

  useEffect(() => {
    setView((current) => resolveAuthorizedWorkspaceView(
      current,
      availableViews,
      defaultView,
    ));
  }, [availableViews, defaultView]);

  const openView = useCallback((
    requestedView: WorkspaceView,
    resetDestination = false,
  ) => {
    const destination = resolveAuthorizedWorkspaceView(
      requestedView,
      availableViews,
      defaultView,
    );
    if (window.innerWidth >= 1024) {
      setView(destination);
      return;
    }

    scrollPositions.current[view] = window.scrollY;
    setView(destination);
    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: workspaceViewScrollTop(
          scrollPositions.current,
          destination,
          resetDestination,
        ),
        behavior: 'auto',
      });
    });
  }, [availableViews, defaultView, view]);

  return { view, openView };
}
