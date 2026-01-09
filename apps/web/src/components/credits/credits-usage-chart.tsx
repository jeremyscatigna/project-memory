import { useQuery } from "@tanstack/react-query";
import { BarChart3, Coins, Hash } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

const chartConfig = {
  credits: {
    label: "Credits Used",
    color: "hsl(var(--chart-1))",
  },
  tokens: {
    label: "Tokens Used",
    color: "hsl(var(--chart-2))",
  },
  requests: {
    label: "Requests",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

interface CreditsUsageChartProps {
  days?: number;
}

export function CreditsUsageChart({ days = 30 }: CreditsUsageChartProps) {
  const { data: analytics, isLoading } = useQuery({
    ...trpc.credits.getUsageAnalytics.queryOptions({ days }),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Unable to load usage data</p>
        </CardContent>
      </Card>
    );
  }

  const { daily, totals } = analytics;

  // Format data for chart
  const chartData = daily.map((d) => ({
    date: d.date,
    credits: d.credits,
    tokens: Math.round(d.tokens / 1000), // Show in K
    requests: d.requests,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Total Credits Used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">
              {totals.credits.toLocaleString()}
            </p>
            <p className="text-muted-foreground text-xs">Last {days} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Total Tokens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">
              {(totals.tokens / 1000).toFixed(1)}K
            </p>
            <p className="text-muted-foreground text-xs">Last {days} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Total Requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">
              {totals.requests.toLocaleString()}
            </p>
            <p className="text-muted-foreground text-xs">Last {days} days</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Over Time</CardTitle>
          <CardDescription>
            Daily credit consumption for the last {days} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No usage data yet</p>
              <p className="text-muted-foreground text-sm">
                Start using AI features to see your usage here
              </p>
            </div>
          ) : (
            <ChartContainer className="h-[300px] w-full" config={chartConfig}>
              <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                  tickLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        });
                      }}
                    />
                  }
                  cursor={false}
                />
                <Area
                  dataKey="credits"
                  fill="var(--color-credits)"
                  fillOpacity={0.4}
                  stroke="var(--color-credits)"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Model Breakdown */}
      {analytics.byModel.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage by Model</CardTitle>
            <CardDescription>
              Breakdown of credit consumption by AI model
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.byModel.map((model) => {
                const percentage =
                  totals.credits > 0
                    ? Math.round((model.credits / totals.credits) * 100)
                    : 0;
                return (
                  <div className="space-y-1" key={model.model}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{model.model}</span>
                      <span className="text-muted-foreground">
                        {model.credits.toLocaleString()} credits ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CreditsUsageChart;
