import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function TestUploadForm() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [projectId, setProjectId] = useState("1"); // Default to our test project
  const [datasetName, setDatasetName] = useState("Test Dataset");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [processingResult, setProcessingResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadResult(null);
    setProcessingResult(null);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("project_id", projectId);
      formData.append("name", datasetName);
      
      // Upload the file
      const uploadResponse = await fetch("/api/datasets", {
        method: "POST",
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }
      
      const uploadData = await uploadResponse.json();
      setUploadResult(uploadData);
      
      toast({
        title: "Upload Successful",
        description: `Dataset "${datasetName}" has been uploaded with ID ${uploadData.id}`
      });
      
      // Process the dataset
      const processResponse = await fetch(`/api/datasets/${uploadData.id}/process`, {
        method: "POST"
      });
      
      if (!processResponse.ok) {
        throw new Error(`Processing failed with status ${processResponse.status}`);
      }
      
      const processData = await processResponse.json();
      setProcessingResult(processData);
      
      // Check if validation exists
      if (processData.config?.validation) {
        console.log('Validation results:', processData.config.validation);
      }
      
      toast({
        title: "Processing Successful",
        description: "Dataset has been processed and columns extracted"
      });
      
    } catch (error) {
      console.error("Error uploading/processing file:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload or process file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  
  const handleCreateModel = async () => {
    if (!uploadResult) {
      toast({
        title: "No Dataset",
        description: "Please upload a dataset first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Find potential target and channel columns from processing result
      const columns = processingResult?.config?.columns || [];
      const potentialTargetColumn = columns.find(c => 
        c.toLowerCase().includes('sales') || 
        c.toLowerCase().includes('revenue') ||
        c.toLowerCase().includes('conversion')
      ) || columns[1];
      
      const potentialChannelColumns = columns.filter(c => 
        c.toLowerCase().includes('spend') || 
        c.toLowerCase().includes('cost')
      );
      
      const potentialDateColumn = columns.find(c => 
        c.toLowerCase().includes('date') || 
        c.toLowerCase().includes('week') || 
        c.toLowerCase().includes('month')
      ) || columns[0];
      
      // Create model with basic config
      const modelResponse = await fetch("/api/models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          project_id: parseInt(projectId),
          dataset_id: uploadResult.id,
          name: `Model from ${datasetName}`,
          config: {
            date_column: potentialDateColumn,
            target_column: potentialTargetColumn,
            channel_columns: potentialChannelColumns,
            seasonality: 52
          }
        })
      });
      
      if (!modelResponse.ok) {
        throw new Error(`Model creation failed with status ${modelResponse.status}`);
      }
      
      const modelData = await modelResponse.json();
      
      toast({
        title: "Model Created",
        description: `Model "${modelData.name}" has been created with ID ${modelData.id}`
      });
      
      // Redirect to model details page
      window.location.href = `/model/${modelData.id}`;
      
    } catch (error) {
      console.error("Error creating model:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create model",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Test Upload & Model Flow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project ID</label>
            <Input 
              value={projectId} 
              onChange={e => setProjectId(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Dataset Name</label>
            <Input 
              value={datasetName} 
              onChange={e => setDatasetName(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">CSV File</label>
            <Input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              className="w-full"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleUpload} 
              disabled={!file || uploading}
              className="w-full"
            >
              {uploading ? "Uploading..." : "Upload & Process"}
            </Button>
            
            <Button 
              onClick={handleCreateModel} 
              disabled={!uploadResult || !processingResult}
              className="w-full"
              variant="outline"
            >
              Create Model
            </Button>
          </div>
          
          {processingResult?.config?.validation && (
            <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-900/20 rounded border">
              <h4 className="text-sm font-medium">Data Validation Results:</h4>
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Quality Score:</span>
                  <span className={`text-lg font-bold ${
                    processingResult.config.validation.score >= 90 ? 'text-green-600' :
                    processingResult.config.validation.score >= 70 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {processingResult.config.validation.score}/100
                  </span>
                </div>
                
                {/* Show any errors or warnings */}
                {processingResult.config.validation.results
                  .filter((r: any) => !r.passed && r.severity !== 'info')
                  .map((result: any, idx: number) => (
                    <div key={idx} className={`text-xs mt-1 ${
                      result.severity === 'error' ? 'text-red-600' : 'text-amber-600'
                    }`}>
                      {result.severity.toUpperCase()}: {result.message}
                    </div>
                  ))
                }
              </div>
              
              <div className="text-sm text-neutral-600 mt-2">
                For detailed data validation report, use the{' '}
                <a href="/datasets/upload" className="text-primary-600 underline">
                  standard upload flow
                </a>
              </div>
            </div>
          )}
          
          {uploadResult && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
              <h4 className="text-sm font-medium">Upload Result:</h4>
              <pre className="mt-1 text-xs overflow-auto">{JSON.stringify(uploadResult, null, 2)}</pre>
            </div>
          )}
          
          {processingResult && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-medium">Processing Result:</h4>
              <pre className="mt-1 text-xs overflow-auto">{JSON.stringify(processingResult, null, 2)}</pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}