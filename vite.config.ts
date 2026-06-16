import { defineConfig } from "vite";

// During development, Vite serves the frontend on :5173 and proxies API calls
// to the Express server on :3001. In production, `vite build` emits `dist/`,
// which the Express server serves statically.
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
