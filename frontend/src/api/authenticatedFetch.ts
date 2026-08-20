type AccessTokenProvider = () => Promise<string | null>;
type AuthenticationHeadersProvider = () => Promise<HeadersInit | undefined>;

let authenticationRequired = false;
let accessTokenProvider: AccessTokenProvider = async () => null;
let authenticationHeadersProvider: AuthenticationHeadersProvider = async () => undefined;

export class AuthenticationRequiredError extends Error {
  constructor() {
    super('A valid sign-in session is required.');
    this.name = 'AuthenticationRequiredError';
  }
}

export function configureApiAuthentication(
  required: boolean,
  provider: AccessTokenProvider,
  headersProvider: AuthenticationHeadersProvider = async () => undefined,
): void {
  authenticationRequired = required;
  accessTokenProvider = provider;
  authenticationHeadersProvider = headersProvider;
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
  const authenticationHeaders = new Headers(await authenticationHeadersProvider());
  authenticationHeaders.forEach((value, name) => headers.set(name, value));
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
