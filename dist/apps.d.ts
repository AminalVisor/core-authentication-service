import type { AppKey, CoreMSAppMeta } from "./types";
/** Registry of every app in the CoreMS suite. Accents keep >= 4.5:1 contrast with white text. */
export declare const COREMS_APPS: Record<AppKey, CoreMSAppMeta>;
export declare const APP_KEYS: AppKey[];
export declare function getAppMeta(appKey: AppKey): CoreMSAppMeta;
