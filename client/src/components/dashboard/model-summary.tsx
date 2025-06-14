import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import {
  TvIcon,
  Globe,
  MessageCircle,
  Radio,
  Store
} from "lucide-react";

type ModelMetrics = {
  r_squared: number;
  mape: number;
};

type ChannelResult = {
  contribution: number;
  contribution_percentage: number;
  roi: number;
  roi_lower: number;
  roi_upper: number;
  spend_percentage?: number;
  total_spend?: number;
};

type ChannelAnalysis = Record<string, ChannelResult>;

interface ModelSummaryProps {
  metrics?: ModelMetrics;
  channelAnalysis?: ChannelAnalysis;
  loading?: boolean;
}

export function ModelSummary({ metrics, channelAnalysis, loading = false }: ModelSummaryProps) {
  // Helper to get channel icon
  const getChannelIcon = (channel: string) => {
    const lowercaseChannel = channel.toLowerCase();
    if (lowercaseChannel.includes('tv')) return <TvIcon className="text-primary-700 mr-2" />;
    if (lowercaseChannel.includes('digital')) return <Globe className="text-primary-700 mr-2" />;
    if (lowercaseChannel.includes('social')) return <MessageCircle className="text-primary-700 mr-2" />;
    if (lowercaseChannel.includes('radio')) return <Radio className="text-primary-700 mr-2" />;
    return <Store className="text-neutral-700 mr-2" />;
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Model performance metrics */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium leading-6 text-neutral-900 dark:text-neutral-100">Model Performance</h3>
          <div className="mt-5 grid grid-cols-2 gap-5">
            <div>
              <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400 truncate">R-Squared</dt>
              {loading ? (
                <Skeleton className="h-10 w-20 mt-1" />
              ) : (
                <>
                  <dd className="mt-1 text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {metrics ? metrics.r_squared.toFixed(2) : "N/A"}
                  </dd>
                  <dd className="mt-1 text-sm text-success-700 dark:text-success-500">
                    {metrics && metrics.r_squared > 0.7 ? "Good fit to data" : "Check model fit"}
                  </dd>
                </>
              )}
            </div>
            <div>
              <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400 truncate">MAPE</dt>
              {loading ? (
                <Skeleton className="h-10 w-20 mt-1" />
              ) : (
                <>
                  <dd className="mt-1 text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {metrics ? `${(metrics.mape * 100).toFixed(1)}%` : "N/A"}
                  </dd>
                  <dd className="mt-1 text-sm text-success-700 dark:text-success-500">
                    {metrics && metrics.mape < 0.15 ? "Low prediction error" : "Check accuracy"}
                  </dd>
                </>
              )}
            </div>
          </div>
          <div className="mt-5 border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <div className="flex items-center justify-between">
              <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Model Status</dt>
              <dd className="text-sm text-success-700 dark:text-success-500 flex items-center">
                <CheckCircle className="mr-1 h-4 w-4" />
                Complete
              </dd>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Training Time</dt>
              <dd className="text-sm text-neutral-900 dark:text-neutral-100">14 minutes</dd>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Data Points</dt>
              <dd className="text-sm text-neutral-900 dark:text-neutral-100">104 weeks</dd>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Channel contribution summary */}
      <Card className="lg:col-span-2">
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium leading-6 text-neutral-900 dark:text-neutral-100">Channel Contributions</h3>
          <div className="mt-4">
            <div className="overflow-hidden">
              {loading ? (
                <>
                  <Skeleton className="h-12 w-full mb-3" />
                  <Skeleton className="h-12 w-full mb-3" />
                  <Skeleton className="h-12 w-full mb-3" />
                  <Skeleton className="h-12 w-full mb-3" />
                </>
              ) : channelAnalysis ? (
                <>
                  {/* Base Sales first */}
                  <div className="py-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <Store className="text-neutral-700 dark:text-neutral-400 mr-2" />
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Base Sales</span>
                      </div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">10.0%</span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                      <div className="bg-neutral-400 dark:bg-neutral-500 h-2 rounded-full" style={{ width: "10.0%" }}></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      <span>Organic revenue baseline</span>
                      <span>$1.0M contributed</span>
                    </div>
                  </div>

                  {/* Media channels ordered by contribution % then ROI */}
                  {Object.entries(channelAnalysis)
                    .sort(([,a], [,b]) => {
                      // First sort by contribution percentage (high to low)
                      const contributionDiff = b.contribution_percentage - a.contribution_percentage;
                      if (Math.abs(contributionDiff) > 0.001) return contributionDiff;
                      // Then by ROI if contributions are similar
                      return b.roi - a.roi;
                    })
                    .map(([channel, data]) => {
                      // Color based on ROI performance
                      const getBarColor = (roi: number) => {
                        if (roi >= 3.0) return "bg-green-500 dark:bg-green-400"; // High ROI
                        if (roi >= 2.0) return "bg-yellow-500 dark:bg-yellow-400"; // Good ROI
                        if (roi >= 1.0) return "bg-blue-500 dark:bg-blue-400"; // Positive ROI
                        return "bg-red-500 dark:bg-red-400"; // Poor ROI
                      };

                      const getPerformanceText = (roi: number) => {
                        if (roi >= 3.0) return "High Performance";
                        if (roi >= 2.0) return "Good Performance";
                        if (roi >= 1.0) return "Positive ROI";
                        return "Below Target";
                      };

                      return (
                        <div className="py-2" key={channel}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center">
                              {getChannelIcon(channel)}
                              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{channel}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                {(data.contribution_percentage * 100).toFixed(1)}%
                              </span>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                ${(data.contribution / 1000000).toFixed(1)}M of value
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getBarColor(data.roi)}`}
                              style={{ width: `${data.contribution_percentage * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                            <span>{getPerformanceText(data.roi)} • ROI: {data.roi.toFixed(2)}x</span>
                            <div className="flex flex-col items-end">
                              <span className="text-xs opacity-75">
                                {data.total_spend ? `$${(data.total_spend / 1000000).toFixed(1)}M (${(data.spend_percentage * 100).toFixed(1)}%) of spend` : 'Spend data pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  }
                </>
              ) : (
                <div className="py-6 text-center text-neutral-500 dark:text-neutral-400">
                  No channel data available
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
