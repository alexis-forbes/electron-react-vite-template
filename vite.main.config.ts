import { defineConfig, ServerOptions } from "vite";

export const viteServer: ServerOptions = {
  port: 8000,
  strictPort: true,
  hmr: {
    protocol: "http",
    host: "localhost",
    clientPort: 8000
  }
};

// https://vitejs.dev/config
export default defineConfig({
  server: viteServer
});
