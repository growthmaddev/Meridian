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
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { Link } from "wouter";
import { Plus, File, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Project } from "@shared/schema";

export default function Projects() {
  // Fetch projects from API
  const { data: projects, isLoading } = useQuery({
    queryKey: ["/api/projects"],
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
      title="Projects"
      subtitle="Manage your marketing mix modeling projects"
      actions={
        <CreateProjectDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          }
        />
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
        ) : projects?.length > 0 ? (
          // Display projects
          projects.map((project: Project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <a className="block h-full">
                <Card className="cursor-pointer h-full transition-shadow hover:shadow-md overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription>
                      {project.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400">
                      <File className="mr-2 h-4 w-4" />
                      <span>ID: {project.id}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>Created {project.created_at ? formatDate(project.created_at) : "recently"}</span>
                    </div>
                  </CardFooter>
                </Card>
              </a>
            </Link>
          ))
        ) : (
          // No projects state
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>No Projects Found</CardTitle>
              <CardDescription>
                Create your first project to get started with marketing mix modeling.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              <CreateProjectDialog />
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
