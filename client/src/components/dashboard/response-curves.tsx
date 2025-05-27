import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";
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
  // Use arrays to store multiple selected channels
  const [selectedChannelsResponse, setSelectedChannelsResponse] = useState<string[]>([]);
  const [selectedChannelsAdstock, setSelectedChannelsAdstock] = useState<string[]>([]);
  
  // Color palette for different channels
  const channelColors = ['#4f46e5', '#7c3aed', '#dc2626', '#059669', '#d97706', '#0891b2'];
  
  // Update selected channels when responseCurves changes
  useEffect(() => {
    if (responseCurves && Object.keys(responseCurves).length > 0) {
      const channels = Object.keys(responseCurves);
      setSelectedChannelsResponse(channels);
      setSelectedChannelsAdstock(channels);
    }
  }, [responseCurves]);

  // Generate response curve data points for multiple channels
  const generateResponseCurveData = () => {
    if (!responseCurves || selectedChannelsResponse.length === 0) {
      return [];
    }
    
    // Generate spending points
    const data = [];
    for (let x = 0; x <= 10; x += 0.5) {
      const dataPoint: any = { spend: x };
      
      // Calculate response for each selected channel
      selectedChannelsResponse.forEach((channel) => {
        const channelData = responseCurves[channel];
        if (channelData) {
          const { ec, slope } = channelData.saturation;
          const response = Math.pow(x, slope) / (Math.pow(ec, slope) + Math.pow(x, slope));
          dataPoint[channel] = response;
        }
      });
      
      data.push(dataPoint);
    }
    
    return data;
  };

  // Generate adstock effect data points for multiple channels
  const generateAdstockData = () => {
    if (!responseCurves || selectedChannelsAdstock.length === 0) {
      return [];
    }
    
    // Generate week points
    const data = [];
    for (let week = 0; week <= 12; week++) {
      const dataPoint: any = { week };
      
      // Calculate adstock effect for each selected channel
      selectedChannelsAdstock.forEach((channel) => {
        const channelData = responseCurves[channel];
        if (channelData) {
          const { decay, peak } = channelData.adstock;
          let effect;
          if (week === 0) {
            // Initial impact
            effect = 1.0;
          } else {
            // Pure decay from week 1 onwards - this shows the real differences
            effect = Math.pow(decay, week);
          }
          dataPoint[channel] = effect;
        }
      });
      
      data.push(dataPoint);
    }
    
    return data;
  };

  // Handle channel selection for response curves
  const handleResponseChannelToggle = (channel: string, checked: boolean) => {
    if (checked) {
      setSelectedChannelsResponse([...selectedChannelsResponse, channel]);
    } else {
      setSelectedChannelsResponse(selectedChannelsResponse.filter(c => c !== channel));
    }
  };

  // Handle channel selection for adstock curves
  const handleAdstockChannelToggle = (channel: string, checked: boolean) => {
    if (checked) {
      setSelectedChannelsAdstock([...selectedChannelsAdstock, channel]);
    } else {
      setSelectedChannelsAdstock(selectedChannelsAdstock.filter(c => c !== channel));
    }
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
            <div className="mb-4">
              <h3 className="text-lg font-medium leading-6 text-neutral-900 dark:text-neutral-100 mb-3">Response Curves</h3>
              <div className="flex flex-wrap gap-3">
                {responseCurves && Object.keys(responseCurves).map(channel => (
                  <div key={channel} className="flex items-center space-x-2">
                    <Checkbox
                      id={`response-${channel}`}
                      checked={selectedChannelsResponse.includes(channel)}
                      onCheckedChange={(checked) => handleResponseChannelToggle(channel, !!checked)}
                    />
                    <Label 
                      htmlFor={`response-${channel}`} 
                      className="text-sm cursor-pointer"
                    >
                      {channel}
                    </Label>
                  </div>
                ))}
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
                    <Tooltip formatter={(value, name) => [`${Number(value).toFixed(2)}`, name]} />
                    <Legend />
                    {selectedChannelsResponse.map((channel, index) => (
                      <Line 
                        key={channel}
                        type="monotone" 
                        dataKey={channel} 
                        stroke={channelColors[index % channelColors.length]} 
                        activeDot={{ r: 6 }} 
                        name={channel}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                  No response curve data available
                </div>
              )}
            </div>
            
            <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
              {!loading && selectedChannelsResponse.length > 0 && responseCurves && (
                <p>
                  Hill saturation curves show diminishing returns as spend increases. 
                  Each channel has unique saturation characteristics based on real Meridian model parameters.
                </p>
              )}
            </div>

            {/* Response Curve Parameters Table */}
            {!loading && selectedChannelsResponse.length > 0 && responseCurves && (
              <div className="mt-6">
                <h4 className="text-md font-medium text-neutral-900 dark:text-neutral-100 mb-3">Saturation Parameters</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>EC (Half-Saturation)</TableHead>
                      <TableHead>Saturation Speed</TableHead>
                      <TableHead>Efficiency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedChannelsResponse
                      .sort((a, b) => {
                        // Sort by EC value (lower EC = better efficiency = higher rank)
                        const ecA = responseCurves[a].saturation.ec;
                        const ecB = responseCurves[b].saturation.ec;
                        return ecA - ecB;
                      })
                      .map((channel) => {
                      const channelData = responseCurves[channel];
                      const ec = channelData.saturation.ec;
                      const saturationSpeed = ec < 1.1 ? "Fast" : ec < 1.3 ? "Quick" : "Moderate";
                      const efficiency = ec < 1.1 ? "High" : ec < 1.3 ? "Good" : "Standard";
                      return (
                        <TableRow key={channel}>
                          <TableCell className="font-medium">{channel}</TableCell>
                          <TableCell>{ec.toFixed(3)}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded ${
                              saturationSpeed === "Fast" 
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                : saturationSpeed === "Quick"
                                ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                                : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            }`}>
                              {saturationSpeed}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded ${
                              efficiency === "High" 
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                : efficiency === "Good"
                                ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                                : "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                            }`}>
                              {efficiency}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <p className="text-sm text-muted-foreground mt-3 px-1">
                  <strong>Note:</strong> This model uses fixed Hill slopes (1.0) with varying EC parameters to differentiate channel saturation behavior. 
                  Lower EC values indicate faster saturation and higher efficiency.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Adstock Effects Chart Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium leading-6 text-neutral-900 dark:text-neutral-100 mb-3">Adstock Effects</h3>
              <div className="flex flex-wrap gap-3">
                {responseCurves && Object.keys(responseCurves).map(channel => (
                  <div key={channel} className="flex items-center space-x-2">
                    <Checkbox
                      id={`adstock-${channel}`}
                      checked={selectedChannelsAdstock.includes(channel)}
                      onCheckedChange={(checked) => handleAdstockChannelToggle(channel, !!checked)}
                    />
                    <Label 
                      htmlFor={`adstock-${channel}`} 
                      className="text-sm cursor-pointer"
                    >
                      {channel}
                    </Label>
                  </div>
                ))}
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
                    <Tooltip formatter={(value, name) => [`${Number(value).toFixed(2)}`, name]} />
                    <Legend />
                    {selectedChannelsAdstock.map((channel, index) => (
                      <Area 
                        key={channel}
                        type="monotone" 
                        dataKey={channel} 
                        stroke={channelColors[index % channelColors.length]} 
                        fill={channelColors[index % channelColors.length]}
                        fillOpacity={0.3}
                        name={channel}
                        strokeWidth={2}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                  No adstock effect data available
                </div>
              )}
            </div>
            
            <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
              {!loading && selectedChannelsAdstock.length > 0 && responseCurves && (
                <p>
                  Adstock transformation shows carryover effects over time. 
                  Each channel has unique decay patterns based on real marketing impact duration.
                </p>
              )}
            </div>

            {/* Adstock Parameters Table */}
            {!loading && selectedChannelsAdstock.length > 0 && responseCurves && (
              <div className="mt-6">
                <h4 className="text-md font-medium text-neutral-900 dark:text-neutral-100 mb-3">Adstock Parameters</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>Decay Rate</TableHead>
                      <TableHead>Half-Life (weeks)</TableHead>
                      <TableHead>Impact Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedChannelsAdstock
                      .sort((a, b) => {
                        // Sort by half-life (longer half-life = better carryover = higher rank)
                        const halfLifeA = Math.log(0.5) / Math.log(responseCurves[a].adstock.decay);
                        const halfLifeB = Math.log(0.5) / Math.log(responseCurves[b].adstock.decay);
                        return halfLifeB - halfLifeA;
                      })
                      .map((channel) => {
                      const channelData = responseCurves[channel];
                      const halfLife = Math.log(0.5) / Math.log(channelData.adstock.decay);
                      const impactDuration = halfLife < 2 ? "Short" : halfLife < 4 ? "Medium" : "Long";
                      return (
                        <TableRow key={channel}>
                          <TableCell className="font-medium">{channel}</TableCell>
                          <TableCell>{channelData.adstock.decay.toFixed(3)}</TableCell>
                          <TableCell>{halfLife.toFixed(1)}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded ${
                              impactDuration === "Long" 
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                : impactDuration === "Medium"
                                ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                            }`}>
                              {impactDuration}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}