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
import { Link, useLocation } from "wouter";
import { 
  BarChart2, 
  Clock, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  BarChart, 
  CheckSquare 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Model } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function Models() {
  const [, setLocation] = useLocation();
  const [compareMode, setCompareMode] = useState(false);
  const [selectedModels, setSelectedModels] = useState<number[]>([]);
  
  // Fetch projects (to get a default project ID)
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Get the first project ID or default to 1
  const projectId = projects?.[0]?.id || 1;

  // Fetch models for the selected project
  const { data: models, isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/models`],
    enabled: !!projectId,
  });

  // Toggle model selection
  const toggleModelSelection = (modelId: number) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      } else {
        // Limit to max 3 selections
        if (prev.length >= 3) {
          return prev;
        }
        return [...prev, modelId];
      }
    });
  };

  // Handle compare button click
  const handleCompare = () => {
    if (selectedModels.length >= 2) {
      const modelIds = selectedModels.join(',');
      setLocation(`/models/compare?ids=${modelIds}`);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Helper to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3" />
          Pending
        </Badge>;
      case 'running':
        return <Badge variant="warning" className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Running
        </Badge>;
      case 'completed':
        return <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Completed
        </Badge>;
      case 'failed':
        return <Badge variant="error" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Failed
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <MainLayout
      title="Models"
      subtitle="Manage your marketing mix models"
      actions={
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="compare-mode"
              checked={compareMode}
              onCheckedChange={setCompareMode}
            />
            <Label htmlFor="compare-mode">Compare Mode</Label>
          </div>
          
          {compareMode && selectedModels.length >= 2 ? (
            <Button onClick={handleCompare}>
              <BarChart className="mr-2 h-4 w-4" />
              Compare Selected ({selectedModels.length})
            </Button>
          ) : (
            <Button asChild>
              <Link href="/models/new">
                <Play className="mr-2 h-4 w-4" />
                Train New Model
              </Link>
            </Button>
          )}
        </div>
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
        ) : models?.length > 0 ? (
          // Display models
          models.map((model: Model) => (
            compareMode ? (
              // Compare mode with checkboxes
              <div key={model.id} className="relative">
                <Card 
                  className={`h-full transition-shadow overflow-hidden ${selectedModels.includes(model.id) ? 'border-primary' : ''}`}
                  onClick={() => model.status === 'completed' && toggleModelSelection(model.id)}
                >
                  <div className="absolute top-3 right-3 z-10">
                    <Checkbox 
                      checked={selectedModels.includes(model.id)}
                      disabled={!model.status || model.status !== 'completed'}
                      onCheckedChange={() => model.status === 'completed' && toggleModelSelection(model.id)}
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{model.name}</CardTitle>
                      {renderStatusBadge(model.status)}
                    </div>
                    <CardDescription>
                      Project ID: {model.project_id} • Dataset ID: {model.dataset_id}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400">
                      <BarChart2 className="mr-2 h-4 w-4" />
                      <span>Meridian MMM</span>
                    </div>
                    {model.config && (
                      <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                        {model.config.channel_columns?.length || 0} channels •&nbsp;
                        Target: {model.config.target_column || 'N/A'}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>Created {model.created_at ? formatDate(model.created_at) : "recently"}</span>
                    </div>
                  </CardFooter>
                </Card>
                {model.status !== 'completed' && (
                  <div className="absolute inset-0 bg-black/5 dark:bg-black/30 pointer-events-none flex items-center justify-center">
                    <Badge variant="secondary">Only completed models can be compared</Badge>
                  </div>
                )}
              </div>
            ) : (
              // Regular mode with links to model details
              <Link key={model.id} href={`/models/${model.id}`}>
                <a className="block h-full">
                  <Card className="cursor-pointer h-full transition-shadow hover:shadow-md overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{model.name}</CardTitle>
                        {renderStatusBadge(model.status)}
                      </div>
                      <CardDescription>
                        Project ID: {model.project_id} • Dataset ID: {model.dataset_id}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400">
                        <BarChart2 className="mr-2 h-4 w-4" />
                        <span>Meridian MMM</span>
                      </div>
                      {model.config && (
                        <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                          {model.config.channel_columns?.length || 0} channels •&nbsp;
                          Target: {model.config.target_column || 'N/A'}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      <div className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        <span>Created {model.created_at ? formatDate(model.created_at) : "recently"}</span>
                      </div>
                    </CardFooter>
                  </Card>
                </a>
              </Link>
            )
          ))
        ) : (
          // No models state
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>No Models Found</CardTitle>
              <CardDescription>
                Train your first marketing mix model to start analyzing your campaign performance.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              <Button asChild>
                <Link href="/">
                  <Play className="mr-2 h-4 w-4" />
                  Train New Model
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
