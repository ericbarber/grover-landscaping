type AccessTokenProvider = () => Promise<string | null>;

let authenticationRequired = false;
let accessTokenProvider: AccessTokenProvider = async () => null;

export class AuthenticationRequiredError extends Error {
  constructor() {
    super('A valid sign-in session is required.');
    this.name = 'AuthenticationRequiredError';
  }
}

export function configureApiAuthentication(
  required: boolean,
  provider: AccessTokenProvider,
): void {
  authenticationRequired = required;
  accessTokenProvider = provider;
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = await accessTokenProvider();
  if (authenticationRequired && !token) {
    throw new AuthenticationRequiredError();
  }

  const headers = new Headers(init.headers);
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
