import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Save, RefreshCw, ArrowRight, Trash2, Download, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface ChannelAnalysis {
  contribution: number;
  contribution_percentage: number;
  roi: number;
  roi_lower: number;
  roi_upper: number;
  spend?: number;
}

interface ModelResults {
  results_json: {
    channel_analysis: Record<string, ChannelAnalysis>;
    metrics?: {
      total_spend?: number;
      total_revenue?: number;
    };
    optimization?: {
      current_budget?: number;
      current_allocation?: Record<string, number>;
    };
  };
}

interface ScenarioPlannerProps {
  modelResults: ModelResults | null;
}

interface ChannelData {
  name: string;
  originalName: string;
  spend: number;
  roi: number;
  contribution: number;
  originalSpend: number;
  originalRoi: number;
}

interface SavedScenario {
  id: string;
  name: string;
  createdAt: Date;
  channels: ChannelData[];
  impact: {
    totalSpend: number;
    totalRevenue: number;
    avgRoi: number;
    percentChange: number;
  };
}

export function ScenarioPlanner({ modelResults }: ScenarioPlannerProps) {
  const { toast } = useToast();
  const [isCalculating, setIsCalculating] = useState(false);
  const [adjustedChannels, setAdjustedChannels] = useState<ChannelData[] | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [scenarioNameInput, setScenarioNameInput] = useState("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  
  // Track whether there are unsaved changes
  const hasUnsavedChanges = !!adjustedChannels;
  
  // Function to generate a default scenario name
  const generateScenarioName = () => {
    return `Scenario ${savedScenarios.length + 1}`;
  };
  
  // Format channel name for display (e.g., "tv_spend" -> "TV")
  function formatChannelName(name: string): string {
    return name
      .replace(/_spend$/, '')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Format currency value
  function formatCurrency(value: number): string {
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
  
  // Calculate the new ROI based on spend change and diminishing returns
  const calculateAdjustedRoi = (originalRoi: number, newSpend: number, originalSpend: number) => {
    // Simple diminishing returns formula (square root of the ratio)
    const ratio = newSpend / originalSpend;
    const diminishingFactor = ratio <= 0 ? 0 : Math.sqrt(ratio);
    return originalRoi * diminishingFactor;
  };

  // Process channel data from model results
  const { channels, totalSpend, avgRoi, totalContribution } = useMemo(() => {
    if (!modelResults?.results_json?.channel_analysis) {
      return { channels: [], totalSpend: 0, avgRoi: 0, totalContribution: 0 };
    }

    const channelAnalysis = modelResults.results_json.channel_analysis;
    
    // Check if we have optimization data with budget information
    const optimization = modelResults.results_json.optimization;
    const totalBudget = optimization?.current_budget || 500000; // Default to $500K if not available
    
    // Check if we have metrics data
    const metrics = modelResults.results_json.metrics || {};
    const totalRevenue = metrics.total_revenue || 1000000; // Default to $1M if not available
    
    // Transform channel analysis data into a more usable format
    const processedChannels = Object.entries(channelAnalysis).map(([name, data]) => {
      // Try to find channel spend from various possible locations
      let spend = 0;
      
      // Option 1: Check if optimization has allocation data
      if (optimization?.current_allocation && optimization.current_allocation[name]) {
        spend = optimization.current_allocation[name] * totalBudget;
      } 
      // Option 2: Calculate spend based on contribution percentage and ROI
      else {
        // We need to adjust for ROI differences to make the distribution realistic
        // Higher ROI channels typically get less budget than their revenue contribution would suggest
        const roiAdjustmentFactor = Math.sqrt(data.roi); // Dampen the effect of ROI
        spend = (totalBudget * data.contribution_percentage) / roiAdjustmentFactor;
      }
      
      // Check if contribution is already a percentage (>1) or decimal (0-1)
      // Our data shows sum is ~112%, so they're already percentages
      const contributionPercent = data.contribution_percentage * 100;
      
      return {
        name: formatChannelName(name),
        originalName: name, // Keep original name for API calls
        spend,
        roi: data.roi,
        contribution: contributionPercent,
        originalSpend: spend, // Store original for comparison
        originalRoi: data.roi // Store original for comparison
      };
    });
    
    // Normalize spends to match total budget
    const initialTotalSpend = processedChannels.reduce((sum, channel) => sum + channel.spend, 0);
    const normalizationFactor = totalBudget / initialTotalSpend;
    
    // Apply normalization
    processedChannels.forEach(channel => {
      channel.spend *= normalizationFactor;
    });
    
    // Calculate totals
    const totalSpendCalc = processedChannels.reduce((sum, channel) => sum + channel.spend, 0);
    const weightedRoi = processedChannels.reduce((sum, channel) => sum + (channel.roi * channel.spend), 0);
    const avgRoiCalc = weightedRoi / totalSpendCalc || 0;
    const totalContributionCalc = processedChannels.reduce((sum, channel) => sum + channel.contribution, 0);
    
    return { 
      channels: processedChannels, 
      totalSpend: totalSpendCalc,
      avgRoi: avgRoiCalc,
      totalContribution: totalContributionCalc
    };
  }, [modelResults]);

  // Calculate the original total revenue for comparison
  const originalTotalRevenue = useMemo(() => {
    if (!channels?.length) return 0;
    return channels.reduce((sum, channel) => sum + (channel.spend * channel.roi), 0);
  }, [channels]);
  
  // Impact of adjusted budget (if any)
  const scenarioImpact = useMemo(() => {
    if (!adjustedChannels) return null;
    
    const totalSpend = adjustedChannels.reduce((sum, channel) => sum + channel.spend, 0);
    
    // Calculate ROI-weighted revenue
    const totalRevenue = adjustedChannels.reduce(
      (sum, channel) => sum + (channel.spend * channel.roi), 0
    );
    
    // Calculate average ROI
    const avgRoi = totalRevenue / totalSpend;
    
    return {
      totalSpend,
      totalRevenue,
      avgRoi,
      percentChange: ((totalRevenue - originalTotalRevenue) / originalTotalRevenue) * 100
    };
  }, [adjustedChannels, originalTotalRevenue]);
  
  // Reset adjustments to initial state
  const handleResetAdjustments = () => {
    setAdjustedChannels(null);
    toast({
      title: "Adjustments Reset",
      description: "Your budget adjustments have been reset to the baseline"
    });
  };
  
  // Save the current scenario
  const handleSaveScenario = () => {
    if (!adjustedChannels || !scenarioImpact) return;
    
    // Use input name or generate default
    const scenarioName = scenarioNameInput.trim() || generateScenarioName();
    
    // Create new scenario
    const newScenario: SavedScenario = {
      id: crypto.randomUUID ? crypto.randomUUID() : `scenario-${Date.now()}`,
      name: scenarioName,
      createdAt: new Date(),
      channels: [...adjustedChannels],
      impact: { ...scenarioImpact }
    };
    
    // Limit to max 5 scenarios (remove oldest if needed)
    const updatedScenarios = [newScenario, ...savedScenarios];
    if (updatedScenarios.length > 5) {
      updatedScenarios.pop();
    }
    
    setSavedScenarios(updatedScenarios);
    setScenarioNameInput("");
    setIsSaveDialogOpen(false);
    
    toast({
      title: "Scenario Saved",
      description: `"${scenarioName}" has been saved for comparison`
    });
  };
  
  // Apply a saved scenario to the current view
  const handleApplyScenario = (scenario: SavedScenario) => {
    setAdjustedChannels([...scenario.channels]);
    
    toast({
      title: "Scenario Applied",
      description: `Now viewing "${scenario.name}"`
    });
  };
  
  // Delete a saved scenario
  const handleDeleteScenario = (scenarioId: string) => {
    setSavedScenarios(savedScenarios.filter(s => s.id !== scenarioId));
    
    toast({
      title: "Scenario Deleted",
      description: "The scenario has been removed"
    });
  };
  
  // Find the best performing scenario based on ROI
  const getBestScenario = () => {
    if (savedScenarios.length === 0) return null;
    
    return savedScenarios.reduce((best, current) => {
      return current.impact.avgRoi > best.impact.avgRoi ? current : best;
    }, savedScenarios[0]);
  };
  
  // Function to handle budget adjustments via sliders
  const handleBudgetChange = (channelIndex: number, newSpend: number) => {
    // Start from the original channels or existing adjusted ones
    const baseChannels = adjustedChannels || channels;
    
    // Create a copy of the channels to modify
    const updatedChannels = [...baseChannels];
    
    // Update the spend for the specific channel
    updatedChannels[channelIndex] = {
      ...updatedChannels[channelIndex],
      spend: newSpend
    };
    
    // Recalculate ROI based on diminishing returns formula (simplified)
    // In a real app, this would use the saturation curves from the model
    updatedChannels[channelIndex].roi = calculateAdjustedRoi(
      updatedChannels[channelIndex].originalRoi,
      newSpend,
      updatedChannels[channelIndex].originalSpend
    );
    
    // Store the adjusted channels
    setAdjustedChannels(updatedChannels);
  };
  
  // Debug output
  console.log("Model results structure:", modelResults?.results_json);
  
  if (modelResults?.results_json?.channel_analysis) {
    const channelAnalysis = modelResults.results_json.channel_analysis;
    const contributionValues = Object.entries(channelAnalysis).map(([name, data]) => ({
      name,
      contribution_percentage: data.contribution_percentage
    }));
    
    console.log("Raw contribution percentages:", contributionValues);
    
    const totalContributionPercentage = Object.values(channelAnalysis)
      .reduce((sum, data) => sum + data.contribution_percentage, 0);
    
    console.log("Sum of all contribution_percentage values:", totalContributionPercentage);
  }
  
  // Loading state
  if (!modelResults) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // No data state
  if (channels.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No channel data available</AlertTitle>
        <AlertDescription>
          The model results don't contain channel analysis data needed for budget scenarios.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Channel Budgets</CardTitle>
          <CardDescription>
            Review your current budget allocation across marketing channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Current Spend</TableHead>
                <TableHead>ROI</TableHead>
                <TableHead>Contribution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((channel, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{channel.name}</TableCell>
                  <TableCell>{formatCurrency(channel.spend)}</TableCell>
                  <TableCell>{channel.roi.toFixed(2)}</TableCell>
                  <TableCell>{channel.contribution.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
              {totalContribution < 98 && (
                <TableRow>
                  <TableCell className="font-medium">Base Sales</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{(100 - totalContribution).toFixed(1)}%</TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium">Total</TableCell>
                <TableCell>{formatCurrency(totalSpend)}</TableCell>
                <TableCell>{avgRoi.toFixed(2)}</TableCell>
                <TableCell>{Math.min(totalContribution, 100).toFixed(1)}%</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Budget Adjustment</CardTitle>
            <CardDescription>
              Modify budget allocations to see potential impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(adjustedChannels || channels).map((channel, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {channel.name}
                    </label>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(channel.spend)}
                      {channel.spend !== channel.originalSpend && (
                        <span className={channel.spend > channel.originalSpend ? "text-green-500 ml-1" : "text-red-500 ml-1"}>
                          {channel.spend > channel.originalSpend ? "+" : ""}
                          {Math.round((channel.spend / channel.originalSpend - 1) * 100)}%
                        </span>
                      )}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={channel.originalSpend * 2}
                    step={Math.max(1000, channel.originalSpend * 0.05)}
                    value={channel.spend}
                    className="w-full"
                    onChange={(e) => handleBudgetChange(index, Number(e.target.value))}
                    disabled={isCalculating}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>Current ({formatCurrency(channel.originalSpend)})</span>
                    <span>+100%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <Button 
                className="flex-1" 
                disabled={isCalculating || !hasUnsavedChanges}
                onClick={() => setIsSaveDialogOpen(true)}
                variant="outline"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Scenario
              </Button>
              
              <Button 
                className="flex-1" 
                disabled={isCalculating || !hasUnsavedChanges}
                onClick={handleResetAdjustments}
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
            
            {/* Save Scenario Dialog */}
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Save Scenario</DialogTitle>
                  <DialogDescription>
                    Give your budget scenario a name to save it for comparison.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    placeholder={generateScenarioName()}
                    value={scenarioNameInput}
                    onChange={(e) => setScenarioNameInput(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button 
                    onClick={handleSaveScenario}
                    disabled={!hasUnsavedChanges || isCalculating}
                  >
                    Save Scenario
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Impact Visualization</CardTitle>
            <CardDescription>
              See how changes affect key performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scenarioImpact ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Total Spend</div>
                    <div className="text-2xl font-bold">{formatCurrency(scenarioImpact.totalSpend)}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {scenarioImpact.totalSpend > totalSpend ? (
                        <span className="text-amber-500">+{formatCurrency(scenarioImpact.totalSpend - totalSpend)}</span>
                      ) : (
                        <span className="text-green-500">-{formatCurrency(totalSpend - scenarioImpact.totalSpend)}</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Average ROI</div>
                    <div className="text-2xl font-bold">{scenarioImpact.avgRoi.toFixed(2)}</div>
                    <div className="text-sm mt-1">
                      {scenarioImpact.avgRoi > avgRoi ? (
                        <span className="text-green-500">+{(scenarioImpact.avgRoi - avgRoi).toFixed(2)}</span>
                      ) : (
                        <span className="text-red-500">{(scenarioImpact.avgRoi - avgRoi).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Revenue Impact</div>
                    <div className="text-2xl font-bold">{formatCurrency(scenarioImpact.totalRevenue)}</div>
                    <div className="text-sm mt-1">
                      {scenarioImpact.percentChange > 0 ? (
                        <span className="text-green-500">+{scenarioImpact.percentChange.toFixed(1)}%</span>
                      ) : (
                        <span className="text-red-500">{scenarioImpact.percentChange.toFixed(1)}%</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Efficiency Change</div>
                    <div className="text-2xl font-bold">
                      {((scenarioImpact.avgRoi / avgRoi - 1) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm mt-1">
                      {scenarioImpact.avgRoi > avgRoi ? (
                        <span className="text-green-500">More efficient</span>
                      ) : (
                        <span className="text-red-500">Less efficient</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground pt-2">
                  This is a simplified estimate based on diminishing returns. In a real system, 
                  this would use the full response curves from the model.
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                Adjust the budget sliders and click "Calculate New Scenario" to see the impact
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scenario Comparison</CardTitle>
          <CardDescription>
            Compare budget scenarios to find the optimal allocation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {savedScenarios.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scenario Name</TableHead>
                  <TableHead>Total Spend</TableHead>
                  <TableHead>Avg. ROI</TableHead>
                  <TableHead>Revenue Impact</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Baseline row */}
                <TableRow>
                  <TableCell className="font-medium">Baseline</TableCell>
                  <TableCell>{formatCurrency(totalSpend)}</TableCell>
                  <TableCell>{avgRoi.toFixed(2)}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleResetAdjustments}
                      className="h-8 px-2"
                    >
                      <ArrowRight className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
                
                {/* Saved scenarios */}
                {savedScenarios.map((scenario) => {
                  const isBest = getBestScenario()?.id === scenario.id;
                  return (
                    <TableRow key={scenario.id}>
                      <TableCell className="font-medium">
                        {scenario.name}
                        {isBest && (
                          <Badge variant="default" className="ml-2 bg-green-600">
                            <Check className="h-3 w-3 mr-1" />
                            Best
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(scenario.impact.totalSpend)}</TableCell>
                      <TableCell>{scenario.impact.avgRoi.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={scenario.impact.percentChange >= 0 ? "text-green-500" : "text-red-500"}>
                          {scenario.impact.percentChange >= 0 ? "+" : ""}
                          {scenario.impact.percentChange.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>{new Date(scenario.createdAt).toLocaleTimeString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleApplyScenario(scenario)}
                            className="h-8 px-2"
                          >
                            <ArrowRight className="h-4 w-4" />
                            <span className="sr-only">Apply</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteScenario(scenario.id)}
                            className="h-8 px-2 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              Adjust the budget sliders and save scenarios to compare different allocations
            </div>
          )}
        </CardContent>
        {savedScenarios.length > 0 && (
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              {savedScenarios.length} of 5 scenarios saved
            </div>
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-2" />
              Export Comparison
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}