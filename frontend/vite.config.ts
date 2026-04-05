import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_DEV_PROXY_TARGET ?? "http://127.0.0.1:3000";
  const useProxy = mode === "development" && !env.VITE_API_URL;

  return {
    plugins: [react()],
    server: useProxy
      ? {
          proxy: {
            /** Evita choque con la ruta SPA `/events`; el cliente usa `/__api/events`. */
            "/__api": {
              target: apiTarget,
              changeOrigin: true,
              rewrite: (p) => p.replace(/^\/__api/, "") || "/",
            },
          },
        }
      : undefined,
  };
});
