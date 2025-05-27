import { Card, CardContent } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LabelList,
  ReferenceLine
} from "recharts";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OptimizationData {
  current_budget: number;
  optimal_allocation: Record<string, number>;
  expected_lift: number;
}

interface OptimizationSectionProps {
  optimization?: OptimizationData;
  channelAnalysis?: Record<string, any>;
  onRunOptimization?: () => void;
  loading?: boolean;
}

export function OptimizationSection({ 
  optimization, 
  channelAnalysis,
  onRunOptimization,
  loading = false 
}: OptimizationSectionProps) {
  
  // Prepare data for bar chart
  const prepareChartData = () => {
    if (!optimization || !channelAnalysis) return [];
    
    return Object.keys(optimization.optimal_allocation).map(channel => {
      // Use actual spend amount instead of contribution
      const currentValue = channelAnalysis[channel]?.total_spend || 0;
      const optimalValue = optimization.optimal_allocation[channel];
      const percentChange = ((optimalValue - currentValue) / currentValue) * 100;
      
      return {
        channel,
        current: Number((currentValue / 1000000).toFixed(1)),
        optimal: Number((optimalValue / 1000000).toFixed(1)),
        percentChange: Number(percentChange.toFixed(0))
      };
    });
  };

  const chartData = prepareChartData();

  // Format as millions
  const formatMillions = (value: number) => `$${value}M`;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Budget Optimization</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Current vs Optimal Budget */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium leading-6 text-neutral-900 dark:text-neutral-100 mb-4">Current vs Optimal Budget Allocation</h3>
            
            <div className="h-64">
              {loading ? (
                <Skeleton className="w-full h-full" />
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis tickFormatter={formatMillions} />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'current') return [`$${value}M`, 'Current'];
                        if (name === 'optimal') return [`$${value}M`, 'Optimal'];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="current" fill="#9ca3af" name="Current" />
                    <Bar dataKey="optimal" fill="#4f46e5" name="Optimal">
                      <LabelList dataKey="percentChange" position="top" formatter={(value: number) => `${value > 0 ? '+' : ''}${value}%`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                  No optimization data available
                </div>
              )}
            </div>
            
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {loading ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : chartData.length > 0 ? (
                chartData.map(item => (
                  <div key={item.channel}>
                    <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{item.channel}</h4>
                    <div className="mt-1 flex items-center">
                      <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">${item.optimal}M</span>
                      <span className={`ml-2 flex items-center text-sm font-medium ${
                        item.percentChange > 0 
                          ? 'text-success-700 dark:text-success-500' 
                          : 'text-error-700 dark:text-error-500'
                      }`}>
                        {item.percentChange > 0 ? '↑' : '↓'} {Math.abs(item.percentChange)}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-4 text-center text-neutral-500 dark:text-neutral-400">
                  Run optimization to see channel allocations
                </div>
              )}
            </div>

            {/* Detailed Budget Allocation Table */}
            {!loading && chartData.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-medium text-neutral-900 dark:text-neutral-100 mb-3">Budget Allocation Details</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead className="text-right">Current Budget</TableHead>
                      <TableHead className="text-right">Current %</TableHead>
                      <TableHead className="text-right">Optimal Budget</TableHead>
                      <TableHead className="text-right">Optimal %</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                      <TableHead className="text-right">Budget Shift</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chartData
                      .sort((a, b) => b.optimal - a.optimal) // Sort by optimal allocation
                      .map((item) => {
                      const currentPercent = optimization ? (item.current * 1000000 / optimization.current_budget * 100) : 0;
                      const optimalPercent = optimization ? (item.optimal * 1000000 / optimization.current_budget * 100) : 0;
                      const budgetShift = item.optimal - item.current;
                      
                      return (
                        <TableRow key={item.channel}>
                          <TableCell className="font-medium">{item.channel}</TableCell>
                          <TableCell className="text-right">${item.current}M</TableCell>
                          <TableCell className="text-right">{currentPercent.toFixed(1)}%</TableCell>
                          <TableCell className="text-right font-medium">${item.optimal}M</TableCell>
                          <TableCell className="text-right font-medium">{optimalPercent.toFixed(1)}%</TableCell>
                          <TableCell className="text-right">
                            <span className={`${
                              item.percentChange > 0 
                                ? 'text-success-700 dark:text-success-500' 
                                : item.percentChange < 0
                                ? 'text-error-700 dark:text-error-500'
                                : 'text-neutral-600 dark:text-neutral-400'
                            }`}>
                              {item.percentChange > 0 ? '+' : ''}{item.percentChange.toFixed(0)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`${
                              budgetShift > 0 
                                ? 'text-success-700 dark:text-success-500' 
                                : budgetShift < 0
                                ? 'text-error-700 dark:text-error-500'
                                : 'text-neutral-600 dark:text-neutral-400'
                            }`}>
                              {budgetShift > 0 ? '+' : ''}${budgetShift.toFixed(1)}M
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <p className="text-sm text-muted-foreground mt-3 px-1">
                  <strong>Note:</strong> Optimization based on ROI efficiency and saturation curves. 
                  Positive changes indicate recommended budget increases, negative indicate reductions.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Optimization Summary */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium leading-6 text-neutral-900 dark:text-neutral-100">Optimization Summary</h3>
            
            <div className="mt-5 text-center">
              {loading ? (
                <div className="flex flex-col items-center">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-10 w-24 mt-3" />
                  <Skeleton className="h-4 w-32 mt-1" />
                </div>
              ) : optimization ? (
                <>
                  <div className="inline-flex items-center justify-center p-3 bg-primary-50 dark:bg-primary-900/30 rounded-full">
                    <Rocket className="h-6 w-6 text-primary-700 dark:text-primary-400" />
                  </div>
                  <p className="mt-3 text-4xl font-bold text-primary-700 dark:text-primary-400">
                    +{(optimization.expected_lift * 100).toFixed(1)}%
                  </p>
                  <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">Expected Revenue Lift</p>
                </>
              ) : (
                <div className="py-4 text-neutral-500 dark:text-neutral-400">
                  No optimization data
                </div>
              )}
            </div>
            
            <div className="mt-6 border-t border-neutral-200 dark:border-neutral-700 pt-4">
              <dl className="space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Budget</dt>
                  <dd className="text-sm text-neutral-900 dark:text-neutral-100">
                    {optimization ? `$${(optimization.current_budget / 1000000).toFixed(1)}M` : 'N/A'}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Budget Reallocation</dt>
                  <dd className="text-sm text-neutral-900 dark:text-neutral-100">
                    {optimization ? 'Run optimization to see' : 'N/A'}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Current Revenue</dt>
                  <dd className="text-sm text-neutral-900 dark:text-neutral-100">
                    {optimization ? 'Run optimization to see' : 'N/A'}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Projected Revenue</dt>
                  <dd className="text-sm text-neutral-900 dark:text-neutral-100">
                    {optimization 
                      ? `$${(48.2 * (1 + optimization.expected_lift)).toFixed(1)}M` 
                      : 'N/A'
                    }
                  </dd>
                </div>
              </dl>
            </div>
            
            <div className="mt-6">
              <Button 
                className="w-full"
                onClick={onRunOptimization}
                disabled={loading}
              >
                Run New Optimization
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
