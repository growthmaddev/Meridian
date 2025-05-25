import React, { useState, useMemo } from "react";
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
  TableFooter,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  };
}

interface ScenarioPlannerProps {
  modelResults: ModelResults | null;
}

export function ScenarioPlanner({ modelResults }: ScenarioPlannerProps) {
  const { toast } = useToast();
  const [isCalculating, setIsCalculating] = useState(false);

  // Process channel data from model results
  const { channels, totalSpend, avgRoi, totalContribution } = useMemo(() => {
    if (!modelResults?.results_json?.channel_analysis) {
      return { channels: [], totalSpend: 0, avgRoi: 0, totalContribution: 0 };
    }

    const channelAnalysis = modelResults.results_json.channel_analysis;
    const totalRevenue = modelResults.results_json.metrics?.total_revenue || 0;
    
    // Transform channel analysis data into a more usable format
    const processedChannels = Object.entries(channelAnalysis).map(([name, data]) => {
      // Calculate spend based on contribution and ROI
      // Spend = Revenue * Contribution / ROI
      const spend = (totalRevenue * data.contribution_percentage) / data.roi;
      
      return {
        name: formatChannelName(name),
        spend,
        roi: data.roi,
        contribution: data.contribution_percentage * 100, // Convert to percentage
        originalSpend: spend, // Store original for comparison
        originalRoi: data.roi // Store original for comparison
      };
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
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium">Total</TableCell>
                <TableCell>{formatCurrency(totalSpend)}</TableCell>
                <TableCell>{avgRoi.toFixed(2)}</TableCell>
                <TableCell>{totalContribution.toFixed(1)}%</TableCell>
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
            <div className="py-4 text-center text-muted-foreground">
              Budget adjustment controls will be implemented here
            </div>
            <Button 
              className="w-full mt-4" 
              disabled={isCalculating}
              onClick={() => {
                toast({
                  title: "Coming Soon",
                  description: "Budget adjustment feature is under development",
                });
              }}
            >
              Calculate New Scenario
            </Button>
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
            <div className="py-10 text-center text-muted-foreground">
              Impact visualization will be displayed here
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scenario Comparison</CardTitle>
          <CardDescription>
            Compare multiple budget allocation scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-10 text-center text-muted-foreground">
            Scenario comparison chart will be displayed here
          </div>
        </CardContent>
      </Card>
    </div>
  );
}