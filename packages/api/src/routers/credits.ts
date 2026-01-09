import { Polar } from "@polar-sh/sdk";
import { PLAN_CREDITS } from "@saas-template/db/schema";
import { env } from "@saas-template/env/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../index";
import {
  adminAdjustCredits,
  getActivePackages,
  getCreditStatus,
  getTransactionHistory,
  getUsageAnalytics,
} from "../lib/credits";

// Initialize Polar client for credit purchases
const polarClient = env.POLAR_ACCESS_TOKEN
  ? new Polar({ accessToken: env.POLAR_ACCESS_TOKEN, server: "sandbox" })
  : null;

export const creditsRouter = router({
  /**
   * Get current credit status for the active organization
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.session.session.activeOrganizationId;

    if (!orgId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No organization selected",
      });
    }

    const status = await getCreditStatus(orgId);

    if (!status) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Credit status not found",
      });
    }

    return status;
  }),

  /**
   * Get transaction history with pagination and filters
   */
  getTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        type: z
          .enum([
            "purchase",
            "subscription",
            "consumption",
            "refund",
            "trial",
            "bonus",
            "adjustment",
            "expiration",
          ])
          .optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      })
    )
    .query(({ ctx, input }) => {
      const orgId = ctx.session.session.activeOrganizationId;

      if (!orgId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization selected",
        });
      }

      return getTransactionHistory({
        organizationId: orgId,
        limit: input.limit,
        offset: input.offset,
        type: input.type,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      });
    }),

  /**
   * Get available credit packages for purchase
   */
  getPackages: protectedProcedure.query(() => {
    return getActivePackages();
  }),

  /**
   * Get usage analytics for the active organization
   */
  getUsageAnalytics: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(({ ctx, input }) => {
      const orgId = ctx.session.session.activeOrganizationId;

      if (!orgId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization selected",
        });
      }

      return getUsageAnalytics(orgId, input.days);
    }),

  /**
   * Get plan credit information
   */
  getPlanCredits: protectedProcedure.query(() => {
    return PLAN_CREDITS;
  }),

  /**
   * Admin: Adjust credits for an organization
   */
  adminAdjustCredits: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        amount: z.number(),
        reason: z.string().min(1).max(500),
      })
    )
    .mutation(({ ctx, input }) => {
      // Check if user is admin (you may want to add proper admin check)
      const userId = ctx.session.user.id;

      // For now, just check that user is part of the org as owner/admin
      // In production, you'd want a proper admin role check
      const orgId = ctx.session.session.activeOrganizationId;

      if (!orgId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization selected",
        });
      }

      // Only allow adjusting own organization for now
      if (input.organizationId !== orgId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot adjust credits for another organization",
        });
      }

      return adminAdjustCredits({
        organizationId: input.organizationId,
        adminUserId: userId,
        amount: input.amount,
        reason: input.reason,
      });
    }),

  /**
   * Purchase a credit package via Polar checkout
   */
  purchasePackage: protectedProcedure
    .input(
      z.object({
        packageId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!polarClient) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Payment system not configured",
        });
      }

      const orgId = ctx.session.session.activeOrganizationId;
      if (!orgId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization selected",
        });
      }

      // Get the package to find the Polar product ID
      const packages = await getActivePackages();
      const pkg = packages.find((p) => p.id === input.packageId);

      if (!pkg) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credit package not found",
        });
      }

      if (!pkg.polarProductId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "This package is not available for purchase",
        });
      }

      // Create Polar checkout session
      const checkout = await polarClient.checkouts.create({
        productId: pkg.polarProductId,
        successUrl: `${env.CORS_ORIGIN}/dashboard/billing?success=credits`,
        metadata: {
          organizationId: orgId,
          userId: ctx.session.user.id,
          packageId: input.packageId,
          credits: String(pkg.credits + pkg.bonusCredits),
        },
      });

      return { checkoutUrl: checkout.url };
    }),
});
