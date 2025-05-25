import { MainLayout } from "@/components/layout/main-layout";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { NewModelForm } from "@/components/dashboard/new-model-form";
import { ChevronRight } from "lucide-react";
import { Link } from "wouter";

interface Dataset {
  id: number;
  name: string;
  config?: {
    columns: string[];
  };
  validation?: any;
}

export default function NewModel() {
  const [, setLocation] = useLocation();
  
  // Fetch projects (to get a default project ID)
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Get the first project ID or default to 1
  const projectId = projects?.[0]?.id || 1;

  // Fetch datasets for the selected project
  const { data: datasets, isLoading: isLoadingDatasets } = useQuery({
    queryKey: [`/api/projects/${projectId}/datasets`],
    enabled: !!projectId,
  });

  const handleModelCreated = (modelId: number) => {
    // Redirect to the model details page
    setLocation(`/model/${modelId}`);
  };

  return (
    <MainLayout
      title="Train New Model"
      subtitle="Configure and train a marketing mix model"
      breadcrumbs={
        <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400">
          <Link href="/models">
            <a className="hover:text-neutral-700 dark:hover:text-neutral-300">Models</a>
          </Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span className="text-neutral-700 dark:text-neutral-300">New Model</span>
        </div>
      }
    >
      <div className="max-w-5xl mx-auto">
        {isLoadingProjects || isLoadingDatasets ? (
          <div className="mt-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-[600px] w-full rounded-lg" />
          </div>
        ) : (
          <NewModelForm 
            datasets={datasets || []} 
            projectId={projectId}
            onModelCreated={handleModelCreated}
          />
        )}
      </div>
    </MainLayout>
  );
}