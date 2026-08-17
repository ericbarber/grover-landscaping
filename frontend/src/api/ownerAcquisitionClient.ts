import { apiRequestError } from './apiError';
import { authenticatedFetch } from './authenticatedFetch';
import { API_BASE_URL } from './baseUrl';

interface ApiOwnerWorkspace {
  owner_user_id: string;
  verified_email: string;
  display_name: string;
  status: string;
  persisted: boolean;
}

interface ApiOwnerProperty {
  property_id: string;
  owner_user_id: string;
  display_name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  region: string;
  postal_code: string;
  country_code: string;
  coarse_area: string;
  address_status: 'unconfirmed' | 'owner_confirmed' | 'correction_required';
  authority_attested: boolean;
  status: string;
  version: number;
  persisted: boolean;
}

interface ApiOwnerYardBrief {
  brief_id: string;
  owner_user_id: string;
  property_id: string;
  version: number;
  status: 'draft' | 'ready';
  yard_areas: string[];
  care_goals: string[];
  cadence_preference: OwnerYardBrief['cadencePreference'];
  considerations: string;
  author_source: 'yard_owner';
  persisted: boolean;
}

export interface OwnerWorkspace {
  ownerUserId: string;
  verifiedEmail: string;
  displayName: string;
  status: string;
  persisted: boolean;
}

export interface OwnerProperty {
  propertyId: string;
  ownerUserId: string;
  displayName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
  coarseArea: string;
  addressStatus: ApiOwnerProperty['address_status'];
  authorityAttested: boolean;
  status: string;
  version: number;
  persisted: boolean;
}

export interface CreateOwnerPropertyInput {
  displayName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode?: string;
  coarseArea?: string;
  addressConfirmed: boolean;
  authorityAttested: boolean;
}

export interface OwnerYardBrief {
  briefId: string;
  ownerUserId: string;
  propertyId: string;
  version: number;
  status: 'draft' | 'ready';
  yardAreas: string[];
  careGoals: string[];
  cadencePreference: 'provider_recommendation' | 'one_time' | 'weekly' | 'every_two_weeks' | 'monthly';
  considerations: string;
  authorSource: 'yard_owner';
  persisted: boolean;
}

export interface SaveOwnerYardBriefInput {
  status: OwnerYardBrief['status'];
  yardAreas: string[];
  careGoals: string[];
  cadencePreference: OwnerYardBrief['cadencePreference'];
  considerations: string;
}

function mapWorkspace(workspace: ApiOwnerWorkspace): OwnerWorkspace {
  return {
    ownerUserId: workspace.owner_user_id,
    verifiedEmail: workspace.verified_email,
    displayName: workspace.display_name,
    status: workspace.status,
    persisted: workspace.persisted,
  };
}

function mapProperty(property: ApiOwnerProperty): OwnerProperty {
  return {
    propertyId: property.property_id,
    ownerUserId: property.owner_user_id,
    displayName: property.display_name,
    addressLine1: property.address_line_1,
    addressLine2: property.address_line_2,
    city: property.city,
    region: property.region,
    postalCode: property.postal_code,
    countryCode: property.country_code,
    coarseArea: property.coarse_area,
    addressStatus: property.address_status,
    authorityAttested: property.authority_attested,
    status: property.status,
    version: property.version,
    persisted: property.persisted,
  };
}

function mapYardBrief(brief: ApiOwnerYardBrief): OwnerYardBrief {
  return {
    briefId: brief.brief_id,
    ownerUserId: brief.owner_user_id,
    propertyId: brief.property_id,
    version: brief.version,
    status: brief.status,
    yardAreas: brief.yard_areas,
    careGoals: brief.care_goals,
    cadencePreference: brief.cadence_preference,
    considerations: brief.considerations,
    authorSource: brief.author_source,
    persisted: brief.persisted,
  };
}

async function ownerRequest(path: string, init?: RequestInit): Promise<Response> {
  const response = await authenticatedFetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    throw await apiRequestError(
      response,
      `Yard Owner request failed with status ${response.status}.`,
    );
  }
  return response;
}

export async function fetchOwnerWorkspace(): Promise<OwnerWorkspace> {
  const response = await ownerRequest('/owner-workspace');
  return mapWorkspace(await response.json() as ApiOwnerWorkspace);
}

export async function saveOwnerWorkspace(displayName: string): Promise<OwnerWorkspace> {
  const response = await ownerRequest('/owner-workspace', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ display_name: displayName }),
  });
  return mapWorkspace(await response.json() as ApiOwnerWorkspace);
}

export async function fetchOwnerProperties(): Promise<OwnerProperty[]> {
  const response = await ownerRequest('/owner-properties');
  return ((await response.json()) as ApiOwnerProperty[]).map(mapProperty);
}

export async function createOwnerProperty(
  input: CreateOwnerPropertyInput,
): Promise<OwnerProperty> {
  const response = await ownerRequest('/owner-properties', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      display_name: input.displayName,
      address_line_1: input.addressLine1,
      address_line_2: input.addressLine2 || null,
      city: input.city,
      region: input.region,
      postal_code: input.postalCode,
      country_code: input.countryCode || 'US',
      coarse_area: input.coarseArea || null,
      address_status: input.addressConfirmed ? 'owner_confirmed' : 'unconfirmed',
      authority_attested: input.authorityAttested,
    }),
  });
  return mapProperty(await response.json() as ApiOwnerProperty);
}

export async function fetchOwnerYardBrief(propertyId: string): Promise<OwnerYardBrief> {
  const response = await ownerRequest(`/owner-properties/${encodeURIComponent(propertyId)}/yard-brief`);
  return mapYardBrief(await response.json() as ApiOwnerYardBrief);
}

export async function saveOwnerYardBrief(
  propertyId: string,
  input: SaveOwnerYardBriefInput,
): Promise<OwnerYardBrief> {
  const response = await ownerRequest(`/owner-properties/${encodeURIComponent(propertyId)}/yard-brief`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      status: input.status,
      yard_areas: input.yardAreas,
      care_goals: input.careGoals,
      cadence_preference: input.cadencePreference,
      considerations: input.considerations,
    }),
  });
  return mapYardBrief(await response.json() as ApiOwnerYardBrief);
}
