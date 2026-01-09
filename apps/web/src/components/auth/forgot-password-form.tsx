import { useForm } from "@tanstack/react-form";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const form = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      const client = authClient as unknown as {
        forgetPassword?: (
          data: { email: string; redirectTo: string },
          options: {
            onSuccess: () => void;
            onError: (error: { error: { message?: string } }) => void;
          }
        ) => Promise<void>;
      };

      if (client.forgetPassword) {
        await client.forgetPassword(
          {
            email: value.email,
            redirectTo: "/reset-password",
          },
          {
            onSuccess: () => {
              setSentEmail(value.email);
              setEmailSent(true);
              toast.success("Password reset email sent!");
            },
            onError: (error: { error: { message?: string } }) => {
              toast.error(error.error.message || "Failed to send reset email");
            },
          }
        );
      } else {
        toast.error("Password reset is not configured");
      }
    },
    validators: {
      onSubmit: z.object({
        email: z.string().email("Please enter a valid email address"),
      }),
    },
  });

  if (emailSent) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <div className="space-y-2">
            <h2 className="font-semibold text-white text-xl">
              Check your email
            </h2>
            <p className="text-sm text-zinc-400">
              We've sent password reset instructions to{" "}
              <span className="font-medium text-white">{sentEmail}</span>
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-400">
          <p>
            Click the link in the email to reset your password. The link will
            expire in 1 hour.
          </p>
        </div>

        <Button
          className="w-full border-zinc-800 bg-transparent text-white hover:bg-zinc-900 hover:text-white"
          onClick={onBack}
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sign in
        </Button>

        <p className="text-center text-xs text-zinc-500">
          Didn't receive the email? Check your spam folder or{" "}
          <button
            className="text-violet-400 transition-colors hover:text-violet-300"
            onClick={() => form.handleSubmit()}
            type="button"
          >
            resend
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        className="-ml-2 text-zinc-400 hover:bg-zinc-900 hover:text-white"
        onClick={onBack}
        size="sm"
        variant="ghost"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10">
          <KeyRound className="h-6 w-6 text-violet-400" />
        </div>
        <h2 className="font-semibold text-white text-xl">
          Forgot your password?
        </h2>
        <p className="text-sm text-zinc-400">
          No worries! Enter your email and we'll send you reset instructions.
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="email">
          {(field) => (
            <div className="space-y-2">
              <Label className="text-zinc-300" htmlFor={field.name}>
                Email address
              </Label>
              <Input
                autoComplete="email"
                autoFocus
                className={`border-zinc-800 bg-zinc-900/50 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20 ${field.state.meta.errors.length > 0 ? "border-red-500" : ""}`}
                id={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="name@example.com"
                type="email"
                value={field.state.value}
              />
              {field.state.meta.errors.map((error) => (
                <p className="text-red-400 text-sm" key={error?.message}>
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Subscribe>
          {(state) => (
            <Button
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 font-medium text-white hover:from-violet-500 hover:to-purple-500"
              disabled={state.isSubmitting}
              type="submit"
            >
              {state.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send reset instructions"
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
