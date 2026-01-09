import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Rate Limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("MemoryStore", () => {
    it("should track request counts", async () => {
      const { MemoryStore } = await import("../middleware/rate-limit");

      const store = new MemoryStore();
      const key = "test-key";
      const windowMs = 60_000;

      // Set initial data
      await store.set(
        key,
        { count: 0, resetAt: Date.now() + windowMs },
        windowMs
      );

      const count1 = await store.increment(key);
      expect(count1).toBe(1);

      const count2 = await store.increment(key);
      expect(count2).toBe(2);
    });

    it("should reset counts after window expires", async () => {
      const { MemoryStore } = await import("../middleware/rate-limit");

      const store = new MemoryStore();
      const key = "test-key";
      const windowMs = 100; // Very short window

      await store.set(
        key,
        { count: 0, resetAt: Date.now() + windowMs },
        windowMs
      );
      const count1 = await store.increment(key);
      expect(count1).toBe(1);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // After expiry, get should return null
      const data = await store.get(key);
      expect(data).toBeNull();
    });

    it("should track different keys separately", async () => {
      const { MemoryStore } = await import("../middleware/rate-limit");

      const store = new MemoryStore();
      const windowMs = 60_000;

      await store.set(
        "key-1",
        { count: 0, resetAt: Date.now() + windowMs },
        windowMs
      );
      await store.set(
        "key-2",
        { count: 0, resetAt: Date.now() + windowMs },
        windowMs
      );

      await store.increment("key-1");
      await store.increment("key-1");
      await store.increment("key-2");

      const count1 = await store.increment("key-1");
      const count2 = await store.increment("key-2");

      expect(count1).toBe(3);
      expect(count2).toBe(2);
    });

    it("should return stored data correctly", async () => {
      const { MemoryStore } = await import("../middleware/rate-limit");

      const store = new MemoryStore();
      const key = "test-key";
      const windowMs = 60_000;
      const resetAt = Date.now() + windowMs;

      await store.set(key, { count: 5, resetAt }, windowMs);

      const data = await store.get(key);
      expect(data).not.toBeNull();
      expect(data?.count).toBe(5);
      expect(data?.resetAt).toBe(resetAt);
    });

    it("should return null for non-existent key", async () => {
      const { MemoryStore } = await import("../middleware/rate-limit");

      const store = new MemoryStore();

      const data = await store.get("non-existent-key");
      expect(data).toBeNull();
    });
  });

  describe("Rate Limit Tiers", () => {
    it("should have correct free tier limits", async () => {
      const { rateLimitTiers } = await import("../middleware/rate-limit");

      expect(rateLimitTiers.free.limit).toBe(60);
      expect(rateLimitTiers.free.windowMs).toBe(60 * 1000);
    });

    it("should have correct pro tier limits", async () => {
      const { rateLimitTiers } = await import("../middleware/rate-limit");

      expect(rateLimitTiers.pro.limit).toBe(300);
      expect(rateLimitTiers.pro.windowMs).toBe(60 * 1000);
    });

    it("should have correct enterprise tier limits", async () => {
      const { rateLimitTiers } = await import("../middleware/rate-limit");

      expect(rateLimitTiers.enterprise.limit).toBe(1000);
      expect(rateLimitTiers.enterprise.windowMs).toBe(60 * 1000);
    });

    it("should have correct API tier limits", async () => {
      const { rateLimitTiers } = await import("../middleware/rate-limit");

      expect(rateLimitTiers.api.limit).toBe(100);
      expect(rateLimitTiers.api.windowMs).toBe(60 * 1000);
    });
  });

  describe("Preset Rate Limiters", () => {
    it("should export strictRateLimit preset", async () => {
      const { strictRateLimit } = await import("../middleware/rate-limit");

      expect(strictRateLimit).toBeDefined();
      expect(typeof strictRateLimit).toBe("function");
    });

    it("should export standardRateLimit preset", async () => {
      const { standardRateLimit } = await import("../middleware/rate-limit");

      expect(standardRateLimit).toBeDefined();
      expect(typeof standardRateLimit).toBe("function");
    });

    it("should export lenientRateLimit preset", async () => {
      const { lenientRateLimit } = await import("../middleware/rate-limit");

      expect(lenientRateLimit).toBeDefined();
      expect(typeof lenientRateLimit).toBe("function");
    });
  });

  describe("rateLimit factory", () => {
    it("should create a middleware function", async () => {
      const { rateLimit } = await import("../middleware/rate-limit");

      const middleware = rateLimit({
        limit: 10,
        windowMs: 60_000,
      });

      expect(typeof middleware).toBe("function");
    });
  });
});
