import type { ReactNode } from "react";
import { type LoginScreenProps } from "./LoginScreen";
export declare function AuthLoading({ contained }: {
    contained?: boolean;
}): import("react").JSX.Element;
export interface RequireAuthProps {
    children: ReactNode;
    /** Shown when signed out. Defaults to the bundled <LoginScreen />. */
    fallback?: ReactNode;
    loadingFallback?: ReactNode;
    loginProps?: LoginScreenProps;
}
/** Router-agnostic guard: renders children only for active, entitled users. */
export declare function RequireAuth({ children, fallback, loadingFallback, loginProps }: RequireAuthProps): import("react").JSX.Element;
export interface RoleBasedRouteProps {
    /** User needs at least one of these roles. */
    roles: string[];
    children: ReactNode;
    /** Shown when the user lacks every listed role. */
    fallback?: ReactNode;
    /** Super Admins pass every role check. Default true. */
    allowSuperAdmin?: boolean;
}
export declare function RoleBasedRoute({ roles, children, fallback, allowSuperAdmin }: RoleBasedRouteProps): import("react").JSX.Element;
