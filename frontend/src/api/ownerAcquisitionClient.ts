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

interface ApiOwnerIntakeMedia {
  media_id: string;
  owner_user_id: string;
  property_id: string;
  brief_id: string;
  shot_type: OwnerIntakeMedia['shotType'];
  file_name: string;
  content_type: string;
  upload_mode: string;
  object_key: string;
  thumbnail_object_key?: string | null;
  status: OwnerIntakeMedia['status'];
  file_size_bytes?: number | null;
  image_width_px?: number | null;
  image_height_px?: number | null;
  metadata_source?: string | null;
  rejection_reason?: string | null;
  replaces_media_id?: string | null;
  replaced_by_media_id?: string | null;
  display_url?: string | null;
  thumbnail_url?: string | null;
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

export interface OwnerIntakeMedia {
  mediaId: string;
  ownerUserId: string;
  propertyId: string;
  briefId: string;
  shotType: 'front_yard' | 'back_yard' | 'side_access' | 'irrigation_or_concern' | 'other';
  fileName: string;
  contentType: string;
  uploadMode: string;
  objectKey: string;
  thumbnailObjectKey?: string;
  status: 'pending_upload' | 'processing' | 'ready' | 'rejected' | 'replaced' | 'deleted';
  fileSizeBytes?: number;
  imageWidthPx?: number;
  imageHeightPx?: number;
  metadataSource?: string;
  rejectionReason?: string;
  replacesMediaId?: string;
  replacedByMediaId?: string;
  displayUrl?: string;
  thumbnailUrl?: string;
  persisted: boolean;
}

export interface OwnerIntakeMediaUpload {
  media: OwnerIntakeMedia;
  uploadUrl: string;
  thumbnailUploadUrl?: string;
  thumbnailContentType?: string;
  thumbnailMaxDimensionPx?: number;
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

function mapIntakeMedia(media: ApiOwnerIntakeMedia): OwnerIntakeMedia {
  return {
    mediaId: media.media_id,
    ownerUserId: media.owner_user_id,
    propertyId: media.property_id,
    briefId: media.brief_id,
    shotType: media.shot_type,
    fileName: media.file_name,
    contentType: media.content_type,
    uploadMode: media.upload_mode,
    objectKey: media.object_key,
    thumbnailObjectKey: media.thumbnail_object_key ?? undefined,
    status: media.status,
    fileSizeBytes: media.file_size_bytes ?? undefined,
    imageWidthPx: media.image_width_px ?? undefined,
    imageHeightPx: media.image_height_px ?? undefined,
    metadataSource: media.metadata_source ?? undefined,
    rejectionReason: media.rejection_reason ?? undefined,
    replacesMediaId: media.replaces_media_id ?? undefined,
    replacedByMediaId: media.replaced_by_media_id ?? undefined,
    displayUrl: media.display_url ?? undefined,
    thumbnailUrl: media.thumbnail_url ?? undefined,
    persisted: media.persisted,
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

export async function fetchOwnerIntakeMedia(propertyId: string): Promise<OwnerIntakeMedia[]> {
  const response = await ownerRequest(`/owner-properties/${encodeURIComponent(propertyId)}/intake-media`);
  return ((await response.json()) as ApiOwnerIntakeMedia[]).map(mapIntakeMedia);
}

export async function createOwnerIntakeMediaUpload(
  propertyId: string,
  file: File,
  shotType: OwnerIntakeMedia['shotType'],
  replacesMediaId?: string,
): Promise<OwnerIntakeMediaUpload> {
  const response = await ownerRequest(`/owner-properties/${encodeURIComponent(propertyId)}/intake-media`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      file_name: file.name,
      content_type: file.type || 'application/octet-stream',
      shot_type: shotType,
      replaces_media_id: replacesMediaId || null,
    }),
  });
  const upload = await response.json() as {
    media: ApiOwnerIntakeMedia;
    upload_url: string;
    thumbnail_upload_url?: string | null;
    thumbnail_content_type?: string | null;
    thumbnail_max_dimension_px?: number | null;
  };
  return {
    media: mapIntakeMedia(upload.media),
    uploadUrl: upload.upload_url,
    thumbnailUploadUrl: upload.thumbnail_upload_url ?? undefined,
    thumbnailContentType: upload.thumbnail_content_type ?? undefined,
    thumbnailMaxDimensionPx: upload.thumbnail_max_dimension_px ?? undefined,
  };
}

export async function uploadOwnerIntakeMediaFile(
  upload: OwnerIntakeMediaUpload,
  file: File,
): Promise<void> {
  if (upload.media.uploadMode === 'local-placeholder') return;
  const response = await fetch(upload.uploadUrl, {
    method: 'PUT',
    headers: { 'content-type': file.type || upload.media.contentType },
    body: file,
  });
  if (!response.ok) throw new Error(`Private photo upload failed with status ${response.status}.`);
}

export async function completeOwnerIntakeMediaUpload(
  propertyId: string,
  mediaId: string,
  file?: File,
): Promise<OwnerIntakeMedia> {
  const response = await ownerRequest(`/owner-properties/${encodeURIComponent(propertyId)}/intake-media/${encodeURIComponent(mediaId)}/complete`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ file_size_bytes: file && file.size > 0 ? file.size : undefined }),
  });
  return mapIntakeMedia(await response.json() as ApiOwnerIntakeMedia);
}

export async function deleteOwnerIntakeMedia(
  propertyId: string,
  mediaId: string,
): Promise<OwnerIntakeMedia> {
  const response = await ownerRequest(`/owner-properties/${encodeURIComponent(propertyId)}/intake-media/${encodeURIComponent(mediaId)}`, {
    method: 'DELETE',
  });
  return mapIntakeMedia(await response.json() as ApiOwnerIntakeMedia);
}
