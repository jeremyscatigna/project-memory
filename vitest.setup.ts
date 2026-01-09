import { afterAll, beforeAll, vi } from "vitest";

// Mock environment variables for testing
vi.stubEnv("NODE_ENV", "test");
vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");
vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-key-for-testing-purposes-only");
vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
vi.stubEnv("POLAR_ACCESS_TOKEN", "test-polar-token");
vi.stubEnv("POLAR_SUCCESS_URL", "http://localhost:3001/billing/success");
vi.stubEnv("CORS_ORIGIN", "http://localhost:3001");

// Setup hooks
beforeAll(() => {
  // Global test setup
});

afterAll(() => {
  // Global test teardown
});
