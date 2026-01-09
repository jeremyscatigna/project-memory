import { db } from "@saas-template/db";
import {
  account,
  auditLog,
  dataExportRequest,
  session,
  user,
} from "@saas-template/db/schema";
import { tasks } from "@trigger.dev/sdk";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../index";

export const userRouter = router({
  /**
   * Request a data export (GDPR compliance)
   * Creates a new export request that will be processed asynchronously
   */
  requestDataExport: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Check for existing pending/processing request
    const existingRequest = await db.query.dataExportRequest.findFirst({
      where: (req, { and, eq, or }) =>
        and(
          eq(req.userId, userId),
          or(eq(req.status, "pending"), eq(req.status, "processing"))
        ),
    });

    if (existingRequest) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "You already have a pending data export request. Please wait for it to complete.",
      });
    }

    // Create new export request
    const requestId = crypto.randomUUID();
    await db.insert(dataExportRequest).values({
      id: requestId,
      userId,
      status: "pending",
    });

    // Trigger background job to process the export
    await tasks.trigger("process-data-export", { requestId });

    return {
      id: requestId,
      status: "pending",
      message:
        "Your data export request has been submitted. You will be notified when it's ready.",
    };
  }),

  /**
   * Get the status of data export requests
   */
  getDataExportRequests: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const requests = await db.query.dataExportRequest.findMany({
      where: eq(dataExportRequest.userId, userId),
      orderBy: [desc(dataExportRequest.createdAt)],
      limit: 10,
    });

    return requests.map((req) => ({
      id: req.id,
      status: req.status,
      downloadUrl: req.status === "completed" ? req.downloadUrl : null,
      expiresAt: req.expiresAt,
      completedAt: req.completedAt,
      createdAt: req.createdAt,
    }));
  }),

  /**
   * Get user's complete data (for immediate viewing)
   * Returns all user data in a structured format
   */
  getMyData: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Fetch user data
    const userData = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!userData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Fetch sessions
    const sessions = await db.query.session.findMany({
      where: eq(session.userId, userId),
    });

    // Fetch accounts (OAuth connections)
    const accounts = await db.query.account.findMany({
      where: eq(account.userId, userId),
    });

    // Fetch audit logs
    const auditLogs = await db.query.auditLog.findMany({
      where: eq(auditLog.userId, userId),
      orderBy: [desc(auditLog.createdAt)],
      limit: 100,
    });

    return {
      profile: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        emailVerified: userData.emailVerified,
        image: userData.image,
        role: userData.role,
        twoFactorEnabled: userData.twoFactorEnabled,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
      sessions: sessions.map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
      })),
      connectedAccounts: accounts.map((a) => ({
        id: a.id,
        provider: a.providerId,
        accountId: a.accountId,
        createdAt: a.createdAt,
      })),
      activityLog: auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        metadata: log.metadata,
        createdAt: log.createdAt,
      })),
      exportedAt: new Date().toISOString(),
    };
  }),

  /**
   * Delete a data export request
   */
  deleteDataExportRequest: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const request = await db.query.dataExportRequest.findFirst({
        where: (req, { and, eq }) =>
          and(eq(req.id, input.id), eq(req.userId, userId)),
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Export request not found",
        });
      }

      await db
        .delete(dataExportRequest)
        .where(eq(dataExportRequest.id, input.id));

      return { success: true };
    }),
});
