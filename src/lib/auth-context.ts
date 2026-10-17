import { createContext } from "react";
import type { CoreMSAuthContextValue } from "./types";

// Keep identity outside the refreshable provider module so existing guards and
// newly refreshed providers always subscribe to the same React context.
export const CoreMSAuthContext = createContext<CoreMSAuthContextValue | undefined>(undefined);