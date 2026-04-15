const AUTH_STORAGE_KEY = "fleetflow.auth.user";

export type UserRole = 'Admin' | 'Fleet Manager' | 'Dispatcher' | 'Viewer';

type PermissionAction = 'exceptions:update' | 'dispatch:assign' | 'maintenance:create' | 'audit:view';

type AuthUser = {
  id: string;
  name: string;
  email: string;
  picture?: string;
  permission: UserRole;
  accessToken: string;
};

type GooglePayload = {
  name?: string;
  email?: string;
};

const hasWindow = typeof window !== "undefined";

const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  Admin: ['exceptions:update', 'dispatch:assign', 'maintenance:create', 'audit:view'],
  'Fleet Manager': ['exceptions:update', 'dispatch:assign', 'maintenance:create', 'audit:view'],
  Dispatcher: ['exceptions:update', 'dispatch:assign'],
  Viewer: [],
};

const inferRoleFromEmail = (email: string): UserRole => {
  const normalizedEmail = email.toLowerCase();
  if (normalizedEmail.includes('admin')) return 'Admin';
  if (normalizedEmail.includes('dispatch')) return 'Dispatcher';
  if (normalizedEmail.includes('viewer')) return 'Viewer';
  return 'Fleet Manager';
};

export const getCurrentUser = (): AuthUser | null => {
  if (!hasWindow) return null;

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return Boolean(getCurrentUser()?.accessToken);
};

export const getCurrentRole = (): UserRole => {
  return getCurrentUser()?.permission || 'Viewer';
};

export const getAccessToken = (): string | null => {
  return getCurrentUser()?.accessToken || null;
};

export const canPerform = (action: PermissionAction): boolean => {
  const role = getCurrentRole();
  return ROLE_PERMISSIONS[role].includes(action);
};

export const signIn = (email: string, password: string): boolean => {
  if (!hasWindow || !email || !password) return false;

  const user: AuthUser = {
    id: "local-user",
    name: email.split("@")[0] || "Operator",
    email,
    permission: inferRoleFromEmail(email),
    accessToken: "mock-token-" + Date.now(),
  };

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  return true;
};

export const signUp = (name: string, email: string, password: string): boolean => {
  if (!hasWindow || !name || !email || password.length < 6) return false;

  const user: AuthUser = {
    id: "local-user",
    name,
    email,
    permission: inferRoleFromEmail(email),
    accessToken: "mock-token-" + Date.now(),
  };
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  return true;
};

export const signOut = (): void => {
  if (!hasWindow) return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};

/**
 * Verifies the Google credential with the Python Auth Service.
 * Returns true if successful, false otherwise.
 */
export const signInWithGoogleCredential = async (credential: string): Promise<boolean> => {
  if (!hasWindow || !credential) return false;

  try {
    const response = await fetch("http://localhost:8001/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ credential }),
    });

    if (!response.ok) {
      console.error("Auth backend error:", await response.text());
      return false;
    }

    const data = await response.json();
    // data expected: { access_token: string, user: { id: string, email: string, name: string ... } }

    const user: AuthUser = {
      id: data.user.id,
      name: data.user.name || data.user.email.split("@")[0] || "Operator",
      email: data.user.email,
      picture: data.user.picture,
      permission: inferRoleFromEmail(data.user.email),
      accessToken: data.access_token,
    };

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    return true;
  } catch (error) {
    console.error("Failed to sign in with Google:", error);
    return false;
  }
};
