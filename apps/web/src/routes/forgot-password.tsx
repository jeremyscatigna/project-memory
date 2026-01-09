import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AuthLayout, ForgotPasswordForm } from "@/components/auth";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      description="Enter your email to receive reset instructions"
      title="Reset password"
    >
      <ForgotPasswordForm onBack={() => navigate({ to: "/login" })} />
    </AuthLayout>
  );
}
