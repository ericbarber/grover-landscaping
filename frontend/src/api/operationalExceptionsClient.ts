import { API_BASE_URL } from './baseUrl';
import { authenticatedFetch } from './authenticatedFetch';
import { apiRequestError } from './apiError';

export type OperationalExceptionCategory = 'delay' | 'staffing' | 'access' | 'weather' | 'equipment' | 'safety' | 'customer_escalation';
export type OperationalExceptionPriority = 'low' | 'medium' | 'high' | 'critical';
export type OperationalExceptionStatus = 'open' | 'in_progress' | 'resolved';
export type OperationalExceptionAction = 'assign' | 'start' | 'resolve' | 'reopen';

interface ApiOperationalException {
  id: string; organization_id: string; category: OperationalExceptionCategory;
  priority: OperationalExceptionPriority; status: OperationalExceptionStatus;
  title: string; description?: string | null; affected_resource_type?: string | null;
  affected_resource_id?: string | null; assigned_user_id?: string | null;
  reported_by_user_id: string; resolved_by_user_id?: string | null;
  resolution_note?: string | null; resolved_at?: string | null;
  created_at: string; updated_at: string;
}

export interface OperationalException {
  id: string; organizationId: string; category: OperationalExceptionCategory;
  priority: OperationalExceptionPriority; status: OperationalExceptionStatus;
  title: string; description: string | null; affectedResourceType: string | null;
  affectedResourceId: string | null; assignedUserId: string | null;
  reportedByUserId: string; resolvedByUserId: string | null;
  resolutionNote: string | null; resolvedAt: string | null;
  createdAt: string; updatedAt: string;
}

export interface OperationalExceptionFilters {
  organizationId?: string; category?: OperationalExceptionCategory;
  priority?: OperationalExceptionPriority; status?: OperationalExceptionStatus; limit?: number;
}

export interface CreateOperationalExceptionInput {
  organizationId: string; category: OperationalExceptionCategory;
  priority: OperationalExceptionPriority; title: string; description?: string;
}

export interface UpdateOperationalExceptionInput {
  action: OperationalExceptionAction; expectedUpdatedAt: string;
  assignedUserId?: string; resolutionNote?: string;
}

export function operationalExceptionsPath(filters: OperationalExceptionFilters = {}): string {
  const query = new URLSearchParams();
  if (filters.organizationId) query.set('organization_id', filters.organizationId);
  if (filters.category) query.set('category', filters.category);
  if (filters.priority) query.set('priority', filters.priority);
  if (filters.status) query.set('status', filters.status);
  if (filters.limit) query.set('limit', String(filters.limit));
  return query.size ? `/operational-exceptions?${query}` : '/operational-exceptions';
}

function mapException(item: ApiOperationalException): OperationalException {
  return {
    id: item.id, organizationId: item.organization_id, category: item.category,
    priority: item.priority, status: item.status, title: item.title,
    description: item.description ?? null, affectedResourceType: item.affected_resource_type ?? null,
    affectedResourceId: item.affected_resource_id ?? null, assignedUserId: item.assigned_user_id ?? null,
    reportedByUserId: item.reported_by_user_id, resolvedByUserId: item.resolved_by_user_id ?? null,
    resolutionNote: item.resolution_note ?? null, resolvedAt: item.resolved_at ?? null,
    createdAt: item.created_at, updatedAt: item.updated_at,
  };
}

async function exceptionRequest(path: string, init?: RequestInit): Promise<Response> {
  const response = await authenticatedFetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) throw await apiRequestError(response, `Operational exception request failed with status ${response.status}`);
  return response;
}

export async function fetchOperationalExceptions(filters: OperationalExceptionFilters = {}): Promise<OperationalException[]> {
  const response = await exceptionRequest(operationalExceptionsPath(filters));
  return ((await response.json()) as ApiOperationalException[]).map(mapException);
}

export async function createOperationalException(input: CreateOperationalExceptionInput): Promise<OperationalException> {
  const response = await exceptionRequest('/operational-exceptions', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ organization_id: input.organizationId, category: input.category, priority: input.priority, title: input.title, description: input.description }),
  });
  return mapException(await response.json() as ApiOperationalException);
}

export async function updateOperationalException(id: string, input: UpdateOperationalExceptionInput): Promise<OperationalException> {
  const response = await exceptionRequest(`/operational-exceptions/${encodeURIComponent(id)}`, {
    method: 'PUT', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: input.action, expected_updated_at: input.expectedUpdatedAt, assigned_user_id: input.assignedUserId, resolution_note: input.resolutionNote }),
  });
  return mapException(await response.json() as ApiOperationalException);
}
