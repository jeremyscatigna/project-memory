import { checkout, polar, portal } from "@polar-sh/better-auth";
import { db } from "@saas-template/db";
import * as schema from "@saas-template/db/schema";
import {
  InvitationEmail,
  MagicLinkEmail,
  sendEmail,
  TwoFactorOTPEmail,
} from "@saas-template/email";
import { env } from "@saas-template/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins";
import { admin } from "better-auth/plugins/admin";
import { magicLink } from "better-auth/plugins/magic-link";
import { organization } from "better-auth/plugins/organization";
import { AuditActions, createAuditLog } from "./lib/audit";
import { isPolarConfigured, polarClient } from "./lib/payments";
import { ac, roles } from "./permissions";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  appName: "SaaS Template",
  emailAndPassword: {
    enabled: true,
  },
  // Audit logging hooks
  databaseHooks: {
    user: {
      create: {
        after: async (user: {
          id: string;
          email: string;
          name: string | null;
        }) => {
          await createAuditLog({
            userId: user.id,
            action: AuditActions.USER_CREATED,
            resource: "user",
            resourceId: user.id,
            level: "info",
            metadata: {
              email: user.email,
              name: user.name,
            },
          });
        },
      },
    },
    session: {
      create: {
        after: async (session: {
          id: string;
          userId: string;
          userAgent?: string | null;
          ipAddress?: string | null;
        }) => {
          await createAuditLog({
            userId: session.userId,
            action: AuditActions.USER_LOGIN,
            resource: "session",
            resourceId: session.id,
            level: "info",
            metadata: {
              userAgent: session.userAgent,
              ipAddress: session.ipAddress,
            },
            ipAddress: session.ipAddress ?? undefined,
            userAgent: session.userAgent ?? undefined,
          });
        },
      },
    },
    organization: {
      create: {
        after: async (org: { id: string; name: string; slug: string }) => {
          // Credits are initialized lazily when first accessed via getOrCreateOrgCredits

          await createAuditLog({
            organizationId: org.id,
            action: AuditActions.ORGANIZATION_CREATED,
            resource: "organization",
            resourceId: org.id,
            level: "info",
            metadata: {
              name: org.name,
              slug: org.slug,
            },
          });
        },
      },
    },
    member: {
      create: {
        after: async (member: {
          id: string;
          organizationId: string;
          userId: string;
          role: string;
        }) => {
          await createAuditLog({
            organizationId: member.organizationId,
            userId: member.userId,
            action: AuditActions.MEMBER_JOINED,
            resource: "member",
            resourceId: member.id,
            level: "info",
            metadata: {
              role: member.role,
            },
          });
        },
      },
    },
    invitation: {
      create: {
        after: async (invitation: {
          id: string;
          organizationId: string;
          inviterId: string;
          email: string;
          role: string;
        }) => {
          await createAuditLog({
            organizationId: invitation.organizationId,
            userId: invitation.inviterId,
            action: AuditActions.INVITATION_SENT,
            resource: "invitation",
            resourceId: invitation.id,
            level: "info",
            metadata: {
              email: invitation.email,
              role: invitation.role,
            },
          });
        },
      },
    },
  },
  // More permissive rate limiting
  rateLimit: {
    window: 60, // 60 seconds
    max: 100, // 100 requests per window
    customRules: {
      "/sign-in/*": {
        window: 60,
        max: 10, // 10 sign-in attempts per minute (instead of default 3 per 10s)
      },
      "/sign-up/*": {
        window: 60,
        max: 10,
      },
      "/magic-link/*": {
        window: 60,
        max: 10,
      },
      "/forgot-password/*": {
        window: 60,
        max: 5,
      },
    },
  },
  // Social providers (conditionally enabled based on env vars)
  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
  plugins: [
    // Organization & multi-tenancy
    organization({
      ac,
      roles: {
        owner: roles.owner,
        admin: roles.admin,
        member: roles.member,
        viewer: roles.viewer,
      },
      teams: {
        enabled: true,
        maximumTeams: 10,
        allowRemovingAllTeams: false,
      },
      async sendInvitationEmail(data) {
        const inviteLink = `${env.CORS_ORIGIN}/invite/${data.id}`;
        await sendEmail({
          to: data.email,
          subject: `You've been invited to join ${data.organization.name}`,
          template: InvitationEmail({
            inviterName: data.inviter.user.name ?? "A team member",
            organizationName: data.organization.name,
            role: data.role,
            inviteLink,
          }),
        });
      },
    }),
    // Admin capabilities
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    // Magic link / passwordless auth
    magicLink({
      async sendMagicLink({ email, url }) {
        await sendEmail({
          to: email,
          subject: "Sign in to SaaS Template",
          template: MagicLinkEmail({
            magicLink: url,
          }),
        });
      },
    }),
    // Two-factor authentication
    twoFactor({
      issuer: "SaaS Template",
      otpOptions: {
        async sendOTP({ user, otp }) {
          await sendEmail({
            to: user.email,
            subject: "Your SaaS Template verification code",
            template: TwoFactorOTPEmail({
              otp,
              userName: user.name ?? undefined,
            }),
          });
        },
      },
    }),
    // Polar payments (only if configured)
    ...(isPolarConfigured && polarClient
      ? [
          polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            enableCustomerPortal: true,
            use: [
              checkout({
                products: env.POLAR_PRODUCT_ID
                  ? [
                      {
                        productId: env.POLAR_PRODUCT_ID,
                        slug: "pro",
                      },
                    ]
                  : [],
                successUrl:
                  env.POLAR_SUCCESS_URL || `${env.CORS_ORIGIN}/billing/success`,
                authenticatedUsersOnly: true,
              }),
              portal(),
            ],
          }),
        ]
      : []),
  ],
});

// Export types for use in other packages
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
