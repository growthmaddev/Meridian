import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface TrainingStatus {
  status: string;
  progress: number;
  error?: string;
}

interface TrainingProgressProps {
  modelId: number;
  onTrainingComplete?: () => void;
  onTrainingFailed?: () => void;
}

export function TrainingProgress({ 
  modelId, 
  onTrainingComplete, 
  onTrainingFailed 
}: TrainingProgressProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<TrainingStatus>({
    status: "pending",
    progress: 0
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [logOutput, setLogOutput] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Start the elapsed time counter
    startTimeRef.current = Date.now();
    intervalRef.current = window.setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    // Poll for training status
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/models/${modelId}`);
        const model = await response.json();
        
        if (model.status === 'completed') {
          setStatus({
            status: 'completed',
            progress: 100
          });
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          
          toast({
            title: "Training Complete",
            description: "The model has been successfully trained"
          });
          
          if (onTrainingComplete) {
            onTrainingComplete();
          }
        } else if (model.status === 'failed') {
          setStatus({
            status: 'failed',
            progress: 0,
            error: 'Model training failed'
          });
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          
          toast({
            title: "Training Failed",
            description: "The model training process failed",
            variant: "destructive"
          });
          
          if (onTrainingFailed) {
            onTrainingFailed();
          }
        } else if (model.status === 'running') {
          // Model is still running, add a log entry
          const timestamp = new Date().toLocaleTimeString();
          const newLogEntry = `[${timestamp}] Model training in progress...`;
          
          setLogOutput(prev => {
            // Only add if it's different from the last entry
            if (prev.length === 0 || prev[prev.length - 1] !== newLogEntry) {
              return [...prev, newLogEntry];
            }
            return prev;
          });
          
          // Set a progress value based on time passed (estimate)
          const timeProgress = Math.min(elapsedTime / 600, 0.95) * 100; // Max 95% until complete
          setStatus({
            status: 'running',
            progress: Math.round(timeProgress)
          });
          
          // Schedule next poll
          setTimeout(pollStatus, 5000);
        }
      } catch (error) {
        console.error("Error polling model status:", error);
        // Continue polling despite errors
        setTimeout(pollStatus, 5000);
      }
    };

    // Start polling
    pollStatus();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [modelId, elapsedTime, onTrainingComplete, onTrainingFailed, toast]);

  // Auto-scroll the log container to the bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logOutput]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Estimate remaining time based on progress
  const estimateRemaining = () => {
    if (status.progress <= 0) return '--:--';
    const totalEstimatedTime = (elapsedTime / status.progress) * 100;
    const remainingSeconds = Math.max(0, Math.round(totalEstimatedTime - elapsedTime));
    return formatTime(remainingSeconds);
  };

  const handleCancelTraining = async () => {
    try {
      await fetch(`/api/models/${modelId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      toast({
        title: "Training Canceled",
        description: "The model training process has been canceled"
      });
      
      if (onTrainingFailed) {
        onTrainingFailed();
      }
    } catch (error) {
      console.error("Error canceling training:", error);
      toast({
        title: "Error",
        description: "Failed to cancel model training",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Model Training Progress</h2>
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium leading-6 text-neutral-900 dark:text-neutral-100 mb-4">
            Training in Progress
          </h3>
          
          <Progress 
            value={status.progress} 
            className="h-2.5 mb-4" 
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Status</h4>
              <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {status.status === 'pending' && 'Initializing'}
                {status.status === 'running' && 'Sampling MCMC Chain'}
                {status.status === 'completed' && 'Complete'}
                {status.status === 'failed' && 'Failed'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Progress</h4>
              <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {status.progress}%
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Elapsed Time</h4>
              <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {formatTime(elapsedTime)}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Est. Completion</h4>
              <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {estimateRemaining()} remaining
              </p>
            </div>
          </div>
          
          <div className="mt-6 border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">Log Output</h4>
            <div 
              ref={logContainerRef}
              className="bg-neutral-50 dark:bg-neutral-900 rounded-md p-3 text-xs font-mono h-32 overflow-y-auto border border-neutral-200 dark:border-neutral-700"
            >
              {logOutput.length > 0 ? (
                logOutput.map((log, index) => (
                  <p key={index} className="text-neutral-700 dark:text-neutral-300">{log}</p>
                ))
              ) : (
                <p className="text-neutral-700 dark:text-neutral-300">[Waiting for training output...]</p>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button 
              variant="destructive" 
              onClick={handleCancelTraining}
              disabled={status.status === 'completed' || status.status === 'failed'}
            >
              Cancel Training
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
