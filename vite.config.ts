import { defineConfig } from "vite";

// During development, Vite serves the frontend on :5173 and proxies API calls
// to `wrangler pages dev` (Pages Functions + local D1) on :8788. In production,
// `vite build` emits `dist/`, which Cloudflare Pages serves as static assets
// while `functions/` runs the API on the same domain.
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8788",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
