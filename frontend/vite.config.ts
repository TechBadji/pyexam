import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // VITE_BASE_PATH is injected at Docker build time for sub-path deployments
  // e.g. /pyexam/ for www.digitalmatis.com/pyexam/
  base: process.env.VITE_BASE_PATH ?? "/",
  server: {
    port: 3000,
    proxy: {
      "/auth":        { target: "http://localhost:8000", changeOrigin: true },
      "/exams":       { target: "http://localhost:8000", changeOrigin: true },
      "/submissions": { target: "http://localhost:8000", changeOrigin: true },
      "/admin":       { target: "http://localhost:8000", changeOrigin: true },
      "/student":     { target: "http://localhost:8000", changeOrigin: true },
      "/code":        { target: "http://localhost:8000", changeOrigin: true },
      "/api":         { target: "http://localhost:8000", changeOrigin: true },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
