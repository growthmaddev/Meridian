import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cpu, Layers } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

export interface GpuAssessmentResult {
  timestamp: string;
  cpu_count: number;
  total_ram_gb: number;
  available_ram_gb: number;
  has_gpu: boolean;
  tf_gpu_available: boolean;
  cuda_version: string | null;
  cudnn_version: string | null;
  is_replit: boolean;
  suitable_for_meridian: boolean;
  status: "gpu_ready" | "gpu_detected" | "cpu_only";
}

interface GpuStatusBadgeProps {
  showTestButton?: boolean;
}

export function GpuStatusBadge({ showTestButton = true }: GpuStatusBadgeProps) {
  const [gpuStatus, setGpuStatus] = useState<GpuAssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Try to load the GPU assessment result from the server
    fetch("/gpu_assessment.json")
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("GPU assessment not found");
      })
      .then(data => {
        setGpuStatus(data);
      })
      .catch(error => {
        console.log("GPU assessment not available:", error);
        // Don't show error toast, just fail silently
      });
  }, []);

  const handleTestGpu = async () => {
    setLoading(true);
    toast({
      title: "Testing GPU Resources",
      description: "Running GPU assessment, this may take a moment...",
    });

    try {
      const response = await fetch("/api/gpu/test", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to run GPU test");
      }

      const result = await response.json();
      setGpuStatus(result);
      
      toast({
        title: "GPU Assessment Complete",
        description: result.tf_gpu_available 
          ? "GPU is available for Meridian modeling!" 
          : "No GPU available. CPU-only mode will be used.",
      });
    } catch (error) {
      console.error("Error testing GPU:", error);
      toast({
        variant: "destructive",
        title: "GPU Test Failed",
        description: "Unable to run GPU resource assessment.",
      });
    } finally {
      setLoading(false);
    }
  };

  // If no status is available yet, show a neutral state
  if (!gpuStatus) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="py-1">
          <Cpu className="mr-1 h-3 w-3" />
          Hardware Status: Unknown
        </Badge>
        {showTestButton && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTestGpu}
            disabled={loading}
          >
            Test Resources
          </Button>
        )}
      </div>
    );
  }

  // Determine the badge variant and text based on GPU status
  const getBadgeDetails = () => {
    switch (gpuStatus.status) {
      case "gpu_ready":
        return {
          variant: "success" as const,
          icon: <Layers className="mr-1 h-3 w-3" />,
          text: "GPU Ready",
          tooltip: `GPU available for Meridian modeling (${gpuStatus.cuda_version || "CUDA"})`,
        };
      case "gpu_detected":
        return {
          variant: "warning" as const,
          icon: <Layers className="mr-1 h-3 w-3" />,
          text: "GPU Detected",
          tooltip: "GPU hardware detected but not available to TensorFlow",
        };
      case "cpu_only":
        return {
          variant: "secondary" as const,
          icon: <Cpu className="mr-1 h-3 w-3" />,
          text: "CPU Only",
          tooltip: `Running in CPU-only mode (${gpuStatus.cpu_count} cores, ${gpuStatus.total_ram_gb}GB RAM)`,
        };
      default:
        return {
          variant: "outline" as const,
          icon: <Cpu className="mr-1 h-3 w-3" />,
          text: "Hardware Status",
          tooltip: "Hardware resource information",
        };
    }
  };

  const badgeDetails = getBadgeDetails();

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={badgeDetails.variant} className="py-1">
              {badgeDetails.icon}
              {badgeDetails.text}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{badgeDetails.tooltip}</p>
            {gpuStatus.timestamp && (
              <p className="text-xs text-neutral-500 mt-1">
                Last tested: {new Date(gpuStatus.timestamp).toLocaleString()}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {showTestButton && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleTestGpu}
          disabled={loading}
        >
          {loading ? "Testing..." : "Test Resources"}
        </Button>
      )}
    </div>
  );
}