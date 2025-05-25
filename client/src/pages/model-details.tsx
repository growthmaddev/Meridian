import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCcw } from "lucide-react";
import { ModelSummary } from "@/components/dashboard/model-summary";
import { ResponseCurvesSection } from "@/components/dashboard/response-curves";
import { OptimizationSection } from "@/components/dashboard/optimization-section";
import { ModelConfigSection } from "@/components/dashboard/model-config";
import { TrainingProgress } from "@/components/dashboard/training-progress";
import { useParams, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function ModelDetails() {
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
    enabled: !!modelId && modelData?.status === 'completed',
    onSuccess: (data) => {
      console.log('Model results loaded:', data);
      console.log('Response curves data:', data?.results_json?.response_curves);
    }
  });

  const handleDownloadResults = () => {
    if (!modelResults) return;
    
    // Create a blob with the results data
    const blob = new Blob([JSON.stringify(modelResults.results_json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `model-${modelId}-results.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Results have been downloaded as JSON file"
    });
  };

  const handleRunNewModel = () => {
    setLocation('/');
  };

  const handleRunOptimization = async () => {
    try {
      const response = await fetch(`/api/models/${modelId}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Optimization for Model ${modelId}`,
          config: {
            objective: 'revenue'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to run optimization');
      }

      toast({
        title: "Optimization Started",
        description: "Budget optimization is running in the background"
      });

    } catch (error) {
      console.error('Error running optimization:', error);
      toast({
        title: "Optimization Failed",
        description: "Failed to start budget optimization",
        variant: "destructive"
      });
    }
  };

  // Prepare breadcrumbs
  const breadcrumbs = [
    { name: "Models", href: "/models" },
    { name: modelData?.name || `Model ${modelId}` }
  ];

  // Determine if model is running
  const isTraining = modelData?.status === 'running';

  // Show error state if model not found
  if (modelError) {
    return (
      <MainLayout
        title="Model Not Found"
        subtitle="The requested model could not be found"
        breadcrumbs={[
          { name: "Models", href: "/models" },
          { name: "Not Found" }
        ]}
      >
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Model Not Found
          </h2>
          <p className="mb-6 text-neutral-600 dark:text-neutral-400">
            The model you're looking for doesn't exist or may have been deleted.
          </p>
          <Button asChild>
            <a href="/models">View All Models</a>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title={loadingModel ? "Loading..." : modelData?.name || `Model ${modelId}`}
      subtitle="Meridian MMM results and optimization"
      breadcrumbs={breadcrumbs}
      actions={
        <>
          <Button 
            onClick={handleDownloadResults} 
            disabled={loadingResults || !modelResults || isTraining}
          >
            <Download className="mr-2" />
            Export Results
          </Button>
          <Button variant="outline" onClick={handleRunNewModel}>
            <RefreshCcw className="mr-2" />
            Run New Model
          </Button>
        </>
      }
    >
      {loadingModel && (
        <div className="space-y-4">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      )}

      {/* Show training progress if a model is training */}
      {!loadingModel && isTraining && (
        <TrainingProgress 
          modelId={modelId}
          onTrainingComplete={() => window.location.reload()}
        />
      )}
      
      {/* Show model results if training is complete */}
      {!loadingModel && modelData?.status === 'completed' && (
        <>
          <ModelSummary 
            metrics={modelResults?.results_json.metrics} 
            channelAnalysis={modelResults?.results_json.channel_analysis}
            loading={loadingResults}
          />
          
          <ResponseCurvesSection 
            responseCurves={modelResults?.results_json.response_curves}
            loading={loadingResults}
          />
          
          <OptimizationSection 
            optimization={modelResults?.results_json.optimization}
            channelAnalysis={modelResults?.results_json.channel_analysis}
            onRunOptimization={handleRunOptimization}
            loading={loadingResults}
          />
          
          <ModelConfigSection 
            config={modelData?.config}
            loading={false}
          />
        </>
      )}
      
      {/* Show failed state */}
      {!loadingModel && modelData?.status === 'failed' && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-500 dark:border-error-700 rounded-lg p-6 my-6">
          <h2 className="text-xl font-bold text-error-700 dark:text-error-500 mb-2">
            Model Training Failed
          </h2>
          <p className="text-neutral-700 dark:text-neutral-300 mb-4">
            The model training process encountered an error. Please try again or check the logs for more details.
          </p>
          <Button onClick={handleRunNewModel}>
            Train New Model
          </Button>
        </div>
      )}
    </MainLayout>
  );
}
