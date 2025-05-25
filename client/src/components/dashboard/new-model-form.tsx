import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { Play, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ModelConfig } from "@shared/schema";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ValidationResult {
  passed: boolean;
  category: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  details?: any;
}

interface ValidationReport {
  isValid: boolean;
  score: number;
  results: ValidationResult[];
  recommendations: string[];
  detectedColumns?: {
    dateColumn: string | null;
    spendColumns: string[];
    gqvColumns: string[];
    populationColumn: string | null;
  };
}

interface Dataset {
  id: number;
  name: string;
  config?: {
    columns: string[];
  };
  validation?: ValidationReport;
}

interface NewModelFormProps {
  datasets: Dataset[];
  projectId: number;
  onModelCreated?: (modelId: number) => void;
}

export function NewModelForm({ datasets, projectId, onModelCreated }: NewModelFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingValidation, setLoadingValidation] = useState(false);
  
  const [selectedDataset, setSelectedDataset] = useState<number | null>(null);
  const [modelName, setModelName] = useState<string>("");
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [dateColumn, setDateColumn] = useState<string>("");
  const [geoColumn, setGeoColumn] = useState<string>("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedControls, setSelectedControls] = useState<string[]>([]);
  const [populationColumn, setPopulationColumn] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationReport | null>(null);
  const [showGqvWarning, setShowGqvWarning] = useState<boolean>(false);
  
  // When dataset changes, fetch validation results
  useEffect(() => {
    if (!selectedDataset) {
      setValidationResults(null);
      return;
    }
    
    const dataset = datasets.find(d => d.id === selectedDataset);
    
    // If we already have validation results in the dataset object
    if (dataset?.validation) {
      setValidationResults(dataset.validation);
      
      // Pre-select detected columns
      if (dataset.validation.detectedColumns) {
        // Pre-select date column
        if (dataset.validation.detectedColumns.dateColumn) {
          setDateColumn(dataset.validation.detectedColumns.dateColumn);
        }
        
        // Pre-select all GQV columns
        if (dataset.validation.detectedColumns.gqvColumns.length > 0) {
          setSelectedControls(dataset.validation.detectedColumns.gqvColumns);
        }
        
        // Set population column if available
        if (dataset.validation.detectedColumns.populationColumn) {
          setPopulationColumn(dataset.validation.detectedColumns.populationColumn);
        }
      }
      
      // Set default model name based on dataset
      setModelName(`Model for ${dataset.name}`);
      return;
    }
    
    // Otherwise fetch validation results
    const fetchValidation = async () => {
      try {
        setLoadingValidation(true);
        const response = await apiRequest("GET", `/api/datasets/${selectedDataset}`);
        const data = await response.json();
        
        if (data.validation) {
          setValidationResults(data.validation);
          
          // Pre-select detected columns
          if (data.validation.detectedColumns) {
            // Pre-select date column
            if (data.validation.detectedColumns.dateColumn) {
              setDateColumn(data.validation.detectedColumns.dateColumn);
            }
            
            // Pre-select all GQV columns
            if (data.validation.detectedColumns.gqvColumns.length > 0) {
              setSelectedControls(data.validation.detectedColumns.gqvColumns);
            }
            
            // Set population column if available
            if (data.validation.detectedColumns.populationColumn) {
              setPopulationColumn(data.validation.detectedColumns.populationColumn);
            }
          }
        }
        
        // Set default model name based on dataset
        setModelName(`Model for ${data.name}`);
      } catch (error) {
        console.error("Error fetching validation results:", error);
        toast({
          title: "Error",
          description: "Failed to fetch dataset validation results",
          variant: "destructive"
        });
      } finally {
        setLoadingValidation(false);
      }
    };
    
    fetchValidation();
  }, [selectedDataset, datasets, toast]);
  
  // Check if we need to show GQV warning
  useEffect(() => {
    if (!validationResults?.detectedColumns) return;
    
    const hasDigitalOrSearchChannels = selectedChannels.some(channel => 
      channel.toLowerCase().includes('digital') || 
      channel.toLowerCase().includes('search') || 
      channel.toLowerCase().includes('paid_search')
    );
    
    const hasGqvControls = validationResults.detectedColumns.gqvColumns.length > 0 && 
      validationResults.detectedColumns.gqvColumns.some(gqv => selectedControls.includes(gqv));
    
    setShowGqvWarning(hasDigitalOrSearchChannels && !hasGqvControls);
  }, [selectedChannels, selectedControls, validationResults]);
  
  // Get columns from selected dataset
  const getDatasetColumns = () => {
    if (!selectedDataset) return [];
    const dataset = datasets.find(d => d.id === selectedDataset);
    return dataset?.config?.columns || [];
  };
  
  const columns = getDatasetColumns();
  
  // Filter columns to likely channel columns (containing "spend" or "cost")
  const getChannelColumns = () => {
    if (validationResults?.detectedColumns?.spendColumns.length) {
      return validationResults.detectedColumns.spendColumns;
    }
    
    return columns.filter(col => 
      col.toLowerCase().includes('spend') || 
      col.toLowerCase().includes('cost')
    );
  };
  
  // Get GQV columns from validation results
  const getGQVColumns = () => {
    if (validationResults?.detectedColumns?.gqvColumns.length) {
      return validationResults.detectedColumns.gqvColumns;
    }
    
    return columns.filter(col => 
      col.toLowerCase().includes('query') || 
      col.toLowerCase().includes('search') || 
      col.toLowerCase().includes('gqv') || 
      col.toLowerCase().includes('google_query')
    );
  };
  
  // Filter columns to other control columns (not channels, date, target, GQV)
  const getOtherControlColumns = () => {
    const channelCols = new Set(getChannelColumns());
    const gqvCols = new Set(getGQVColumns());
    const popCol = validationResults?.detectedColumns?.populationColumn;
    
    return columns.filter(col => 
      !channelCols.has(col) && 
      !gqvCols.has(col) &&
      col !== dateColumn && 
      col !== targetColumn &&
      col !== geoColumn &&
      col !== popCol &&
      col !== 'holiday' && // Exclude common control columns that will be auto-detected
      !col.toLowerCase().includes('date') &&
      !col.toLowerCase().includes('week')
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
  
  const handlePopulationToggle = () => {
    if (!validationResults?.detectedColumns?.populationColumn) return;
    
    if (populationColumn) {
      setPopulationColumn(null);
    } else {
      setPopulationColumn(validationResults.detectedColumns.populationColumn);
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
    
    if (!modelName) {
      toast({
        title: "Error",
        description: "Please enter a model name",
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
      
      // Combine control columns with population column if selected
      let controlColumns = [...selectedControls];
      if (populationColumn && !controlColumns.includes(populationColumn)) {
        controlColumns.push(populationColumn);
      }
      
      const modelConfig: ModelConfig = {
        date_column: dateColumn,
        target_column: targetColumn,
        channel_columns: selectedChannels,
        control_columns: controlColumns.length > 0 ? controlColumns : undefined,
        seasonality: 52, // Default weekly seasonality
        use_geo: geoColumn ? true : false,
      };
      
      if (geoColumn && geoColumn !== 'none') {
        modelConfig.geo_column = geoColumn;
      }
      
      // Add population scaling if selected
      if (populationColumn) {
        modelConfig.population_scaling_column = populationColumn;
      }
      
      const response = await apiRequest("POST", "/api/models", {
        project_id: projectId,
        dataset_id: selectedDataset,
        name: modelName,
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
              <Label htmlFor="model_name">Model Name</Label>
              <div className="mt-1">
                <Input
                  id="model_name"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="Enter model name"
                />
              </div>
            </div>
            
            {/* Date & Target Columns Section */}
            <div className="sm:col-span-6">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                Date & Target Column Selection
              </h3>
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
              <Label htmlFor="date_column">Date Column</Label>
              <div className="mt-1">
                <Select 
                  disabled={!selectedDataset || columns.length === 0}
                  value={dateColumn}
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
            
            {/* Marketing Channels Section */}
            <div className="sm:col-span-6">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                Marketing Channel Selection
              </h3>
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
            
            {/* Google Query Volume Section */}
            <div className="sm:col-span-6">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                Control Variables
              </h3>
            </div>
            
            {getGQVColumns().length > 0 && (
              <div className="sm:col-span-6">
                <div className="flex items-center">
                  <Label className="font-medium">Google Query Volume</Label>
                  <Info className="h-4 w-4 text-neutral-500 ml-2" />
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                  Google Query Volume helps isolate true media impact by accounting for search intent
                </p>
                <div className="mt-2 space-y-2">
                  {getGQVColumns().map(gqvColumn => (
                    <div key={gqvColumn} className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <Checkbox 
                          id={`gqv-${gqvColumn}`}
                          checked={selectedControls.includes(gqvColumn)}
                          onCheckedChange={() => handleControlToggle(gqvColumn)}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <Label 
                          htmlFor={`gqv-${gqvColumn}`}
                          className="font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          {gqvColumn}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Population Column Section */}
            {validationResults?.detectedColumns?.populationColumn && (
              <div className="sm:col-span-6">
                <div className="flex items-center">
                  <Label className="font-medium">Population Scaling</Label>
                  <Info className="h-4 w-4 text-neutral-500 ml-2" />
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                  Account for differences in market size by scaling metrics with population data
                </p>
                <div className="mt-2">
                  <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <Checkbox 
                        id={`population-${validationResults.detectedColumns.populationColumn}`}
                        checked={populationColumn !== null}
                        onCheckedChange={() => handlePopulationToggle()}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <Label 
                        htmlFor={`population-${validationResults.detectedColumns.populationColumn}`}
                        className="font-medium text-neutral-700 dark:text-neutral-300"
                      >
                        {validationResults.detectedColumns.populationColumn}
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Other Controls Section */}
            <div className="sm:col-span-6">
              <Label>Other Control Variables</Label>
              <div className="mt-2 space-y-2">
                {getOtherControlColumns().map(control => (
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
                
                {getOtherControlColumns().length === 0 && (
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    No additional control columns detected.
                  </div>
                )}
              </div>
            </div>
            
            {/* Advanced Settings Section */}
            <div className="sm:col-span-6">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                Advanced Settings
              </h3>
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
                    <SelectItem value="none">None</SelectItem>
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
          </div>
          
          {/* Warning Message for GQV */}
          {showGqvWarning && (
            <div className="mt-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>GQV Data Recommended</AlertTitle>
                <AlertDescription>
                  Including search channels without GQV data may overestimate ROI. Consider selecting the available GQV columns.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex justify-end">
              <Button variant="outline" className="mr-3">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={loading || loadingValidation}
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