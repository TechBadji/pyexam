import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // VITE_BASE_PATH is injected at Docker build time for sub-path deployments
  // e.g. /certifcamp/ when served from a sub-path
  base: process.env.VITE_BASE_PATH ?? "/",
  server: {
    port: 3000,
    proxy: {
      // The app talks to the API through /api (see src/api/axios.ts); nginx
      // strips that prefix in production, so mirror the rewrite here. Only /api
      // is proxied — bare prefixes like /admin belong to the SPA router.
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
