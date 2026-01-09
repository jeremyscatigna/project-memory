import { randomUUID } from "node:crypto";
import type { Context, MiddlewareHandler } from "hono";
import { createRequestLogger, perfLog } from "../lib/logger";

/**
 * Get log level based on HTTP status code
 */
function getLogLevelForStatus(statusCode: number): "error" | "warn" | "info" {
  if (statusCode >= 500) {
    return "error";
  }
  if (statusCode >= 400) {
    return "warn";
  }
  return "info";
}

/**
 * Request logging middleware with structured output
 */
export function requestLogger(): MiddlewareHandler {
  return async (c, next) => {
    const start = Date.now();

    // Generate or extract request ID
    const requestId = c.req.header("x-request-id") || randomUUID();
    c.header("x-request-id", requestId);

    // Create request-scoped logger
    const reqLogger = createRequestLogger(requestId);

    // Log incoming request
    reqLogger.info(
      {
        type: "request",
        method: c.req.method,
        path: c.req.path,
        query: c.req.query(),
        userAgent: c.req.header("user-agent"),
        ip: getClientIp(c),
      },
      `${c.req.method} ${c.req.path}`
    );

    try {
      await next();
    } catch (error) {
      const duration = Date.now() - start;

      reqLogger.error(
        {
          type: "error",
          method: c.req.method,
          path: c.req.path,
          duration,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        `Request failed: ${c.req.method} ${c.req.path}`
      );

      throw error;
    }

    const duration = Date.now() - start;
    const status = c.res.status;

    // Determine log level based on status
    const logLevel = getLogLevelForStatus(status);

    reqLogger[logLevel](
      {
        type: "response",
        method: c.req.method,
        path: c.req.path,
        status,
        duration,
        contentLength: c.res.headers.get("content-length"),
      },
      `${c.req.method} ${c.req.path} -> ${status} (${duration}ms)`
    );

    // Log slow requests
    if (duration > 1000) {
      perfLog("slow_request", duration, {
        method: c.req.method,
        path: c.req.path,
        status,
      });
    }
  };
}

/**
 * Extract client IP from various headers
 */
function getClientIp(c: Context): string {
  return (
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-real-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export default requestLogger;
