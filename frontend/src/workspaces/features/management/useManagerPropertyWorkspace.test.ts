import { describe, expect, it } from 'vitest';
import type { CustomerPropertyRecord } from '../../../api/client';
import {
  createManagerPropertyWorkspaceState,
  managerPropertyWorkspaceReducer,
} from './useManagerPropertyWorkspace';

const alpha: CustomerPropertyRecord = {
  propertyId: 'property-alpha',
  accountId: 'account-1',
  organizationId: 'organization-1',
  displayName: 'Alpha home',
  serviceAddress: '1 Alpha Way',
  status: 'active',
  persisted: true,
};

const beta: CustomerPropertyRecord = {
  propertyId: 'property-beta',
  accountId: 'account-2',
  organizationId: 'organization-1',
  displayName: 'Beta home',
  serviceAddress: '2 Beta Way',
  status: 'onboarding',
  persisted: true,
};

describe('manager property workspace coordination', () => {
  it('keeps initial property collections inside the active organization', () => {
    const state = createManagerPropertyWorkspaceState('organization-1', [
      { ...beta, organizationId: 'organization-2' },
      alpha,
    ]);

    expect(state.customerProperties).toEqual([alpha]);
    expect(state.onboardingOptions.map(({ propertyId }) => propertyId))
      .toEqual(['property-alpha']);
  });

  it('registers matching properties atomically and sorts them for both views', () => {
    const state = createManagerPropertyWorkspaceState('organization-1', [beta]);
    const updated = managerPropertyWorkspaceReducer(state, {
      type: 'properties_registered',
      properties: [alpha],
    });

    expect(updated.customerProperties.map(({ propertyId }) => propertyId))
      .toEqual(['property-alpha', 'property-beta']);
    expect(updated.onboardingOptions.map(({ propertyId }) => propertyId))
      .toEqual(['property-alpha', 'property-beta']);
  });

  it('retains an archived customer record but removes it from onboarding choices', () => {
    const state = createManagerPropertyWorkspaceState('organization-1', [alpha, beta]);
    const updated = managerPropertyWorkspaceReducer(state, {
      type: 'properties_registered',
      properties: [{ ...alpha, status: 'archived' }],
    });

    expect(updated.customerProperties.find(({ propertyId }) => propertyId === alpha.propertyId)?.status)
      .toBe('archived');
    expect(updated.onboardingOptions.map(({ propertyId }) => propertyId))
      .toEqual(['property-beta']);
  });

  it('rejects records from a different organization', () => {
    const state = createManagerPropertyWorkspaceState('organization-1', [alpha]);
    const updated = managerPropertyWorkspaceReducer(state, {
      type: 'properties_registered',
      properties: [{ ...beta, organizationId: 'organization-2' }],
    });

    expect(updated).toBe(state);
  });

  it('clears prior property data and requests when the organization changes', () => {
    const requested = managerPropertyWorkspaceReducer(
      createManagerPropertyWorkspaceState('organization-1', [alpha]),
      {
        type: 'property_workspace_requested',
        propertyId: alpha.propertyId,
        workspace: 'operational-profile',
      },
    );
    const changed = managerPropertyWorkspaceReducer(requested, {
      type: 'organization_activated',
      organizationId: 'organization-2',
    });

    expect(changed).toEqual(createManagerPropertyWorkspaceState('organization-2', []));
  });

  it('routes property requests to the intended workspace without altering collections', () => {
    const state = createManagerPropertyWorkspaceState('organization-1', [alpha]);
    const requested = managerPropertyWorkspaceReducer(state, {
      type: 'property_workspace_requested',
      propertyId: alpha.propertyId,
      workspace: 'service-setup',
    });
    const updated = managerPropertyWorkspaceReducer(requested, {
      type: 'properties_registered',
      properties: [beta],
    });

    expect(updated.requestedServiceSetupPropertyId).toBe(alpha.propertyId);
    expect(updated.requestedOperationalProfilePropertyId).toBe('');
    expect(requested.customerProperties).toBe(state.customerProperties);
    expect(updated.customerProperties).toHaveLength(2);
  });
});
