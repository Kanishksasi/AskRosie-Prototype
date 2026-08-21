import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // bind all interfaces (not just IPv6 ::1) so localhost resolves reliably
    // Honors a dev-server manager's reassigned PORT (e.g. to dodge a
    // conflict) instead of always fighting for 5173. The API server reads
    // API_PORT instead of PORT specifically so it's unaffected by this.
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
});
