import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: path.resolve(__dirname, "../.."),
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
          if (id.includes("convex")) return "vendor-convex";
          if (id.includes("lucide-react")) return "vendor-icons";
          return "vendor";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: false, // if 5173 is in use, Vite will use the next available port
    host: true,
    proxy: {
      // Forward orchestration server in dev so UI can reach it same-origin (no CORS).
      // If nothing is running on 4100, /gateway/* requests will fail; the UI handles that.
      "/gateway": {
        target: "http://localhost:4100",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
