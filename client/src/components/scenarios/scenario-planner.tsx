import React, { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ScenarioPlannerProps {
  modelResults: any;
}

export function ScenarioPlanner({ modelResults }: ScenarioPlannerProps) {
  const { toast } = useToast();
  const [isCalculating, setIsCalculating] = useState(false);

  // Get channel data from model results
  // This assumes the model results contain a channels array with name and spend properties
  const channels = modelResults?.results_json?.channel_results || [];
  
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
              {channels.map((channel: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{channel.name}</TableCell>
                  <TableCell>${channel.spend?.toLocaleString() || "N/A"}</TableCell>
                  <TableCell>{channel.roi?.toFixed(2) || "N/A"}</TableCell>
                  <TableCell>{channel.contribution?.toFixed(2) || "N/A"}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
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