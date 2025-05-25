import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { useParams, useLocation, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Import the ScenarioPlanner component
import { ScenarioPlanner } from "../components/scenarios/scenario-planner.js";

export default function Scenarios() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const modelId = parseInt(id || "0", 10);
  const { toast } = useToast();

  // Get model data
  const { 
    data: modelData, 
    isLoading: loadingModel,
    error: modelError
  } = useQuery({
    queryKey: [`/api/models/${modelId}`],
    enabled: !!modelId,
  });

  // Get model results
  const {
    data: modelResults,
    isLoading: loadingResults,
    error: resultsError
  } = useQuery({
    queryKey: [`/api/models/${modelId}/results`],
    enabled: !!modelId,
  });

  // Handle errors
  if (modelError) {
    return (
      <MainLayout title="Error">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load model data. Please try again later.
          </AlertDescription>
        </Alert>
        <Button 
          className="mt-4"
          onClick={() => setLocation("/models")}
        >
          <ChevronLeft className="mr-2" />
          Back to Models
        </Button>
      </MainLayout>
    );
  }

  // Set up breadcrumbs
  const breadcrumbs = [
    { name: "Models", href: "/models" },
    { name: modelData?.name || `Model ${modelId}`, href: `/model/${modelId}` },
    { name: "What-If Scenarios" },
  ];

  return (
    <MainLayout 
      title={loadingModel ? "Loading..." : `${modelData?.name || `Model ${modelId}`} - What-If Scenarios`}
      subtitle="Create and compare different budget allocation scenarios"
      breadcrumbs={breadcrumbs}
      actions={
        <Button 
          variant="outline" 
          onClick={() => setLocation(`/model/${modelId}`)}
        >
          <ChevronLeft className="mr-2" />
          Back to Model
        </Button>
      }
    >
      {loadingModel || loadingResults ? (
        <div className="space-y-4">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : (
        <ScenarioPlanner modelResults={modelResults as any} />
      )}
    </MainLayout>
  );
}