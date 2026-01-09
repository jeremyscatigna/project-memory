import { protectedProcedure, publicProcedure, router } from "../index";
import { adminRouter } from "./admin";
import { apiKeysRouter } from "./api-keys";
import { auditRouter } from "./audit";
import { creditsRouter } from "./credits";
import { featureFlagsRouter } from "./feature-flags";
import { notificationsRouter } from "./notifications";
import { uploadsRouter } from "./uploads";
import { userRouter } from "./user";
import { webhooksRouter } from "./webhooks";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  // Audit logs
  audit: auditRouter,
  // Credits management
  credits: creditsRouter,
  // User operations (profile, data export)
  user: userRouter,
  // API keys management
  apiKeys: apiKeysRouter,
  // Webhooks management
  webhooks: webhooksRouter,
  // Feature flags
  featureFlags: featureFlagsRouter,
  // File uploads
  uploads: uploadsRouter,
  // In-app notifications
  notifications: notificationsRouter,
  // Admin operations
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
