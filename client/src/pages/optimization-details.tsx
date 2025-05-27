import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, useParams } from "wouter";
import { ArrowLeft, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function OptimizationDetails() {
  const { id } = useParams();

  // Fetch optimization details
  const { data: optimization, isLoading } = useQuery({
    queryKey: [`/api/optimizations/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <MainLayout
        title="Optimization Details"
        subtitle="Loading optimization results..."
        actions={
          <Button asChild variant="outline">
            <Link href="/optimizations">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Optimizations
            </Link>
          </Button>
        }
      >
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!optimization) {
    return (
      <MainLayout
        title="Optimization Not Found"
        subtitle="The requested optimization could not be found"
        actions={
          <Button asChild variant="outline">
            <Link href="/optimizations">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Optimizations
            </Link>
          </Button>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Optimization Not Found</CardTitle>
            <CardDescription>
              This optimization may have been deleted or the ID is incorrect.
            </CardDescription>
          </CardHeader>
        </Card>
      </MainLayout>
    );
  }

  const results = optimization.results;

  return (
    <MainLayout
      title={optimization.name || `Optimization ${optimization.id}`}
      subtitle={`Model ID: ${optimization.model_id}`}
      actions={
        <Button asChild variant="outline">
          <Link href="/optimizations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Optimizations
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Optimization Overview
            </CardTitle>
            <CardDescription>
              Budget allocation recommendations based on your Meridian model
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    +{results.expected_lift_percentage?.toFixed(1) || "0.0"}%
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    Expected Lift
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    ${(results.total_budget / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    Total Budget
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {results.optimized_allocation ? Object.keys(results.optimized_allocation).length : 0}
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    Channels Optimized
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Badge variant="secondary">Results Pending</Badge>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                  Optimization is still processing
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Allocation Card */}
        {results?.optimized_allocation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Optimized Budget Allocation
              </CardTitle>
              <CardDescription>
                Recommended spend allocation across all channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(results.optimized_allocation).map(([channel, amount]) => {
                  const percentage = ((amount as number) / results.total_budget * 100);
                  return (
                    <div key={channel} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="font-medium capitalize">
                          {channel.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          ${((amount as number) / 1000000).toFixed(2)}M
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current vs Optimized Comparison */}
        {results?.current_allocation && results?.optimized_allocation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Current vs Optimized Comparison
              </CardTitle>
              <CardDescription>
                See how the optimized allocation compares to your current spend
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(results.current_allocation).map(([channel, currentAmount]) => {
                  const optimizedAmount = results.optimized_allocation[channel] as number;
                  const change = ((optimizedAmount - (currentAmount as number)) / (currentAmount as number)) * 100;
                  
                  return (
                    <div key={channel} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">
                          {channel.replace('_', ' ')}
                        </span>
                        <Badge 
                          variant={change > 0 ? "default" : change < 0 ? "secondary" : "outline"}
                          className={change > 0 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : 
                                   change < 0 ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" : ""}
                        >
                          {change > 0 ? '+' : ''}{change.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-neutral-500 dark:text-neutral-400">Current</div>
                          <div className="font-semibold">
                            ${((currentAmount as number) / 1000000).toFixed(2)}M
                          </div>
                        </div>
                        <div>
                          <div className="text-neutral-500 dark:text-neutral-400">Optimized</div>
                          <div className="font-semibold">
                            ${(optimizedAmount / 1000000).toFixed(2)}M
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}