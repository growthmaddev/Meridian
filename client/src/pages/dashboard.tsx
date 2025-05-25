import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCcw } from "lucide-react";
import { ModelSummary } from "@/components/dashboard/model-summary";
import { ResponseCurvesSection } from "@/components/dashboard/response-curves";
import { OptimizationSection } from "@/components/dashboard/optimization-section";
import { ModelConfigSection } from "@/components/dashboard/model-config";
import { NewModelForm } from "@/components/dashboard/new-model-form";
import { TrainingProgress } from "@/components/dashboard/training-progress";
import { GpuStatusBadge } from "@/components/dashboard/gpu-status-badge";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  
  // Get projects
  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ["/api/projects"],
  });
  
  // Get datasets
  const { data: datasets, isLoading: loadingDatasets } = useQuery({
    queryKey: ["/api/projects/1/datasets"],
    enabled: !!projects?.length,
  });
  
  // Get model results if a model is selected
  const { data: modelResults, isLoading: loadingResults } = useQuery({
    queryKey: ["/api/models", selectedModel, "results"],
    enabled: !!selectedModel && !isTraining,
  });
  
  // Get model data if a model is selected
  const { data: modelData, isLoading: loadingModel } = useQuery({
    queryKey: ["/api/models", selectedModel],
    enabled: !!selectedModel,
  });
  
  const handleDownloadResults = () => {
    if (!modelResults) return;
    
    // Create a blob with the results data
    const blob = new Blob([JSON.stringify(modelResults, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `model-${selectedModel}-results.json`;
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
    setSelectedModel(null);
    setIsTraining(false);
  };
  
  const handleModelCreated = (modelId: number) => {
    setSelectedModel(modelId);
    setIsTraining(true);
  };
  
  const handleTrainingComplete = () => {
    setIsTraining(false);
    toast({
      title: "Training Complete",
      description: "Model has been successfully trained"
    });
  };
  
  const handleRunOptimization = () => {
    toast({
      title: "Optimization Started",
      description: "Running budget optimization..."
    });
    // In a real implementation, this would call the API to run optimization
  };
  
  // Check if we have results to display
  const hasResults = selectedModel && modelResults && !isTraining;
  
  // Prepare breadcrumbs
  let breadcrumbs = [{ name: "Dashboard" }];
  if (selectedModel && modelData) {
    breadcrumbs = [
      { name: "Projects", href: "/projects" },
      { name: modelData.name || "Model Results" }
    ];
  }
  
  return (
    <MainLayout 
      title={selectedModel && modelData ? modelData.name : "Dashboard"} 
      subtitle={selectedModel ? "Meridian MMM results and optimization" : "Marketing Mix Modeling"}
      breadcrumbs={breadcrumbs}
      actions={selectedModel && (
        <>
          <Button onClick={handleDownloadResults} disabled={!hasResults}>
            <Download className="mr-2" />
            Export Results
          </Button>
          <Button variant="outline" onClick={handleRunNewModel}>
            <RefreshCcw className="mr-2" />
            Run New Model
          </Button>
        </>
      )}
    >
      {/* Show welcome screen if no model selected */}
      {!selectedModel && !isTraining && (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                Welcome to MarketMixPro
              </h2>
              <p className="mb-4 text-neutral-600 dark:text-neutral-400">
                Get started by training a new marketing mix model or browsing your existing projects.
              </p>
              
              <div className="mb-4">
                <GpuStatusBadge showTestButton={true} />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-lg mb-2">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button asChild className="w-full justify-start">
                      <Link href="/projects">
                        View Projects
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href="/datasets/upload">
                        Upload New Dataset
                      </Link>
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-lg mb-2">Recent Models</h3>
                  {loadingModel ? (
                    <p>Loading recent models...</p>
                  ) : (
                    <p className="text-neutral-500 dark:text-neutral-400">
                      No recent models. Train your first model below.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* New Model Form */}
          <NewModelForm 
            datasets={datasets || []} 
            projectId={1} 
            onModelCreated={handleModelCreated}
          />
        </div>
      )}
      
      {/* Show training progress if a model is training */}
      {isTraining && selectedModel && (
        <TrainingProgress 
          modelId={selectedModel} 
          onTrainingComplete={handleTrainingComplete}
          onTrainingFailed={() => setIsTraining(false)}
        />
      )}
      
      {/* Show model results if a model is selected and training is complete */}
      {hasResults && (
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
            loading={loadingModel}
          />
        </>
      )}
    </MainLayout>
  );
}
