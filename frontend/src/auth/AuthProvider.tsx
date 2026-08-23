import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { User, UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { API_BASE_URL } from '../api/baseUrl';
import { fetchPrincipalAccessSummary, type OrganizationMembership } from '../api/client';
import { configureApiAuthentication } from '../api/authenticatedFetch';

type AuthMode = 'disabled' | 'local_review' | 'cognito';
export type AccessVerificationStatus = 'idle' | 'loading' | 'ready' | 'unavailable';
export const LOCAL_DEVELOPMENT_USER_ID = 'local-development-user';
export const LOCAL_REVIEWER_STORAGE_KEY = 'grover.local-reviewer-id';

export interface LocalReviewerProfile {
  reviewer_id: string;
  user_id: string;
  display_name: string;
  verified_email: string;
  roles: string[];
}

interface RuntimeAuthConfig {
  mode: AuthMode;
  issuer_url: string | null;
  client_id: string | null;
  login_domain: string | null;
  local_reviewers: LocalReviewerProfile[];
}

interface AuthContextValue {
  loading: boolean;
  authenticated: boolean;
  error: string | null;
  accessStatus: AccessVerificationStatus;
  accessError: string | null;
  displayName: string;
  userId: string | null;
  verifiedEmail: string | null;
  roles: string[];
  memberships: OrganizationMembership[];
  localReviewers: LocalReviewerProfile[];
  activeLocalReviewerId: string | null;
  selectLocalReviewer: (reviewerId: string) => void;
  refreshAccess: () => Promise<void>;
  authMode: AuthMode | null;
  retryInitialization: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function safeAuthReturnPath(state: unknown): string {
  if (!state || typeof state !== 'object' || !('returnTo' in state)) return '/';
  const returnTo = (state as { returnTo?: unknown }).returnTo;
  return typeof returnTo === 'string'
    && returnTo.startsWith('/')
    && !returnTo.startsWith('//')
    ? returnTo
    : '/';
}

export function resolveLocalReviewer(
  reviewers: LocalReviewerProfile[],
  storedReviewerId: string | null,
): LocalReviewerProfile | null {
  return reviewers.find((reviewer) => reviewer.reviewer_id === storedReviewerId)
    ?? reviewers[0]
    ?? null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function requireCognitoConfig(config: RuntimeAuthConfig): {
  issuerUrl: string;
  clientId: string;
  loginDomain: string;
} {
  if (!config.issuer_url || !config.client_id || !config.login_domain) {
    throw new Error('The API returned an incomplete Cognito configuration.');
  }

  return {
    issuerUrl: config.issuer_url.replace(/\/+$/, ''),
    clientId: config.client_id,
    loginDomain: config.login_domain.replace(/\/+$/, ''),
  };
}

async function fetchRuntimeAuthConfig(): Promise<RuntimeAuthConfig> {
  const response = await fetch(`${API_BASE_URL}/auth/config`, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Authentication configuration failed with status ${response.status}.`);
  }

  return response.json() as Promise<RuntimeAuthConfig>;
}

function createUserManager(config: RuntimeAuthConfig): UserManager {
  const { issuerUrl, clientId, loginDomain } = requireCognitoConfig(config);
  const origin = window.location.origin;

  return new UserManager({
    authority: issuerUrl,
    client_id: clientId,
    redirect_uri: `${origin}/auth/callback`,
    post_logout_redirect_uri: `${origin}/`,
    response_type: 'code',
    scope: 'openid email profile',
    loadUserInfo: false,
    automaticSilentRenew: true,
    monitorSession: false,
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    metadata: {
      issuer: issuerUrl,
      authorization_endpoint: `${loginDomain}/oauth2/authorize`,
      token_endpoint: `${loginDomain}/oauth2/token`,
      userinfo_endpoint: `${loginDomain}/oauth2/userInfo`,
      revocation_endpoint: `${loginDomain}/oauth2/revoke`,
      end_session_endpoint: `${loginDomain}/logout`,
    },
  });
}

function rolesFromUser(user: User | null): string[] {
  const groups = user?.profile['cognito:groups'];
  if (!Array.isArray(groups)) {
    return [];
  }

  return groups.filter((group): group is string => typeof group === 'string');
}

function displayNameFromUser(user: User | null): string {
  if (!user) {
    return '';
  }

  return (
    (typeof user.profile.email === 'string' && user.profile.email) ||
    (typeof user.profile.preferred_username === 'string' && user.profile.preferred_username) ||
    user.profile.sub
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessStatus, setAccessStatus] = useState<AccessVerificationStatus>('idle');
  const [accessError, setAccessError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [manager, setManager] = useState<UserManager | null>(null);
  const [config, setConfig] = useState<RuntimeAuthConfig | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initializationAttempt, setInitializationAttempt] = useState(0);
  const [membershipRoles, setMembershipRoles] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [localReviewers, setLocalReviewers] = useState<LocalReviewerProfile[]>([]);
  const [activeLocalReviewerId, setActiveLocalReviewerId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const runtimeConfig = await fetchRuntimeAuthConfig();
        if (!active) return;

        setConfig(runtimeConfig);
        setAuthMode(runtimeConfig.mode);

        if (runtimeConfig.mode === 'disabled') {
          configureApiAuthentication(false, async () => null);
          setUserId(LOCAL_DEVELOPMENT_USER_ID);
          setLoading(false);
          return;
        }

        if (runtimeConfig.mode === 'local_review') {
          const reviewers = runtimeConfig.local_reviewers ?? [];
          const reviewer = resolveLocalReviewer(
            reviewers,
            window.sessionStorage.getItem(LOCAL_REVIEWER_STORAGE_KEY),
          );
          if (!reviewer) {
            throw new Error('The API returned no local reviewer profiles.');
          }
          window.sessionStorage.setItem(LOCAL_REVIEWER_STORAGE_KEY, reviewer.reviewer_id);
          configureApiAuthentication(
            false,
            async () => null,
            async () => ({ 'x-grover-local-reviewer': reviewer.reviewer_id }),
          );
          setLocalReviewers(reviewers);
          setActiveLocalReviewerId(reviewer.reviewer_id);
          setUserId(reviewer.user_id);
          setLoading(false);
          return;
        }

        const nextManager = createUserManager(runtimeConfig);
        nextManager.events.addUserLoaded((loadedUser) => {
          if (active) setUser(loadedUser);
        });
        nextManager.events.addUserUnloaded(() => {
          if (active) setUser(null);
        });
        nextManager.events.addAccessTokenExpired(() => {
          if (active) setUser(null);
        });

        configureApiAuthentication(true, async () => {
          const currentUser = await nextManager.getUser();
          return currentUser && !currentUser.expired ? currentUser.access_token : null;
        });

        setManager(nextManager);
        let currentUser: User | null;
        if (window.location.pathname === '/auth/callback') {
          currentUser = await nextManager.signinRedirectCallback();
          window.history.replaceState(
            {},
            document.title,
            safeAuthReturnPath(currentUser.state),
          );
        } else {
          currentUser = await nextManager.getUser();
          if (currentUser?.expired) {
            try {
              currentUser = await nextManager.signinSilent();
            } catch {
              await nextManager.removeUser();
              currentUser = null;
            }
          }
        }

        if (active) {
          setUser(currentUser);
          setLoading(false);
        }
      } catch (initializationError) {
        if (active) {
          configureApiAuthentication(true, async () => null);
          setError(
            initializationError instanceof Error
              ? initializationError.message
              : 'Authentication initialization failed.',
          );
          setLoading(false);
        }
      }
    }

    void initialize();
    return () => {
      active = false;
    };
  }, [initializationAttempt]);

  const retryInitialization = useCallback(() => {
    configureApiAuthentication(true, async () => null);
    setLoading(true);
    setError(null);
    setAuthMode(null);
    setManager(null);
    setConfig(null);
    setUser(null);
    setAccessStatus('idle');
    setAccessError(null);
    setLocalReviewers([]);
    setActiveLocalReviewerId(null);
    setInitializationAttempt((current) => current + 1);
  }, []);

  const signIn = useCallback(async () => {
    if (!manager) return;
    await manager.signinRedirect({
      state: { returnTo: `${window.location.pathname}${window.location.search}` },
    });
  }, [manager]);

  const signOut = useCallback(async () => {
    if (!manager || !config) return;
    const { clientId, loginDomain } = requireCognitoConfig(config);
    await manager.removeUser();
    const logoutUrl = new URL(`${loginDomain}/logout`);
    logoutUrl.searchParams.set('client_id', clientId);
    logoutUrl.searchParams.set('logout_uri', `${window.location.origin}/`);
    window.location.assign(logoutUrl);
  }, [config, manager]);

  const refreshAccess = useCallback(async () => {
    setAccessStatus((current) => current === 'ready' ? current : 'loading');
    setAccessError(null);
    try {
      const access = await fetchPrincipalAccessSummary();
      setUserId(access.userId);
      setMemberships(access.memberships);
      setMembershipRoles(access.memberships.map((membership) => membership.role));
      setVerifiedEmail(access.verifiedEmail);
      setAccessStatus('ready');
    } catch {
      setUserId(null);
      setMemberships([]);
      setMembershipRoles([]);
      setVerifiedEmail(null);
      setAccessStatus('unavailable');
      setAccessError('Active organization access could not be verified.');
    }
  }, []);

  const selectLocalReviewer = useCallback((reviewerId: string) => {
    if (!localReviewers.some((reviewer) => reviewer.reviewer_id === reviewerId)) return;
    window.sessionStorage.setItem(LOCAL_REVIEWER_STORAGE_KEY, reviewerId);
    window.location.reload();
  }, [localReviewers]);

  useEffect(() => {
    if (authMode === 'disabled' || authMode === 'local_review' || (user && !user.expired)) {
      void refreshAccess();
    } else {
      setUserId(null);
      setMemberships([]);
      setMembershipRoles([]);
      setVerifiedEmail(null);
      setAccessStatus('idle');
      setAccessError(null);
    }
  }, [authMode, refreshAccess, user]);

  const value = useMemo<AuthContextValue>(
    () => {
      const localReviewer = resolveLocalReviewer(localReviewers, activeLocalReviewerId);
      const roles = Array.from(new Set([
        ...(authMode === 'disabled' ? ['OrganizationOwner'] : rolesFromUser(user)),
        ...(authMode === 'local_review' ? (localReviewer?.roles ?? []) : []),
        ...membershipRoles,
      ]));
      return {
        loading,
        authenticated: authMode === 'disabled'
          || authMode === 'local_review'
          || Boolean(user && !user.expired),
        error,
        accessStatus,
        accessError,
        displayName: authMode === 'disabled'
          ? 'Local development user'
          : localReviewer?.display_name ?? displayNameFromUser(user),
        userId,
        verifiedEmail,
        roles,
        memberships,
        localReviewers,
        activeLocalReviewerId,
        selectLocalReviewer,
        authMode,
        refreshAccess,
        retryInitialization,
        signIn,
        signOut,
      };
    },
    [
      activeLocalReviewerId,
      accessError,
      accessStatus,
      authMode,
      error,
      loading,
      localReviewers,
      membershipRoles,
      memberships,
      refreshAccess,
      retryInitialization,
      selectLocalReviewer,
      signIn,
      signOut,
      user,
      userId,
      verifiedEmail,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
}
