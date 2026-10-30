import type { AppKey, CoreMSAppMeta } from "./types";
import coreCtrlLogo from "./assets/CoreCTRL-Auth.png";
import coreFUELLogo from "./assets/CoreFUEL-Auth.png";
import coreLOADLogo from "./assets/CoreLOAD-Auth.png";
import coreBLSTLogo from "./assets/CoreBLST-Auth.png";
import coreSHLDLogo from "./assets/CoreSHLD-Auth.png";
import corePORTLogo from "./assets/CorePORT-Auth.png";
import coreLABSLogo from "./assets/CoreLABS-Auth.png";
import coreFILLLogo from "./assets/CoreFILL-Auth.png";
import corePRCSLogo from "./assets/CorePRCS-Auth.png";
import coreMINELogo from "./assets/CoreMINE-Auth.png";
import coreMECHLogo from "./assets/CoreMECH-Auth.png";
import coreSTORLogo from "./assets/CoreSTOR-Auth.png";
import coreVIEWLogo from "./assets/CoreVIEW-Auth.png";
import coreRISKLogo from "./assets/CoreRISK-Auth.png";

/** Registry of every app in the CoreMS suite. Accents keep >= 4.5:1 contrast with white text. */
export const COREMS_APPS: Record<AppKey, CoreMSAppMeta> = {
  ctrl: {
    key: "ctrl",
    name: "CoreCTRL",
    title: "CoreMS Control Centre",
    tagline: "Users, sites, assets and every app in the suite — centralised and secure.",
    accent: "#00D2BE",
    logo: coreCtrlLogo,
  },
  fuel: {
    key: "fuel",
    name: "CoreFUEL",
    title: "Fuel Manager",
    tagline: "Track every litre dispensed, reconciled and billed across your fleet.",
    accent: "#F59E0B",
    logo: coreFUELLogo,
  },
  shld: {
    key: "shld",
    name: "CoreSHLD",
    title: "Security Manager",
    tagline: "Security operations. Controlled and connected.",
    accent: "#EF4444",
    logo: coreSHLDLogo,
  },
  loading: {
    key: "loading",
    name: "CoreLOAD",
    title: "Load Manager",
    tagline: "Live load counts, haul cycles and payload tracking from pit to plant.",
    accent: "#F97316",
    logo: coreLOADLogo,
  },
  production: {
    key: "production",
    name: "CoreMINE",
    title: "Mine Production",
    tagline: "Shift production, targets and variances in one operational view.",
    accent: "#38BDF8",
    logo: coreMINELogo,
  },
  process: {
    key: "process",
    name: "CorePRCS",
    title: "Processing & Production",
    tagline: "Throughput, recovery and plant uptime at a glance.",
    accent: "#3B82F6",
    logo: corePRCSLogo,
  },
  mech: {
    key: "mech",
    name: "CoreMECH",
    title: "Maintenance and Fleetcare",
    tagline: "Breakdowns, services and equipment availability under control.",
    accent: "#EAB308",
    logo: coreMECHLogo,
  },
  safety: {
    key: "safety",
    name: "CoreRISK",
    title: "Safety & Compliance",
    tagline: "Incidents, inspections and corrective actions — nothing missed.",
    accent: "#EF4444",
    logo: coreRISKLogo,
  },
  qc: {
    key: "qc",
    name: "CoreLABS",
    title: "Quality Control",
    tagline: "Sampling, assays and grade control with full traceability.",
    accent: "#22C55E",
    logo: coreLABSLogo,
  },
  stock: {
    key: "stock",
    name: "CoreSTOR",
    title: "Stores & Inventory",
    tagline: "Stockpile volumes, movements and inventory reconciled daily.",
    accent: "#C47A3A",
    logo: coreSTORLogo,
  },
  port: {
    key: "port",
    name: "CorePORT",
    title: "Destination Receiving",
    tagline: "Vessel loading, rail arrivals and port stock in sync.",
    accent: "#22D3EE",
    logo: corePORTLogo,
  },
  dashboard: {
    key: "dashboard",
    name: "CoreVIEW",
    title: "Executive Dashboard",
    tagline: "Suite-wide KPIs for every site, in real time.",
    accent: "#A855F7",
    logo: coreVIEWLogo,
  },
};

export const APP_KEYS = Object.keys(COREMS_APPS) as AppKey[];

export function getAppMeta(appKey: AppKey): CoreMSAppMeta {
  return COREMS_APPS[appKey];
}
