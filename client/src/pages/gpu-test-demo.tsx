import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Cpu, Layers, Server, Activity, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function GpuTestDemo() {
  const [selectedTest, setSelectedTest] = useState<"cpu" | "gpu" | null>(null);
  const { toast } = useToast();

  const runSampleTest = (type: "cpu" | "gpu") => {
    setSelectedTest(type);
    
    toast({
      title: "Sample Test Results",
      description: type === "gpu" 
        ? "Showing sample results for a GPU-enabled system" 
        : "Showing sample results for a CPU-only system",
    });
  };

  const renderCpuResults = () => (
    <>
      <h3 className="text-lg font-medium mt-4 mb-2">Sample CPU-Only Results</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border rounded-md p-4">
          <div className="flex items-center mb-2">
            <Cpu className="mr-2 h-5 w-5 text-blue-500" />
            <h4 className="font-medium">CPU Resources</h4>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
            CPU Cores: <span className="font-medium text-neutral-900 dark:text-neutral-100">4</span>
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            RAM: <span className="font-medium text-neutral-900 dark:text-neutral-100">8.0 GB</span> 
            <span className="text-xs ml-1">(5.5 GB Available)</span>
          </p>
        </div>
        
        <div className="border rounded-md p-4">
          <div className="flex items-center mb-2">
            <Layers className="mr-2 h-5 w-5 text-purple-500" />
            <h4 className="font-medium">GPU Status</h4>
          </div>
          <div className="flex items-center mb-2">
            <Badge variant="secondary" className="mb-1">CPU Only</Badge>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No GPU detected. Using CPU mode.
          </p>
        </div>
      </div>
      
      <Separator className="my-6" />
      
      <h3 className="text-lg font-medium mb-3">Recommendations</h3>
      <ul className="space-y-2 mb-4">
        <li className="flex items-start">
          <span className="text-amber-500 mr-2">⚠</span>
          <span>No GPU acceleration available. Complex models may take longer to train.</span>
        </li>
        <li className="flex items-start">
          <span className="text-amber-500 mr-2">⚠</span>
          <span>Consider limiting model complexity (fewer channels/variables) for better performance.</span>
        </li>
        <li className="flex items-start">
          <span className="text-blue-500 mr-2">ℹ</span>
          <span>For best results with CPU-only mode, use smaller datasets and simpler models.</span>
        </li>
      </ul>
    </>
  );

  const renderGpuResults = () => (
    <>
      <h3 className="text-lg font-medium mt-4 mb-2">Sample GPU-Enabled Results</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border rounded-md p-4">
          <div className="flex items-center mb-2">
            <Cpu className="mr-2 h-5 w-5 text-blue-500" />
            <h4 className="font-medium">CPU Resources</h4>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
            CPU Cores: <span className="font-medium text-neutral-900 dark:text-neutral-100">8</span>
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            RAM: <span className="font-medium text-neutral-900 dark:text-neutral-100">16.0 GB</span> 
            <span className="text-xs ml-1">(12.5 GB Available)</span>
          </p>
        </div>
        
        <div className="border rounded-md p-4">
          <div className="flex items-center mb-2">
            <Layers className="mr-2 h-5 w-5 text-purple-500" />
            <h4 className="font-medium">GPU Status</h4>
          </div>
          <div className="flex items-center mb-2">
            <Badge variant="success" className="mb-1">GPU Available</Badge>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            CUDA 11.8 | NVIDIA T4 (16GB VRAM)
          </p>
        </div>
      </div>
      
      <Separator className="my-6" />
      
      <h3 className="text-lg font-medium mb-3">Recommendations</h3>
      <ul className="space-y-2 mb-4">
        <li className="flex items-start">
          <span className="text-green-500 mr-2">✓</span>
          <span>Your hardware is suitable for Meridian modeling with GPU acceleration.</span>
        </li>
        <li className="flex items-start">
          <span className="text-green-500 mr-2">✓</span>
          <span>GPU acceleration will significantly improve training speed for complex models.</span>
        </li>
        <li className="flex items-start">
          <span className="text-blue-500 mr-2">ℹ</span>
          <span>For optimal performance, consider batch sizes that fit within GPU memory.</span>
        </li>
      </ul>
    </>
  );

  return (
    <MainLayout
      title="GPU Resources Demo"
      subtitle="Sample GPU resource checking for Meridian"
      breadcrumbs={[
        { name: "Dashboard", href: "/" },
        { name: "GPU Test Demo" },
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
            <CardTitle>Meridian Computing Resources Demo</CardTitle>
            <CardDescription>
              See sample results for different hardware configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-neutral-600 dark:text-neutral-400">
              This is a demonstration of how the GPU testing feature would display results.
              Choose one of the sample configurations below:
            </p>
            
            <div className="flex flex-wrap gap-3 mb-6">
              <Button 
                variant={selectedTest === "cpu" ? "default" : "outline"}
                onClick={() => runSampleTest("cpu")}
              >
                <Cpu className="mr-2 h-4 w-4" />
                CPU-Only System
              </Button>
              
              <Button
                variant={selectedTest === "gpu" ? "default" : "outline"}
                onClick={() => runSampleTest("gpu")}
              >
                <Layers className="mr-2 h-4 w-4" />
                GPU-Enabled System
              </Button>
            </div>
            
            {selectedTest === "cpu" && renderCpuResults()}
            {selectedTest === "gpu" && renderGpuResults()}
            
            {!selectedTest && (
              <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                Select a sample configuration to see test results
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}