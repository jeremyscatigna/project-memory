import { useForm } from "@tanstack/react-form";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { authClient } from "@/lib/auth-client";

// Password validation regex patterns
const UPPERCASE_REGEX = /[A-Z]/;
const LOWERCASE_REGEX = /[a-z]/;
const NUMBER_REGEX = /[0-9]/;
const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

// Password strength calculation
function calculatePasswordStrength(password: string): {
  score: number;
  requirements: { label: string; met: boolean }[];
} {
  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains uppercase letter", met: UPPERCASE_REGEX.test(password) },
    { label: "Contains lowercase letter", met: LOWERCASE_REGEX.test(password) },
    { label: "Contains number", met: NUMBER_REGEX.test(password) },
    {
      label: "Contains special character",
      met: SPECIAL_CHAR_REGEX.test(password),
    },
  ];

  const score = requirements.filter((r) => r.met).length * 20;
  return { score, requirements };
}

function getStrengthColor(score: number): string {
  if (score <= 20) {
    return "bg-red-500";
  }
  if (score <= 40) {
    return "bg-orange-500";
  }
  if (score <= 60) {
    return "bg-yellow-500";
  }
  if (score <= 80) {
    return "bg-lime-500";
  }
  return "bg-green-500";
}

function getStrengthLabel(score: number): string {
  if (score <= 20) {
    return "Very weak";
  }
  if (score <= 40) {
    return "Weak";
  }
  if (score <= 60) {
    return "Fair";
  }
  if (score <= 80) {
    return "Good";
  }
  return "Strong";
}

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/reset-password" });
  const token = (search as { token?: string }).token;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [resetComplete, setResetComplete] = useState(false);

  const passwordStrength = useMemo(
    () => calculatePasswordStrength(password),
    [password]
  );

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      if (!token) {
        toast.error("Invalid or expired reset link");
        return;
      }

      if (value.password !== value.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      await authClient.resetPassword(
        {
          newPassword: value.password,
          token,
        },
        {
          onSuccess: () => {
            setResetComplete(true);
            toast.success("Password reset successfully!");
          },
          onError: (error) => {
            toast.error(error.error.message || "Failed to reset password");
          },
        }
      );
    },
    validators: {
      onSubmit: z
        .object({
          password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(UPPERCASE_REGEX, "Password must contain an uppercase letter")
            .regex(LOWERCASE_REGEX, "Password must contain a lowercase letter")
            .regex(NUMBER_REGEX, "Password must contain a number"),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: "Passwords do not match",
          path: ["confirmPassword"],
        }),
    },
  });

  if (!token) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <X className="h-8 w-8 text-red-400" />
          </div>
          <div className="space-y-2">
            <h2 className="font-semibold text-white text-xl">
              Invalid Reset Link
            </h2>
            <p className="text-sm text-zinc-400">
              This password reset link is invalid or has expired.
            </p>
          </div>
        </div>

        <Button
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 font-medium text-white hover:from-violet-500 hover:to-purple-500"
          onClick={() => navigate({ to: "/forgot-password" })}
        >
          Request a new link
        </Button>
      </div>
    );
  }

  if (resetComplete) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <div className="space-y-2">
            <h2 className="font-semibold text-white text-xl">
              Password Reset Complete
            </h2>
            <p className="text-sm text-zinc-400">
              Your password has been successfully reset. You can now sign in
              with your new password.
            </p>
          </div>
        </div>

        <Button
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 font-medium text-white hover:from-violet-500 hover:to-purple-500"
          onClick={() => navigate({ to: "/login" })}
        >
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10">
          <KeyRound className="h-6 w-6 text-violet-400" />
        </div>
        <h2 className="font-semibold text-white text-xl">
          Reset your password
        </h2>
        <p className="text-sm text-zinc-400">Enter your new password below.</p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="password">
          {(field) => (
            <div className="space-y-2">
              <Label className="text-zinc-300" htmlFor={field.name}>
                New password
              </Label>
              <div className="relative">
                <Input
                  autoComplete="new-password"
                  className={`border-zinc-800 bg-zinc-900/50 pr-10 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20 ${field.state.meta.errors.length > 0 ? "border-red-500" : ""}`}
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                    setPassword(e.target.value);
                  }}
                  placeholder="Create a strong password"
                  type={showPassword ? "text" : "password"}
                  value={field.state.value}
                />
                <Button
                  className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-zinc-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-zinc-500" />
                  )}
                </Button>
              </div>

              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Progress
                      className={`h-1.5 flex-1 bg-zinc-800 [&>div]:${getStrengthColor(passwordStrength.score)}`}
                      value={passwordStrength.score}
                    />
                    <span className="text-xs text-zinc-500">
                      {getStrengthLabel(passwordStrength.score)}
                    </span>
                  </div>
                  <ul className="grid grid-cols-2 gap-1 text-xs">
                    {passwordStrength.requirements.map((req) => (
                      <li
                        className={`flex items-center gap-1 ${
                          req.met ? "text-green-400" : "text-zinc-500"
                        }`}
                        key={req.label}
                      >
                        {req.met ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        {req.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="confirmPassword">
          {(field) => (
            <div className="space-y-2">
              <Label className="text-zinc-300" htmlFor={field.name}>
                Confirm password
              </Label>
              <div className="relative">
                <Input
                  autoComplete="new-password"
                  className={`border-zinc-800 bg-zinc-900/50 pr-10 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20 ${field.state.meta.errors.length > 0 ? "border-red-500" : ""}`}
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Confirm your password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={field.state.value}
                />
                <Button
                  className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-zinc-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-zinc-500" />
                  )}
                </Button>
              </div>
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
                  Resetting password...
                </>
              ) : (
                "Reset password"
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
