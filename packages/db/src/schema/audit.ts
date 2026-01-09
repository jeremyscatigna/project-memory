import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { organization } from "./organization";

// Audit log level enum
export const auditLogLevelEnum = pgEnum("audit_log_level", [
  "info",
  "warning",
  "error",
  "critical",
]);

// Audit log table
export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "set null",
    }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(), // e.g., "user.created", "member.invited", "settings.updated"
    resource: text("resource").notNull(), // e.g., "user", "organization", "team", "invitation"
    resourceId: text("resource_id"), // ID of the affected resource
    level: auditLogLevelEnum("level").default("info").notNull(),
    metadata: jsonb("metadata"), // Additional context as JSON
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_log_organization_id_idx").on(table.organizationId),
    index("audit_log_user_id_idx").on(table.userId),
    index("audit_log_action_idx").on(table.action),
    index("audit_log_resource_idx").on(table.resource),
    index("audit_log_created_at_idx").on(table.createdAt),
  ]
);

// Relations
export const auditLogRelations = relations(auditLog, ({ one }) => ({
  organization: one(organization, {
    fields: [auditLog.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [auditLog.userId],
    references: [user.id],
  }),
}));

// Export types
export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;

// Common audit actions
export const AuditActions = {
  // User actions
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
  USER_LOGIN: "user.login",
  USER_LOGOUT: "user.logout",
  USER_PASSWORD_CHANGED: "user.password_changed",
  USER_PASSWORD_RESET: "user.password_reset",
  USER_EMAIL_VERIFIED: "user.email_verified",

  // Organization actions
  ORGANIZATION_CREATED: "organization.created",
  ORGANIZATION_UPDATED: "organization.updated",
  ORGANIZATION_DELETED: "organization.deleted",
  ORGANIZATION_PLAN_CHANGED: "organization.plan_changed",

  // Member actions
  MEMBER_INVITED: "member.invited",
  MEMBER_JOINED: "member.joined",
  MEMBER_REMOVED: "member.removed",
  MEMBER_ROLE_CHANGED: "member.role_changed",
  MEMBER_LEFT: "member.left",

  // Team actions
  TEAM_CREATED: "team.created",
  TEAM_UPDATED: "team.updated",
  TEAM_DELETED: "team.deleted",
  TEAM_MEMBER_ADDED: "team.member_added",
  TEAM_MEMBER_REMOVED: "team.member_removed",

  // Invitation actions
  INVITATION_SENT: "invitation.sent",
  INVITATION_ACCEPTED: "invitation.accepted",
  INVITATION_REJECTED: "invitation.rejected",
  INVITATION_CANCELED: "invitation.canceled",
  INVITATION_EXPIRED: "invitation.expired",

  // Billing actions
  BILLING_SUBSCRIPTION_CREATED: "billing.subscription_created",
  BILLING_SUBSCRIPTION_UPDATED: "billing.subscription_updated",
  BILLING_SUBSCRIPTION_CANCELED: "billing.subscription_canceled",
  BILLING_PAYMENT_SUCCEEDED: "billing.payment_succeeded",
  BILLING_PAYMENT_FAILED: "billing.payment_failed",

  // Admin actions
  ADMIN_USER_IMPERSONATED: "admin.user_impersonated",
  ADMIN_USER_BANNED: "admin.user_banned",
  ADMIN_USER_UNBANNED: "admin.user_unbanned",
  ADMIN_ORGANIZATION_SUSPENDED: "admin.organization_suspended",

  // API actions
  API_KEY_CREATED: "api.key_created",
  API_KEY_REVOKED: "api.key_revoked",
} as const;

export type AuditAction = (typeof AuditActions)[keyof typeof AuditActions];
