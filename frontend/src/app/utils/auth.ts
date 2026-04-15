const AUTH_STORAGE_KEY = "fleetflow.auth.user";

export type UserRole = 'Admin' | 'Fleet Manager' | 'Dispatcher' | 'Viewer';

type PermissionAction = 'exceptions:update' | 'dispatch:assign' | 'maintenance:create' | 'audit:view';

type AuthUser = {
  name: string;
  email: string;
  permission: UserRole;
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
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (!parsed?.email || !parsed?.name) return null;

    return {
      name: parsed.name,
      email: parsed.email,
      permission: parsed.permission || "Fleet Manager",
    };
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return Boolean(getCurrentUser());
};

export const getCurrentRole = (): UserRole => {
  return getCurrentUser()?.permission || 'Viewer';
};

export const canPerform = (action: PermissionAction): boolean => {
  const role = getCurrentRole();
  return ROLE_PERMISSIONS[role].includes(action);
};

export const signIn = (email: string, password: string): boolean => {
  if (!hasWindow || !email || !password) return false;

  const user: AuthUser = {
    name: email.split("@")[0] || "Operator",
    email,
    permission: inferRoleFromEmail(email),
  };

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  return true;
};

export const signUp = (name: string, email: string, password: string): boolean => {
  if (!hasWindow || !name || !email || password.length < 6) return false;

  const user: AuthUser = {
    name,
    email,
    permission: inferRoleFromEmail(email),
  };
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  return true;
};

export const signOut = (): void => {
  if (!hasWindow) return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};

const parseGooglePayload = (credential: string): GooglePayload | null => {
  try {
    const payload = credential.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = atob(padded);

    return JSON.parse(decoded) as GooglePayload;
  } catch {
    return null;
  }
};

export const signInWithGoogleCredential = (credential: string): boolean => {
  if (!hasWindow || !credential) return false;

  const payload = parseGooglePayload(credential);
  if (!payload?.email) return false;

  const user: AuthUser = {
    name: payload.name || payload.email.split("@")[0] || "Operator",
    email: payload.email,
    permission: inferRoleFromEmail(payload.email),
  };

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  return true;
};
