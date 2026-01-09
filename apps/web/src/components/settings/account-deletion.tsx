import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

interface AccountDeletionProps {
  userEmail: string;
}

export function AccountDeletion({ userEmail }: AccountDeletionProps) {
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const [step, setStep] = useState<"confirm" | "verify">("confirm");
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmations, setConfirmations] = useState({
    understand: false,
    dataLoss: false,
    irreversible: false,
  });

  const allConfirmed =
    confirmations.understand &&
    confirmations.dataLoss &&
    confirmations.irreversible;
  const confirmTextCorrect = confirmText === "delete my account";

  const handleDelete = async () => {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setIsDeleting(true);
    try {
      // Delete user account through Better Auth
      const result = await authClient.deleteUser({
        password,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to delete account");
        return;
      }

      toast.success("Account deleted successfully");
      await authClient.signOut();
      navigate({ to: "/" });
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setStep("confirm");
    setPassword("");
    setConfirmText("");
    setConfirmations({
      understand: false,
      dataLoss: false,
      irreversible: false,
    });
  };

  return (
    <>
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Account
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm">
              <p className="mb-2 font-medium text-destructive">
                Warning: This action is irreversible
              </p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>All your data will be permanently deleted</li>
                <li>You will lose access to all organizations you own</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>
            <Button onClick={() => setShowDialog(true)} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog onOpenChange={handleCloseDialog} open={showDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              {step === "confirm"
                ? "Please confirm that you understand the consequences"
                : "Enter your password to confirm deletion"}
            </DialogDescription>
          </DialogHeader>

          {step === "confirm" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={confirmations.understand}
                    id="understand"
                    onCheckedChange={(checked) =>
                      setConfirmations((prev) => ({
                        ...prev,
                        understand: checked === true,
                      }))
                    }
                  />
                  <Label
                    className="cursor-pointer text-sm leading-relaxed"
                    htmlFor="understand"
                  >
                    I understand that deleting my account will remove all my
                    personal data
                  </Label>
                </div>
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={confirmations.dataLoss}
                    id="dataLoss"
                    onCheckedChange={(checked) =>
                      setConfirmations((prev) => ({
                        ...prev,
                        dataLoss: checked === true,
                      }))
                    }
                  />
                  <Label
                    className="cursor-pointer text-sm leading-relaxed"
                    htmlFor="dataLoss"
                  >
                    I understand that organizations I own will be deleted or
                    transferred
                  </Label>
                </div>
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={confirmations.irreversible}
                    id="irreversible"
                    onCheckedChange={(checked) =>
                      setConfirmations((prev) => ({
                        ...prev,
                        irreversible: checked === true,
                      }))
                    }
                  />
                  <Label
                    className="cursor-pointer text-sm leading-relaxed"
                    htmlFor="irreversible"
                  >
                    I understand this action is permanent and cannot be undone
                  </Label>
                </div>
              </div>

              <Button
                className="w-full"
                disabled={!allConfirmed}
                onClick={() => setStep("verify")}
                variant="destructive"
              >
                Continue
              </Button>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="confirm-email">
                    Your email: <span className="font-medium">{userEmail}</span>
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Enter your password</Label>
                  <Input
                    id="password"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    type="password"
                    value={password}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-text">
                    Type{" "}
                    <span className="font-medium font-mono">
                      delete my account
                    </span>{" "}
                    to confirm
                  </Label>
                  <Input
                    id="confirm-text"
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="delete my account"
                    type="text"
                    value={confirmText}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => setStep("confirm")}
                  variant="outline"
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!(password && confirmTextCorrect) || isDeleting}
                  onClick={handleDelete}
                  variant="destructive"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Account"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
