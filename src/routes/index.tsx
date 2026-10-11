import { createFileRoute } from "@tanstack/react-router";
import Showcase from "@/pages/Showcase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CoreMS Auth — Sign-in Test Harness" },
      { name: "description", content: "Preview and test the shared CoreMS sign-in, entitlement and set-password screens across every suite app." },
      { property: "og:title", content: "CoreMS Auth — Sign-in Test Harness" },
      { property: "og:description", content: "Preview and test the shared CoreMS sign-in, entitlement and set-password screens across every suite app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Showcase,
});
