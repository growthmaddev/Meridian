import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ModelConfig } from "@shared/schema";

interface Dataset {
  id: number;
  name: string;
  config?: {
    columns: string[];
  };
}

interface NewModelFormProps {
  datasets: Dataset[];
  projectId: number;
  onModelCreated?: (modelId: number) => void;
}

export function NewModelForm({ datasets, projectId, onModelCreated }: NewModelFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [selectedDataset, setSelectedDataset] = useState<number | null>(null);
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [dateColumn, setDateColumn] = useState<string>("");
  const [geoColumn, setGeoColumn] = useState<string>("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedControls, setSelectedControls] = useState<string[]>([]);
  
  // Get columns from selected dataset
  const getDatasetColumns = () => {
    if (!selectedDataset) return [];
    const dataset = datasets.find(d => d.id === selectedDataset);
    return dataset?.config?.columns || [];
  };
  
  const columns = getDatasetColumns();
  
  // Filter columns to likely channel columns (containing "spend" or "cost")
  const getChannelColumns = () => {
    return columns.filter(col => 
      col.toLowerCase().includes('spend') || 
      col.toLowerCase().includes('cost')
    );
  };
  
  // Filter columns to likely control columns (not channels, date, target)
  const getControlColumns = () => {
    const channelCols = new Set(getChannelColumns());
    return columns.filter(col => 
      !channelCols.has(col) && 
      col !== dateColumn && 
      col !== targetColumn &&
      col !== geoColumn
    );
  };
  
  const handleChannelToggle = (channel: string) => {
    if (selectedChannels.includes(channel)) {
      setSelectedChannels(selectedChannels.filter(c => c !== channel));
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };
  
  const handleControlToggle = (control: string) => {
    if (selectedControls.includes(control)) {
      setSelectedControls(selectedControls.filter(c => c !== control));
    } else {
      setSelectedControls([...selectedControls, control]);
    }
  };
  
  const handleSubmit = async () => {
    if (!selectedDataset) {
      toast({
        title: "Error",
        description: "Please select a dataset",
        variant: "destructive"
      });
      return;
    }
    
    if (!targetColumn) {
      toast({
        title: "Error",
        description: "Please select a target KPI column",
        variant: "destructive"
      });
      return;
    }
    
    if (!dateColumn) {
      toast({
        title: "Error",
        description: "Please select a date column",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedChannels.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one marketing channel",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const modelConfig: ModelConfig = {
        date_column: dateColumn,
        target_column: targetColumn,
        channel_columns: selectedChannels,
        control_columns: selectedControls.length > 0 ? selectedControls : undefined,
        seasonality: 52, // Default weekly seasonality
        use_geo: geoColumn ? true : false,
      };
      
      if (geoColumn) {
        modelConfig.geo_column = geoColumn;
      }
      
      const response = await apiRequest("POST", "/api/models", {
        project_id: projectId,
        dataset_id: selectedDataset,
        name: `Model for ${datasets.find(d => d.id === selectedDataset)?.name}`,
        config: modelConfig
      });
      
      const model = await response.json();
      
      toast({
        title: "Success",
        description: "Model training started successfully",
      });
      
      if (onModelCreated) {
        onModelCreated(model.id);
      }
      
    } catch (error) {
      console.error("Error creating model:", error);
      toast({
        title: "Error",
        description: "Failed to start model training",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Train New Model</h2>
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <Label htmlFor="dataset">Dataset</Label>
              <div className="mt-1">
                <Select onValueChange={(value) => setSelectedDataset(Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasets.map(dataset => (
                      <SelectItem key={dataset.id} value={dataset.id.toString()}>
                        {dataset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <Label htmlFor="target_column">Target KPI</Label>
              <div className="mt-1">
                <Select 
                  disabled={!selectedDataset || columns.length === 0}
                  onValueChange={setTargetColumn}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns
                      .filter(col => !col.toLowerCase().includes('spend') && !col.toLowerCase().includes('date'))
                      .map(column => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <Label htmlFor="geo_column">Geo Hierarchy Column</Label>
              <div className="mt-1">
                <Select 
                  disabled={!selectedDataset || columns.length === 0}
                  onValueChange={setGeoColumn}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select geo column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {columns
                      .filter(col => 
                        col.toLowerCase().includes('geo') || 
                        col.toLowerCase().includes('region') || 
                        col.toLowerCase().includes('market')
                      )
                      .map(column => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <Label htmlFor="date_column">Date Column</Label>
              <div className="mt-1">
                <Select 
                  disabled={!selectedDataset || columns.length === 0}
                  onValueChange={setDateColumn}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns
                      .filter(col => 
                        col.toLowerCase().includes('date') || 
                        col.toLowerCase().includes('week') || 
                        col.toLowerCase().includes('month')
                      )
                      .map(column => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="sm:col-span-6">
              <Label>Marketing Channels</Label>
              <div className="mt-2 space-y-2">
                {getChannelColumns().map(channel => (
                  <div key={channel} className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <Checkbox 
                        id={`channel-${channel}`}
                        checked={selectedChannels.includes(channel)}
                        onCheckedChange={() => handleChannelToggle(channel)}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <Label 
                        htmlFor={`channel-${channel}`}
                        className="font-medium text-neutral-700 dark:text-neutral-300"
                      >
                        {channel}
                      </Label>
                    </div>
                  </div>
                ))}
                
                {getChannelColumns().length === 0 && (
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    No channel columns detected. Select a dataset first.
                  </div>
                )}
              </div>
            </div>
            
            <div className="sm:col-span-6">
              <Label>Control Variables</Label>
              <div className="mt-2 space-y-2">
                {getControlColumns().map(control => (
                  <div key={control} className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <Checkbox 
                        id={`control-${control}`}
                        checked={selectedControls.includes(control)}
                        onCheckedChange={() => handleControlToggle(control)}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <Label 
                        htmlFor={`control-${control}`}
                        className="font-medium text-neutral-700 dark:text-neutral-300"
                      >
                        {control}
                      </Label>
                    </div>
                  </div>
                ))}
                
                {getControlColumns().length === 0 && (
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    No control columns detected. Select target and date columns first.
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex justify-end">
              <Button variant="outline" className="mr-3">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="flex items-center"
              >
                <Play className="mr-2 h-4 w-4" />
                Train Model
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
