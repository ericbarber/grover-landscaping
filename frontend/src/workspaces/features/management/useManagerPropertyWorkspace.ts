import { useCallback, useReducer } from 'react';
import type { CustomerPropertyRecord } from '../../../api/client';

export type ManagerPropertyWorkspace = 'operational-profile' | 'service-setup';

export interface ManagerPropertyOnboardingOption {
  propertyId: string;
  accountId: string;
  organizationId: string;
  displayName: string;
  serviceAddress: string;
}

export interface ManagerPropertyWorkspaceState {
  organizationId: string;
  customerProperties: CustomerPropertyRecord[];
  onboardingOptions: ManagerPropertyOnboardingOption[];
  requestedOperationalProfilePropertyId: string;
  requestedServiceSetupPropertyId: string;
}

type ManagerPropertyWorkspaceAction =
  | { type: 'organization_activated'; organizationId: string }
  | { type: 'properties_registered'; properties: CustomerPropertyRecord[] }
  | {
    type: 'property_workspace_requested';
    propertyId: string;
    workspace: ManagerPropertyWorkspace;
  };

function byDisplayName(
  a: { displayName: string; propertyId: string },
  b: { displayName: string; propertyId: string },
) {
  return a.displayName.localeCompare(b.displayName)
    || a.propertyId.localeCompare(b.propertyId);
}

export function createManagerPropertyWorkspaceState(
  organizationId: string,
  customerProperties: CustomerPropertyRecord[],
): ManagerPropertyWorkspaceState {
  const scopedProperties = customerProperties
    .filter((property) => property.organizationId === organizationId)
    .sort(byDisplayName);

  return {
    organizationId,
    customerProperties: scopedProperties,
    onboardingOptions: scopedProperties
      .filter((property) => property.status !== 'archived')
      .map((property) => ({
        propertyId: property.propertyId,
        accountId: property.accountId,
        organizationId: property.organizationId,
        displayName: property.displayName,
        serviceAddress: property.serviceAddress,
      })),
    requestedOperationalProfilePropertyId: '',
    requestedServiceSetupPropertyId: '',
  };
}

export function managerPropertyWorkspaceReducer(
  state: ManagerPropertyWorkspaceState,
  action: ManagerPropertyWorkspaceAction,
): ManagerPropertyWorkspaceState {
  switch (action.type) {
    case 'organization_activated':
      if (action.organizationId === state.organizationId) return state;
      return createManagerPropertyWorkspaceState(action.organizationId, []);
    case 'properties_registered': {
      const matchingProperties = action.properties.filter(
        (property) => property.organizationId === state.organizationId,
      );
      if (matchingProperties.length === 0) return state;

      const next = new Map(
        state.customerProperties.map((property) => [property.propertyId, property]),
      );
      matchingProperties.forEach((property) => next.set(property.propertyId, property));
      const collections = createManagerPropertyWorkspaceState(
        state.organizationId,
        Array.from(next.values()),
      );
      return {
        ...state,
        customerProperties: collections.customerProperties,
        onboardingOptions: collections.onboardingOptions,
      };
    }
    case 'property_workspace_requested':
      return action.workspace === 'operational-profile'
        ? {
            ...state,
            requestedOperationalProfilePropertyId: action.propertyId,
          }
        : {
            ...state,
            requestedServiceSetupPropertyId: action.propertyId,
          };
  }
}

export function useManagerPropertyWorkspace(
  organizationId: string,
  customerProperties: CustomerPropertyRecord[],
) {
  const [state, dispatch] = useReducer(
    managerPropertyWorkspaceReducer,
    createManagerPropertyWorkspaceState(organizationId, customerProperties),
  );

  const activateOrganization = useCallback((nextOrganizationId: string) => {
    dispatch({ type: 'organization_activated', organizationId: nextOrganizationId });
  }, []);
  const registerProperties = useCallback((properties: CustomerPropertyRecord[]) => {
    dispatch({ type: 'properties_registered', properties });
  }, []);
  const requestPropertyWorkspace = useCallback((
    propertyId: string,
    workspace: ManagerPropertyWorkspace,
  ) => {
    dispatch({ type: 'property_workspace_requested', propertyId, workspace });
  }, []);

  return {
    ...state,
    activateOrganization,
    registerProperties,
    requestPropertyWorkspace,
  };
}
