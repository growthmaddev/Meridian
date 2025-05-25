import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ModelConfig {
  date_column: string;
  target_column: string;
  channel_columns: string[];
  geo_column?: string;
  control_columns?: string[];
  seasonality?: number;
  use_geo?: boolean;
}

interface ModelConfigSectionProps {
  config?: ModelConfig;
  loading?: boolean;
}

export function ModelConfigSection({ config, loading = false }: ModelConfigSectionProps) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Model Configuration</h2>
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Model Specification */}
            <div>
              <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2">Model Specification</h3>
              {loading ? (
                <>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                </>
              ) : (
                <dl className="space-y-1">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Model Type</dt>
                    <dd className="text-sm text-neutral-900 dark:text-neutral-100">Meridian MMM</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Adstock Method</dt>
                    <dd className="text-sm text-neutral-900 dark:text-neutral-100">Hill Transformation</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Saturation Curve</dt>
                    <dd className="text-sm text-neutral-900 dark:text-neutral-100">Hill Saturation</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Geo Hierarchy</dt>
                    <dd className="text-sm text-neutral-900 dark:text-neutral-100">
                      {config?.use_geo ? "National + Regional" : "National"}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
            
            {/* Dataset Details */}
            <div>
              <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2">Dataset Details</h3>
              {loading ? (
                <>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                </>
              ) : (
                <dl className="space-y-1">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Date Range</dt>
                    <dd className="text-sm text-neutral-900 dark:text-neutral-100">Jan 2021 - Dec 2022</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Granularity</dt>
                    <dd className="text-sm text-neutral-900 dark:text-neutral-100">Weekly</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Target KPI</dt>
                    <dd className="text-sm text-neutral-900 dark:text-neutral-100">{config?.target_column || "N/A"}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Control Variables</dt>
                    <dd className="text-sm text-neutral-900 dark:text-neutral-100">{config?.control_columns?.length || 0}</dd>
                  </div>
                </dl>
              )}
            </div>
            
            {/* Training Parameters */}
            <div>
              <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2">Training Parameters</h3>
              {loading ? (
                <>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                </>
              ) : (
                <dl className="space-y-1">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">MCMC Chains</dt>
                    <dd className="text-sm text-neutral-900 dark:text-neutral-100">2</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Warmup Iterations</dt>
                    <dd className="text-sm text-neutral-900 dark:text-neutral-100">1,000</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Sample Iterations</dt>
                    <dd className="text-sm text-neutral-900 dark:text-neutral-100">1,000</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Seasonality</dt>
                    <dd className="text-sm text-neutral-900 dark:text-neutral-100">{config?.seasonality || 52} weeks</dd>
                  </div>
                </dl>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
