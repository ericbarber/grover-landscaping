import { expect, test } from '@playwright/test';

const visitReference = 'customer_visit_0123456789abcdef0123456789abcdef';
const recommendationReference = 'customer_recommendation_0123456789abcdef0123456789abcdef';

const currentPublication = {
  proposal_version: 2,
  customer_safe_reason: 'The hedge is blocking the front walkway.',
  currency_code: 'USD',
  line_items: [{
    service_name: 'Front hedge trim',
    service_description: 'Trim the hedge clear of the walkway and remove clippings.',
    quantity: 2,
    unit_price_cents: 4500,
  }],
  total_cents: 9000,
  published_at_epoch_seconds: 1_787_760_000,
  expires_at_epoch_seconds: 1_800_604_800,
};

test('yard owner reviews version history and approves the exact recommendation on mobile', async ({ page }) => {
  let lifecycleStatus = 'pending';
  let decisionBody: Record<string, unknown> | null = null;

  await page.addInitScript(() => {
    window.sessionStorage.setItem('grover.local-reviewer-id', 'property-owner');
  });
  await page.route('**/auth/config', (route) => route.fulfill({
    contentType: 'application/json',
    json: {
      mode: 'local_review',
      issuer_url: null,
      client_id: null,
      login_domain: null,
      local_reviewers: [{
        reviewer_id: 'property-owner',
        user_id: 'local-review-property-owner',
        display_name: 'Jamie — Property Owner',
        verified_email: 'property.owner.local@example.test',
        roles: ['PropertyOwner'],
      }],
    },
  }));
  await page.route('**/me/access', (route) => route.fulfill({
    contentType: 'application/json',
    json: {
      user_id: 'local-review-property-owner',
      username: 'Jamie — Property Owner',
      verified_email: 'property.owner.local@example.test',
      claim_roles: ['PropertyOwner'],
      memberships: [{
        id: 'membership-property-owner',
        organization_id: 'org_demo_landscaping',
        organization_name: 'Grover Demo Landscaping',
        organization_type: 'yard_care_company',
        user_id: 'local-review-property-owner',
        display_name: 'Jamie — Property Owner',
        role: 'PropertyOwner',
        status: 'active',
        scope_type: 'customer_account',
        scope_id: 'account_1',
      }],
    },
  }));
  await page.route('**/customer-portal/visits', (route) => route.fulfill({
    contentType: 'application/json',
    json: {
      properties: [{
        organization_id: 'org_demo_landscaping',
        account_id: 'account_1',
        property_id: 'property_1',
        property_display_name: 'Home',
      }],
      visits: [{
        organization_id: 'org_demo_landscaping',
        account_id: 'account_1',
        property_id: 'property_1',
        customer_visit_reference: visitReference,
        service_date: '2026-08-30',
        window_start_epoch_seconds: 1_788_099_600,
        window_end_epoch_seconds: 1_788_106_800,
        time_zone: 'America/Phoenix',
        service_title: 'Weekly yard care',
        service_scope: ['Mow and edge turf'],
        status: 'confirmed',
        preparation_message: 'Please unlock the side gate.',
        next_update_message: 'Your provider will share an arrival update here.',
        delivered_proof_available: false,
      }],
    },
  }));
  await page.route('**/customer-portal/visits/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.endsWith(`/recommendations/${recommendationReference}`)) {
      if (request.method() === 'POST') {
        decisionBody = request.postDataJSON() as Record<string, unknown>;
        lifecycleStatus = 'approved';
        return route.fulfill({
          contentType: 'application/json',
          json: {
            customer_recommendation_reference: recommendationReference,
            proposal_version: 2,
            action: 'approve',
            lifecycle_status: 'approved',
            decided_at_epoch_seconds: 1_800_000_100,
            replayed: false,
          },
        });
      }
      return route.fulfill({
        contentType: 'application/json',
        json: {
          customer_visit_reference: visitReference,
          customer_recommendation_reference: recommendationReference,
          current_version: 2,
          lifecycle_status: lifecycleStatus,
          versions: [{
            ...currentPublication,
            proposal_version: 1,
            total_cents: 7500,
          }, currentPublication],
        },
      });
    }
    if (path.endsWith('/recommendations')) {
      return route.fulfill({
        contentType: 'application/json',
        json: {
          customer_visit_reference: visitReference,
          recommendations: [{
            customer_recommendation_reference: recommendationReference,
            current_version: 2,
            lifecycle_status: lifecycleStatus,
            current_publication: currentPublication,
          }],
        },
      });
    }
    return route.fulfill({
      contentType: 'application/json',
      json: { customer_visit_reference: visitReference, current_version: 0, messages: [] },
    });
  });

  await page.goto('/app');

  await page.getByRole('navigation', { name: 'Mobile workspace' })
    .getByRole('button', { name: 'My yard', exact: true }).click();
  const portal = page.locator('#customer-workspace');
  await expect(portal.getByRole('heading', { name: 'Welcome back, Jamie — Property Owner' })).toBeVisible();
  await expect(portal.getByRole('heading', { name: 'Front hedge trim' })).toBeVisible();
  await expect(portal.getByText('The hedge is blocking the front walkway.')).toBeVisible();
  await expect(portal.getByText('$90.00', { exact: true }).last()).toBeVisible();
  await expect(portal.getByText('Decision needed')).toBeVisible();

  await portal.getByRole('button', { name: 'View 2 published versions' }).click();
  await expect(portal.getByRole('heading', { name: 'Published version history' })).toBeVisible();
  await expect(portal.getByText('$75.00')).toBeVisible();

  await portal.getByRole('button', { name: 'Approve', exact: true }).click();
  await portal.getByRole('checkbox').check();
  await expect(portal.getByText(/does not schedule recurring work, create an invoice, or charge/)).toBeVisible();
  await portal.getByRole('button', { name: 'Confirm approval' }).click();

  await expect(portal.getByText('Recommendation approved.', { exact: true })).toBeVisible();
  await expect(portal.getByText('Approved', { exact: true })).toBeVisible();
  expect(decisionBody).toMatchObject({
    expected_proposal_version: 2,
    action: 'approve',
    affirmation_text_version: 'customer_recommendation_approval_v1',
  });
  expect(String(decisionBody?.idempotency_key)).toMatch(/^customer-recommendation-/);
  expect(decisionBody).not.toHaveProperty('customer_safe_note');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
