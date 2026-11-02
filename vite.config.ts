import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    hmr: {
      overlay: false,
    },
  },
});
