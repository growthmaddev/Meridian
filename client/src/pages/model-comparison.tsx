import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Download, AlertTriangle } from "lucide-react";
import { useLocation, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ModelData = {
  id: number;
  name: string;
  config: any;
  status: string;
};

type ModelResultsData = {
  model_id: number;
  results_json: {
    metrics: {
      r_squared: number;
      mape: number;
    };
    channel_analysis: Record<string, {
      contribution: number;
      contribution_percentage: number;
      roi: number;
      roi_lower: number;
      roi_upper: number;
    }>;
    control_analysis: Record<string, {
      coefficient: number;
      p_value: number;
      impact: "positive" | "negative";
      significance: "significant" | "not significant";
    }>;
  };
};

export default function ModelComparison() {
  const [location] = useLocation();
  const { toast } = useToast();
  
  // Extract model IDs from URL
  const params = new URLSearchParams(window.location.search);
  const modelIdsString = params.get('ids') || '';
  const modelIds = modelIdsString.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
  
  // Early return if no model IDs provided
  if (modelIds.length < 2) {
    return (
      <MainLayout
        title="Model Comparison"
        subtitle="Compare model performance metrics"
        breadcrumbs={[
          { name: "Models", href: "/models" },
          { name: "Compare" },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link href="/models">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Models
            </Link>
          </Button>
        }
      >
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Invalid Comparison</AlertTitle>
          <AlertDescription>
            Please select at least 2 models to compare. Go back to the models page and select models in compare mode.
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/models">Go to Models</Link>
        </Button>
      </MainLayout>
    );
  }
  
  // Fetch all the selected models data
  const modelsQueries = modelIds.map(id => 
    useQuery({
      queryKey: [`/api/models/${id}`],
    })
  );
  
  // Fetch all the selected models results
  const resultsQueries = modelIds.map(id => 
    useQuery({
      queryKey: [`/api/models/${id}/results`],
      enabled: !!modelsQueries.find(q => q.data?.id === id && q.data?.status === 'completed'),
    })
  );
  
  // Determine if any queries are loading
  const isLoading = modelsQueries.some(q => q.isLoading) || resultsQueries.some(q => q.isLoading);
  
  // Get models and results data
  const models = modelsQueries.map(q => q.data as ModelData).filter(Boolean);
  const results = resultsQueries.map(q => q.data as ModelResultsData).filter(Boolean);
  
  // Check if we have all needed results
  const hasAllResults = models.length === modelIds.length && 
                        results.length === modelIds.length &&
                        models.every(model => model.status === 'completed');
  
  // Get common channels across all models
  const commonChannels = results.length > 0 
    ? Object.keys(results[0].results_json.channel_analysis).filter(channel => 
        results.every(result => 
          Object.keys(result.results_json.channel_analysis).includes(channel)
        )
      )
    : [];
  
  // Get common control variables across all models
  const commonControls = results.length > 0 
    ? Object.keys(results[0].results_json.control_analysis).filter(control => 
        results.every(result => 
          Object.keys(result.results_json.control_analysis).includes(control)
        )
      )
    : [];
  
  // Format variable names nicely
  const formatVariableName = (name: string): string => {
    // Replace underscores with spaces
    let formatted = name.replace(/_/g, ' ');
    
    // Handle specific GQV cases
    if (formatted.includes('gqv')) {
      formatted = formatted.replace('gqv', 'GQV');
    }
    
    // Capitalize each word
    return formatted
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Function to determine better/worse metrics
  const compareMetric = (metric: string, values: number[]): string[] => {
    if (values.length < 2) return values.map(() => '');
    
    const resultClassNames = values.map(() => '');
    const bestIndex = metric === 'mape' 
      ? values.indexOf(Math.min(...values)) // Lower MAPE is better
      : values.indexOf(Math.max(...values)); // Higher R-squared is better
    
    // Only highlight if difference is significant (>5%)
    const threshold = 0.05;
    const bestValue = values[bestIndex];
    
    values.forEach((value, i) => {
      if (i === bestIndex) {
        resultClassNames[i] = 'text-green-600 dark:text-green-400 font-medium';
      } else if (metric === 'mape') {
        // For MAPE, lower is better
        const percentDiff = (value - bestValue) / bestValue;
        if (percentDiff > threshold) {
          resultClassNames[i] = 'text-red-600 dark:text-red-400';
        }
      } else {
        // For R-squared, higher is better
        const percentDiff = (bestValue - value) / bestValue;
        if (percentDiff > threshold) {
          resultClassNames[i] = 'text-red-600 dark:text-red-400';
        }
      }
    });
    
    return resultClassNames;
  };
  
  // Function to compare ROI values
  const compareROI = (roiValues: number[]): string[] => {
    return compareMetric('roi', roiValues);
  };
  
  // Generate key insights about the comparison
  const generateKeyInsights = () => {
    if (!hasAllResults) return [];
    
    const insights: string[] = [];
    
    // Compare R-squared
    const rSquaredValues = results.map(r => r.results_json.metrics.r_squared);
    const bestRSquared = Math.max(...rSquaredValues);
    const bestRSquaredIndex = rSquaredValues.indexOf(bestRSquared);
    if (bestRSquared > 0.7) {
      insights.push(`Model "${models[bestRSquaredIndex].name}" has the highest R-squared value of ${bestRSquared.toFixed(3)}, indicating a strong fit.`);
    }
    
    // Compare MAPE
    const mapeValues = results.map(r => r.results_json.metrics.mape);
    const bestMape = Math.min(...mapeValues);
    const bestMapeIndex = mapeValues.indexOf(bestMape);
    if (bestMape < 0.1) {
      insights.push(`Model "${models[bestMapeIndex].name}" has the lowest MAPE of ${(bestMape * 100).toFixed(1)}%, indicating high accuracy.`);
    }
    
    // Compare channel ROIs
    commonChannels.forEach(channel => {
      const roiValues = results.map(r => r.results_json.channel_analysis[channel].roi);
      const bestRoi = Math.max(...roiValues);
      const bestRoiIndex = roiValues.indexOf(bestRoi);
      
      // Only add insight if ROI difference is significant (>20%)
      const secondBestRoi = [...roiValues].sort((a, b) => b - a)[1];
      if (bestRoi > 1.5 && (bestRoi - secondBestRoi) / secondBestRoi > 0.2) {
        insights.push(`Model "${models[bestRoiIndex].name}" shows the highest ROI for ${formatVariableName(channel)} at ${bestRoi.toFixed(2)}.`);
      }
    });
    
    // Add control variable insights
    commonControls.forEach(control => {
      const coefficients = results.map(r => r.results_json.control_analysis[control].coefficient);
      const pValues = results.map(r => r.results_json.control_analysis[control].p_value);
      
      // Check if all models agree on significance and direction
      const allSignificant = pValues.every(p => p < 0.05);
      const allPositive = coefficients.every(c => c > 0);
      const allNegative = coefficients.every(c => c < 0);
      
      if (allSignificant && (allPositive || allNegative)) {
        insights.push(`All models agree that ${formatVariableName(control)} has a ${allPositive ? 'positive' : 'negative'} effect on sales.`);
      }
    });
    
    return insights;
  };
  
  const keyInsights = generateKeyInsights();
  
  return (
    <MainLayout
      title="Model Comparison"
      subtitle={`Comparing ${models.length} models`}
      breadcrumbs={[
        { name: "Models", href: "/models" },
        { name: "Compare" },
      ]}
      actions={
        <Button asChild variant="outline">
          <Link href="/models">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Models
          </Link>
        </Button>
      }
    >
      {isLoading ? (
        // Loading state
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !hasAllResults ? (
        // Error state
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Missing Data</AlertTitle>
          <AlertDescription>
            Some of the selected models are not completed or their results could not be loaded.
            Please select only completed models for comparison.
          </AlertDescription>
        </Alert>
      ) : (
        // Content
        <>
          {/* Key Insights Section */}
          {keyInsights.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>
                  Key differences and insights from comparing these models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {keyInsights.map((insight, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-primary-700 dark:text-primary-400 font-medium mr-2">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="channels">Channel Analysis</TabsTrigger>
              <TabsTrigger value="controls">Control Variables</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Model Performance Metrics</CardTitle>
                  <CardDescription>
                    Compare accuracy and fit metrics across models
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        {models.map(model => (
                          <TableHead key={model.id}>{model.name}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">R-squared</TableCell>
                        {results.map((result, index) => {
                          const rSquaredValues = results.map(r => r.results_json.metrics.r_squared);
                          const classNames = compareMetric('r_squared', rSquaredValues);
                          return (
                            <TableCell key={index} className={classNames[index]}>
                              {result.results_json.metrics.r_squared.toFixed(3)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">MAPE</TableCell>
                        {results.map((result, index) => {
                          const mapeValues = results.map(r => r.results_json.metrics.mape);
                          const classNames = compareMetric('mape', mapeValues);
                          return (
                            <TableCell key={index} className={classNames[index]}>
                              {(result.results_json.metrics.mape * 100).toFixed(1)}%
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Date Column</TableCell>
                        {models.map(model => (
                          <TableCell key={model.id}>
                            {model.config.date_column}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Target</TableCell>
                        {models.map(model => (
                          <TableCell key={model.id}>
                            {model.config.target_column}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Channels</TableCell>
                        {models.map(model => (
                          <TableCell key={model.id}>
                            {model.config.channel_columns?.length || 0}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Controls</TableCell>
                        {models.map(model => (
                          <TableCell key={model.id}>
                            {model.config.control_columns?.length || 0}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Channel Analysis Tab */}
            <TabsContent value="channels">
              <Card>
                <CardHeader>
                  <CardTitle>Channel ROI Comparison</CardTitle>
                  <CardDescription>
                    Compare return on investment across channels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {commonChannels.length === 0 ? (
                    <div className="text-center text-neutral-500 dark:text-neutral-400 py-6">
                      No common channels found across these models
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Channel</TableHead>
                          {models.map(model => (
                            <TableHead key={model.id}>{model.name}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commonChannels.map(channel => {
                          const roiValues = results.map(result => 
                            result.results_json.channel_analysis[channel].roi
                          );
                          const classNames = compareROI(roiValues);
                          
                          return (
                            <TableRow key={channel}>
                              <TableCell className="font-medium">
                                {formatVariableName(channel)}
                              </TableCell>
                              {results.map((result, index) => (
                                <TableCell key={index} className={classNames[index]}>
                                  {result.results_json.channel_analysis[channel].roi.toFixed(2)}
                                </TableCell>
                              ))}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Channel Contribution</CardTitle>
                  <CardDescription>
                    Compare channel contribution percentages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {commonChannels.length === 0 ? (
                    <div className="text-center text-neutral-500 dark:text-neutral-400 py-6">
                      No common channels found across these models
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Channel</TableHead>
                          {models.map(model => (
                            <TableHead key={model.id}>{model.name}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commonChannels.map(channel => (
                          <TableRow key={channel}>
                            <TableCell className="font-medium">
                              {formatVariableName(channel)}
                            </TableCell>
                            {results.map((result, index) => (
                              <TableCell key={index}>
                                {(result.results_json.channel_analysis[channel].contribution_percentage * 100).toFixed(1)}%
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Control Variables Tab */}
            <TabsContent value="controls">
              <Card>
                <CardHeader>
                  <CardTitle>Control Variable Coefficients</CardTitle>
                  <CardDescription>
                    Compare the effect of control variables across models
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {commonControls.length === 0 ? (
                    <div className="text-center text-neutral-500 dark:text-neutral-400 py-6">
                      No common control variables found across these models
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Control Variable</TableHead>
                          {models.map(model => (
                            <TableHead key={model.id}>{model.name}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commonControls.map(control => (
                          <TableRow key={control}>
                            <TableCell className="font-medium">
                              {formatVariableName(control)}
                            </TableCell>
                            {results.map((result, index) => (
                              <TableCell 
                                key={index}
                                className={
                                  result.results_json.control_analysis[control].significance === 'significant'
                                    ? result.results_json.control_analysis[control].impact === 'positive'
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-red-600 dark:text-red-400'
                                    : 'text-neutral-500 dark:text-neutral-400'
                                }
                              >
                                {result.results_json.control_analysis[control].coefficient.toFixed(3)}
                                {result.results_json.control_analysis[control].significance !== 'significant' && '*'}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    * Not statistically significant (p-value &gt; 0.05)
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </MainLayout>
  );
}