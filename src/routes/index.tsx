import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "cOreMS-Auth" },
      { name: "description", content: "cOreMS-Auth — authentication service" },
      { property: "og:title", content: "cOreMS-Auth" },
      { property: "og:description", content: "cOreMS-Auth — authentication service" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          cOreMS-Auth
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Project scaffolded. Ready to build.
        </p>
      </div>
    </div>
  );
}
