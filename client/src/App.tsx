import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import Datasets from "@/pages/datasets";
import UploadDataset from "@/pages/upload-dataset";
import Models from "@/pages/models";
import NewModel from "@/pages/models-new";
import ModelDetails from "@/pages/model-details";
import ModelComparison from "@/pages/model-comparison";
import Optimizations from "@/pages/optimizations";
import OptimizationDetails from "@/pages/optimization-details";
import LegacyModelResults from "@/pages/legacy-model-results";
import LegacyBudgetOptimizer from "@/pages/legacy-budget-optimizer";
import TestFlow from "@/pages/test-flow";
import Scenarios from "@/pages/scenarios";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/projects" component={Projects} />
      <Route path="/datasets" component={Datasets} />
      <Route path="/datasets/upload" component={UploadDataset} />
      <Route path="/models" component={Models} />
      <Route path="/models/new" component={NewModel} />
      <Route path="/models/compare" component={ModelComparison} />
      <Route path="/models/:id" component={ModelDetails} />
      <Route path="/models/:id/scenarios" component={Scenarios} />
      <Route path="/optimizations" component={Optimizations} />
      <Route path="/optimizations/:id" component={OptimizationDetails} />
      <Route path="/legacy-results" component={LegacyModelResults} />
      <Route path="/legacy-optimizer" component={LegacyBudgetOptimizer} />
      <Route path="/test-flow" component={TestFlow} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="marketmixpro-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
