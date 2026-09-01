import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: Number(process.env.PORT) || 8080,
    /* The /api/* routes are Vercel serverless functions and do not exist under
       `vite dev`, so the diesel feed 404s locally and anything that depends on it
       is untestable. Proxy to the deployed functions instead of stubbing, so what
       renders in development is the same payload production returns. */
    proxy: {
      '/api': {
        target: 'https://overland-ochre.vercel.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    sourcemap: true,
  },
  plugins: [
    react(),
    process.env.SENTRY_AUTH_TOKEN ? sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }) : null,
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
}));
