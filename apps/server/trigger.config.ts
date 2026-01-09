import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "proj_saas-template", // Will be replaced with actual project ref
  runtime: "node",
  logLevel: "log",
  maxDuration: 300, // 5 minutes default
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10_000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./src/trigger"],
  build: {
    external: [
      "@saas-template/db",
      "@saas-template/auth",
      "@saas-template/email",
    ],
  },
});
