import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.turbo/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.d.ts",
        "**/*.config.{js,ts}",
        "**/index.ts",
      ],
    },
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@saas-template/db": path.resolve(__dirname, "./packages/db/src"),
      "@saas-template/api": path.resolve(__dirname, "./packages/api/src"),
      "@saas-template/auth": path.resolve(__dirname, "./packages/auth/src"),
      "@saas-template/env": path.resolve(__dirname, "./packages/env/src"),
    },
  },
});
