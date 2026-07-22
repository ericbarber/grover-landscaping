import { describe, expect, it } from 'vitest';
import { operationalExceptionsPath } from './operationalExceptionsClient';

describe('operational exceptions client', () => {
  it('builds bounded manager queue filters', () => {
    expect(operationalExceptionsPath({
      organizationId: 'org/demo', category: 'customer_escalation',
      priority: 'critical', status: 'in_progress', limit: 100,
    })).toBe('/operational-exceptions?organization_id=org%2Fdemo&category=customer_escalation&priority=critical&status=in_progress&limit=100');
  });
});
