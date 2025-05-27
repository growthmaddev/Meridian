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
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Link } from "wouter";
import { ArrowLeft, Target, TrendingUp, DollarSign, Calculator, AlertTriangle, Zap } from "lucide-react";
import { useState } from "react";

// Mock data structure representing pre-Meridian budget optimization features
const legacyBudgetData = {
  total_budget: 1190000,
  current_allocation: {
    tv_spend: 297500,
    radio_spend: 297500,
    digital_spend: 297500,
    print_spend: 297500
  },
  channel_performance: {
    tv_spend: { roi: 0.754, efficiency_score: 65, saturation_level: 0.72 },
    radio_spend: { roi: 1.027, efficiency_score: 78, saturation_level: 0.45 },
    digital_spend: { roi: 1.770, efficiency_score: 92, saturation_level: 0.38 },
    print_spend: { roi: 3.819, efficiency_score: 98, saturation_level: 0.15 }
  },
  optimization_scenarios: [
    {
      name: "ROI Maximization",
      expected_lift: 12.5,
      risk_level: "Medium",
      optimized_allocation: {
        tv_spend: 178500,
        radio_spend: 238000,
        digital_spend: 357000,
        print_spend: 416500
      }
    },
    {
      name: "Balanced Growth",
      expected_lift: 8.3,
      risk_level: "Low",
      optimized_allocation: {
        tv_spend: 238000,
        radio_spend: 297500,
        digital_spend: 357000,
        print_spend: 297500
      }
    },
    {
      name: "Reach Maximization",
      expected_lift: 15.2,
      risk_level: "High",
      optimized_allocation: {
        tv_spend: 357000,
        radio_spend: 178500,
        digital_spend: 416500,
        print_spend: 238000
      }
    }
  ]
};

export default function LegacyBudgetOptimizer() {
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [customBudgets, setCustomBudgets] = useState({
    tv_spend: 25,
    radio_spend: 25,
    digital_spend: 25,
    print_spend: 25
  });

  const { current_allocation, channel_performance, optimization_scenarios, total_budget } = legacyBudgetData;
  const scenario = optimization_scenarios[selectedScenario];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateBudgetShift = (current: number, optimized: number) => {
    return ((optimized - current) / current * 100);
  };

  const updateCustomBudget = (channel: string, percentage: number) => {
    const remaining = 100 - percentage;
    const otherChannels = Object.keys(customBudgets).filter(c => c !== channel);
    const equalShare = remaining / otherChannels.length;
    
    setCustomBudgets(prev => ({
      ...prev,
      [channel]: percentage,
      ...Object.fromEntries(otherChannels.map(c => [c, equalShare]))
    }));
  };

  return (
    <MainLayout
      title="Legacy Budget Optimizer (Pre-Meridian)"
      subtitle="Review of optimization features available before Meridian integration"
      actions={
        <Button asChild variant="outline">
          <Link href="/optimizations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Current Optimizations
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Current Budget Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Current Budget Allocation
            </CardTitle>
            <CardDescription>
              Your existing spend distribution across all marketing channels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Object.entries(current_allocation).map(([channel, amount]) => {
                const performance = channel_performance[channel as keyof typeof channel_performance];
                const percentage = (amount / total_budget * 100);
                
                return (
                  <div key={channel} className="text-center">
                    <div className="mb-2">
                      <div className="text-lg font-semibold capitalize">
                        {channel.replace('_', ' ')}
                      </div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(amount)}
                      </div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        {percentage.toFixed(1)}% of budget
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>ROI: {performance.roi.toFixed(2)}x</span>
                        <span>Efficiency: {performance.efficiency_score}%</span>
                      </div>
                      <Progress value={performance.saturation_level * 100} className="h-2" />
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {(performance.saturation_level * 100).toFixed(0)}% saturated
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Optimization Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Pre-Built Optimization Scenarios
            </CardTitle>
            <CardDescription>
              Choose from pre-configured optimization strategies based on different goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {optimization_scenarios.map((scenario, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedScenario(index)}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    selectedScenario === index 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                      : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{scenario.name}</h3>
                    <Badge variant={
                      scenario.risk_level === 'Low' ? 'default' : 
                      scenario.risk_level === 'Medium' ? 'secondary' : 'destructive'
                    }>
                      {scenario.risk_level} Risk
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    +{scenario.expected_lift.toFixed(1)}%
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    Expected Lift
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Scenario Details */}
            <div className="border rounded-lg p-4 bg-neutral-50 dark:bg-neutral-900">
              <h3 className="font-semibold mb-4">{scenario.name} - Budget Reallocation</h3>
              <div className="space-y-3">
                {Object.entries(scenario.optimized_allocation).map(([channel, optimizedAmount]) => {
                  const currentAmount = current_allocation[channel as keyof typeof current_allocation];
                  const shift = calculateBudgetShift(currentAmount, optimizedAmount);
                  
                  return (
                    <div key={channel} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium capitalize w-20">
                          {channel.replace('_', ' ')}
                        </span>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          {formatCurrency(currentAmount)} → {formatCurrency(optimizedAmount)}
                        </div>
                      </div>
                      <Badge variant={shift > 0 ? 'default' : shift < 0 ? 'secondary' : 'outline'}>
                        {shift > 0 ? '+' : ''}{shift.toFixed(1)}%
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Budget Slider */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Custom Budget Allocation Tool
            </CardTitle>
            <CardDescription>
              Manually adjust budget percentages and see real-time impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(customBudgets).map(([channel, percentage]) => (
                <div key={channel} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-medium capitalize">
                      {channel.replace('_', ' ')}
                    </label>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(total_budget * percentage / 100)}
                      </div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <Slider
                    value={[percentage]}
                    onValueChange={(value) => updateCustomBudget(channel, value[0])}
                    max={70}
                    min={5}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
              
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">Total: {Object.values(customBudgets).reduce((a, b) => a + b, 0).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legacy Optimization Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Legacy Optimization Methods
            </CardTitle>
            <CardDescription>
              Traditional approaches used before advanced statistical modeling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Rule-Based Optimization</h3>
                <ul className="text-sm space-y-1 text-neutral-600 dark:text-neutral-400">
                  <li>• Fixed percentage allocations</li>
                  <li>• ROI threshold constraints</li>
                  <li>• Manual saturation adjustments</li>
                  <li>• Historical performance weights</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Linear Programming</h3>
                <ul className="text-sm space-y-1 text-neutral-600 dark:text-neutral-400">
                  <li>• Maximize ROI under constraints</li>
                  <li>• Budget bounds per channel</li>
                  <li>• Simple objective functions</li>
                  <li>• Limited interaction effects</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Scenario Planning</h3>
                <ul className="text-sm space-y-1 text-neutral-600 dark:text-neutral-400">
                  <li>• Pre-defined allocation templates</li>
                  <li>• What-if analysis tools</li>
                  <li>• Risk level categorization</li>
                  <li>• Manual efficiency scoring</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Heuristic Methods</h3>
                <ul className="text-sm space-y-1 text-neutral-600 dark:text-neutral-400">
                  <li>• Expert-driven recommendations</li>
                  <li>• Industry benchmark matching</li>
                  <li>• Seasonal adjustment factors</li>
                  <li>• Competitive response modeling</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legacy Limitations Notice */}
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5" />
              Legacy Optimization Limitations
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              Constraints of pre-Meridian budget optimization approaches
            </CardDescription>
          </CardHeader>
          <CardContent className="text-amber-800 dark:text-amber-200">
            <ul className="space-y-2 text-sm">
              <li>• <strong>No Statistical Modeling:</strong> Lacked advanced MMM statistical inference</li>
              <li>• <strong>Limited Interaction Effects:</strong> Couldn't model cross-channel synergies</li>
              <li>• <strong>Static Saturation Curves:</strong> No dynamic response curve optimization</li>
              <li>• <strong>Manual Risk Assessment:</strong> Human-defined risk categories without statistical backing</li>
              <li>• <strong>Simplified Constraints:</strong> Basic budget bounds without sophisticated modeling</li>
              <li>• <strong>No Uncertainty Quantification:</strong> Lacked confidence intervals and posterior distributions</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}