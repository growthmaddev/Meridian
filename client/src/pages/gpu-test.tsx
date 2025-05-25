import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Cpu, Layers, Server, Activity, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function GpuTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const runGpuTest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      toast({
        title: "Testing GPU Resources",
        description: "This may take a few moments...",
      });
      
      const response = await fetch('/api/gpu/test', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Error running GPU test: ${response.statusText}`);
      }
      
      const data = await response.json();
      setResults(data);
      
      toast({
        title: "GPU Test Complete",
        description: data.tf_gpu_available 
          ? "GPU is available for Meridian modeling!"
          : "No suitable GPU detected. Using CPU mode.",
      });
    } catch (err) {
      console.error("Error running GPU test:", err);
      setError(err instanceof Error ? err.message : String(err));
      
      toast({
        variant: "destructive",
        title: "GPU Test Failed",
        description: "Unable to execute the GPU test. The Python script may need configuration.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout
      title="GPU Resources Test"
      subtitle="Check available computing resources for Meridian"
      breadcrumbs={[
        { name: "Dashboard", href: "/" },
        { name: "GPU Test" },
      ]}
      actions={
        <Button asChild variant="outline">
          <Link href="/">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Meridian Computing Resources</CardTitle>
            <CardDescription>
              Test available CPU, RAM, and GPU resources for running Meridian marketing mix models
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-neutral-600 dark:text-neutral-400">
              Meridian performs best with GPU acceleration, especially for larger models and datasets.
              This test will check your available resources and provide recommendations.
            </p>
            
            <Button 
              onClick={runGpuTest}
              disabled={loading}
              className="mb-6"
            >
              {loading ? (
                <>
                  <Activity className="mr-2 h-4 w-4 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <Server className="mr-2 h-4 w-4" />
                  Run Hardware Test
                </>
              )}
            </Button>
            
            {error && (
              <div className="mb-6 p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-md text-red-600 dark:text-red-400">
                <p className="font-medium">Error running GPU test</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}
            
            {loading && (
              <div className="space-y-2 mb-6">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Testing hardware resources...</p>
                <Progress value={60} className="w-full" />
              </div>
            )}
            
            {results && (
              <>
                <h3 className="text-lg font-medium mt-4 mb-2">Test Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="border rounded-md p-4">
                    <div className="flex items-center mb-2">
                      <Cpu className="mr-2 h-5 w-5 text-blue-500" />
                      <h4 className="font-medium">CPU Resources</h4>
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                      CPU Cores: <span className="font-medium text-neutral-900 dark:text-neutral-100">{results.cpu_count}</span>
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      RAM: <span className="font-medium text-neutral-900 dark:text-neutral-100">{results.total_ram_gb.toFixed(1)} GB</span> 
                      <span className="text-xs ml-1">({results.available_ram_gb.toFixed(1)} GB Available)</span>
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <div className="flex items-center mb-2">
                      <Layers className="mr-2 h-5 w-5 text-purple-500" />
                      <h4 className="font-medium">GPU Status</h4>
                    </div>
                    <div className="flex items-center mb-2">
                      {results.tf_gpu_available ? (
                        <Badge variant="success" className="mb-1">GPU Available</Badge>
                      ) : results.has_gpu ? (
                        <Badge variant="warning" className="mb-1">GPU Detected (Not Available)</Badge>
                      ) : (
                        <Badge variant="secondary" className="mb-1">CPU Only</Badge>
                      )}
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {results.tf_gpu_available 
                        ? `CUDA ${results.cuda_version || 'Available'}`
                        : results.has_gpu 
                          ? 'GPU detected but not available to TensorFlow'
                          : 'No GPU detected. Using CPU mode.'}
                    </p>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <h3 className="text-lg font-medium mb-3">Recommendations</h3>
                <ul className="space-y-2 mb-4">
                  {results.tf_gpu_available ? (
                    <>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Your hardware is suitable for Meridian modeling with GPU acceleration.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>GPU acceleration will significantly improve training speed for complex models.</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start">
                        <span className="text-amber-500 mr-2">⚠</span>
                        <span>No GPU acceleration available. Complex models may take longer to train.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-amber-500 mr-2">⚠</span>
                        <span>Consider limiting model complexity (fewer channels/variables) for better performance.</span>
                      </li>
                    </>
                  )}
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">ℹ</span>
                    <span>For best results with CPU-only mode, use smaller datasets and simpler models.</span>
                  </li>
                </ul>
                
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  Last tested: {new Date(results.timestamp).toLocaleString()}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}