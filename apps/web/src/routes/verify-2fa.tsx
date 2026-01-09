import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/verify-2fa")({
  component: Verify2FAPage,
});

function Verify2FAPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await authClient.twoFactor.verifyTotp({
        code,
        trustDevice,
      });

      if (result.error) {
        toast.error(result.error.message || "Invalid verification code");
        return;
      }

      toast.success("Verification successful!");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyBackupCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupCode) {
      toast.error("Please enter a backup code");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await authClient.twoFactor.verifyBackupCode({
        code: backupCode,
        trustDevice,
      });

      if (result.error) {
        toast.error(result.error.message || "Invalid backup code");
        return;
      }

      toast.success("Verification successful!");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBackToLogin = () => {
    navigate({ to: "/login" });
  };

  return (
    <AuthLayout
      description="Enter your verification code to continue"
      title="Two-Factor Authentication"
    >
      <div className="space-y-6">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-xl">Verify Your Identity</CardTitle>
            <CardDescription>
              Enter the code from your authenticator app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs className="w-full" defaultValue="totp">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="totp">Authenticator</TabsTrigger>
                <TabsTrigger value="backup">Backup Code</TabsTrigger>
              </TabsList>

              <TabsContent className="mt-4" value="totp">
                <form className="space-y-4" onSubmit={handleVerifyTotp}>
                  <div className="space-y-2">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                      autoComplete="one-time-code"
                      autoFocus
                      className="h-14 text-center font-mono text-2xl tracking-[0.5em]"
                      id="code"
                      inputMode="numeric"
                      maxLength={6}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, ""))
                      }
                      pattern="[0-9]*"
                      placeholder="000000"
                      type="text"
                      value={code}
                    />
                    <p className="text-center text-muted-foreground text-xs">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      checked={trustDevice}
                      className="h-4 w-4 rounded border-gray-300"
                      id="trust"
                      onChange={(e) => setTrustDevice(e.target.checked)}
                      type="checkbox"
                    />
                    <Label className="font-normal text-sm" htmlFor="trust">
                      Trust this device for 30 days
                    </Label>
                  </div>

                  <Button
                    className="h-11 w-full"
                    disabled={isVerifying || code.length !== 6}
                    type="submit"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent className="mt-4" value="backup">
                <form className="space-y-4" onSubmit={handleVerifyBackupCode}>
                  <div className="space-y-2">
                    <Label htmlFor="backup-code">Backup Code</Label>
                    <div className="relative">
                      <KeyRound className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="h-11 pl-10"
                        id="backup-code"
                        onChange={(e) => setBackupCode(e.target.value)}
                        placeholder="Enter your backup code"
                        type="text"
                        value={backupCode}
                      />
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Use one of your backup codes if you don't have access to
                      your authenticator
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      checked={trustDevice}
                      className="h-4 w-4 rounded border-gray-300"
                      id="trust-backup"
                      onChange={(e) => setTrustDevice(e.target.checked)}
                      type="checkbox"
                    />
                    <Label
                      className="font-normal text-sm"
                      htmlFor="trust-backup"
                    >
                      Trust this device for 30 days
                    </Label>
                  </div>

                  <Button
                    className="h-11 w-full"
                    disabled={isVerifying || !backupCode}
                    type="submit"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify with Backup Code"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Button className="w-full" onClick={handleBackToLogin} variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to login
        </Button>
      </div>
    </AuthLayout>
  );
}
