import { randomUUID } from "node:crypto";
import { db } from "@saas-template/db";
import { notification } from "@saas-template/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../index";

export const notificationsRouter = router({
  /**
   * Get user's notifications
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { limit, unreadOnly } = input;

      const conditions = [eq(notification.userId, userId)];
      if (unreadOnly) {
        conditions.push(eq(notification.read, false));
      }

      const notifications = await db.query.notification.findMany({
        where: and(...conditions),
        orderBy: [desc(notification.createdAt)],
        limit: limit + 1,
      });

      let nextCursor: string | undefined;
      if (notifications.length > limit) {
        const nextItem = notifications.pop();
        nextCursor = nextItem?.id;
      }

      return {
        notifications: notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          link: n.link,
          read: n.read,
          metadata: n.metadata ? JSON.parse(n.metadata) : null,
          createdAt: n.createdAt,
        })),
        nextCursor,
      };
    }),

  /**
   * Get unread count
   */
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notification)
      .where(
        and(eq(notification.userId, userId), eq(notification.read, false))
      );

    return { count: result[0]?.count ?? 0 };
  }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      await db
        .update(notification)
        .set({ read: true })
        .where(
          and(eq(notification.id, input.id), eq(notification.userId, userId))
        );

      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    await db
      .update(notification)
      .set({ read: true })
      .where(
        and(eq(notification.userId, userId), eq(notification.read, false))
      );

    return { success: true };
  }),

  /**
   * Delete a notification
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      await db
        .delete(notification)
        .where(
          and(eq(notification.id, input.id), eq(notification.userId, userId))
        );

      return { success: true };
    }),

  /**
   * Delete all read notifications
   */
  deleteAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    await db
      .delete(notification)
      .where(and(eq(notification.userId, userId), eq(notification.read, true)));

    return { success: true };
  }),

  /**
   * Delete all notifications
   */
  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    await db.delete(notification).where(eq(notification.userId, userId));

    return { success: true };
  }),
});

/**
 * Helper function to create a notification (for use in other parts of the app)
 */
export async function createNotification(
  userId: string,
  data: {
    type: "info" | "success" | "warning" | "error" | "system";
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const id = randomUUID();

  await db.insert(notification).values({
    id,
    userId,
    type: data.type,
    title: data.title,
    message: data.message,
    link: data.link,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
  });

  return { id };
}

/**
 * Helper to send system notifications to multiple users
 */
export async function broadcastNotification(
  userIds: string[],
  data: {
    type: "info" | "success" | "warning" | "error" | "system";
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const notifications = userIds.map((userId) => ({
    id: randomUUID(),
    userId,
    type: data.type,
    title: data.title,
    message: data.message,
    link: data.link,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
  }));

  await db.insert(notification).values(notifications);

  return { count: notifications.length };
}
