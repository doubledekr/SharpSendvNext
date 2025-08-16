import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NavigationHeader from "@/components/dashboard/navigation-header";
import Sidebar from "@/components/dashboard/sidebar";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  Mail,
  Target,
  Lightbulb,
  ChevronUp,
  ChevronDown,
  Calendar,
  Brain,
  Zap,
  Eye
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function ComparativeAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [sidebarTab, setSidebarTab] = useState("overview");
  
  // Email version performance data
  const versionPerformance = [
    { 
      version: 'Day Traders',
      opens: 68,
      clicks: 42,
      conversions: 28,
      revenue: 4250,
      improvement: 12
    },
    { 
      version: 'Long-term Investors',
      opens: 54,
      clicks: 31,
      conversions: 19,
      revenue: 6800,
      improvement: -3
    },
    { 
      version: 'Options Traders',
      opens: 72,
      clicks: 48,
      conversions: 35,
      revenue: 5200,
      improvement: 18
    },
    { 
      version: 'Crypto Enthusiasts',
      opens: 61,
      clicks: 38,
      conversions: 24,
      revenue: 3900,
      improvement: 7
    }
  ];

  // Send time performance data
  const sendTimeData = [
    { time: '6 AM', opens: 42, clicks: 18 },
    { time: '9 AM', opens: 78, clicks: 45 },
    { time: '12 PM', opens: 65, clicks: 38 },
    { time: '3 PM', opens: 58, clicks: 32 },
    { time: '6 PM', opens: 71, clicks: 41 },
    { time: '9 PM', opens: 45, clicks: 22 }
  ];

  // Day of week performance
  const dayPerformance = [
    { day: 'Mon', emails: 4200, opens: 2856, clicks: 1428 },
    { day: 'Tue', emails: 4500, opens: 3240, clicks: 1620 },
    { day: 'Wed', emails: 4300, opens: 2924, clicks: 1462 },
    { day: 'Thu', emails: 4600, opens: 3404, clicks: 1702 },
    { day: 'Fri', emails: 3800, opens: 2432, clicks: 1216 },
    { day: 'Sat', emails: 2100, opens: 1260, clicks: 630 },
    { day: 'Sun', emails: 2200, opens: 1276, clicks: 638 }
  ];

  // Subject line performance
  const subjectLinePerformance = [
    {
      subject: "🚨 Market Alert: Immediate Action Required",
      opens: 82,
      clicks: 48,
      segment: "Day Traders"
    },
    {
      subject: "Your Portfolio Analysis: Q1 2025 Outlook",
      opens: 64,
      clicks: 35,
      segment: "Long-term"
    },
    {
      subject: "Breaking: Fed Decision Impact Analysis",
      opens: 78,
      clicks: 42,
      segment: "All Segments"
    },
    {
      subject: "Options Strategy: High IV Opportunity",
      opens: 71,
      clicks: 45,
      segment: "Options"
    }
  ];

  // AI-generated insights
  const aiInsights = [
    {
      type: 'critical',
      title: 'Optimal Send Time Detected',
      description: 'Tuesday 9 AM EST shows 34% higher engagement than average. Consider scheduling priority campaigns for this window.',
      action: 'Adjust Schedule',
      impact: '+34% engagement'
    },
    {
      type: 'opportunity',
      title: 'Segment Performance Gap',
      description: 'Day Traders segment outperforms others by 22%. Consider creating more variations tailored to this high-value group.',
      action: 'Create Variations',
      impact: '+$12K potential'
    },
    {
      type: 'warning',
      title: 'Weekend Engagement Drop',
      description: 'Saturday and Sunday show 45% lower engagement. Pause non-critical sends during weekends to preserve sender reputation.',
      action: 'Optimize Calendar',
      impact: 'Save 15% volume'
    },
    {
      type: 'success',
      title: 'Subject Line Winner',
      description: 'Emoji usage in subject lines increases opens by 18%. "🚨" and "💰" perform best with financial content.',
      action: 'Update Templates',
      impact: '+18% open rate'
    }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-slate-900">
      <NavigationHeader currentPage="comparative-analytics" />
      
      <div className="flex">
        <Sidebar activeTab={sidebarTab} onTabChange={setSidebarTab} />
        
        <div className="flex-1 ml-64 px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Comparative Analytics</h1>
          <p className="text-slate-400">Compare performance across variations, times, and segments</p>
        </div>

        {/* AI Insights Section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-600/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI-Powered Insights & Recommendations
                </CardTitle>
                <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">
                  Updated 2 min ago
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiInsights.map((insight, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${
                      insight.type === 'critical' ? 'bg-red-900/10 border-red-600/30' :
                      insight.type === 'opportunity' ? 'bg-green-900/10 border-green-600/30' :
                      insight.type === 'warning' ? 'bg-yellow-900/10 border-yellow-600/30' :
                      'bg-blue-900/10 border-blue-600/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Lightbulb className={`h-4 w-4 ${
                          insight.type === 'critical' ? 'text-red-400' :
                          insight.type === 'opportunity' ? 'text-green-400' :
                          insight.type === 'warning' ? 'text-yellow-400' :
                          'text-blue-400'
                        }`} />
                        <h3 className="text-white font-semibold">{insight.title}</h3>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {insight.impact}
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">{insight.description}</p>
                    <Button size="sm" variant="outline" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      {insight.action}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="versions" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="versions">Version Comparison</TabsTrigger>
            <TabsTrigger value="timing">Send Time Analysis</TabsTrigger>
            <TabsTrigger value="subjects">Subject Line Performance</TabsTrigger>
            <TabsTrigger value="segments">Segment Deep Dive</TabsTrigger>
          </TabsList>

          {/* Version Comparison Tab */}
          <TabsContent value="versions">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Chart */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Version Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={versionPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="version" stroke="#94A3B8" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#94A3B8" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}
                        labelStyle={{ color: '#E2E8F0' }}
                      />
                      <Legend />
                      <Bar dataKey="opens" fill="#3B82F6" name="Open Rate %" />
                      <Bar dataKey="clicks" fill="#10B981" name="Click Rate %" />
                      <Bar dataKey="conversions" fill="#F59E0B" name="Conversion %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Version Rankings */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Performance Rankings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {versionPerformance
                      .sort((a, b) => b.opens - a.opens)
                      .map((version, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              index === 0 ? 'bg-yellow-600' :
                              index === 1 ? 'bg-gray-500' :
                              index === 2 ? 'bg-orange-600' :
                              'bg-slate-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-white font-medium">{version.version}</p>
                              <p className="text-sm text-slate-400">
                                ${version.revenue.toLocaleString()} revenue
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {version.improvement > 0 ? (
                              <ChevronUp className="h-4 w-4 text-green-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-red-400" />
                            )}
                            <span className={`text-sm font-medium ${
                              version.improvement > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {Math.abs(version.improvement)}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Send Time Analysis Tab */}
          <TabsContent value="timing">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Time Performance Chart */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Send Time Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={sendTimeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="time" stroke="#94A3B8" />
                      <YAxis stroke="#94A3B8" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}
                        labelStyle={{ color: '#E2E8F0' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="opens" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        name="Open Rate %"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="clicks" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        name="Click Rate %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Day of Week Performance */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Day of Week Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dayPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="day" stroke="#94A3B8" />
                      <YAxis stroke="#94A3B8" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}
                        labelStyle={{ color: '#E2E8F0' }}
                      />
                      <Legend />
                      <Bar dataKey="opens" fill="#8B5CF6" name="Opens" />
                      <Bar dataKey="clicks" fill="#EC4899" name="Clicks" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Best Times Summary */}
              <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white">Optimal Send Windows</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-green-400" />
                        <h3 className="text-white font-semibold">Best Time</h3>
                      </div>
                      <p className="text-2xl font-bold text-green-400">Tuesday 9 AM</p>
                      <p className="text-sm text-slate-400 mt-1">78% open rate average</p>
                    </div>
                    <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-5 w-5 text-yellow-400" />
                        <h3 className="text-white font-semibold">Best Day</h3>
                      </div>
                      <p className="text-2xl font-bold text-yellow-400">Thursday</p>
                      <p className="text-sm text-slate-400 mt-1">3,404 average opens</p>
                    </div>
                    <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-red-400" />
                        <h3 className="text-white font-semibold">Avoid</h3>
                      </div>
                      <p className="text-2xl font-bold text-red-400">Weekends</p>
                      <p className="text-sm text-slate-400 mt-1">45% lower engagement</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Subject Line Performance Tab */}
          <TabsContent value="subjects">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Subject Line Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subjectLinePerformance.map((subject, index) => (
                    <div key={index} className="border border-slate-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-white font-medium mb-1">{subject.subject}</p>
                          <Badge variant="outline" className="text-xs">
                            {subject.segment}
                          </Badge>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Open Rate</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-700 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${subject.opens}%` }}
                              />
                            </div>
                            <span className="text-sm text-white font-medium">{subject.opens}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Click Rate</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-700 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${subject.clicks}%` }}
                              />
                            </div>
                            <span className="text-sm text-white font-medium">{subject.clicks}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Alert className="mt-6 bg-blue-900/20 border-blue-600/30">
                  <Lightbulb className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-slate-300">
                    <strong>Pattern Detected:</strong> Subject lines with urgency indicators ("Alert", "Breaking") 
                    and emojis show 22% higher open rates. Personalized subjects perform 18% better than generic ones.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Segment Deep Dive Tab */}
          <TabsContent value="segments">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Segment Radar Chart */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Segment Performance Matrix</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={[
                      { metric: 'Engagement', dayTraders: 85, longTerm: 65, options: 78, crypto: 72 },
                      { metric: 'Revenue', dayTraders: 70, longTerm: 88, options: 75, crypto: 60 },
                      { metric: 'Growth', dayTraders: 92, longTerm: 55, options: 80, crypto: 95 },
                      { metric: 'Retention', dayTraders: 60, longTerm: 85, options: 70, crypto: 50 },
                      { metric: 'Activity', dayTraders: 95, longTerm: 45, options: 88, crypto: 82 }
                    ]}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="metric" stroke="#94A3B8" />
                      <PolarRadiusAxis stroke="#334155" />
                      <Radar name="Day Traders" dataKey="dayTraders" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                      <Radar name="Long-term" dataKey="longTerm" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                      <Radar name="Options" dataKey="options" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                      <Radar name="Crypto" dataKey="crypto" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Segment Distribution */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Revenue by Segment</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Day Traders', value: 4250 },
                          { name: 'Long-term Investors', value: 6800 },
                          { name: 'Options Traders', value: 5200 },
                          { name: 'Crypto Enthusiasts', value: 3900 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {versionPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}
                        labelStyle={{ color: '#E2E8F0' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
}