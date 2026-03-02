import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: path.resolve(__dirname, "../.."),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    proxy: {
      // Forward orchestration server in dev so UI can reach it same-origin (no CORS)
      "/gateway": {
        target: "http://localhost:4100",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
