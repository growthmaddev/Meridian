import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ArrowLeft, BarChart3, TrendingUp, DollarSign, Target, Users } from "lucide-react";

// Mock data structure that represents the pre-Meridian model results format
const legacyModelResults = {
  model_id: 1,
  model_name: "Legacy MMM Model",
  status: "completed",
  metrics: {
    r_squared: 0.85,
    mape: 0.12,
    mae: 15000,
    rmse: 22000
  },
  channel_analysis: {
    tv_spend: {
      contribution: 381946.72,
      contribution_percentage: 0.2029,
      roi: 0.754,
      roi_lower: 0.603,
      roi_upper: 0.904,
      spend_percentage: 0.25,
      total_spend: 297500
    },
    radio_spend: {
      contribution: 121808.86,
      contribution_percentage: 0.0647,
      roi: 1.027,
      roi_lower: 0.822,
      roi_upper: 1.232,
      spend_percentage: 0.25,
      total_spend: 297500
    },
    digital_spend: {
      contribution: 681618.0,
      contribution_percentage: 0.3621,
      roi: 1.770,
      roi_lower: 1.416,
      roi_upper: 2.123,
      spend_percentage: 0.25,
      total_spend: 297500
    },
    print_spend: {
      contribution: 697046.0,
      contribution_percentage: 0.3703,
      roi: 3.819,
      roi_lower: 3.056,
      roi_upper: 4.583,
      spend_percentage: 0.25,
      total_spend: 297500
    }
  },
  control_analysis: {
    seasonality: {
      coefficient: 0.15,
      p_value: 0.001,
      impact: "positive" as const,
      significance: "significant" as const
    },
    trend: {
      coefficient: 0.08,
      p_value: 0.025,
      impact: "positive" as const,
      significance: "significant" as const
    },
    competitor_activity: {
      coefficient: -0.12,
      p_value: 0.005,
      impact: "negative" as const,
      significance: "significant" as const
    }
  },
  response_curves: {
    tv_spend: {
      saturation: { ec: 1.204, slope: 1.0 },
      adstock: { decay: 0.193, peak: 1 }
    },
    radio_spend: {
      saturation: { ec: 0.856, slope: 1.2 },
      adstock: { decay: 0.237, peak: 1 }
    },
    digital_spend: {
      saturation: { ec: 2.145, slope: 0.8 },
      adstock: { decay: 0.158, peak: 1 }
    },
    print_spend: {
      saturation: { ec: 1.789, slope: 1.1 },
      adstock: { decay: 0.185, peak: 1 }
    }
  }
};

export default function LegacyModelResults() {
  const { metrics, channel_analysis, control_analysis, response_curves } = legacyModelResults;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <MainLayout
      title="Legacy Model Results (Pre-Meridian)"
      subtitle="Review of features available before Meridian integration"
      actions={
        <Button asChild variant="outline">
          <Link href="/models">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Current Models
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Model Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Model Performance Metrics
            </CardTitle>
            <CardDescription>
              Statistical measures of model accuracy and fit quality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {(metrics.r_squared * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  R-Squared
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {(metrics.mape * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  MAPE
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(metrics.mae)}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  MAE
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(metrics.rmse)}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  RMSE
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Channel Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Channel Analysis & ROI
            </CardTitle>
            <CardDescription>
              Contribution and return on investment by marketing channel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(channel_analysis).map(([channel, data]) => (
                <div key={channel} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold capitalize text-lg">
                      {channel.replace('_', ' ')}
                    </h3>
                    <Badge variant="outline">
                      {formatPercentage(data.spend_percentage)} of Budget
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        Contribution
                      </div>
                      <div className="font-semibold">
                        {formatCurrency(data.contribution)}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {formatPercentage(data.contribution_percentage)} of total
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        ROI
                      </div>
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        {data.roi.toFixed(2)}x
                      </div>
                      <div className="text-xs text-neutral-400">
                        ({data.roi_lower.toFixed(2)} - {data.roi_upper.toFixed(2)})
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        Total Spend
                      </div>
                      <div className="font-semibold">
                        {formatCurrency(data.total_spend)}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        Efficiency
                      </div>
                      <div className="font-semibold text-blue-600 dark:text-blue-400">
                        {(data.contribution / data.total_spend).toFixed(2)}x
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Control Variables Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Control Variables Analysis
            </CardTitle>
            <CardDescription>
              Impact of external factors and baseline variables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(control_analysis).map(([variable, data]) => (
                <div key={variable} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      data.impact === 'positive' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium capitalize">
                      {variable.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {data.coefficient > 0 ? '+' : ''}{data.coefficient.toFixed(3)}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        Coefficient
                      </div>
                    </div>
                    
                    <Badge 
                      variant={data.significance === 'significant' ? 'default' : 'secondary'}
                      className={data.significance === 'significant' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : ''
                      }
                    >
                      p = {data.p_value.toFixed(3)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Response Curves Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Response Curves Parameters
            </CardTitle>
            <CardDescription>
              Saturation and adstock parameters for each channel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(response_curves).map(([channel, curves]) => (
                <div key={channel} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium capitalize">
                    {channel.replace('_', ' ')}
                  </span>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-sm font-semibold">
                        {curves.saturation.ec.toFixed(2)}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        EC (Saturation)
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-semibold">
                        {curves.saturation.slope.toFixed(1)}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        Slope
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-semibold">
                        {curves.adstock.decay.toFixed(3)}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        Decay Rate
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Legacy Features Notice */}
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="text-orange-800 dark:text-orange-200">
              Legacy Features Overview
            </CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              Features that were available in the pre-Meridian version
            </CardDescription>
          </CardHeader>
          <CardContent className="text-orange-800 dark:text-orange-200">
            <ul className="space-y-2 text-sm">
              <li>• <strong>Model Performance Metrics:</strong> R-squared, MAPE, MAE, RMSE</li>
              <li>• <strong>Channel ROI Analysis:</strong> Contribution, ROI with confidence intervals</li>
              <li>• <strong>Budget Allocation:</strong> Spend percentage and efficiency metrics</li>
              <li>• <strong>Control Variables:</strong> Statistical significance testing</li>
              <li>• <strong>Response Curves:</strong> Saturation and adstock parameters</li>
              <li>• <strong>Model Comparison:</strong> Side-by-side analysis across models</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}