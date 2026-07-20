import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('creates a service-ready customer account in one mobile workflow', async ({ page }) => {
  let submittedAccount: Record<string, unknown> | null = null;
  let accountCreateCount = 0;
  let archivedAccountId = '';
  await page.route('**/customer-accounts', async (route) => {
    if (route.request().method() === 'POST') {
      accountCreateCount += 1;
      submittedAccount = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        contentType: 'application/json',
        json: {
          account_id: `acct_mobile_smoke_${accountCreateCount}`,
          organization_id: submittedAccount.organization_id,
          customer_name: submittedAccount.customer_name,
          billing_model: submittedAccount.billing_model,
          payment_status: submittedAccount.payment_status,
          service_approval_status: submittedAccount.service_approval_status,
          contracted_services_per_period: submittedAccount.contracted_services_per_period,
          completed_services_this_period: 0,
          billing_notes: '',
          primary_contact_name: submittedAccount.primary_contact_name,
          contact_email: submittedAccount.contact_email,
          contact_phone: submittedAccount.contact_phone,
          email_notifications_enabled: submittedAccount.email_notifications_enabled,
          sms_notifications_enabled: submittedAccount.sms_notifications_enabled,
          quiet_hours_start: '',
          quiet_hours_end: '',
          persisted: true,
        },
      });
      return;
    }
    await route.fulfill({ contentType: 'application/json', json: [] });
  });
  await page.route('**/customer-accounts/*', async (route) => {
    if (route.request().method() === 'DELETE') {
      archivedAccountId = new URL(route.request().url()).pathname.split('/').pop() ?? '';
      await route.fulfill({ status: 204 });
      return;
    }
    await route.continue();
  });

  await page.goto('/');
  await page.locator('summary').filter({ hasText: 'Manager and office tools' }).click();
  const onboarding = page
    .getByRole('heading', { name: 'Customer accounts' })
    .locator('xpath=ancestor::section[1]');
  await onboarding.getByRole('button', { name: 'Add customer account' }).click();
  await onboarding.getByLabel('Customer or company name').fill('Mobile Smoke HOA');
  await onboarding.getByLabel('Primary contact').fill('Sam Lee');
  await onboarding.getByLabel('Contact email').fill('sam@example.com');
  await onboarding.getByLabel('Mobile phone').fill('+14805550123');
  await onboarding.getByLabel('Customer opted into email updates').check();
  await onboarding.getByRole('button', { name: 'Create account' }).click();

  await expect(onboarding.getByText('Mobile Smoke HOA account created.')).toBeVisible();
  await onboarding.getByLabel('Find customer account').fill('sam@example.com');
  await onboarding.getByRole('button', { name: /Needs setup/ }).click();
  await expect(onboarding.getByText('Mobile Smoke HOA', { exact: true })).toBeVisible();
  await onboarding.getByLabel('Find customer account').fill('missing customer');
  await expect(onboarding.getByText('No accounts match this search and onboarding filter.')).toBeVisible();
  await onboarding.getByLabel('Find customer account').fill('');
  await onboarding.getByRole('button', { name: 'Add customer account' }).click();
  await onboarding.getByLabel('Customer or company name').fill('Mobile Smoke HOA');
  await onboarding.getByLabel('Primary contact').fill('Another Contact');
  await onboarding.getByLabel('Contact email').fill('another@example.com');
  await onboarding.getByRole('button', { name: 'Create account' }).click();
  await expect(onboarding.getByText('Possible duplicate account')).toBeVisible();
  await onboarding.getByRole('button', { name: 'Review existing account' }).click();
  await expect(onboarding.getByLabel('Customer name')).toHaveValue('Mobile Smoke HOA');
  await onboarding.getByRole('button', { name: 'Cancel' }).click();
  await onboarding.getByRole('button', { name: 'Add customer account' }).click();
  await onboarding.getByLabel('Customer or company name').fill('Mobile Smoke HOA');
  await onboarding.getByLabel('Primary contact').fill('Separate Contact');
  await onboarding.getByLabel('Contact email').fill('separate@example.com');
  await onboarding.getByRole('button', { name: 'Create account' }).click();
  await onboarding.getByRole('button', { name: 'Create separate account' }).click();
  await expect.poll(() => accountCreateCount).toBe(2);
  await expect(onboarding.getByText('Mobile Smoke HOA account created.')).toBeVisible();
  await onboarding.getByRole('button', { name: 'Archive account' }).last().click();
  await expect(onboarding.getByText('The account leaves active onboarding')).toBeVisible();
  await onboarding.getByRole('button', { name: 'Confirm archive' }).click();
  await expect(onboarding.getByText(/account archived. Historical records remain available/)).toBeVisible();
  expect(archivedAccountId).toBe('acct_mobile_smoke_2');
  expect(submittedAccount).toMatchObject({
    customer_name: 'Mobile Smoke HOA',
    primary_contact_name: 'Separate Contact',
    contact_email: 'separate@example.com',
    contact_phone: null,
    email_notifications_enabled: false,
    sms_notifications_enabled: false,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('queues route progress during interruption and replays after recovery', async ({
  context,
  page,
  request,
}) => {
  await page.goto('/');
  const frontendUrl = new URL(page.url());
  const apiOrigin = `${frontendUrl.protocol}//${frontendUrl.hostname}:8080`;
  const dayPlanResponse = await request.get(`${apiOrigin}/crews/crew_1001/day-plan/today`);
  expect(dayPlanResponse.ok()).toBe(true);
  const dayPlan = await dayPlanResponse.json() as {
    id: string;
    stops: Array<{ id: string }>;
  };
  expect(dayPlan.stops.length).toBeGreaterThan(0);
  const resetResponse = await request.post(
    `${apiOrigin}/day-plans/${dayPlan.id}/stops/${dayPlan.stops[0].id}/status`,
    { data: { status: 'pending' } },
  );
  expect(resetResponse.ok()).toBe(true);
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('grover-field-offline');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('offline database reset was blocked'));
    });
  });
  const accessReady = page.waitForResponse(
    (response) => response.url().endsWith('/me/access') && response.ok(),
  );
  await page.reload();
  await accessReady;

  await expect(page.getByText('Crew day plan', { exact: true })).toBeVisible();
  await expect(page.locator('#today-route').getByText('Source: local API')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const storageProbe = await page.evaluate(async () => {
    const queue = await import('/src/domain/offlineMutationQueue.ts');
    try {
      const mutation = await queue.enqueueStopProgressMutation({
        organizationId: 'org_demo_landscaping',
        actorId: 'local-development-user',
        dayPlanId: 'smoke-probe',
        stopId: 'smoke-probe',
        status: 'pending',
      });
      await queue.removeOfflineMutation(mutation.id);
      return null;
    } catch (error) {
      return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    }
  });
  expect(storageProbe).toBeNull();

  await context.setOffline(true);
  await expect(page.getByText(/You are offline/)).toBeVisible();
  const routeAction = page.getByRole('button', { name: /Start stop|Finish stop/ }).first();
  await expect(routeAction).toBeEnabled();
  await routeAction.click();

  await expect.poll(async () => page.evaluate(async () =>
    new Promise<number>((resolve, reject) => {
      const openRequest = indexedDB.open('grover-field-offline', 3);
      openRequest.onerror = () => reject(openRequest.error);
      openRequest.onsuccess = () => {
        const database = openRequest.result;
        const transaction = database.transaction('mutations', 'readonly');
        const countRequest = transaction.objectStore('mutations').count();
        countRequest.onerror = () => reject(countRequest.error);
        countRequest.onsuccess = () => {
          database.close();
          resolve(countRequest.result);
        };
      };
    })
  ), { timeout: 15_000 }).toBe(1);
  await expect(page.getByText('1 offline change waiting to sync')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/1 pending · 0 retry failed · 0 conflicted/)).toBeVisible();
  await page.locator('summary').filter({ hasText: 'Route changes' }).click();
  await page.getByRole('button', { name: 'Request unplanned stop' }).click();
  await expect(page.getByText('1 route request is queued offline.')).toBeVisible({
    timeout: 15_000,
  });

  await context.setOffline(false);
  await expect(page.getByText('1 offline change waiting to sync')).toBeHidden({ timeout: 30_000 });
  await expect(page.getByText('1 route request is queued offline.')).toBeHidden({
    timeout: 30_000,
  });
  await expect(page.getByText('Progress: synced')).toBeVisible();
  await expect.poll(async () => {
    const response = await request.get(`${apiOrigin}/day-plans/${dayPlan.id}/amendments`);
    if (!response.ok()) return false;
    const amendments = await response.json() as Array<{ note?: string }>;
    return amendments.some((amendment) =>
      amendment.note === 'North Route Crew requested an unplanned stop for manager review.'
    );
  }).toBe(true);
});

test('restores persisted manager report filters after a mobile reload', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('grover.manager-completion-report-filters.v1'));
  await page.reload();

  await page.locator('summary').filter({ hasText: 'Manager and office tools' }).click();
  const reportQueue = page
    .getByRole('heading', { name: 'Completion review queue' })
    .locator('xpath=ancestor::section[1]');
  await expect(reportQueue).toBeVisible();
  await reportQueue.getByLabel('Customer').fill('Sample');
  await reportQueue.getByLabel('Readiness blocker').selectOption('route_stop');
  await reportQueue.getByRole('button', { name: 'Apply' }).click();
  await expect(reportQueue.getByText('2 persisted filters applied.')).toBeVisible();

  const restoredRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === '/completion-reports'
      && url.searchParams.get('customer') === 'Sample'
      && url.searchParams.get('readiness_blocker') === 'route_stop';
  });
  await page.reload();
  await restoredRequest;
  await page.locator('summary').filter({ hasText: 'Manager and office tools' }).click();

  await expect(reportQueue.getByLabel('Customer')).toHaveValue('Sample');
  await expect(reportQueue.getByLabel('Readiness blocker')).toHaveValue('route_stop');
  await expect(reportQueue.getByText('2 persisted filters applied.')).toBeVisible();
});

test('guards mobile dispatch hierarchy and exposes crew scope assignment', async ({
  page,
  request,
}) => {
  await page.goto('/');
  const frontendUrl = new URL(page.url());
  const apiOrigin = `${frontendUrl.protocol}//${frontendUrl.hostname}:8080`;
  await page.evaluate(() => {
    localStorage.removeItem(
      'grover.dispatch-hierarchy-filters.v1.org_demo_landscaping',
    );
  });
  await page.reload();
  const [crewsResponse, branchesResponse, territoriesResponse] = await Promise.all([
    request.get(`${apiOrigin}/organizations/org_demo_landscaping/crews`),
    request.get(`${apiOrigin}/organization-branches`),
    request.get(`${apiOrigin}/service-territories`),
  ]);
  expect(crewsResponse.ok()).toBe(true);
  expect(branchesResponse.ok()).toBe(true);
  expect(territoriesResponse.ok()).toBe(true);
  const crews = await crewsResponse.json() as Array<{
    id: string;
    branch_id: string;
    territory_id: string;
  }>;
  const branches = await branchesResponse.json() as Array<{ id: string; name: string }>;
  const territories = await territoriesResponse.json() as Array<{
    id: string;
    name: string;
    status: string;
  }>;
  const crew = crews.find((item) => item.id === 'crew_1001');
  expect(crew).toBeTruthy();
  const branch = branches.find((item) => item.id === crew?.branch_id);
  const territory = territories.find((item) => item.id === crew?.territory_id);
  expect(branch).toBeTruthy();
  expect(territory).toBeTruthy();

  await page.locator('summary').filter({ hasText: 'Manager and office tools' }).click();
  const crewAdministration = page
    .getByRole('heading', { name: 'Crew administration' })
    .locator('xpath=ancestor::div[1]');
  await expect(crewAdministration.getByLabel('Branch')).toHaveValue(crew!.branch_id);
  await expect(crewAdministration.getByLabel('Territory')).toHaveValue(crew!.territory_id);

  const hierarchy = page
    .getByRole('heading', { name: 'Branches and territories' })
    .locator('xpath=ancestor::section[1]');
  await expect(hierarchy.locator('p').filter({ hasText: branch!.name }).last()).toBeVisible();
  const territoryRow = hierarchy
    .locator('p')
    .filter({ hasText: territory!.name })
    .last()
    .locator('xpath=parent::div/parent::div');
  await territoryRow.getByRole('button', { name: 'Deactivate' }).click();
  await territoryRow.getByRole('button', { name: 'Confirm inactive' }).click();
  await expect(hierarchy.getByText('Move active crews out of this territory first.')).toBeVisible();

  const hierarchyConflict = await request.put(
    `${apiOrigin}/organizations/org_demo_landscaping/crews/crew_1001`,
    {
      data: {
        name: 'North Route Crew',
        status: 'active',
        branch_id: crew!.branch_id,
        territory_id: 'territory_outside_selected_branch',
      },
    },
  );
  expect(hierarchyConflict.status()).toBe(409);
  const territoryAfter = await request.get(`${apiOrigin}/service-territories`);
  const currentTerritories = await territoryAfter.json() as Array<{ id: string; status: string }>;
  expect(currentTerritories.find((item) => item.id === territory!.id)?.status).toBe('active');

  await hierarchy.getByLabel('Search hierarchy').fill(branch!.name);
  await hierarchy.getByLabel('Lifecycle status').selectOption('active');
  await expect(hierarchy.getByText(
    `Showing 1 of ${branches.length} branches and 1 of ${territories.length} territories.`,
  )).toBeVisible();
  await page.reload();
  await page.locator('summary').filter({ hasText: 'Manager and office tools' }).click();
  await expect(hierarchy.getByLabel('Search hierarchy')).toHaveValue(branch!.name);
  await expect(hierarchy.getByLabel('Lifecycle status')).toHaveValue('active');
  await hierarchy.getByRole('button', { name: 'Clear hierarchy filters' }).click();
  await expect(hierarchy.getByLabel('Search hierarchy')).toHaveValue('');
  await expect(hierarchy.getByLabel('Lifecycle status')).toHaveValue('all');
  await expect(hierarchy.getByRole('button', { name: 'Clear hierarchy filters' })).toBeHidden();
  const teamActivity = page
    .getByRole('heading', { name: 'Recent access activity' })
    .locator('xpath=ancestor::section[1]');
  await teamActivity.getByRole('button', { name: /Cross-branch moves/ }).click();
  await teamActivity.getByLabel('Sort').selectOption('oldest');
  await teamActivity.getByLabel('Find move source').fill('Main Branch');
  await teamActivity.getByLabel('Find move destination').fill('Primary Territory');
  await expect(teamActivity.getByLabel('Event')).toHaveValue('crew_hierarchy_updated');
  await expect(teamActivity.getByLabel('Crew move scope')).toHaveValue('cross_branch');
  await expect(teamActivity.getByLabel('Sort')).toHaveValue('oldest');
  await expect(teamActivity.getByLabel('Find move source')).toHaveValue('Main Branch');
  await expect(teamActivity.getByLabel('Find move destination')).toHaveValue('Primary Territory');
  await page.reload();
  await page.locator('summary').filter({ hasText: 'Manager and office tools' }).click();
  await expect(teamActivity.getByLabel('Event')).toHaveValue('crew_hierarchy_updated');
  await expect(teamActivity.getByLabel('Crew move scope')).toHaveValue('cross_branch');
  await expect(teamActivity.getByLabel('Sort')).toHaveValue('oldest');
  await expect(teamActivity.getByLabel('Find move source')).toHaveValue('Main Branch');
  await expect(teamActivity.getByLabel('Find move destination')).toHaveValue('Primary Territory');
  await teamActivity.getByRole('button', {
    name: 'Remove source filter Main Branch',
  }).click();
  await expect(teamActivity.getByLabel('Find move source')).toHaveValue('');
  await teamActivity.getByRole('button', { name: 'Reset review view' }).click();
  await expect(teamActivity.getByLabel('Event')).toHaveValue('all');
  await expect(teamActivity.getByLabel('Crew move scope')).toHaveValue('all');
  await expect(teamActivity.getByLabel('Sort')).toHaveValue('newest');
  await expect(teamActivity.getByLabel('Find move source')).toHaveValue('');
  await expect(teamActivity.getByLabel('Find move destination')).toHaveValue('');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('prepares, resets, and confirms an unstaffed territory crew move', async ({
  page,
  request,
}) => {
  const frontendUrl = new URL(process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173');
  const apiOrigin = `${frontendUrl.protocol}//${frontendUrl.hostname}:8080`;
  const [crewsResponse, branchesResponse] = await Promise.all([
    request.get(`${apiOrigin}/organizations/org_demo_landscaping/crews`),
    request.get(`${apiOrigin}/organization-branches`),
  ]);
  expect(crewsResponse.ok()).toBe(true);
  expect(branchesResponse.ok()).toBe(true);
  const originalCrews = await crewsResponse.json() as Array<{
    id: string;
    name: string;
    organization_id: string;
    branch_id: string;
    territory_id: string;
    status: string;
    daily_stop_capacity: number;
    lead_membership_id: string | null;
    persisted: boolean;
  }>;
  const branches = await branchesResponse.json() as Array<{
    id: string;
    organization_id: string;
    status: string;
  }>;
  const originalCrew = originalCrews.find((crew) => crew.id === 'crew_1001');
  const branch = branches.find((item) => (
    item.id === originalCrew?.branch_id
    && item.organization_id === 'org_demo_landscaping'
    && item.status === 'active'
  ));
  expect(originalCrew).toBeTruthy();
  expect(branch).toBeTruthy();
  const territoryId = 'territory_e2e_unstaffed_overlay';
  const territoryName = 'Mobile Staffing Overlay';
  let crewMoved = false;
  let omitLatestFromFocusedReview = false;
  let failAuditRecovery = false;

  await page.route('**/service-territories', async (route) => {
    const response = await route.fetch();
    const territories = await response.json() as unknown[];
    await route.fulfill({
      response,
      json: [
        ...territories,
        {
          id: territoryId,
          organization_id: 'org_demo_landscaping',
          branch_id: branch!.id,
          name: territoryName,
          status: 'active',
        },
      ],
    });
  });
  await page.route('**/organizations/org_demo_landscaping/crews', async (route) => {
    await route.fulfill({
      json: originalCrews.map((crew) => (
        crewMoved && crew.id === originalCrew!.id
          ? { ...crew, branch_id: branch!.id, territory_id: territoryId }
          : crew
      )),
    });
  });
  await page.route(
    `**/organizations/org_demo_landscaping/crews/${originalCrew!.id}`,
    async (route) => {
      const body = route.request().postDataJSON() as {
        branch_id: string;
        territory_id: string;
      };
      expect(body.branch_id).toBe(branch!.id);
      expect(body.territory_id).toBe(territoryId);
      crewMoved = true;
      await route.fulfill({
        json: {
          ...originalCrew,
          ...body,
          persisted: true,
        },
      });
    },
  );
  await page.route(
    '**/organizations/org_demo_landscaping/team-activity*',
    async (route) => {
      const requestUrl = new URL(route.request().url());
      const isFocusedCrewReview = requestUrl.searchParams.get('target') === originalCrew!.id;
      const isOlderFocusedPage = isFocusedCrewReview
        && requestUrl.searchParams.has('before');
      const requestedAuditId = requestUrl.searchParams.get('audit_id');
      const auditedMove = {
        id: 'audit_e2e_crew_hierarchy_move',
        actor_user_id: 'local-dev-user',
        actor_label: 'Local Owner',
        organization_id: 'org_demo_landscaping',
        event_kind: 'crew_hierarchy_updated',
        target_id: originalCrew!.id,
        target_label: originalCrew!.name,
        source_branch_label: 'Main Branch',
        source_territory_label: 'Primary Territory',
        destination_branch_label: 'Main Branch',
        destination_territory_label: 'Primary Territory',
        destination_branch_id: branch!.id,
        destination_territory_id: originalCrew!.territory_id,
        cross_branch_move: false,
        occurred_at: '2026-07-20T03:00:00Z',
      };
      const focusedCrewMoves = [
        {
          ...auditedMove,
          id: 'audit_e2e_latest_crew_hierarchy_move',
          destination_territory_label: territoryName,
          destination_territory_id: territoryId,
          occurred_at: '2026-07-20T04:00:00Z',
        },
        ...Array.from({ length: 24 }, (_, index) => ({
          ...auditedMove,
          id: `audit_e2e_older_crew_hierarchy_move_${index + 1}`,
          occurred_at: `2026-07-19T${String(23 - index).padStart(2, '0')}:00:00Z`,
        })),
      ];
      await route.fulfill({
        json: crewMoved
          ? requestedAuditId === 'audit_e2e_latest_crew_hierarchy_move'
            ? failAuditRecovery ? [] : [focusedCrewMoves[0]]
            : isOlderFocusedPage ? [
            focusedCrewMoves[focusedCrewMoves.length - 1],
            {
              ...auditedMove,
              id: 'audit_e2e_oldest_unique_crew_hierarchy_move',
              occurred_at: '2026-07-18T23:00:00Z',
            },
          ] : isFocusedCrewReview
            ? omitLatestFromFocusedReview ? focusedCrewMoves.slice(1) : focusedCrewMoves
            : [auditedMove]
          : [],
      });
    },
  );

  await page.goto('/');
  await page.locator('summary').filter({ hasText: 'Manager and office tools' }).click();
  const hierarchy = page
    .getByRole('heading', { name: 'Branches and territories' })
    .locator('xpath=ancestor::section[1]');
  const territoryRow = hierarchy
    .locator('p')
    .filter({ hasText: territoryName })
    .locator('xpath=ancestor::div[contains(@class, \"rounded-lg\")][1]');
  const crewAdministration = page
    .getByRole('heading', { name: 'Crew administration' })
    .locator('xpath=ancestor::div[1]');

  await territoryRow.getByRole('button', { name: 'Staff territory' }).click();
  await expect(crewAdministration.getByLabel('Territory')).toHaveValue(territoryId);
  await expect(crewAdministration.getByText('Prepared hierarchy destination')).toBeVisible();
  await crewAdministration.getByRole('button', { name: 'Reset destination' }).click();
  await expect(crewAdministration.getByLabel('Territory')).toHaveValue(
    originalCrew!.territory_id,
  );
  await expect(crewAdministration.getByText('Prepared hierarchy destination')).toBeHidden();

  await territoryRow.getByText('Choose an active crew').click();
  await territoryRow.getByRole('button', { name: new RegExp(originalCrew!.name) }).click();
  await expect(crewAdministration.getByLabel('Territory')).toHaveValue(territoryId);
  await crewAdministration.getByRole('button', { name: 'Save crew profile' }).click();
  await expect(crewAdministration.getByText(
    new RegExp(`${originalCrew!.name} moved from .* to .*${territoryName}`),
  )).toBeVisible();
  await crewAdministration.getByRole('button', { name: 'Return to hierarchy review' }).click();
  await expect(hierarchy).toBeFocused();
  const teamActivity = page
    .getByRole('heading', { name: 'Recent access activity' })
    .locator('xpath=ancestor::section[1]');
  await teamActivity.getByLabel('Find actor').fill('Local Owner');
  await teamActivity.getByLabel('Find audit ID').fill('audit_e2e_crew_hierarchy_move');
  await teamActivity.getByLabel('Find move source').fill('Main Branch');
  await teamActivity.getByLabel('Crew move scope').selectOption('within_branch');
  await teamActivity.getByLabel('Sort').selectOption('oldest');
  await teamActivity.getByRole('button', { name: 'Open affected crew' }).click();
  await expect(crewAdministration).toBeFocused();
  await expect(crewAdministration.getByRole('combobox').first()).toHaveValue(originalCrew!.id);
  await expect(crewAdministration.getByText(
    'Within-branch audited move: Main Branch · Primary Territory → Main Branch · Primary Territory',
  )).toBeVisible();
  await expect(crewAdministration.getByText(
    'Current crew assignment differs. This crew moved again after the audited event.',
  )).toBeVisible();
  await expect(crewAdministration.getByText(
    `Current assignment: Main Branch · ${territoryName}`,
  )).toBeVisible();
  await expect(crewAdministration.getByText(/Audit audit_e2e_crew_hierarchy_move/)).toBeVisible();
  await crewAdministration.getByRole('button', { name: 'Copy audit event ID' }).click();
  await expect(crewAdministration.getByText(
    /Audit event ID copied|Copy is unavailable/,
  )).toBeVisible();
  await crewAdministration.getByRole('button', { name: 'Copy move support summary' }).click();
  await expect(crewAdministration.getByText(
    /Crew move support summary copied|Summary copy is unavailable/,
  )).toBeVisible();
  await crewAdministration.getByRole('button', { name: 'Share move support summary' }).click();
  await expect(crewAdministration.getByText(
    /Crew move support summary (shared|copied)|Summary copy is unavailable|sharing canceled/,
  )).toBeVisible();
  const supportDownload = page.waitForEvent('download');
  await crewAdministration.getByRole('button', {
    name: 'Download move support summary',
  }).click();
  const downloadedSummary = await supportDownload;
  expect(downloadedSummary.suggestedFilename()).toBe(
    'crew-move-audit-audit_e2e_crew_hierarchy_move.txt',
  );
  const downloadedSummaryPath = await downloadedSummary.path();
  expect(downloadedSummaryPath).not.toBeNull();
  expect(await readFile(downloadedSummaryPath!, 'utf8')).toContain(
    `Current assignment: Main Branch · ${territoryName}`,
  );
  await expect(crewAdministration.getByText(
    'Crew move support summary downloaded.',
  )).toBeVisible();
  await crewAdministration.getByRole('button', { name: 'Find latest crew move' }).click();
  await expect(teamActivity).toBeFocused();
  await expect(teamActivity.getByLabel('Event')).toHaveValue('crew_hierarchy_updated');
  await expect(teamActivity.getByLabel('Find affected item')).toHaveValue(originalCrew!.id);
  await expect(teamActivity.getByText('Focused latest-move review')).toBeVisible();
  await expect(teamActivity.getByRole('status').filter({
    hasText: `Crew ${originalCrew!.id} remains selected`,
  })).toBeVisible();
  await expect(teamActivity.getByText('25 matching crew moves loaded.')).toBeVisible();
  await expect(teamActivity.getByText(
    'Older matching crew moves may still be available.',
  )).toBeVisible();
  await teamActivity.getByRole('button', { name: 'Load older activity' }).click();
  await expect(teamActivity.getByText('All matching crew moves are loaded.')).toBeVisible();
  await expect(teamActivity.getByText('26 matching crew moves loaded.')).toBeVisible();
  await expect(teamActivity.locator('ol > li')).toHaveCount(26);
  await expect(teamActivity.locator('ol > li[aria-current="true"]')).toHaveCount(1);
  await expect(teamActivity.locator('ol > li[aria-current="true"]'))
    .toContainText('audit_e2e_latest_crew_hierarchy_move');
  await teamActivity.getByRole('button', { name: 'Return to latest crew move' }).click();
  await expect(teamActivity.locator('ol > li[aria-current="true"]')).toBeFocused();
  await expect(teamActivity.getByText('Latest crew move', { exact: true })).toBeVisible();
  await expect(teamActivity.getByText('Destination matches current assignment')).toBeVisible();
  await teamActivity.getByText('Latest crew move', { exact: true })
    .locator('xpath=ancestor::li[1]')
    .getByRole('button', { name: 'Open affected crew' })
    .click();
  await crewAdministration.getByRole('button', { name: 'Return to owner activity' }).click();
  await expect(teamActivity.locator('ol > li[aria-current="true"]')).toBeFocused();
  await expect(teamActivity.getByText(
    'Returned to audit event audit_e2e_latest_crew_hierarchy_move.',
  )).toBeVisible();
  await expect(teamActivity.locator('ol > li[aria-current="true"]'))
    .toContainText('Restored after inspection');
  await teamActivity.getByRole('button', { name: 'Dismiss activity review message' }).click();
  await expect(teamActivity.getByText(
    'Returned to audit event audit_e2e_latest_crew_hierarchy_move.',
  )).toBeHidden();
  await expect(teamActivity.locator('ol > li[aria-current="true"]')).toBeFocused();
  await expect(teamActivity.locator('ol > li[aria-current="true"]'))
    .toContainText('Restored after inspection');
  await teamActivity.getByRole('button', { name: 'Refresh' }).click();
  await expect(teamActivity.getByText('25 matching crew moves loaded.')).toBeVisible();
  await expect(teamActivity.locator('ol > li[aria-current="true"]'))
    .toContainText('Restored after inspection');
  await teamActivity.getByRole('button', { name: 'Load older activity' }).click();
  await expect(teamActivity.getByText('26 matching crew moves loaded.')).toBeVisible();
  await expect(teamActivity.locator('ol > li[aria-current="true"]'))
    .toContainText('Restored after inspection');
  omitLatestFromFocusedReview = true;
  await teamActivity.getByRole('button', { name: 'Refresh' }).click();
  await expect(teamActivity.getByText('Restored after inspection')).toBeHidden();
  await expect(teamActivity.getByText(
    'Restored audit event audit_e2e_latest_crew_hierarchy_move is no longer in the loaded results.',
  )).toBeVisible();
  await teamActivity.getByRole('button', { name: 'Find audit event' }).click();
  await expect(teamActivity.getByLabel('Find audit ID')).toHaveValue(
    'audit_e2e_latest_crew_hierarchy_move',
  );
  await expect(teamActivity.locator('ol > li')).toHaveCount(1);
  await expect(teamActivity.locator('ol > li').first())
    .toContainText('audit_e2e_latest_crew_hierarchy_move');
  await expect(teamActivity.getByText(
    'Audit event audit_e2e_latest_crew_hierarchy_move loaded by immutable ID.',
  )).toBeVisible();
  await expect(teamActivity.locator('ol > li').first())
    .toContainText('Restored after inspection');
  failAuditRecovery = true;
  await teamActivity.getByRole('button', { name: 'Refresh' }).click();
  await teamActivity.getByRole('button', { name: 'Find audit event' }).click();
  await expect(teamActivity.locator('ol > li')).toHaveCount(0);
  await expect(teamActivity.getByText(
    'Audit event audit_e2e_latest_crew_hierarchy_move could not be loaded. Confirm owner access or retry the immutable-ID search.',
  )).toBeVisible();
  await expect(teamActivity.getByRole('button', { name: 'Find audit event' })).toBeVisible();
  failAuditRecovery = false;
  await teamActivity.getByRole('button', { name: 'Find audit event' }).click();
  await expect(teamActivity.getByText(
    'Audit event audit_e2e_latest_crew_hierarchy_move loaded by immutable ID.',
  )).toBeVisible();
  await expect(teamActivity.locator('ol > li')).toHaveCount(1);
  omitLatestFromFocusedReview = false;
  await teamActivity.getByRole('button', { name: 'Return to full crew history' }).click();
  await expect(teamActivity.getByLabel('Find audit ID')).toHaveValue('');
  await expect(teamActivity.locator('ol > li')).toHaveCount(25);
  await expect(teamActivity.getByText('Focused latest-move review')).toBeVisible();
  await expect(teamActivity.getByText('Focused latest-move review')).toBeVisible();
  await expect(teamActivity.getByText('Latest crew move', { exact: true })).toBeVisible();
  await expect(teamActivity.getByLabel('Find affected item')).toHaveValue(originalCrew!.id);
  await teamActivity.getByRole('button', { name: 'Exit focused review' }).click();
  await expect(teamActivity.getByText('Focused latest-move review')).toBeHidden();
  await expect(teamActivity.getByText('Restored after inspection')).toBeHidden();
  await expect(teamActivity.getByLabel('Find affected item')).toHaveValue('');
  await expect(teamActivity.getByLabel('Event')).toHaveValue('all');
  await expect(teamActivity.getByLabel('Find actor')).toHaveValue('Local Owner');
  await expect(teamActivity.getByLabel('Find audit ID')).toHaveValue(
    'audit_e2e_crew_hierarchy_move',
  );
  await expect(teamActivity.getByLabel('Find move source')).toHaveValue('Main Branch');
  await expect(teamActivity.getByLabel('Crew move scope')).toHaveValue('within_branch');
  await expect(teamActivity.getByLabel('Sort')).toHaveValue('oldest');
  await expect(teamActivity.getByText(/4 active filters/)).toBeVisible();
  await expect(teamActivity.getByText(/4 active filters · oldest first/)).toBeVisible();
  await expect(teamActivity.getByText('Your prior owner activity review was restored.'))
    .toBeVisible();
  await teamActivity.getByRole('button', { name: 'Use newest-first ordering' }).click();
  await expect(teamActivity.getByLabel('Sort')).toHaveValue('newest');
  await expect(teamActivity.getByText(/4 active filters · oldest first/)).toBeHidden();
  await expect(teamActivity.getByText(/4 active filters/)).toBeVisible();
  await teamActivity.getByRole('button', { name: 'Dismiss activity review message' }).click();
  await expect(teamActivity.getByText('Your prior owner activity review was restored.'))
    .toBeHidden();
  await expect(teamActivity.getByLabel('Find move source')).toHaveValue('Main Branch');
  await expect(teamActivity.getByLabel('Crew move scope')).toHaveValue('within_branch');
  await expect(teamActivity.getByLabel('Sort')).toHaveValue('newest');
  await expect.poll(() => page.evaluate(() => (
    window.localStorage.getItem(
      'grover.team-activity-review-filters.v1.org_demo_landscaping',
    )
  ))).toContain('"sourceQuery":"Main Branch"');
  await page.reload();
  await page.locator('summary').filter({ hasText: 'Manager and office tools' }).click();
  const reloadedTeamActivity = page
    .getByRole('heading', { name: 'Recent access activity' })
    .locator('xpath=ancestor::section[1]');
  await expect(reloadedTeamActivity.getByLabel('Find move source')).toHaveValue('Main Branch');
  await expect(reloadedTeamActivity.getByLabel('Crew move scope')).toHaveValue('within_branch');
  await expect(reloadedTeamActivity.getByLabel('Sort')).toHaveValue('newest');
  await expect(reloadedTeamActivity.getByLabel('Find actor')).toHaveValue('');
  await expect(reloadedTeamActivity.getByLabel('Find audit ID')).toHaveValue('');
  await expect(reloadedTeamActivity.getByText(
    'Restored 2 saved owner activity review settings for this organization.',
  )).toBeVisible();
  await reloadedTeamActivity.getByRole('button', {
    name: 'Dismiss activity review message',
  }).click();
  await expect(reloadedTeamActivity.getByText(
    'Restored 2 saved owner activity review settings for this organization.',
  )).toBeHidden();
  await expect(reloadedTeamActivity.getByLabel('Find move source')).toHaveValue('Main Branch');
  await expect(reloadedTeamActivity.getByLabel('Crew move scope')).toHaveValue('within_branch');
  await expect(reloadedTeamActivity.getByLabel('Sort')).toHaveValue('newest');
  await page.reload();
  await page.locator('summary').filter({ hasText: 'Manager and office tools' }).click();
  const savedReview = page
    .getByRole('heading', { name: 'Recent access activity' })
    .locator('xpath=ancestor::section[1]');
  await savedReview.getByRole('button', { name: 'Clear saved review settings' }).click();
  await expect(savedReview.getByLabel('Find move source')).toHaveValue('');
  await expect(savedReview.getByLabel('Crew move scope')).toHaveValue('all');
  await expect(savedReview.getByLabel('Sort')).toHaveValue('newest');
  await savedReview.getByRole('button', { name: 'Undo saved review clear' }).click();
  await expect(savedReview.getByLabel('Find move source')).toHaveValue('Main Branch');
  await expect(savedReview.getByLabel('Crew move scope')).toHaveValue('within_branch');
  await expect(savedReview.getByLabel('Sort')).toHaveValue('newest');
  await expect.poll(() => page.evaluate(() => (
    window.localStorage.getItem(
      'grover.team-activity-review-filters.v1.org_demo_landscaping',
    )
  ))).toContain('"sourceQuery":"Main Branch"');
  await page.reload();
  await page.locator('summary').filter({ hasText: 'Manager and office tools' }).click();
  const undoneReview = page
    .getByRole('heading', { name: 'Recent access activity' })
    .locator('xpath=ancestor::section[1]');
  await expect(undoneReview.getByLabel('Find move source')).toHaveValue('Main Branch');
  await expect(undoneReview.getByLabel('Crew move scope')).toHaveValue('within_branch');
  await expect(undoneReview.getByText(
    'Restored 2 saved owner activity review settings for this organization.',
  )).toBeVisible();
  await expect(undoneReview.getByRole('button', { name: 'Undo saved review clear' }))
    .toBeHidden();
  await undoneReview.getByRole('button', { name: 'Clear saved review settings' }).click();
  await expect(undoneReview.getByLabel('Find move source')).toHaveValue('');
  await expect(undoneReview.getByLabel('Crew move scope')).toHaveValue('all');
  await expect.poll(() => page.evaluate(() => (
    window.localStorage.getItem(
      'grover.team-activity-review-filters.v1.org_demo_landscaping',
    )
  ))).toContain('"sourceQuery":""');
  await page.reload();
  await page.locator('summary').filter({ hasText: 'Manager and office tools' }).click();
  const clearedReview = page
    .getByRole('heading', { name: 'Recent access activity' })
    .locator('xpath=ancestor::section[1]');
  await expect(clearedReview.getByLabel('Find move source')).toHaveValue('');
  await expect(clearedReview.getByLabel('Crew move scope')).toHaveValue('all');
  await expect(clearedReview.getByText(/saved owner activity review setting/)).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
});

test('moves scheduled work with notification follow-up from mobile dispatch', async ({
  page,
  request,
}) => {
  await page.goto('/');
  const frontendUrl = new URL(page.url());
  const apiOrigin = `${frontendUrl.protocol}//${frontendUrl.hostname}:8080`;
  const baseline = {
    crew_id: 'crew_1001',
    scheduled_date: '2026-06-16',
    customer_notification_required: false,
  };
  const resetResponse = await request.put(
    `${apiOrigin}/jobs/job_1003/dispatch-assignment`,
    { data: baseline },
  );
  expect(resetResponse.ok()).toBe(true);

  try {
    await page.reload();
    await page.locator('summary').filter({ hasText: 'Manager and office tools' }).click();
    const dispatch = page
      .getByRole('heading', { name: 'Day workload' })
      .locator('xpath=ancestor::section[1]');
    const jobRow = dispatch.locator('div').filter({
      has: page.getByRole('button', { name: 'Route Planning Demo Customer' }),
    }).last();
    await jobRow.getByRole('button', { name: 'Move' }).click();
    await dispatch.getByLabel('Service date').last().fill('2026-06-17');
    await dispatch.getByLabel('Customer schedule notification').selectOption('required');
    await expect(dispatch.getByText(/Customer continuity:/)).toBeVisible();
    await dispatch.getByRole('button', { name: 'Save move' }).click();
    await expect(dispatch.getByText('Dispatch assignment saved and audited.')).toBeVisible();

    await expect.poll(async () => {
      const response = await request.get(`${apiOrigin}/jobs/job_1003`);
      if (!response.ok()) return false;
      const job = await response.json() as { scheduled_date: string };
      return job.scheduled_date === '2026-06-17';
    }).toBe(true);

    await page.reload();
    await page.locator('summary').filter({ hasText: 'Manager and office tools' }).click();
    await expect(page.getByText('Scheduled job moved').first()).toBeVisible();
    await expect(page.getByText(/Notify the customer about the changed service schedule/).first()).toBeVisible();
    await page.getByRole('button', { name: 'Mark customer notified' }).first().click();
    await expect(page.getByText('Dispatch customer notified').first()).toBeVisible();
    await expect(page.getByText(/Customer contacted by phone/).first()).toBeVisible();
  } finally {
    await request.put(
      `${apiOrigin}/jobs/job_1003/dispatch-assignment`,
      { data: baseline },
    );
  }
});
