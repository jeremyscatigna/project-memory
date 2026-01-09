import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Coins,
  CreditCard,
  Crown,
  ExternalLink,
  Loader2,
  Receipt,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CreditPackages } from "@/components/credits/credit-packages";
import { CreditsUsageChart } from "@/components/credits/credits-usage-chart";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/dashboard/billing")({
  component: BillingPage,
});

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: "month" | "year";
  features: PlanFeature[];
  popular?: boolean;
  slug?: string;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "For individuals and small projects",
    price: 0,
    interval: "month",
    features: [
      { text: "Up to 3 team members", included: true },
      { text: "1 organization", included: true },
      { text: "Basic analytics", included: true },
      { text: "Community support", included: true },
      { text: "API access", included: false },
      { text: "Advanced integrations", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing teams and businesses",
    price: 29,
    interval: "month",
    popular: true,
    slug: "pro",
    features: [
      { text: "Up to 10 team members", included: true },
      { text: "5 organizations", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Email support", included: true },
      { text: "API access", included: true },
      { text: "Advanced integrations", included: true },
      { text: "Priority support", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    price: 99,
    interval: "month",
    slug: "enterprise",
    features: [
      { text: "Unlimited team members", included: true },
      { text: "Unlimited organizations", included: true },
      { text: "Advanced analytics + AI", included: true },
      { text: "Dedicated support", included: true },
      { text: "Unlimited API access", included: true },
      { text: "Custom integrations", included: true },
      { text: "Priority support", included: true },
    ],
  },
];

function PlanCard({
  plan,
  currentPlan,
  onSelect,
  isLoading,
}: {
  plan: Plan;
  currentPlan: string;
  onSelect: (plan: Plan) => void;
  isLoading: boolean;
}) {
  const isCurrent = currentPlan === plan.id;
  const isUpgrade = currentPlan === "free" && plan.id !== "free";
  const isDowngrade = currentPlan !== "free" && plan.id === "free";

  const Icon = plan.id === "free" ? Zap : plan.id === "pro" ? Crown : Building2;

  return (
    <Card
      className={`relative ${
        plan.popular
          ? "scale-105 border-primary shadow-lg"
          : isCurrent
            ? "border-primary/50"
            : ""
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="gap-1 bg-primary">
            <Sparkles className="h-3 w-3" />
            Most Popular
          </Badge>
        </div>
      )}
      <CardHeader className="pt-8">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <CardTitle>{plan.name}</CardTitle>
          {isCurrent && <Badge variant="secondary">Current</Badge>}
        </div>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-4xl">${plan.price}</span>
          <span className="text-muted-foreground">/{plan.interval}</span>
        </div>

        <ul className="space-y-2">
          {plan.features.map((feature) => (
            <li className="flex items-center gap-2 text-sm" key={feature.text}>
              {feature.included ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              )}
              <span
                className={
                  feature.included ? "" : "text-muted-foreground line-through"
                }
              >
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {isCurrent ? (
          <Button className="w-full" disabled variant="outline">
            Current Plan
          </Button>
        ) : isDowngrade ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full" variant="outline">
                Downgrade
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Downgrade to Free?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will lose access to premium features at the end of your
                  current billing period. Are you sure?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onSelect(plan)}>
                  Downgrade
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            className="w-full"
            disabled={isLoading}
            onClick={() => onSelect(plan)}
            variant={plan.popular ? "default" : "outline"}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isUpgrade ? (
              "Upgrade"
            ) : (
              "Get Started"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

interface CustomerState {
  activeSubscriptions?: Array<{
    product?: { name?: string };
    status?: string;
  }>;
}

function BillingPage() {
  const { customerState } = Route.useRouteContext() as {
    customerState: CustomerState | null;
  };
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isPurchasingCredits, setIsPurchasingCredits] = useState(false);
  const [purchasingPackageId, setPurchasingPackageId] = useState<string | null>(
    null
  );

  // Fetch credit status
  const { data: creditStatus, isLoading: isLoadingCredits } = useQuery({
    ...trpc.credits.getStatus.queryOptions(),
  });

  const hasProSubscription =
    (customerState?.activeSubscriptions?.length ?? 0) > 0;
  const subscription = customerState?.activeSubscriptions?.[0];

  // Determine current plan based on subscription
  const currentPlan = hasProSubscription
    ? subscription?.product?.name?.toLowerCase() === "enterprise"
      ? "enterprise"
      : "pro"
    : "free";

  const handleSelectPlan = async (plan: Plan) => {
    if (!plan.slug) {
      toast.error("This plan is not available for purchase");
      return;
    }

    setIsLoading(true);
    setSelectedPlan(plan.id);

    try {
      if ("checkout" in authClient) {
        await (
          authClient as unknown as {
            checkout: (opts: { slug: string }) => Promise<void>;
          }
        ).checkout({
          slug: plan.slug,
        });
      } else {
        toast.error("Billing is not configured. Please contact support.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      if ("customer" in authClient && authClient.customer) {
        await (
          authClient.customer as unknown as {
            portal: () => Promise<void>;
          }
        ).portal();
      } else {
        toast.error("Billing is not configured. Please contact support.");
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast.error("Failed to open billing portal. Please try again.");
    }
  };

  const purchasePackageMutation = useMutation({
    ...trpc.credits.purchasePackage.mutationOptions(),
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error) => {
      console.error("Purchase error:", error);
      toast.error(
        error.message || "Failed to purchase credits. Please try again."
      );
      setIsPurchasingCredits(false);
      setPurchasingPackageId(null);
    },
  });

  const handlePurchaseCredits = (packageId: string) => {
    setIsPurchasingCredits(true);
    setPurchasingPackageId(packageId);
    purchasePackageMutation.mutate({ packageId });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription, credits, and billing settings
        </p>
      </div>

      {/* Credit Status Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Credit Balance
              </CardTitle>
              <CardDescription>
                Your current credit balance and usage
              </CardDescription>
            </div>
            {hasProSubscription && (
              <Button onClick={handleManageSubscription} variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Subscription
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingCredits ? (
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton className="h-20" key={i} />
              ))}
            </div>
          ) : creditStatus ? (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">Current Balance</p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-3xl">
                    {creditStatus.balance.toLocaleString()}
                  </span>
                  {creditStatus.isLowBalance && (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  Lifetime Credits
                </p>
                <span className="font-bold text-2xl">
                  {creditStatus.lifetimeCredits.toLocaleString()}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">Total Used</p>
                <span className="font-bold text-2xl">
                  {creditStatus.lifetimeUsed.toLocaleString()}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">Trial Status</p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      creditStatus.isTrialActive
                        ? "default"
                        : creditStatus.trialStatus === "converted"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {creditStatus.isTrialActive
                      ? `${creditStatus.trialDaysRemaining}d left`
                      : creditStatus.trialStatus === "converted"
                        ? "Converted"
                        : "Expired"}
                  </Badge>
                </div>
              </div>
            </div>
          ) : null}

          {/* Trial Progress */}
          {creditStatus?.isTrialActive && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Free Trial Progress</span>
                </div>
                <span className="text-muted-foreground">
                  {creditStatus.trialDaysRemaining} days remaining
                </span>
              </div>
              <Progress value={100 - creditStatus.trialProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs className="space-y-6" defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="credits">Buy Credits</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent className="space-y-6" value="plans">
          {/* Current Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
              <CardDescription>
                Your current plan and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">Plan</p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={currentPlan === "free" ? "secondary" : "default"}
                    >
                      {currentPlan.charAt(0).toUpperCase() +
                        currentPlan.slice(1)}
                    </Badge>
                    {hasProSubscription && (
                      <Badge className="text-green-600" variant="outline">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">
                    Billing Period
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {currentPlan === "free" ? "N/A" : "Monthly"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">Status</p>
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm capitalize">
                      {subscription?.status ?? "Free tier"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plans */}
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="font-bold text-2xl">Choose Your Plan</h2>
              <p className="text-muted-foreground">
                Select the plan that best fits your needs
              </p>
            </div>

            <div className="grid gap-6 pt-4 md:grid-cols-3 lg:gap-8">
              {plans.map((plan) => (
                <PlanCard
                  currentPlan={currentPlan}
                  isLoading={isLoading && selectedPlan === plan.id}
                  key={plan.id}
                  onSelect={handleSelectPlan}
                  plan={plan}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Credits Tab */}
        <TabsContent className="space-y-6" value="credits">
          <div className="space-y-4">
            <div>
              <h2 className="font-bold text-2xl">Buy Credit Packages</h2>
              <p className="text-muted-foreground">
                Purchase additional credits for AI features
              </p>
            </div>
            <CreditPackages
              isPurchasing={isPurchasingCredits}
              onPurchase={handlePurchaseCredits}
              purchasingPackageId={purchasingPackageId ?? undefined}
            />
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent className="space-y-6" value="usage">
          <div className="space-y-4">
            <div>
              <h2 className="font-bold text-2xl">Credit Usage</h2>
              <p className="text-muted-foreground">
                Track your credit consumption over time
              </p>
            </div>
            <CreditsUsageChart days={30} />
          </div>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Can I cancel anytime?</h4>
            <p className="text-muted-foreground text-sm">
              Yes, you can cancel your subscription at any time. You'll continue
              to have access until the end of your billing period.
            </p>
          </div>
          <div>
            <h4 className="font-medium">How do credits work?</h4>
            <p className="text-muted-foreground text-sm">
              Credits are used for AI features. 1 credit equals approximately
              1,000 tokens. Each plan includes monthly credits, and you can
              purchase additional credit packages anytime.
            </p>
          </div>
          <div>
            <h4 className="font-medium">What payment methods do you accept?</h4>
            <p className="text-muted-foreground text-sm">
              We accept all major credit cards (Visa, Mastercard, American
              Express) through our secure payment provider Polar.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Do credits expire?</h4>
            <p className="text-muted-foreground text-sm">
              Purchased credits never expire. Monthly plan credits refresh at
              the start of each billing cycle.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
