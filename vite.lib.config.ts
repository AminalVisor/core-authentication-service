// Library build for the distributable @corems/auth package (ESM + inline assets).
// Separate from the TanStack app config so the harness and the package never share build settings.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    assetsInlineLimit: 1024 * 1024, // inline the CoreMS logo so consumers need no asset handling
    lib: {
      entry: resolve(__dirname, "src/lib/index.ts"),
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "@supabase/supabase-js"],
    },
  },
});
