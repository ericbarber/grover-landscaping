import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../../../api/apiError';
import { fetchCustomerPortalVisits } from '../../../api/customerPortalClient';
import type {
  CustomerPortalPropertySummary,
  CustomerPortalVisitSummary,
} from '../../../domain/customerPortalVisits';
import type { CustomerPortalReadState } from './customerWorkspace';

export type CustomerPortalReadError = Exclude<
  CustomerPortalReadState,
  'loading' | 'ready'
>;

export function classifyCustomerPortalReadError(error: unknown): CustomerPortalReadError {
  if (
    error instanceof ApiRequestError
    && error.code === 'customer_portal_access_required'
  ) {
    return 'access_required';
  }
  if (
    error instanceof ApiRequestError
    && error.code === 'customer_portal_access_inconsistent'
  ) {
    return 'inconsistent';
  }
  return 'unavailable';
}

export interface CustomerPortalCollection {
  properties: CustomerPortalPropertySummary[];
  visits: CustomerPortalVisitSummary[];
  isLoading: boolean;
  readError: CustomerPortalReadError | null;
  readState: CustomerPortalReadState;
  refresh: () => Promise<boolean>;
}

export function useCustomerPortalCollection({
  enabled,
  subjectKey,
}: {
  enabled: boolean;
  subjectKey: string;
}): CustomerPortalCollection {
  const [properties, setProperties] = useState<CustomerPortalPropertySummary[]>([]);
  const [visits, setVisits] = useState<CustomerPortalVisitSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [readError, setReadError] = useState<CustomerPortalReadError | null>(null);
  const [readState, setReadState] = useState<CustomerPortalReadState>('loading');
  const request = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++request.current;
    if (!enabled) {
      setProperties([]);
      setVisits([]);
      setReadError(null);
      setIsLoading(false);
      setReadState('loading');
      return false;
    }

    setIsLoading(true);
    setReadError(null);
    setReadState('loading');
    try {
      const collection = await fetchCustomerPortalVisits();
      if (requestId !== request.current) return false;
      setProperties(collection.properties);
      setVisits(collection.visits);
      setReadState('ready');
      return true;
    } catch (error) {
      if (requestId !== request.current) return false;
      const nextError = classifyCustomerPortalReadError(error);
      setProperties([]);
      setVisits([]);
      setReadError(nextError);
      setReadState(nextError);
      return false;
    } finally {
      if (requestId === request.current) setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
    return () => {
      ++request.current;
    };
  }, [refresh, subjectKey]);

  return { properties, visits, isLoading, readError, readState, refresh };
}
