import { Hono } from "hono";
import {
  type ApiKeyContext,
  apiKeyAuth,
  requireScopes,
} from "../middleware/api-key-auth";
import { rateLimit, rateLimitTiers } from "../middleware/rate-limit";

interface ApiKeyEnv {
  Variables: ApiKeyContext;
}

const publicApi = new Hono<ApiKeyEnv>();

// Apply API key authentication to all routes
publicApi.use("/*", apiKeyAuth());

// Apply rate limiting based on API tier
publicApi.use(
  "/*",
  rateLimit({
    ...rateLimitTiers.api,
    keyGenerator: (c) => {
      const apiKey = c.get("apiKey");
      return apiKey?.id ?? "unknown";
    },
  })
);

/**
 * API Health Check
 * GET /api/v1/health
 */
publicApi.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

/**
 * Get current user info
 * GET /api/v1/me
 * Requires: read:data scope
 */
publicApi.get("/me", requireScopes("read:data"), (c) => {
  const apiKey = c.get("apiKey");

  // In a real app, you'd fetch user data from the database
  return c.json({
    userId: apiKey.userId,
    organizationId: apiKey.organizationId,
    scopes: apiKey.scopes,
  });
});

/**
 * List resources
 * GET /api/v1/resources
 * Requires: read:data scope
 */
publicApi.get("/resources", requireScopes("read:data"), (c) => {
  const { limit = "10", offset = "0" } = c.req.query();
  const apiKey = c.get("apiKey");

  // Return empty data structure for now - connect to your data source
  return c.json({
    data: [],
    pagination: {
      limit: Number.parseInt(limit, 10),
      offset: Number.parseInt(offset, 10),
      total: 0,
    },
    organizationId: apiKey.organizationId,
  });
});

/**
 * Create resource
 * POST /api/v1/resources
 * Requires: write:data scope
 */
publicApi.post("/resources", requireScopes("write:data"), async (c) => {
  const body = await c.req.json();
  const apiKey = c.get("apiKey");

  // Create resource - connect to your data source
  return c.json(
    {
      id: crypto.randomUUID(),
      organizationId: apiKey.organizationId,
      ...body,
      createdAt: new Date().toISOString(),
    },
    201
  );
});

/**
 * Get analytics data
 * GET /api/v1/analytics
 * Requires: read:analytics scope
 */
publicApi.get("/analytics", requireScopes("read:analytics"), (c) => {
  const { period = "7d" } = c.req.query();
  const apiKey = c.get("apiKey");

  // Return analytics data - connect to your analytics source
  return c.json({
    period,
    organizationId: apiKey.organizationId,
    metrics: {
      totalUsers: 0,
      activeUsers: 0,
      newUsers: 0,
    },
    chartData: [],
  });
});

export { publicApi };
