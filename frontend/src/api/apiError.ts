export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code?: string,
    message?: string,
  ) {
    super(message ?? `API request failed with status ${status}`);
    this.name = 'ApiRequestError';
  }
}

export async function apiRequestError(response: Response, fallbackMessage?: string): Promise<ApiRequestError> {
  let payload: { error?: unknown; message?: unknown } = {};
  try {
    payload = await response.json() as { error?: unknown; message?: unknown };
  } catch {
    // Some upstream and development errors do not include a JSON body.
  }

  return new ApiRequestError(
    response.status,
    typeof payload.error === 'string' ? payload.error : undefined,
    typeof payload.message === 'string' ? payload.message : fallbackMessage,
  );
}

export function isApiErrorCode(error: unknown, code: string): boolean {
  return error instanceof ApiRequestError && error.code === code;
}
