import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      // .mts 以 ESM 載入，沒有 __dirname，用 import.meta.dirname（Node 20.11+）
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
