import {
  Clock,
  Globe,
  Loader2,
  LogOut,
  MapPin,
  Monitor,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import { authClient } from "@/lib/auth-client";

interface Session {
  id: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

function parseUserAgent(userAgent?: string | null): {
  browser: string;
  os: string;
  device: "desktop" | "mobile" | "tablet";
} {
  if (!userAgent) {
    return { browser: "Unknown", os: "Unknown", device: "desktop" };
  }

  let browser = "Unknown";
  let os = "Unknown";
  let device: "desktop" | "mobile" | "tablet" = "desktop";

  // Detect browser
  if (userAgent.includes("Chrome")) {
    browser = "Chrome";
  } else if (userAgent.includes("Firefox")) {
    browser = "Firefox";
  } else if (userAgent.includes("Safari")) {
    browser = "Safari";
  } else if (userAgent.includes("Edge")) {
    browser = "Edge";
  } else if (userAgent.includes("Opera")) {
    browser = "Opera";
  }

  // Detect OS
  if (userAgent.includes("Windows")) {
    os = "Windows";
  } else if (userAgent.includes("Mac")) {
    os = "macOS";
  } else if (userAgent.includes("Linux")) {
    os = "Linux";
  } else if (userAgent.includes("Android")) {
    os = "Android";
  } else if (userAgent.includes("iOS") || userAgent.includes("iPhone")) {
    os = "iOS";
  }

  // Detect device type
  if (
    userAgent.includes("Mobile") ||
    userAgent.includes("iPhone") ||
    userAgent.includes("Android")
  ) {
    device = "mobile";
  } else if (userAgent.includes("iPad") || userAgent.includes("Tablet")) {
    device = "tablet";
  }

  return { browser, os, device };
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  if (days < 7) {
    return `${days}d ago`;
  }
  return new Date(date).toLocaleDateString();
}

function DeviceIcon({ device }: { device: "desktop" | "mobile" | "tablet" }) {
  if (device === "mobile") {
    return <Smartphone className="h-5 w-5" />;
  }
  return <Monitor className="h-5 w-5" />;
}

export function SessionManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionToken, setCurrentSessionToken] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
    null
  );
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const result = await authClient.listSessions();
      if (result.data) {
        setSessions(result.data as Session[]);
      }

      // Get current session token from cookie or session data
      const currentSession = await authClient.getSession();
      if (currentSession.data?.session) {
        setCurrentSessionToken(currentSession.data.session.token);
      }
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  };

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevokeSession = async (sessionToken: string) => {
    setRevokingSessionId(sessionToken);
    try {
      await authClient.revokeSession({ token: sessionToken });
      setSessions(sessions.filter((s) => s.token !== sessionToken));
      toast.success("Session revoked successfully");
    } catch {
      toast.error("Failed to revoke session");
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    setIsRevokingAll(true);
    try {
      await authClient.revokeOtherSessions();
      await loadSessions();
      toast.success("All other sessions revoked");
    } catch {
      toast.error("Failed to revoke sessions");
    } finally {
      setIsRevokingAll(false);
      setShowRevokeAllDialog(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Active Sessions
            </CardTitle>
            <CardDescription>
              Manage your active sessions across devices
            </CardDescription>
          </div>
          {sessions.length > 1 && (
            <Button
              onClick={() => setShowRevokeAllDialog(true)}
              size="sm"
              variant="outline"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out other devices
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No active sessions found
          </p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const { browser, os, device } = parseUserAgent(session.userAgent);
              const isCurrentSession = session.token === currentSessionToken;

              return (
                <div
                  className={`flex items-start justify-between rounded-lg border p-4 ${
                    isCurrentSession ? "border-primary bg-primary/5" : ""
                  }`}
                  key={session.id}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <DeviceIcon device={device} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {browser} on {os}
                        </p>
                        {isCurrentSession && (
                          <Badge className="gap-1" variant="default">
                            <ShieldCheck className="h-3 w-3" />
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-muted-foreground text-sm">
                        {session.ipAddress && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.ipAddress}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(session.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!isCurrentSession && (
                    <Button
                      disabled={revokingSessionId === session.token}
                      onClick={() => handleRevokeSession(session.token)}
                      size="sm"
                      variant="ghost"
                    >
                      {revokingSessionId === session.token ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <AlertDialog
        onOpenChange={setShowRevokeAllDialog}
        open={showRevokeAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of all other devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out of all devices except this one. You'll need
              to sign in again on those devices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isRevokingAll}
              onClick={handleRevokeAllOtherSessions}
            >
              {isRevokingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing out...
                </>
              ) : (
                "Sign out all"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
