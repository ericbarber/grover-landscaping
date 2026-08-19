import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureApiAuthentication } from './authenticatedFetch';
import {
  completeOwnerIntakeMediaUpload,
  createOwnerProperty,
  createOwnerIntakeMediaUpload,
  deleteOwnerIntakeMedia,
  fetchOwnerIntakeMedia,
  fetchOwnerProviderConnectionProgress,
  fetchOwnerYardBrief,
  fetchOwnerProperties,
  saveOwnerYardBrief,
  uploadOwnerIntakeMediaFile,
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
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      brief_id: 'owner_brief_1', owner_user_id: 'owner_1', property_id: 'owner_property_1',
      version: 2, status: 'ready', yard_areas: ['Front yard'], care_goals: ['Routine upkeep'],
      cadence_preference: 'every_two_weeks', considerations: 'Keep the side gate closed.',
      author_source: 'yard_owner', persisted: true,
    }), { status: 200 })));
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

  it('maps customer-safe provider connection progress without private authority data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      invitation_id: 'invitation_1', provider_name: 'Desert Bloom Yard Care',
      invitation_status: 'opened', delivery_status: 'delivered',
      progress_stage: 'disclosure_decision',
      status_label: 'Provider is interested in the next owner-approved review',
      owner_action_required: true, next_action: 'review_disclosure',
      latest_response_action: 'express_interest',
      response_label: 'Interested in reviewing the next owner-approved details',
      expires_at_epoch_seconds: 1_800_000_000, responded_at_epoch_seconds: 1_799_000_000,
      persisted: true,
    }]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchOwnerProviderConnectionProgress('owner_property_1')).resolves.toEqual([
      expect.objectContaining({
        invitationId: 'invitation_1',
        progressStage: 'disclosure_decision',
        ownerActionRequired: true,
        latestResponseAction: 'express_interest',
      }),
    ]);
    expect(fetchMock.mock.calls[0][0]).toContain(
      '/owner-properties/owner_property_1/provider-connection-progress',
    );
  });

  it('creates an independently scoped guided-media upload without provider identifiers', async () => {
    const apiMedia = {
      media_id: 'owner_media_1', owner_user_id: 'owner_1', property_id: 'owner_property_1',
      brief_id: 'owner_brief_2', shot_type: 'front_yard', file_name: 'front.jpg',
      content_type: 'image/jpeg', upload_mode: 'local-placeholder',
      object_key: 'local/owner-intake/private/owner_property_1/front_yard/front.jpg',
      thumbnail_object_key: null, status: 'pending_upload', file_size_bytes: null,
      image_width_px: null, image_height_px: null, metadata_source: null,
      rejection_reason: null, replaces_media_id: null, replaced_by_media_id: null,
      display_url: null, thumbnail_url: null, persisted: true,
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([apiMedia]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        media: apiMedia,
        upload_url: 'local://private-upload',
        thumbnail_upload_url: null,
        thumbnail_content_type: null,
        thumbnail_max_dimension_px: null,
      }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        ...apiMedia,
        status: 'ready',
        file_size_bytes: 5,
        metadata_source: 'client_reported',
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...apiMedia, status: 'deleted' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchOwnerIntakeMedia('owner_property_1')).resolves.toEqual([
      expect.objectContaining({ mediaId: 'owner_media_1', shotType: 'front_yard' }),
    ]);
    const file = new File(['image'], 'front.jpg', { type: 'image/jpeg' });
    const upload = await createOwnerIntakeMediaUpload('owner_property_1', file, 'front_yard');
    expect(upload.media.objectKey).toContain('owner-intake');
    const createBody = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
    expect(createBody).toEqual({
      file_name: 'front.jpg',
      content_type: 'image/jpeg',
      shot_type: 'front_yard',
      replaces_media_id: null,
    });
    expect(createBody).not.toHaveProperty('job_id');
    expect(createBody).not.toHaveProperty('organization_id');
    await uploadOwnerIntakeMediaFile(upload, file);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await expect(completeOwnerIntakeMediaUpload(
      'owner_property_1',
      'owner_media_1',
      file,
    )).resolves.toEqual(expect.objectContaining({ status: 'ready', fileSizeBytes: 5 }));
    expect(JSON.parse((fetchMock.mock.calls[2][1] as RequestInit).body as string)).toEqual({
      file_size_bytes: file.size,
    });
    await expect(deleteOwnerIntakeMedia('owner_property_1', 'owner_media_1')).resolves.toEqual(
      expect.objectContaining({ status: 'deleted' }),
    );
  });
});
