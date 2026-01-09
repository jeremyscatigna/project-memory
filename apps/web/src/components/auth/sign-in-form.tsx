import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { OrDivider, SocialButtons } from "./social-buttons";

interface SignInFormProps {
  onSwitchToSignUp: () => void;
  onSwitchToMagicLink: () => void;
}

export function SignInForm({
  onSwitchToSignUp,
  onSwitchToMagicLink,
}: SignInFormProps) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
          rememberMe,
        },
        {
          onSuccess: () => {
            toast.success("Welcome back!");
            navigate({ to: "/dashboard" });
          },
          onError: (error) => {
            toast.error(error.error.message || "Invalid email or password");
          },
        }
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.string().email("Please enter a valid email address"),
        password: z.string().min(1, "Password is required"),
      }),
    },
  });

  return (
    <div className="space-y-6">
      <SocialButtons />
      <OrDivider />

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
                Email
              </Label>
              <Input
                autoComplete="email"
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

        <form.Field name="password">
          {(field) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-300" htmlFor={field.name}>
                  Password
                </Label>
                <Link
                  className="text-sm text-zinc-400 transition-colors hover:text-violet-400"
                  to="/forgot-password"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  autoComplete="current-password"
                  className={`border-zinc-800 bg-zinc-900/50 pr-10 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20 ${field.state.meta.errors.length > 0 ? "border-red-500" : ""}`}
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter your password"
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
              {field.state.meta.errors.map((error) => (
                <p className="text-red-400 text-sm" key={error?.message}>
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <div className="flex items-center space-x-2">
          <Checkbox
            checked={rememberMe}
            className="border-zinc-700 data-[state=checked]:border-violet-600 data-[state=checked]:bg-violet-600"
            id="remember"
            onCheckedChange={(checked) => setRememberMe(checked === true)}
          />
          <Label
            className="cursor-pointer font-normal text-sm text-zinc-400"
            htmlFor="remember"
          >
            Remember me for 30 days
          </Label>
        </div>

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
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <Button
        className="w-full text-zinc-400 hover:bg-zinc-900 hover:text-white"
        onClick={onSwitchToMagicLink}
        variant="ghost"
      >
        <Mail className="mr-2 h-4 w-4" />
        Sign in with magic link
      </Button>

      <p className="text-center text-sm text-zinc-500">
        Don't have an account?{" "}
        <button
          className="font-medium text-violet-400 transition-colors hover:text-violet-300"
          onClick={onSwitchToSignUp}
          type="button"
        >
          Sign up
        </button>
      </p>
    </div>
  );
}
