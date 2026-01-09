import {
  Check,
  Copy,
  Key,
  Loader2,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

interface TwoFactorSettingsProps {
  twoFactorEnabled: boolean;
  onUpdate?: () => void;
}

export function TwoFactorSettings({
  twoFactorEnabled,
  onUpdate,
}: TwoFactorSettingsProps) {
  const [isEnabling, setIsEnabling] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [setupStep, setSetupStep] = useState<
    "password" | "qr" | "verify" | "backup"
  >("password");
  const [password, setPassword] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleEnable2FA = async () => {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setIsEnabling(true);
    try {
      const result = await authClient.twoFactor.enable({
        password,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to enable 2FA");
        return;
      }

      if (result.data) {
        setTotpUri(result.data.totpURI);
        setBackupCodes(result.data.backupCodes);
        setSetupStep("qr");
      }
    } catch {
      toast.error("Failed to enable 2FA");
    } finally {
      setIsEnabling(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsEnabling(true);
    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: verificationCode,
      });

      if (result.error) {
        toast.error(result.error.message || "Invalid verification code");
        return;
      }

      setSetupStep("backup");
      toast.success("2FA enabled successfully!");
      onUpdate?.();
    } catch {
      toast.error("Verification failed");
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setIsDisabling(true);
    try {
      const result = await authClient.twoFactor.disable({
        password,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to disable 2FA");
        return;
      }

      toast.success("2FA disabled successfully");
      setPassword("");
      onUpdate?.();
    } catch {
      toast.error("Failed to disable 2FA");
    } finally {
      setIsDisabling(false);
    }
  };

  const handleCopyBackupCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success("Backup code copied!");
  };

  const handleCopyAllBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("All backup codes copied!");
  };

  const handleCloseSetup = () => {
    setShowSetupDialog(false);
    setSetupStep("password");
    setPassword("");
    setTotpUri("");
    setBackupCodes([]);
    setVerificationCode("");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </div>
            <Badge variant={twoFactorEnabled ? "default" : "secondary"}>
              {twoFactorEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              {twoFactorEnabled
                ? "Your account is protected with two-factor authentication. You'll need to enter a code from your authenticator app when signing in."
                : "Protect your account by requiring a verification code in addition to your password when signing in."}
            </p>

            {twoFactorEnabled ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <ShieldOff className="mr-2 h-4 w-4" />
                    Disable 2FA
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Disable Two-Factor Authentication?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will make your account less secure. You'll only need
                      your password to sign in.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Label htmlFor="disable-password">
                      Enter your password to confirm
                    </Label>
                    <Input
                      className="mt-2"
                      id="disable-password"
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      type="password"
                      value={password}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setPassword("")}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDisabling || !password}
                      onClick={handleDisable2FA}
                    >
                      {isDisabling ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Disabling...
                        </>
                      ) : (
                        "Disable 2FA"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button onClick={() => setShowSetupDialog(true)}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Enable 2FA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2FA Setup Dialog */}
      <Dialog onOpenChange={handleCloseSetup} open={showSetupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {setupStep === "password" && "Enable Two-Factor Authentication"}
              {setupStep === "qr" && "Scan QR Code"}
              {setupStep === "verify" && "Verify Setup"}
              {setupStep === "backup" && "Save Backup Codes"}
            </DialogTitle>
            <DialogDescription>
              {setupStep === "password" && "Enter your password to begin setup"}
              {setupStep === "qr" &&
                "Scan this QR code with your authenticator app"}
              {setupStep === "verify" &&
                "Enter the code from your authenticator app"}
              {setupStep === "backup" && "Save these codes in a safe place"}
            </DialogDescription>
          </DialogHeader>

          {setupStep === "password" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="setup-password">Password</Label>
                <Input
                  id="setup-password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  type="password"
                  value={password}
                />
              </div>
              <Button
                className="w-full"
                disabled={isEnabling || !password}
                onClick={handleEnable2FA}
              >
                {isEnabling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          )}

          {setupStep === "qr" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-lg border bg-white p-4">
                  {totpUri && (
                    <img
                      alt="2FA QR Code"
                      className="h-48 w-48"
                      height={192}
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUri)}`}
                      width={192}
                    />
                  )}
                </div>
                <p className="text-center text-muted-foreground text-sm">
                  Can't scan? Enter this code manually in your authenticator
                  app:
                </p>
                <code className="break-all rounded bg-muted px-3 py-2 text-xs">
                  {totpUri.split("secret=")[1]?.split("&")[0] || ""}
                </code>
              </div>
              <Button className="w-full" onClick={() => setSetupStep("verify")}>
                I've scanned the code
              </Button>
            </div>
          )}

          {setupStep === "verify" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verify-code">Verification Code</Label>
                <Input
                  className="text-center text-xl tracking-widest"
                  id="verify-code"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, ""))
                  }
                  pattern="[0-9]*"
                  placeholder="000000"
                  type="text"
                  value={verificationCode}
                />
              </div>
              <Button
                className="w-full"
                disabled={isEnabling || verificationCode.length !== 6}
                onClick={handleVerify2FA}
              >
                {isEnabling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Enable"
                )}
              </Button>
            </div>
          )}

          {setupStep === "backup" && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <Key className="h-4 w-4" />
                    Backup Codes
                  </div>
                  <Button
                    onClick={handleCopyAllBackupCodes}
                    size="sm"
                    variant="ghost"
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy all
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <button
                      className="flex items-center justify-between rounded bg-background px-3 py-2 font-mono text-sm transition-colors hover:bg-muted"
                      key={code}
                      onClick={() => handleCopyBackupCode(code, index)}
                    >
                      <span>{code}</span>
                      {copiedIndex === index ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-200">
                <strong>Important:</strong> Save these codes somewhere safe.
                Each code can only be used once.
              </div>
              <Button className="w-full" onClick={handleCloseSetup}>
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
