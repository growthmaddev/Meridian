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
  ReferenceLine,
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
    
    // Generate realistic spending points based on current spend levels
    // Use 0x to 3x current spend as realistic scenario range
    const data = [];
    for (let multiplier = 0; multiplier <= 3; multiplier += 0.2) {
      const dataPoint: any = { spend: multiplier };
      
      // Calculate response for each selected channel
      selectedChannelsResponse.forEach((channel) => {
        const channelData = responseCurves[channel];
        if (channelData) {
          const { ec, slope } = channelData.saturation;
          // Use realistic spend amounts: multiplier represents multiples of current spend
          // For chart display, we'll show the multiplier (0x to 3x current spend)
          const response = Math.pow(multiplier, slope) / (Math.pow(ec, slope) + Math.pow(multiplier, slope));
          dataPoint[channel] = response;
        }
      });
      
      // Calculate average across ALL available channels (not just selected ones)
      if (responseCurves && Object.keys(responseCurves).length > 1) {
        const allChannels = Object.keys(responseCurves);
        const allResponses = allChannels.map(channel => {
          if (responseCurves[channel]) {
            const { ec, slope } = responseCurves[channel].saturation;
            return Math.pow(multiplier, slope) / (Math.pow(ec, slope) + Math.pow(multiplier, slope));
          }
          return 0;
        }).filter(val => val !== undefined);
        
        if (allResponses.length > 0) {
          dataPoint.average = allResponses.reduce((sum, val) => sum + val, 0) / allResponses.length;
        }
      }
      
      data.push(dataPoint);
    }
    
    return data;
  };

  // Calculate average response at 1x spend (current spend level)
  const calculateAverageResponse = () => {
    if (!responseCurves || selectedChannelsResponse.length === 0) return 0;
    
    const responses = selectedChannelsResponse.map(channel => {
      const channelData = responseCurves[channel];
      if (channelData) {
        const { ec, slope } = channelData.saturation;
        return Math.pow(1, slope) / (Math.pow(ec, slope) + Math.pow(1, slope));
      }
      return 0;
    });
    
    return responses.reduce((sum, resp) => sum + resp, 0) / responses.length;
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
            // Retention rate from week 1 onwards - decay is fraction that decays
            const retention = 1 - decay;
            effect = Math.pow(retention, week);
          }
          dataPoint[channel] = effect;
        }
      });
      
      // Calculate average across ALL available channels (not just selected ones)
      if (responseCurves && Object.keys(responseCurves).length > 1) {
        const allChannels = Object.keys(responseCurves);
        const allEffects = allChannels.map(channel => {
          if (responseCurves[channel]) {
            const { decay } = responseCurves[channel].adstock;
            let effect;
            if (week === 0) {
              effect = 1.0;
            } else {
              const retention = 1 - decay;
              effect = Math.pow(retention, week);
            }
            return effect;
          }
          return 0;
        }).filter(val => val !== undefined);
        
        if (allEffects.length > 0) {
          dataPoint.average = allEffects.reduce((sum, val) => sum + val, 0) / allEffects.length;
        }
      }
      
      data.push(dataPoint);
    }
    
    return data;
  };

  // Calculate average adstock effect at week 4 (mid-point reference)
  const calculateAverageAdstock = () => {
    if (!responseCurves || selectedChannelsAdstock.length === 0) return 0;
    
    const effects = selectedChannelsAdstock.map(channel => {
      const channelData = responseCurves[channel];
      if (channelData) {
        const { decay } = channelData.adstock;
        const retention = 1 - decay;
        return Math.pow(retention, 4); // Week 4 effect
      }
      return 0;
    });
    
    return effects.reduce((sum, effect) => sum + effect, 0) / effects.length;
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
                      label={{ value: 'Spend Multiplier (0x = $0, 1x = Current, 2x = Double, 3x = Triple)', position: 'insideBottom', offset: -5 }} 
                      tickFormatter={(value) => `${Number(value).toFixed(1)}x`}
                    />
                    <YAxis 
                      label={{ value: 'Response', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip 
                      formatter={(value, name) => [`${Number(value).toFixed(2)}`, name]}
                      labelFormatter={(label) => `${Number(label).toFixed(1)}x Spend`}
                    />
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
                    {responseCurves && Object.keys(responseCurves).length > 1 && (
                      <Line
                        key="average"
                        type="monotone"
                        dataKey="average"
                        stroke="#9CA3AF"
                        name="Average (All Channels)"
                        strokeWidth={3}
                        activeDot={{ r: 4 }}
                      />
                    )}
                    {selectedChannelsResponse.length > 0 && (
                      <>
                        <ReferenceLine 
                          y={calculateAverageResponse()} 
                          stroke="#9CA3AF" 
                          strokeDasharray="5 5" 
                          label={{ 
                            value: selectedChannelsResponse.length > 1 ? "Average" : "Response at 1x", 
                            position: "insideTopRight" 
                          }}
                        />
                        <ReferenceLine 
                          x={1.0} 
                          stroke="#9CA3AF" 
                          strokeDasharray="5 5" 
                          label={{ value: "Current Spend", position: "insideTopLeft" }}
                        />
                        {/* Intersection point label */}
                        <text 
                          x="55%" 
                          y="45%" 
                          fill="#9CA3AF" 
                          fontSize="11" 
                          fontWeight="400"
                          textAnchor="start"
                        >
                          (1.0x, {calculateAverageResponse().toFixed(2)})
                        </text>
                      </>
                    )}
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
                    {responseCurves && Object.keys(responseCurves).length > 1 && (
                      <Area
                        key="average"
                        type="monotone"
                        dataKey="average"
                        stroke="#9CA3AF"
                        fill="#9CA3AF"
                        fillOpacity={0.15}
                        name="Average (All Channels)"
                        strokeWidth={3}
                      />
                    )}
                    {selectedChannelsAdstock.length > 0 && (
                      <>
                        <ReferenceLine 
                          y={calculateAverageAdstock()} 
                          stroke="#9CA3AF" 
                          strokeDasharray="5 5" 
                          label={{ 
                            value: selectedChannelsAdstock.length > 1 ? "Average" : "Effect at Week 4", 
                            position: "insideTopRight" 
                          }}
                        />
                        <ReferenceLine 
                          x={4} 
                          stroke="#9CA3AF" 
                          strokeDasharray="5 5" 
                          label={{ value: "Week 4", position: "insideTopLeft" }}
                        />
                        {/* Intersection point label */}
                        <text 
                          x="45%" 
                          y="35%" 
                          fill="#9CA3AF" 
                          fontSize="11" 
                          fontWeight="400"
                          textAnchor="start"
                        >
                          (Week 4, {calculateAverageAdstock().toFixed(2)})
                        </text>
                      </>
                    )}
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
                        const halfLifeA = Math.log(0.5) / Math.log(1 - responseCurves[a].adstock.decay);
                        const halfLifeB = Math.log(0.5) / Math.log(1 - responseCurves[b].adstock.decay);
                        return halfLifeB - halfLifeA;
                      })
                      .map((channel) => {
                      const channelData = responseCurves[channel];
                      // Decay is the fraction that decays, so retention = 1 - decay
                      const retention = 1 - channelData.adstock.decay;
                      const halfLife = Math.log(0.5) / Math.log(retention);
                      
                      // Debug logging for half-life calculation
                      console.log(`${channel}: decay=${channelData.adstock.decay}, retention=${retention}, half-life=${halfLife}`);
                      
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