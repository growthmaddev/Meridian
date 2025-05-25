import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Users, 
  Thermometer, 
  CalendarDays,
  HelpCircle 
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ControlResult = {
  coefficient: number;
  p_value: number;
  impact: "positive" | "negative";
  significance: "significant" | "not significant";
};

type ControlAnalysisData = Record<string, ControlResult>;

interface ControlAnalysisProps {
  controlAnalysis?: ControlAnalysisData;
  loading?: boolean;
}

export function ControlAnalysis({ controlAnalysis, loading = false }: ControlAnalysisProps) {
  // Helper to format variable names nicely
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
  
  // Helper to get control variable icon
  const getControlIcon = (control: string) => {
    const lowercaseControl = control.toLowerCase();
    if (lowercaseControl.includes('search') || lowercaseControl.includes('query') || lowercaseControl.includes('gqv')) {
      return <Search className="text-blue-600 dark:text-blue-400" />;
    }
    if (lowercaseControl.includes('population') || lowercaseControl.includes('pop')) {
      return <Users className="text-green-600 dark:text-green-400" />;
    }
    if (lowercaseControl.includes('temp')) {
      return <Thermometer className="text-orange-600 dark:text-orange-400" />;
    }
    if (lowercaseControl.includes('holiday') || lowercaseControl.includes('season')) {
      return <CalendarDays className="text-purple-600 dark:text-purple-400" />;
    }
    return <HelpCircle className="text-neutral-600 dark:text-neutral-400" />;
  };

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium leading-6 text-neutral-900 dark:text-neutral-100 mb-4">
          Control Variable Analysis
        </h3>
        
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !controlAnalysis || Object.keys(controlAnalysis).length === 0 ? (
          <div className="py-6 text-center text-neutral-500 dark:text-neutral-400">
            No control variable data available
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
              <thead>
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Variable
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    <div className="flex items-center">
                      Coefficient
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="ml-1 h-3 w-3 text-neutral-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-[200px] text-xs">
                              The coefficient shows the direction and strength of the relationship between 
                              the control variable and the target metric. Higher absolute values indicate 
                              stronger relationships.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Impact
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    <div className="flex items-center">
                      P-Value
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="ml-1 h-3 w-3 text-neutral-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-[200px] text-xs">
                              The p-value indicates statistical significance. Values below 0.05 suggest 
                              the relationship is unlikely to be due to random chance.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Significance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-950 divide-y divide-neutral-200 dark:divide-neutral-800">
                {Object.entries(controlAnalysis).map(([variable, data]) => (
                  <tr key={variable}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center">
                          {getControlIcon(variable)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {formatVariableName(variable)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {data.coefficient > 0 ? '+' : ''}{data.coefficient.toFixed(3)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge 
                        className={data.impact === "positive" ? 
                          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : 
                          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"}
                      >
                        {data.impact}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        {data.p_value.toFixed(3)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {data.significance === "significant" ? (
                        <Badge>Significant</Badge>
                      ) : (
                        <Badge variant="outline">Not Significant</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && controlAnalysis && Object.keys(controlAnalysis).length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Control variables help isolate the true impact of marketing activities by accounting for 
              other factors that influence the target metric. Including search query volume data helps 
              prevent overattribution of sales to marketing channels.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}