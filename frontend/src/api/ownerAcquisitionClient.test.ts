import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureApiAuthentication } from './authenticatedFetch';
import {
  createOwnerProperty,
  fetchOwnerYardBrief,
  fetchOwnerProperties,
  saveOwnerYardBrief,
  saveOwnerWorkspace,
} from './ownerAcquisitionClient';

afterEach(() => {
  configureApiAuthentication(false, async () => null);
  vi.unstubAllGlobals();
});

describe('Yard Owner acquisition API client', () => {
  it('maps private owner property records from the API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      property_id: 'owner_property_1', owner_user_id: 'owner_1', display_name: 'Home',
      address_line_1: '123 Oak Street', address_line_2: '', city: 'Phoenix', region: 'AZ',
      postal_code: '85004', country_code: 'US', coarse_area: 'Central Phoenix',
      address_status: 'owner_confirmed', authority_attested: true, status: 'draft',
      version: 1, persisted: true,
    }]), { status: 200 })));

    await expect(fetchOwnerProperties()).resolves.toEqual([expect.objectContaining({
      propertyId: 'owner_property_1',
      addressLine1: '123 Oak Street',
      authorityAttested: true,
      persisted: true,
    })]);
  });

  it('sends only profile content while authentication supplies owner identity', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      owner_user_id: 'owner_1', verified_email: 'owner@example.com', display_name: 'Morgan',
      status: 'active', persisted: true,
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await saveOwnerWorkspace('Morgan');

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toEqual({ display_name: 'Morgan' });
    expect(body).not.toHaveProperty('owner_user_id');
    expect(body).not.toHaveProperty('verified_email');
  });

  it('invalidates address confirmation when the caller has not reconfirmed it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      property_id: 'owner_property_1', owner_user_id: 'owner_1', display_name: 'Home',
      address_line_1: '123 Oak Street', address_line_2: '', city: 'Phoenix', region: 'AZ',
      postal_code: '85004', country_code: 'US', coarse_area: '', address_status: 'unconfirmed',
      authority_attested: true, status: 'draft', version: 1, persisted: true,
    }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await createOwnerProperty({
      displayName: 'Home', addressLine1: '123 Oak Street', city: 'Phoenix', region: 'AZ',
      postalCode: '85004', addressConfirmed: false, authorityAttested: true,
    });

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.address_status).toBe('unconfirmed');
    expect(body).not.toHaveProperty('owner_user_id');
  });

  it('maps and versions the owner-authored private yard brief', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      brief_id: 'owner_brief_1', owner_user_id: 'owner_1', property_id: 'owner_property_1',
      version: 2, status: 'ready', yard_areas: ['Front yard'], care_goals: ['Routine upkeep'],
      cadence_preference: 'every_two_weeks', considerations: 'Keep the side gate closed.',
      author_source: 'yard_owner', persisted: true,
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchOwnerYardBrief('owner_property_1')).resolves.toEqual(expect.objectContaining({
      briefId: 'owner_brief_1',
      propertyId: 'owner_property_1',
      version: 2,
      yardAreas: ['Front yard'],
      authorSource: 'yard_owner',
    }));

    await saveOwnerYardBrief('owner_property_1', {
      status: 'ready',
      yardAreas: ['Front yard'],
      careGoals: ['Routine upkeep'],
      cadencePreference: 'every_two_weeks',
      considerations: 'Keep the side gate closed.',
    });
    const body = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
    expect(body).toEqual({
      status: 'ready',
      yard_areas: ['Front yard'],
      care_goals: ['Routine upkeep'],
      cadence_preference: 'every_two_weeks',
      considerations: 'Keep the side gate closed.',
    });
    expect(body).not.toHaveProperty('owner_user_id');
  });
});
