import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { ReactNode } from "react";

export type AppKey =
  | "ctrl"
  | "fuel"
  | "loading"
  | "production"
  | "process"
  | "mech"
  | "safety"
  | "qc"
  | "stock"
  | "port"
  | "dashboard";

export interface CoreMSAppMeta {
  key: AppKey;
  /** Short product name, e.g. "CoreFUEL". */
  name: string;
  /** Card title, e.g. "Fuel Management". */
  title: string;
  /** One-line description shown on large screens. */
  tagline: string;
  /** Accent colour (hex). Must keep >= 4.5:1 contrast with white text. */
  accent: string;
}

export interface CoreMSBranding {
  appName?: string;
  title?: string;
  subtitle?: string;
  tagline?: string;
  accent?: string;
  /** Image URL or custom node rendered in place of the app mark. */
  logo?: string | ReactNode;
  /** Hide the CoreMS suite wordmark. */
  hideSuiteLogo?: boolean;
}

export type ResolvedBranding = Required<Omit<CoreMSBranding, "logo">> & {
  logo?: string | ReactNode;
  appKey: AppKey;
};

export interface CoreMSUser {
  id: string;
  email: string | null;
  username: string;
  role: string;
  roles: string[];
  isSuperAdmin: boolean;
  /** Raw profile row, if one was loaded. */
  profile?: Record<string, unknown> | null;
}

export type AuthErrorCode =
  | "invalid_credentials"
  | "inactive"
  | "entitlement_denied"
  | "profile_error"
  | "rate_limited"
  | "network"
  | "unknown";

export interface AuthResult {
  success: boolean;
  error?: string;
  code?: AuthErrorCode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySupabaseClient = SupabaseClient<any, any, any>;

export type ProfileLoader = (
  client: AnySupabaseClient,
  userId: string,
) => Promise<{ username?: string; role?: string; roles?: string[]; profile?: Record<string, unknown> | null }>;

export interface CoreMSAuthContextValue {
  appKey: AppKey;
  branding: ResolvedBranding;
  supabase: AnySupabaseClient;
  user: CoreMSUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  errorCode: AuthErrorCode | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  requestPasswordReset: (email: string, redirectTo?: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
}
