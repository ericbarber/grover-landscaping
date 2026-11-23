import { useCallback, useEffect, useState } from 'react';
import {
  eraseCustomerPhotoEvidence,
  fetchCustomerPrivacyExport,
  type CustomerPhotoErasureSummary,
  type CustomerPrivacyExport,
} from '../../../api/client';

export type ManagerCustomerPrivacyExportResult =
  | { ok: true; privacyExport: CustomerPrivacyExport }
  | { ok: false; error: unknown };

export type ManagerCustomerPhotoErasureResult =
  | {
    ok: true;
    erasure: CustomerPhotoErasureSummary;
    privacyExport: CustomerPrivacyExport | null;
  }
  | { ok: false; error: unknown };

export async function executeManagerCustomerPrivacyExport(
  accountId: string,
  readExport: (accountId: string) => Promise<CustomerPrivacyExport> = fetchCustomerPrivacyExport,
): Promise<ManagerCustomerPrivacyExportResult> {
  try {
    return { ok: true, privacyExport: await readExport(accountId) };
  } catch (error) {
    return { ok: false, error };
  }
}

export async function executeManagerCustomerPhotoErasure(
  accountId: string,
  reason: string,
  erasePhotos: (
    accountId: string,
    reason: string,
  ) => Promise<CustomerPhotoErasureSummary> = eraseCustomerPhotoEvidence,
  readExport: (accountId: string) => Promise<CustomerPrivacyExport> = fetchCustomerPrivacyExport,
): Promise<ManagerCustomerPhotoErasureResult> {
  let erasure: CustomerPhotoErasureSummary;
  try {
    erasure = await erasePhotos(accountId, reason);
  } catch (error) {
    return { ok: false, error };
  }

  try {
    return {
      ok: true,
      erasure,
      privacyExport: await readExport(accountId),
    };
  } catch {
    return { ok: true, erasure, privacyExport: null };
  }
}

export interface ManagerCustomerPrivacy {
  privacyExport: CustomerPrivacyExport | null;
  erasure: CustomerPhotoErasureSummary | null;
  isLoading: boolean;
  exportAccount: (accountId: string) => Promise<ManagerCustomerPrivacyExportResult>;
  erasePhotos: (
    accountId: string,
    reason: string,
  ) => Promise<ManagerCustomerPhotoErasureResult>;
}

export function useManagerCustomerPrivacy({
  enabled,
}: {
  enabled: boolean;
}): ManagerCustomerPrivacy {
  const [privacyExport, setPrivacyExport] = useState<CustomerPrivacyExport | null>(null);
  const [erasure, setErasure] = useState<CustomerPhotoErasureSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (enabled) return;
    setPrivacyExport(null);
    setErasure(null);
    setIsLoading(false);
  }, [enabled]);

  const exportAccount = useCallback(async (accountId: string) => {
    if (!enabled) {
      return {
        ok: false,
        error: new Error('Customer privacy tools are not enabled.'),
      } as const;
    }
    setIsLoading(true);
    try {
      const result = await executeManagerCustomerPrivacyExport(accountId);
      if (result.ok) {
        setPrivacyExport(result.privacyExport);
        setErasure(null);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  const erasePhotos = useCallback(async (accountId: string, reason: string) => {
    if (!enabled) {
      return {
        ok: false,
        error: new Error('Customer privacy tools are not enabled.'),
      } as const;
    }
    setIsLoading(true);
    try {
      const result = await executeManagerCustomerPhotoErasure(accountId, reason);
      if (result.ok) {
        setErasure(result.erasure);
        setPrivacyExport(result.privacyExport);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  return { privacyExport, erasure, isLoading, exportAccount, erasePhotos };
}
