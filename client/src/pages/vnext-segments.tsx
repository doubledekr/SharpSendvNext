import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Brain, 
  Zap, 
  DollarSign,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Plus,
  Settings,
  Edit
} from "lucide-react";

interface Segment {
  id: string;
  publisherId: string;
  name: string;
  description?: string;
  isDetected: boolean;
  isDynamic: boolean;
  criteria?: {
    espListId?: string;
    tags?: string[];
    customFields?: Record<string, any>;
    behavioralTriggers?: string[];
    dynamicRules?: {
      engagement?: { min?: number; max?: number };
      revenue?: { min?: number; max?: number };
      activity?: { daysSinceLastOpen?: number };
      cohort?: string;
    };
  };
  subscriberCount: number;
  growth: number;
  lastCalculatedAt?: string;
  createdAt: string;
  potentialRevenue?: number;
  engagementScore?: number;
  churnRisk?: string;
}

export function VNextSegments() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("all");
  const [isDetectingSegments, setIsDetectingSegments] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSegment, setNewSegment] = useState({
    name: "",
    description: "",
    isDynamic: false,
    criteria: {
      espListId: "",
      tags: [],
      customFields: {},
      behavioralTriggers: [],
      dynamicRules: {
        engagement: { min: undefined, max: undefined },
        revenue: { min: undefined, max: undefined },
        activity: { daysSinceLastOpen: undefined },
        cohort: ""
      }
    }
  });

  // Fetch segments
  const { data: segments = [], isLoading } = useQuery<Segment[]>({
    queryKey: ["/api/segments"],
  });

  // Create manual segment mutation
  const createSegmentMutation = useMutation({
    mutationFn: async (segmentData: any) => {
      return await apiRequest("/api/segments", "POST", segmentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/segments"] });
      toast({
        title: "Segment Created",
        description: "Your new segment has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      resetNewSegment();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create segment. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Detect new segments mutation
  const detectSegmentsMutation = useMutation({
    mutationFn: async () => {
      setIsDetectingSegments(true);
      return await apiRequest("/api/segments/detect", "POST", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/segments"] });
      toast({
        title: "Segment Detection Complete",
        description: "New segments have been discovered and added.",
      });
      setIsDetectingSegments(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to detect new segments.",
        variant: "destructive",
      });
      setIsDetectingSegments(false);
    },
  });

  // Adopt segment mutation
  const adoptSegmentMutation = useMutation({
    mutationFn: async (segmentId: string) => {
      return await apiRequest(`/api/segments/${segmentId}/adopt`, "POST", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/segments"] });
      toast({
        title: "Segment Adopted",
        description: "The segment has been activated for use.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to adopt segment.",
        variant: "destructive",
      });
    },
  });

  // Calculate segment revenue mutation
  const calculateRevenueMutation = useMutation({
    mutationFn: async (segmentId: string) => {
      return await apiRequest(`/api/segments/${segmentId}/calculate-revenue`, "POST", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/segments"] });
      toast({
        title: "Revenue Calculated",
        description: "Segment revenue potential has been updated.",
      });
    },
  });

  const resetNewSegment = () => {
    setNewSegment({
      name: "",
      description: "",
      isDynamic: false,
      criteria: {
        espListId: "",
        tags: [],
        customFields: {},
        behavioralTriggers: [],
        dynamicRules: {
          engagement: { min: undefined, max: undefined },
          revenue: { min: undefined, max: undefined },
          activity: { daysSinceLastOpen: undefined },
          cohort: ""
        }
      }
    });
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <BarChart3 className="h-4 w-4 text-gray-500" />;
  };

  const getChurnRiskColor = (risk?: string) => {
    switch (risk) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const filterSegments = (segments: Segment[]) => {
    switch (selectedTab) {
      case "detected":
        return segments.filter(s => s.isDetected);
      case "dynamic":
        return segments.filter(s => s.isDynamic);
      case "manual":
        return segments.filter(s => !s.isDetected && !s.isDynamic);
      default:
        return segments;
    }
  };

  const filteredSegments = filterSegments(segments);

  // Calculate emerging segments (high growth, recently detected)
  const emergingSegments = segments.filter(s => 
    s.isDetected && 
    s.growth > 10 && 
    s.lastCalculatedAt && 
    new Date(s.lastCalculatedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dynamic Segments</h1>
            <p className="text-gray-600 mt-1">AI-powered segment detection and manual management</p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Segment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Manual Segment</DialogTitle>
                  <DialogDescription>
                    Define a custom segment based on your criteria
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Segment Name</Label>
                    <Input
                      value={newSegment.name}
                      onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
                      placeholder="e.g., High-Value Tech Investors"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newSegment.description}
                      onChange={(e) => setNewSegment({ ...newSegment, description: e.target.value })}
                      placeholder="Describe the characteristics of this segment"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Segment Type</Label>
                    <Select 
                      value={newSegment.isDynamic ? "dynamic" : "static"}
                      onValueChange={(v) => setNewSegment({ ...newSegment, isDynamic: v === "dynamic" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="static">Static (Fixed List)</SelectItem>
                        <SelectItem value="dynamic">Dynamic (Rule-Based)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {newSegment.isDynamic && (
                    <div className="space-y-3 border-l-2 border-blue-200 pl-4">
                      <h4 className="font-medium">Dynamic Rules</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Min Engagement (%)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={newSegment.criteria.dynamicRules.engagement.min || ""}
                            onChange={(e) => setNewSegment({
                              ...newSegment,
                              criteria: {
                                ...newSegment.criteria,
                                dynamicRules: {
                                  ...newSegment.criteria.dynamicRules,
                                  engagement: {
                                    ...newSegment.criteria.dynamicRules.engagement,
                                    min: e.target.value ? parseInt(e.target.value) : undefined
                                  }
                                }
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label>Max Engagement (%)</Label>
                          <Input
                            type="number"
                            placeholder="100"
                            value={newSegment.criteria.dynamicRules.engagement.max || ""}
                            onChange={(e) => setNewSegment({
                              ...newSegment,
                              criteria: {
                                ...newSegment.criteria,
                                dynamicRules: {
                                  ...newSegment.criteria.dynamicRules,
                                  engagement: {
                                    ...newSegment.criteria.dynamicRules.engagement,
                                    max: e.target.value ? parseInt(e.target.value) : undefined
                                  }
                                }
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label>Min Revenue ($)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={newSegment.criteria.dynamicRules.revenue.min || ""}
                            onChange={(e) => setNewSegment({
                              ...newSegment,
                              criteria: {
                                ...newSegment.criteria,
                                dynamicRules: {
                                  ...newSegment.criteria.dynamicRules,
                                  revenue: {
                                    ...newSegment.criteria.dynamicRules.revenue,
                                    min: e.target.value ? parseInt(e.target.value) : undefined
                                  }
                                }
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label>Max Revenue ($)</Label>
                          <Input
                            type="number"
                            placeholder="∞"
                            value={newSegment.criteria.dynamicRules.revenue.max || ""}
                            onChange={(e) => setNewSegment({
                              ...newSegment,
                              criteria: {
                                ...newSegment.criteria,
                                dynamicRules: {
                                  ...newSegment.criteria.dynamicRules,
                                  revenue: {
                                    ...newSegment.criteria.dynamicRules.revenue,
                                    max: e.target.value ? parseInt(e.target.value) : undefined
                                  }
                                }
                              }
                            })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Days Since Last Open</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 30"
                          value={newSegment.criteria.dynamicRules.activity.daysSinceLastOpen || ""}
                          onChange={(e) => setNewSegment({
                            ...newSegment,
                            criteria: {
                              ...newSegment.criteria,
                              dynamicRules: {
                                ...newSegment.criteria.dynamicRules,
                                activity: {
                                  daysSinceLastOpen: e.target.value ? parseInt(e.target.value) : undefined
                                }
                              }
                            }
                          })}
                        />
                      </div>
                      <div>
                        <Label>Cohort</Label>
                        <Select
                          value={newSegment.criteria.dynamicRules.cohort}
                          onValueChange={(v) => setNewSegment({
                            ...newSegment,
                            criteria: {
                              ...newSegment.criteria,
                              dynamicRules: {
                                ...newSegment.criteria.dynamicRules,
                                cohort: v
                              }
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select cohort" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            <SelectItem value="growth_seekers">Growth Seekers</SelectItem>
                            <SelectItem value="dividend_focused">Dividend Focused</SelectItem>
                            <SelectItem value="risk_averse">Risk Averse</SelectItem>
                            <SelectItem value="aggressive">Aggressive Traders</SelectItem>
                            <SelectItem value="tech_savvy">Tech Savvy</SelectItem>
                            <SelectItem value="value_investors">Value Investors</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => createSegmentMutation.mutate(newSegment)}
                      disabled={!newSegment.name || createSegmentMutation.isPending}
                    >
                      Create Segment
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button
              onClick={() => detectSegmentsMutation.mutate()}
              disabled={isDetectingSegments || detectSegmentsMutation.isPending}
            >
              <Brain className="h-4 w-4 mr-2" />
              {isDetectingSegments ? "Detecting..." : "Detect Segments"}
            </Button>
          </div>
        </div>

        {/* Segment Intelligence Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Segments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{segments.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                {segments.filter(s => s.isDetected).length} auto-detected
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {segments.reduce((sum, s) => sum + s.subscriberCount, 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Across all segments
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Emerging Segments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {emergingSegments.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                High growth this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Revenue Potential</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${segments.reduce((sum, s) => sum + (s.potentialRevenue || 0), 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Untapped opportunity
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI-Detected Opportunities */}
        {emergingSegments.length > 0 && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-green-600" />
                <CardTitle>Emerging Opportunities</CardTitle>
              </div>
              <CardDescription>
                AI has detected {emergingSegments.length} high-growth segments this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {emergingSegments.slice(0, 3).map((segment) => (
                  <div key={segment.id} className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{segment.name}</h4>
                      <Badge className="bg-green-100 text-green-800">
                        +{(Number(segment.growth) || 0).toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{segment.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {segment.subscriberCount.toLocaleString()} subscribers
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => adoptSegmentMutation.mutate(segment.id)}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Activate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Segments List */}
        <Card>
          <CardHeader>
            <CardTitle>All Segments</CardTitle>
            <CardDescription>Manage and monitor your subscriber segments</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Segments</TabsTrigger>
                <TabsTrigger value="detected">
                  AI-Detected
                  {segments.filter(s => s.isDetected).length > 0 && (
                    <Badge className="ml-2" variant="secondary">
                      {segments.filter(s => s.isDetected).length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="dynamic">Dynamic</TabsTrigger>
                <TabsTrigger value="manual">Manual</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab}>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading segments...</div>
                ) : filteredSegments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No segments found in this category
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredSegments.map((segment) => (
                      <div
                        key={segment.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-lg">{segment.name}</h3>
                              {segment.isDetected && (
                                <Badge variant="secondary">
                                  <Brain className="h-3 w-3 mr-1" />
                                  AI-Detected
                                </Badge>
                              )}
                              {segment.isDynamic && (
                                <Badge variant="secondary">
                                  <Zap className="h-3 w-3 mr-1" />
                                  Dynamic
                                </Badge>
                              )}
                              {getGrowthIcon(Number(segment.growth) || 0)}
                              <span className={`text-sm font-medium ${
                                (Number(segment.growth) || 0) > 0 ? "text-green-600" : 
                                (Number(segment.growth) || 0) < 0 ? "text-red-600" : "text-gray-600"
                              }`}>
                                {(Number(segment.growth) || 0) > 0 ? "+" : ""}{(Number(segment.growth) || 0).toFixed(1)}%
                              </span>
                            </div>
                            
                            {segment.description && (
                              <p className="text-gray-600 mb-3">{segment.description}</p>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                              <div>
                                <div className="flex items-center space-x-1 text-sm text-gray-500 mb-1">
                                  <Users className="h-3 w-3" />
                                  <span>Subscribers</span>
                                </div>
                                <div className="font-semibold">
                                  {segment.subscriberCount.toLocaleString()}
                                </div>
                              </div>
                              
                              {segment.potentialRevenue && (
                                <div>
                                  <div className="flex items-center space-x-1 text-sm text-gray-500 mb-1">
                                    <DollarSign className="h-3 w-3" />
                                    <span>Revenue Potential</span>
                                  </div>
                                  <div className="font-semibold text-green-600">
                                    ${segment.potentialRevenue.toLocaleString()}
                                  </div>
                                </div>
                              )}
                              
                              {segment.engagementScore && (
                                <div>
                                  <div className="flex items-center space-x-1 text-sm text-gray-500 mb-1">
                                    <BarChart3 className="h-3 w-3" />
                                    <span>Engagement</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Progress value={segment.engagementScore} className="h-2 w-16" />
                                    <span className="text-sm font-medium">
                                      {segment.engagementScore}%
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {segment.churnRisk && (
                                <div>
                                  <div className="flex items-center space-x-1 text-sm text-gray-500 mb-1">
                                    <AlertCircle className="h-3 w-3" />
                                    <span>Churn Risk</span>
                                  </div>
                                  <Badge className={getChurnRiskColor(segment.churnRisk)}>
                                    {segment.churnRisk}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            {segment.criteria?.dynamicRules && (
                              <div className="bg-gray-50 rounded p-2 text-sm">
                                <span className="font-medium">Dynamic Rules:</span>
                                <div className="mt-1 space-x-3">
                                  {segment.criteria.dynamicRules.engagement && (
                                    <span className="inline-flex items-center">
                                      Engagement: {segment.criteria.dynamicRules.engagement.min}%-
                                      {segment.criteria.dynamicRules.engagement.max}%
                                    </span>
                                  )}
                                  {segment.criteria.dynamicRules.revenue && (
                                    <span className="inline-flex items-center">
                                      Revenue: ${segment.criteria.dynamicRules.revenue.min}-
                                      ${segment.criteria.dynamicRules.revenue.max}
                                    </span>
                                  )}
                                  {segment.criteria.dynamicRules.activity && (
                                    <span className="inline-flex items-center">
                                      Last open: {segment.criteria.dynamicRules.activity.daysSinceLastOpen} days
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {segment.isDetected && !segment.isDynamic && (
                              <Button
                                size="sm"
                                onClick={() => adoptSegmentMutation.mutate(segment.id)}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Adopt
                              </Button>
                            )}
                            {!segment.potentialRevenue && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => calculateRevenueMutation.mutate(segment.id)}
                              >
                                Calculate Revenue
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}