import { useQuery } from "@tanstack/react-query";
import { Check, Coins, Loader2, Star, Zap } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

interface CreditPackagesProps {
  onPurchase?: (packageId: string) => void;
  isPurchasing?: boolean;
  purchasingPackageId?: string;
}

export function CreditPackages({
  onPurchase,
  isPurchasing,
  purchasingPackageId,
}: CreditPackagesProps) {
  const { data: packages, isLoading } = useQuery({
    ...trpc.credits.getPackages.queryOptions(),
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-20" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (!packages || packages.length === 0) {
    return (
      <Card className="py-12">
        <CardContent className="flex flex-col items-center justify-center text-center">
          <Coins className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">No credit packages available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg) => (
        <Card
          className={cn(
            "relative flex flex-col",
            pkg.featured && "border-primary shadow-md"
          )}
          key={pkg.id}
        >
          {pkg.featured && (
            <Badge
              className="absolute -top-2 left-1/2 -translate-x-1/2"
              variant="default"
            >
              <Star className="mr-1 h-3 w-3" />
              Best Value
            </Badge>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              {pkg.name}
            </CardTitle>
            <CardDescription>{pkg.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              {/* Price */}
              <div>
                <span className="font-bold text-3xl">
                  ${(pkg.priceInCents / 100).toFixed(0)}
                </span>
                <span className="text-muted-foreground">/one-time</span>
              </div>

              {/* Credits */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>
                    <strong>{pkg.credits.toLocaleString()}</strong> credits
                  </span>
                </div>
                {pkg.bonusCredits > 0 && (
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span>
                      <strong>+{pkg.bonusCredits.toLocaleString()}</strong>{" "}
                      bonus credits
                    </span>
                  </div>
                )}
                <p className="text-muted-foreground text-xs">
                  ~$
                  {(
                    pkg.priceInCents /
                    100 /
                    ((pkg.credits + pkg.bonusCredits) / 1000)
                  ).toFixed(2)}{" "}
                  per 1K credits
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              disabled={isPurchasing}
              onClick={() => onPurchase?.(pkg.id)}
              variant={pkg.featured ? "default" : "outline"}
            >
              {isPurchasing && purchasingPackageId === pkg.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Coins className="mr-2 h-4 w-4" />
                  Purchase
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default CreditPackages;
