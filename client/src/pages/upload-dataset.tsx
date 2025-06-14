import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/file-upload";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DataValidationReport } from "@/components/data-validation-report";

export default function UploadDataset() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [datasetName, setDatasetName] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Fetch projects
  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ["/api/projects"],
  });
  
  const handleUploadSuccess = (response: any) => {
    toast({
      title: "Upload Successful",
      description: `Dataset "${datasetName}" has been uploaded.`
    });
    
    // Process the dataset to extract columns
    processDataset(response.id);
  };
  
  const processDataset = async (datasetId: number) => {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/datasets/${datasetId}/process`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to process dataset');
      }
      
      const result = await response.json();
      setProcessingResult(result);
      
      toast({
        title: "Dataset Processed",
        description: "Dataset validated and columns extracted successfully."
      });
      
      // Do not redirect immediately, show validation report first
      
    } catch (error) {
      console.error('Error processing dataset:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to process the dataset columns.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleProceedAfterValidation = () => {
    setLocation('/models/new'); // Redirect to create new model
  };
  
  return (
    <MainLayout
      title="Upload Dataset"
      subtitle="Upload your marketing data for analysis"
      breadcrumbs={[
        { name: "Datasets", href: "/datasets" },
        { name: "Upload" }
      ]}
    >
      {processingResult?.config?.validation ? (
        // Show validation report if dataset has been processed
        <DataValidationReport 
          validation={processingResult.config.validation}
          onProceed={handleProceedAfterValidation}
        />
      ) : (
        // Show upload form
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="dataset-name">Dataset Name</Label>
                  <Input
                    id="dataset-name"
                    placeholder="e.g. Q1 2023 Marketing Data"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    className="mt-1"
                    disabled={isProcessing}
                  />
                </div>
                
                <div>
                  <Label htmlFor="project">Project</Label>
                  <Select
                    value={selectedProject}
                    onValueChange={setSelectedProject}
                    disabled={isProcessing}
                  >
                    <SelectTrigger id="project" className="mt-1">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingProjects ? (
                        <SelectItem key="loading" value="loading">Loading projects...</SelectItem>
                      ) : projects?.length > 0 ? (
                        projects.map((project: any) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem key="none" value="none">No projects available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Upload CSV File</Label>
                <FileUpload
                  accept=".csv"
                  url="/api/datasets"
                  additionalData={{
                    name: datasetName || "Untitled Dataset",
                    project_id: parseInt(selectedProject, 10) || 1
                  }}
                  onSuccess={handleUploadSuccess}
                  buttonText={isProcessing ? "Processing..." : "Select CSV File"}
                  disabled={isProcessing || !datasetName}
                />
              </div>
              
              <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-md">
                <h3 className="text-sm font-medium mb-2">CSV File Requirements</h3>
                <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1 ml-5 list-disc">
                  <li>File must be in CSV format with headers in the first row</li>
                  <li>Should include a date column (e.g., date, week, month)</li>
                  <li>Should include marketing channel spend columns (e.g., tv_spend, digital_spend)</li>
                  <li>Should include a target metric column (e.g., revenue, conversions)</li>
                  <li>Optional geo column for hierarchical modeling</li>
                  <li>Optional control variables (e.g., temperature, promotions, holidays)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </MainLayout>
  );
}
