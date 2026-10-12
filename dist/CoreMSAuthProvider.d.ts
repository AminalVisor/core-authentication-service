import { type ReactNode } from "react";
import type { AnySupabaseClient, AppKey, CoreMSAuthContextValue, CoreMSBranding, ProfileLoader, ResolvedBranding } from "./types";
export declare const DEFAULT_SUPER_ADMIN_ROLES: string[];
export interface CoreMSAuthProviderProps {
    supabaseClient: AnySupabaseClient;
    appKey: AppKey;
    branding?: CoreMSBranding;
    /** Override how the profile/roles are loaded. Defaults to `profiles` table + `get_user_roles` RPC. */
    loadProfile?: ProfileLoader;
    /** Role names treated as Super Admin (in addition to the `is_super_admin` RPC). */
    superAdminRoles?: string[];
    children: ReactNode;
}
export declare const defaultProfileLoader: ProfileLoader;
export declare function resolveBranding(appKey: AppKey, overrides?: CoreMSBranding): ResolvedBranding;
export declare function CoreMSAuthProvider({ supabaseClient: supabase, appKey, branding: brandingOverrides, loadProfile, superAdminRoles, children, }: CoreMSAuthProviderProps): import("react").JSX.Element;
export declare function useCoreMSAuth(): CoreMSAuthContextValue;
