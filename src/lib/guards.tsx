import type { ReactNode } from "react";
import { useCoreMSAuth } from "./CoreMSAuthProvider";
import { LoginScreen, type LoginScreenProps } from "./LoginScreen";
import { AuthShell, Spinner } from "./ui";

export function AuthLoading({ contained }: { contained?: boolean }) {
  const { branding } = useCoreMSAuth();
  return (
    <AuthShell branding={branding} hero={false} {...(contained !== undefined && { contained })}>
      <div className="cms-center" role="status"><Spinner size={28} />Checking your session…</div>
    </AuthShell>
  );
}

export interface RequireAuthProps {
  children: ReactNode;
  /** Shown when signed out. Defaults to the bundled <LoginScreen />. */
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  loginProps?: LoginScreenProps;
}

/** Router-agnostic guard: renders children only for active, entitled users. */
export function RequireAuth({ children, fallback, loadingFallback, loginProps }: RequireAuthProps) {
  const { user, loading } = useCoreMSAuth();
  if (loading) return <>{loadingFallback ?? <AuthLoading {...(loginProps?.contained !== undefined && { contained: loginProps.contained })} />}</>;
  if (!user) return <>{fallback ?? <LoginScreen {...loginProps} />}</>;
  return <>{children}</>;
}

export interface RoleBasedRouteProps {
  /** User needs at least one of these roles. */
  roles: string[];
  children: ReactNode;
  /** Shown when the user lacks every listed role. */
  fallback?: ReactNode;
  /** Super Admins pass every role check. Default true. */
  allowSuperAdmin?: boolean;
}

export function RoleBasedRoute({ roles, children, fallback = null, allowSuperAdmin = true }: RoleBasedRouteProps) {
  const { user, hasAnyRole } = useCoreMSAuth();
  if (!user) return <>{fallback}</>;
  if ((allowSuperAdmin && user.isSuperAdmin) || hasAnyRole(roles)) return <>{children}</>;
  return <>{fallback}</>;
}
