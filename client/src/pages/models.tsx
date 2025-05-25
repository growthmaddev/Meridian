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
import { BarChart2, Clock, Play, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Model } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function Models() {
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
        <Button asChild>
          <Link href="/">
            <Play className="mr-2 h-4 w-4" />
            Train New Model
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
        ) : models?.length > 0 ? (
          // Display models
          models.map((model: Model) => (
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
