import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "wouter";
import { Rocket, Clock, ArrowUpRight, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Optimizations() {
  // Fetch models to get optimization scenarios
  const { data: models } = useQuery({
    queryKey: ["/api/projects/1/models"],
  });

  // Get the first model ID if available
  const modelId = models?.[0]?.id;

  // Fetch optimization scenarios for the selected model
  const { data: scenarios, isLoading } = useQuery({
    queryKey: [`/api/models/${modelId}/optimizations`],
    enabled: !!modelId,
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <MainLayout
      title="Budget Optimizations"
      subtitle="Optimize your marketing budget allocations"
      actions={
        <Button asChild>
          <Link href="/models">
            <Rocket className="mr-2 h-4 w-4" />
            Run New Optimization
          </Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Skeleton loaders
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-2/3 mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-1/2" />
              </CardFooter>
            </Card>
          ))
        ) : scenarios?.length > 0 ? (
          // Display optimization scenarios
          scenarios.map((scenario: any) => (
            <Card key={scenario.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{scenario.name}</CardTitle>
                  <Badge variant="primary" className="flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3" />
                    {scenario.results?.expected_lift_percentage 
                      ? `+${scenario.results.expected_lift_percentage.toFixed(1)}%` 
                      : 'Pending'}
                  </Badge>
                </div>
                <CardDescription>
                  Model ID: {scenario.model_id}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400">
                  <Rocket className="mr-2 h-4 w-4" />
                  <span>Budget Optimization</span>
                </div>
                {scenario.results ? (
                  <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    Total Budget: ${(scenario.results.total_budget / 1000000).toFixed(1)}M
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    Results pending
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-1 text-xs text-neutral-500 dark:text-neutral-400">
                <div className="flex items-center">
                  <Clock className="mr-1 h-3 w-3" />
                  <span>Created {scenario.created_at ? formatDate(scenario.created_at) : "recently"}</span>
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          // No optimization scenarios state
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>No Optimization Scenarios Found</CardTitle>
              <CardDescription>
                Run your first budget optimization to improve your marketing ROI.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-6 space-y-4">
              <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-md mb-4">
                <div className="flex items-start mb-2">
                  <AlertCircle className="h-5 w-5 text-neutral-500 dark:text-neutral-400 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium mb-1">How to run an optimization</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      To run a budget optimization, you need to first train a marketing mix model,
                      then go to the model details page and click "Run New Optimization".
                    </p>
                  </div>
                </div>
              </div>
              
              <Button asChild>
                <Link href="/models">
                  <Rocket className="mr-2 h-4 w-4" />
                  View Models
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
