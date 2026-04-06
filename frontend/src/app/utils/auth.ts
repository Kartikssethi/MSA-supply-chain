const AUTH_STORAGE_KEY = "fleetflow.auth.user";

type AuthUser = {
  name: string;
  email: string;
};

type GooglePayload = {
  name?: string;
  email?: string;
};

const hasWindow = typeof window !== "undefined";

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
  return Boolean(getCurrentUser());
};

export const signIn = (email: string, password: string): boolean => {
  if (!hasWindow || !email || !password) return false;

  const user: AuthUser = {
    name: email.split("@")[0] || "Operator",
    email,
  };

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  return true;
};

export const signUp = (name: string, email: string, password: string): boolean => {
  if (!hasWindow || !name || !email || password.length < 6) return false;

  const user: AuthUser = { name, email };
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
  };

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  return true;
};
