import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  AreaChart,
  Area
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

type ResponseCurve = {
  saturation: {
    ec: number;
    slope: number;
  };
  adstock: {
    decay: number;
    peak: number;
  };
};

type ResponseCurves = Record<string, ResponseCurve>;

interface ResponseCurvesSectionProps {
  responseCurves?: ResponseCurves;
  loading?: boolean;
}

export function ResponseCurvesSection({ responseCurves, loading = false }: ResponseCurvesSectionProps) {
  console.log('ResponseCurvesSection received:', responseCurves);
  
  const [selectedChannelResponse, setSelectedChannelResponse] = useState<string | null>(
    responseCurves ? Object.keys(responseCurves)[0] : null
  );
  
  const [selectedChannelAdstock, setSelectedChannelAdstock] = useState<string | null>(
    responseCurves ? Object.keys(responseCurves)[0] : null
  );

  // Generate response curve data points
  const generateResponseCurveData = () => {
    if (!responseCurves || !selectedChannelResponse) return [];
    
    const channel = responseCurves[selectedChannelResponse];
    if (!channel) return [];
    
    const { ec, slope } = channel.saturation;
    
    // Generate Hill saturation curve: y = x^slope / (ec^slope + x^slope)
    const data = [];
    for (let x = 0; x <= 10; x += 0.5) {
      const spend = x;
      const response = Math.pow(spend, slope) / (Math.pow(ec, slope) + Math.pow(spend, slope));
      data.push({ spend, response });
    }
    
    return data;
  };

  // Generate adstock effect data points
  const generateAdstockData = () => {
    if (!responseCurves || !selectedChannelAdstock) return [];
    
    const channel = responseCurves[selectedChannelAdstock];
    if (!channel) return [];
    
    const { decay, peak } = channel.adstock;
    
    // Generate adstock effect curve over time
    const data = [];
    for (let week = 0; week <= 12; week++) {
      let effect;
      if (week < peak) {
        // Ramp up to peak
        effect = (week / peak);
      } else {
        // Decay after peak
        effect = Math.pow(decay, week - peak);
      }
      
      data.push({ week, effect });
    }
    
    return data;
  };

  const responseCurveData = generateResponseCurveData();
  const adstockData = generateAdstockData();

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Response Curves & Adstock Effects</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Response Curve Chart Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-neutral-900 dark:text-neutral-100">Response Curves</h3>
              <div className="relative">
                <Select 
                  disabled={loading || !responseCurves} 
                  value={selectedChannelResponse || ""}
                  onValueChange={setSelectedChannelResponse}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {responseCurves && Object.keys(responseCurves).map(channel => (
                      <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="h-64">
              {loading ? (
                <Skeleton className="w-full h-full" />
              ) : responseCurveData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={responseCurveData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="spend" 
                      label={{ value: 'Spend ($M)', position: 'insideBottom', offset: -5 }} 
                    />
                    <YAxis 
                      label={{ value: 'Response', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}`, 'Response']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="response" 
                      stroke="#4f46e5" 
                      activeDot={{ r: 8 }} 
                      name={selectedChannelResponse || 'Channel'}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                  No response curve data available
                </div>
              )}
            </div>
            
            <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
              {!loading && selectedChannelResponse && responseCurves && responseCurves[selectedChannelResponse] && (
                <p>
                  The Hill saturation curve shows diminishing returns as spend increases. 
                  Half saturation point (EC) is at ${responseCurves[selectedChannelResponse].saturation.ec.toFixed(1)}M 
                  with slope of {responseCurves[selectedChannelResponse].saturation.slope.toFixed(1)}.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Adstock Effects Chart Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-neutral-900 dark:text-neutral-100">Adstock Effects</h3>
              <div className="relative">
                <Select 
                  disabled={loading || !responseCurves} 
                  value={selectedChannelAdstock || ""}
                  onValueChange={setSelectedChannelAdstock}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {responseCurves && Object.keys(responseCurves).map(channel => (
                      <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="h-64">
              {loading ? (
                <Skeleton className="w-full h-full" />
              ) : adstockData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={adstockData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="week" 
                      label={{ value: 'Weeks', position: 'insideBottom', offset: -5 }} 
                    />
                    <YAxis 
                      label={{ value: 'Effect', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}`, 'Effect']} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="effect" 
                      stroke="#4f46e5" 
                      fill="#4f46e5" 
                      fillOpacity={0.3}
                      name={selectedChannelAdstock || 'Channel'}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                  No adstock effect data available
                </div>
              )}
            </div>
            
            <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
              {!loading && selectedChannelAdstock && responseCurves && responseCurves[selectedChannelAdstock] && (
                <p>
                  Hill adstock transformation shows peak effect at {responseCurves[selectedChannelAdstock].adstock.peak} weeks 
                  with decay rate of {responseCurves[selectedChannelAdstock].adstock.decay.toFixed(1)}. 
                  This indicates medium-term impact from {selectedChannelAdstock} campaigns.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
