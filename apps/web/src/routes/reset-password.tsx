import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { AuthLayout, ResetPasswordForm } from "@/components/auth";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  validateSearch: searchSchema,
});

function ResetPasswordPage() {
  return (
    <AuthLayout
      description="Create a strong password for your account"
      title="Set new password"
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
