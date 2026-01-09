import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

/**
 * Custom statements for our application
 * These must match the server-side permissions exactly
 */
const statement = {
  ...defaultStatements,
  // Project-level permissions
  project: ["create", "read", "update", "delete", "share"],
  // Settings permissions
  settings: ["read", "update"],
  // Billing permissions
  billing: ["read", "update", "manage"],
  // Audit log permissions
  auditLog: ["read"],
  // API key permissions
  apiKey: ["create", "read", "revoke"],
  // Team permissions (extending defaults)
  team: ["create", "read", "update", "delete"],
} as const;

/**
 * Create the access control instance
 */
export const ac = createAccessControl(statement);

/**
 * Owner role - full access to everything
 */
export const owner = ac.newRole({
  ...ownerAc.statements,
  project: ["create", "read", "update", "delete", "share"],
  settings: ["read", "update"],
  billing: ["read", "update", "manage"],
  auditLog: ["read"],
  apiKey: ["create", "read", "revoke"],
  team: ["create", "read", "update", "delete"],
});

/**
 * Admin role - most permissions except destructive org operations
 */
export const admin = ac.newRole({
  ...adminAc.statements,
  project: ["create", "read", "update", "delete", "share"],
  settings: ["read", "update"],
  billing: ["read", "update"],
  auditLog: ["read"],
  apiKey: ["create", "read", "revoke"],
  team: ["create", "read", "update", "delete"],
});

/**
 * Member role - basic access
 */
export const member = ac.newRole({
  ...memberAc.statements,
  project: ["create", "read", "update"],
  settings: ["read"],
  billing: ["read"],
  team: ["read"],
});

/**
 * Viewer role - read-only access (custom role)
 */
export const viewer = ac.newRole({
  project: ["read"],
  settings: ["read"],
  team: ["read"],
});

/**
 * All roles exported for use in auth client
 */
export const roles = {
  owner,
  admin,
  member,
  viewer,
};
