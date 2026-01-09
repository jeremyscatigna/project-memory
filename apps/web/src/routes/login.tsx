import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import {
  AuthLayout,
  MagicLinkForm,
  SignInForm,
  SignUpForm,
} from "@/components/auth";
import Loader from "@/components/loader";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (session.data?.user) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

type AuthView = "sign-in" | "sign-up" | "magic-link";

function LoginPage() {
  const [view, setView] = useState<AuthView>("sign-in");
  const { isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  const getTitle = () => {
    switch (view) {
      case "sign-in":
        return "Welcome back";
      case "sign-up":
        return "Create an account";
      case "magic-link":
        return "Sign in with magic link";
    }
  };

  const getDescription = () => {
    switch (view) {
      case "sign-in":
        return "Enter your credentials to access your account";
      case "sign-up":
        return "Get started with your free account today";
      case "magic-link":
        return "We'll send you a link to sign in instantly";
    }
  };

  return (
    <AuthLayout description={getDescription()} title={getTitle()}>
      {view === "sign-in" && (
        <SignInForm
          onSwitchToMagicLink={() => setView("magic-link")}
          onSwitchToSignUp={() => setView("sign-up")}
        />
      )}
      {view === "sign-up" && (
        <SignUpForm onSwitchToSignIn={() => setView("sign-in")} />
      )}
      {view === "magic-link" && (
        <MagicLinkForm onBack={() => setView("sign-in")} />
      )}
    </AuthLayout>
  );
}
