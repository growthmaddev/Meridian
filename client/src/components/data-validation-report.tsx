import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";

interface ValidationResult {
  passed: boolean;
  category: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  details?: any;
}

interface ValidationReport {
  score: number;
  results: ValidationResult[];
  recommendations: string[];
  validatedAt: string;
}

interface DataValidationReportProps {
  validation: ValidationReport;
  onProceed: () => void;
}

export function DataValidationReport({ validation, onProceed }: DataValidationReportProps) {
  // Count issues by severity
  const errorCount = validation.results.filter(r => !r.passed && r.severity === 'error').length;
  const warningCount = validation.results.filter(r => !r.passed && r.severity === 'warning').length;
  const passedCount = validation.results.filter(r => r.passed).length;
  
  // Determine overall status
  const hasErrors = errorCount > 0;
  const hasWarnings = warningCount > 0;
  
  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 70) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };
  
  // Icon for validation result
  const getResultIcon = (result: ValidationResult) => {
    if (result.passed) return <CheckCircle className="h-5 w-5 text-green-500" />;
    
    switch (result.severity) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };
  
  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Data Validation Report</span>
          <Badge 
            variant={hasErrors ? "destructive" : (hasWarnings ? "outline" : "default")}
            className="ml-2"
          >
            {hasErrors ? "Failed" : (hasWarnings ? "Warnings" : "Passed")}
          </Badge>
        </CardTitle>
        <CardDescription>
          Validation completed on {new Date(validation.validatedAt).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="col-span-1 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg">
            <span className={`text-4xl font-bold ${getScoreColor(validation.score)}`}>
              {validation.score}
            </span>
            <span className="text-sm text-muted-foreground mt-1">Quality Score</span>
            <Progress 
              value={validation.score} 
              className={`w-full mt-2 ${
                validation.score >= 90 ? 'bg-green-100 dark:bg-green-900/20' :
                validation.score >= 70 ? 'bg-emerald-100 dark:bg-emerald-900/20' :
                validation.score >= 50 ? 'bg-amber-100 dark:bg-amber-900/20' :
                'bg-red-100 dark:bg-red-900/20'
              }`}
            />
          </div>
          <div className="col-span-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <span className="text-2xl font-semibold text-green-600 dark:text-green-400">{passedCount}</span>
                <span className="text-sm text-muted-foreground">Passed</span>
              </div>
              <div className="flex flex-col items-center bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                <span className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{warningCount}</span>
                <span className="text-sm text-muted-foreground">Warnings</span>
              </div>
              <div className="flex flex-col items-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <span className="text-2xl font-semibold text-red-600 dark:text-red-400">{errorCount}</span>
                <span className="text-sm text-muted-foreground">Errors</span>
              </div>
            </div>
            
            {validation.recommendations.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Recommendations:</h4>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  {validation.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <Accordion type="multiple" className="w-full">
          {validation.results.map((result, index) => (
            <AccordionItem value={`item-${index}`} key={index}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center">
                  {getResultIcon(result)}
                  <span className="ml-2">{result.category}</span>
                  <Badge 
                    variant={result.passed ? "default" : (result.severity === 'error' ? "destructive" : "outline")}
                    className="ml-4"
                  >
                    {result.passed ? "Passed" : result.severity}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-md">
                  <p className="text-sm">{result.message}</p>
                  
                  {result.details && result.details.rows && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">
                        {result.details.rows.length} {result.details.rows.length === 1 ? 'row' : 'rows'} affected: 
                        {result.details.rows.slice(0, 5).map((r: any, i: number) => (
                          <span key={i} className="ml-1">
                            {typeof r === 'object' ? `Row ${r.index}` : r}
                            {i < Math.min(4, result.details.rows.length - 1) ? ',' : ''}
                          </span>
                        ))}
                        {result.details.rows.length > 5 && ' and more...'}
                      </p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => window.history.back()}>
          Back
        </Button>
        <Button 
          onClick={onProceed} 
          disabled={hasErrors}
        >
          {hasErrors 
            ? "Fix Errors to Continue" 
            : (hasWarnings ? "Proceed with Warnings" : "Continue")}
        </Button>
      </CardFooter>
    </Card>
  );
}