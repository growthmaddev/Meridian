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
import { Upload, Database, Clock, Eye, FileUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Dataset } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function Datasets() {
  // Fetch projects (to get a default project ID)
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Get the first project ID or default to 1
  const projectId = projects?.[0]?.id || 1;

  // Fetch datasets for the selected project
  const { data: datasets, isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/datasets`],
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

  return (
    <MainLayout
      title="Datasets"
      subtitle="Manage your marketing data for analysis"
      actions={
        <Button asChild>
          <Link href="/datasets/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload Dataset
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
        ) : datasets?.length > 0 ? (
          // Display datasets
          datasets.map((dataset: Dataset) => (
            <Link key={dataset.id} href={`/datasets/${dataset.id}`}>
              <a className="block h-full">
                <Card className="cursor-pointer h-full transition-shadow hover:shadow-md overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{dataset.name}</CardTitle>
                      <Badge variant="secondary">CSV</Badge>
                    </div>
                    <CardDescription>
                      {dataset.config?.columns?.length 
                        ? `${dataset.config.columns.length} columns` 
                        : "No column data"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400">
                      <Database className="mr-2 h-4 w-4" />
                      <span>Dataset ID: {dataset.id}</span>
                    </div>
                    {dataset.config?.sampleData && (
                      <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                        {dataset.config.sampleData.length} sample rows
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-1 flex justify-between items-center">
                    <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>Uploaded {dataset.uploaded_at ? formatDate(dataset.uploaded_at) : "recently"}</span>
                    </div>
                    <Button size="sm" variant="ghost" className="p-0 h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </a>
            </Link>
          ))
        ) : (
          // No datasets state
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>No Datasets Found</CardTitle>
              <CardDescription>
                Upload your first dataset to start building marketing mix models.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              <Button asChild>
                <Link href="/datasets/upload">
                  <FileUp className="mr-2 h-4 w-4" />
                  Upload Dataset
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
