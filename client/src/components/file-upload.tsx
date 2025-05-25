import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in bytes
  url: string;
  onSuccess?: (data: any) => void;
  additionalData?: Record<string, string | number>;
  buttonText?: string;
  disabled?: boolean;
}

export function FileUpload({
  accept = ".csv",
  maxSize = 10 * 1024 * 1024, // 10MB
  url,
  onSuccess,
  additionalData = {},
  buttonText = "Upload File",
  disabled = false
}: FileUploadProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  }, []);
  
  const validateAndSetFile = (file: File) => {
    // Check file type
    if (accept && !file.name.endsWith(accept.replace(".", ""))) {
      toast({
        title: "Invalid File Type",
        description: `Please upload a ${accept} file.`,
        variant: "destructive"
      });
      return;
    }
    
    // Check file size
    if (maxSize && file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: `File size exceeds ${maxSize / (1024 * 1024)}MB limit.`,
        variant: "destructive"
      });
      return;
    }
    
    setFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append("file", file);
    
    // Add any additional data to the form
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    
    try {
      // Create XHR to track upload progress
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      });
      
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          toast({
            title: "Upload Complete",
            description: "File has been uploaded successfully."
          });
          
          if (onSuccess) {
            onSuccess(response);
          }
        } else {
          toast({
            title: "Upload Failed",
            description: `Server responded with status: ${xhr.status}`,
            variant: "destructive"
          });
        }
        setUploading(false);
        setFile(null);
        setUploadProgress(0);
      });
      
      xhr.addEventListener("error", () => {
        toast({
          title: "Upload Failed",
          description: "An error occurred during upload.",
          variant: "destructive"
        });
        setUploading(false);
      });
      
      xhr.open("POST", url, true);
      xhr.send(formData);
      
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload Failed",
        description: "An error occurred while uploading the file.",
        variant: "destructive"
      });
      setUploading(false);
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-6 text-center ${
        dragOver 
          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20" 
          : "border-neutral-300 dark:border-neutral-700"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-full">
          <Upload className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            {file ? file.name : "Upload a file"}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Drag and drop or click to select a file
          </p>
          {!file && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {accept} files up to {maxSize / (1024 * 1024)}MB
            </p>
          )}
        </div>
        
        {file && !uploading && (
          <Button onClick={uploadFile}>
            Upload File
          </Button>
        )}
        
        {uploading && (
          <div className="w-full max-w-xs">
            <Progress value={uploadProgress} className="h-2 mb-2" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}
        
        {!file && !uploading && (
          <div>
            <input
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button
                variant="outline"
                className={`${disabled ? 'opacity-50' : 'cursor-pointer'}`}
                disabled={disabled}
                asChild={!disabled}
              >
                {disabled ? buttonText : <span>{buttonText}</span>}
              </Button>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
