import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  // Admin plugin fields
  role: text("role").default("user"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  // Two-factor authentication field
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Organization plugin fields
    activeOrganizationId: text("active_organization_id"),
    activeTeamId: text("active_team_id"),
    // Admin plugin field for impersonation
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

// Feature flags table
export const featureFlag = pgTable(
  "feature_flag",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    enabled: boolean("enabled").default(false).notNull(),
    percentage: text("percentage").default("0"), // For gradual rollout (0-100)
    allowedUsers: text("allowed_users").array(), // Specific user IDs
    allowedOrganizations: text("allowed_organizations").array(), // Specific org IDs
    metadata: text("metadata"), // JSON metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("feature_flag_key_idx").on(table.key)]
);

// Webhooks table for outgoing webhook subscriptions
export const webhook = pgTable(
  "webhook",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id"),
    name: text("name").notNull(),
    url: text("url").notNull(),
    secret: text("secret").notNull(), // For signature verification
    events: text("events").array().notNull(), // e.g., ['user.created', 'user.deleted']
    enabled: boolean("enabled").default(true).notNull(),
    failureCount: text("failure_count").default("0"),
    lastTriggeredAt: timestamp("last_triggered_at"),
    lastSuccessAt: timestamp("last_success_at"),
    lastFailureAt: timestamp("last_failure_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("webhook_userId_idx").on(table.userId),
    index("webhook_organizationId_idx").on(table.organizationId),
  ]
);

// Webhook delivery logs
export const webhookDelivery = pgTable(
  "webhook_delivery",
  {
    id: text("id").primaryKey(),
    webhookId: text("webhook_id")
      .notNull()
      .references(() => webhook.id, { onDelete: "cascade" }),
    event: text("event").notNull(),
    payload: text("payload").notNull(), // JSON stringified
    statusCode: text("status_code"),
    responseBody: text("response_body"),
    duration: text("duration"), // in ms
    success: boolean("success").default(false).notNull(),
    attempts: text("attempts").default("1"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("webhook_delivery_webhookId_idx").on(table.webhookId),
    index("webhook_delivery_createdAt_idx").on(table.createdAt),
  ]
);

// API keys table for public API access
export const apiKey = pgTable(
  "api_key",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id"),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull(), // Hashed API key
    keyPrefix: text("key_prefix").notNull(), // First 8 chars for identification
    scopes: text("scopes").array(), // e.g., ['read:data', 'write:data']
    rateLimit: text("rate_limit").default("100/minute"), // Rate limit tier
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("api_key_userId_idx").on(table.userId),
    index("api_key_keyPrefix_idx").on(table.keyPrefix),
  ]
);

// Data export requests table (GDPR compliance)
export const dataExportRequest = pgTable(
  "data_export_request",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // pending, processing, completed, failed
    downloadUrl: text("download_url"),
    expiresAt: timestamp("expires_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("data_export_request_userId_idx").on(table.userId)]
);

// Notifications table
export const notification = pgTable(
  "notification",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // info, success, warning, error, system
    title: text("title").notNull(),
    message: text("message").notNull(),
    link: text("link"), // Optional link to navigate to
    read: boolean("read").default(false).notNull(),
    metadata: text("metadata"), // JSON string for additional data
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notification_userId_idx").on(table.userId),
    index("notification_userId_read_idx").on(table.userId, table.read),
  ]
);

// File uploads table
export const fileUpload = pgTable(
  "file_upload",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id"),
    key: text("key").notNull().unique(), // S3/R2 key
    filename: text("filename").notNull(), // Original filename
    mimeType: text("mime_type").notNull(),
    size: text("size").notNull(), // File size in bytes (as string for bigint)
    category: text("category").default("general"), // general, avatar, document, etc.
    isPublic: boolean("is_public").default(false).notNull(),
    metadata: text("metadata"), // JSON string for additional metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("file_upload_userId_idx").on(table.userId),
    index("file_upload_key_idx").on(table.key),
  ]
);

// Two-factor authentication table
export const twoFactor = pgTable(
  "two_factor",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    secret: text("secret"),
    backupCodes: text("backup_codes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("two_factor_userId_idx").on(table.userId)]
);

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  twoFactorData: one(twoFactor),
  dataExportRequests: many(dataExportRequest),
  apiKeys: many(apiKey),
  webhooks: many(webhook),
  fileUploads: many(fileUpload),
  notifications: many(notification),
}));

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
  user: one(user, {
    fields: [apiKey.userId],
    references: [user.id],
  }),
}));

export const webhookRelations = relations(webhook, ({ one, many }) => ({
  user: one(user, {
    fields: [webhook.userId],
    references: [user.id],
  }),
  deliveries: many(webhookDelivery),
}));

export const webhookDeliveryRelations = relations(
  webhookDelivery,
  ({ one }) => ({
    webhook: one(webhook, {
      fields: [webhookDelivery.webhookId],
      references: [webhook.id],
    }),
  })
);

export const dataExportRequestRelations = relations(
  dataExportRequest,
  ({ one }) => ({
    user: one(user, {
      fields: [dataExportRequest.userId],
      references: [user.id],
    }),
  })
);

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, {
    fields: [twoFactor.userId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const fileUploadRelations = relations(fileUpload, ({ one }) => ({
  user: one(user, {
    fields: [fileUpload.userId],
    references: [user.id],
  }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
}));
