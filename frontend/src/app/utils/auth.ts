import { use } from "react";

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

export const signIn = async (email: string, password: string): Promise<void> => {
  if (!email || !password) throw new Error("Enter email and password to continue.");

  const url = "http://127.0.0.1:8001/auth/login";
  console.log(`[Auth] Attempting sign in: ${url}`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || "Login failed. Check your credentials.");
    }

    const data = await response.json();
    const user: AuthUser = {
      id: data.user.id,
      name: data.user.name || data.user.email.split("@")[0] || "Operator",
      email: data.user.email,
      permission: inferRoleFromEmail(data.user.email),
      accessToken: data.access_token,
    };

    if (hasWindow) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      window.localStorage.setItem("user_id", user.id);
    }
  } catch (error: any) {
    console.error("[Auth] Login fetch error:", error);
    if (error.name === "TypeError" && error.message === "Failed to fetch") {
      throw new Error("Network error: Cannot reach the backend. Ensure Docker is running at http://127.0.0.1:8001");
    }
    throw error;
  }
};

export const signUp = async (name: string, email: string, password: string): Promise<void> => {
  if (!name || !email || password.length < 6) {
    throw new Error("Use a valid name, email, and password (6+ chars).");
  }

  const url = "http://127.0.0.1:8001/auth/register";
  console.log(`[Auth] Attempting sign up: ${url}`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || "Registration failed. Please try again.");
    }

    const data = await response.json();
    const user: AuthUser = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      permission: inferRoleFromEmail(data.user.email),
      accessToken: data.access_token,
    };

    if (hasWindow) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      window.localStorage.setItem("user_id", user.id);
    }
  } catch (error: any) {
    console.error("[Auth] Fetch error details:", error);
    if (error.name === "TypeError" && error.message === "Failed to fetch") {
      throw new Error("Network error: Cannot reach the backend. Ensure Docker is running at http://127.0.0.1:8001");
    }
    throw error;
  }
};

export const signOut = (): void => {
  if (!hasWindow) return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};

/**
 * Verifies the Google credential with the Python Auth Service.
 */
export const signInWithGoogleCredential = async (credential: string): Promise<void> => {
  if (!hasWindow || !credential) throw new Error("Google credential missing.");

  const response = await fetch("http://127.0.0.1:8001/auth/google", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ credential }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Google authentication failed.");
  }

  const data = await response.json();
  const user: AuthUser = {
    id: data.user.id,
    name: data.user.name || data.user.email.split("@")[0] || "Operator",
    email: data.user.email,
    picture: data.user.picture,
    permission: inferRoleFromEmail(data.user.email),
    accessToken: data.access_token,
  };

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  window.localStorage.setItem("user_id", user.id);
};
