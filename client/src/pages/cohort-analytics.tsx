import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Mail, 
  MousePointer, 
  DollarSign,
  Target,
  Clock,
  Zap,
  AlertTriangle
} from 'lucide-react';

interface CohortMetrics {
  cohortId: string;
  cohortName: string;
  subscriberCount: number;
  emailsSent: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
  engagementTrend: number[];
  lastSent: string;
  topSubjects: Array<{ subject: string; openRate: number; clickRate: number }>;
}

interface EmailPerformance {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
}

const CohortAnalytics: React.FC = () => {
  const [cohortMetrics, setCohortMetrics] = useState<CohortMetrics[]>([]);
  const [emailPerformance, setEmailPerformance] = useState<EmailPerformance[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<string>('30d');
  const [loading, setLoading] = useState(true);

  // Sample data for demo
  useEffect(() => {
    setTimeout(() => {
      setCohortMetrics([
        {
          cohortId: 'conservative_investors',
          cohortName: 'Conservative Investors',
          subscriberCount: 1250,
          emailsSent: 45,
          openRate: 0.72,
          clickRate: 0.14,
          conversionRate: 0.08,
          revenue: 15600,
          engagementTrend: [68, 70, 72, 71, 74, 72, 75],
          lastSent: '2024-01-16T09:00:00Z',
          topSubjects: [
            { subject: 'Dividend Aristocrats: Steady Income Opportunities', openRate: 0.78, clickRate: 0.16 },
            { subject: 'Bond Market Update: Stability in Uncertain Times', openRate: 0.74, clickRate: 0.13 },
            { subject: 'Blue-Chip Analysis: Long-term Value Plays', openRate: 0.71, clickRate: 0.15 }
          ]
        },
        {
          cohortId: 'aggressive_investors',
          cohortName: 'Growth Seekers',
          subscriberCount: 890,
          emailsSent: 52,
          openRate: 0.85,
          clickRate: 0.22,
          conversionRate: 0.12,
          revenue: 18900,
          engagementTrend: [82, 84, 85, 87, 85, 88, 85],
          lastSent: '2024-01-16T08:00:00Z',
          topSubjects: [
            { subject: '🚀 AI Breakout: 40% Upside Potential', openRate: 0.91, clickRate: 0.28 },
            { subject: 'Growth Alert: Semiconductor Surge Continues', openRate: 0.87, clickRate: 0.24 },
            { subject: 'High-Growth Plays: Tech Momentum Building', openRate: 0.83, clickRate: 0.21 }
          ]
        },
        {
          cohortId: 'tech_focused',
          cohortName: 'Tech Sector Specialists',
          subscriberCount: 650,
          emailsSent: 38,
          openRate: 0.78,
          clickRate: 0.18,
          conversionRate: 0.10,
          revenue: 12400,
          engagementTrend: [75, 77, 78, 76, 79, 78, 80],
          lastSent: '2024-01-16T09:30:00Z',
          topSubjects: [
            { subject: 'NVIDIA Earnings: Technical Analysis Deep Dive', openRate: 0.82, clickRate: 0.21 },
            { subject: 'AI Infrastructure: Investment Thesis Update', openRate: 0.79, clickRate: 0.19 },
            { subject: 'Semiconductor Cycle: Technical Indicators', openRate: 0.76, clickRate: 0.17 }
          ]
        },
        {
          cohortId: 'beginner_investors',
          cohortName: 'New Investors',
          subscriberCount: 1100,
          emailsSent: 28,
          openRate: 0.65,
          clickRate: 0.11,
          conversionRate: 0.06,
          revenue: 8800,
          engagementTrend: [60, 62, 65, 63, 66, 65, 68],
          lastSent: '2024-01-16T11:00:00Z',
          topSubjects: [
            { subject: 'Investing 101: Building Your First Portfolio', openRate: 0.71, clickRate: 0.14 },
            { subject: 'Market Basics: Understanding Stock Fundamentals', openRate: 0.68, clickRate: 0.12 },
            { subject: 'Risk Management: Protecting Your Investments', openRate: 0.64, clickRate: 0.10 }
          ]
        }
      ]);

      setEmailPerformance([
        { date: '2024-01-10', sent: 2800, opened: 2016, clicked: 448, converted: 224 },
        { date: '2024-01-11', sent: 2850, opened: 2109, clicked: 456, converted: 228 },
        { date: '2024-01-12', sent: 2790, opened: 2013, clicked: 446, converted: 223 },
        { date: '2024-01-13', sent: 2900, opened: 2175, clicked: 464, converted: 232 },
        { date: '2024-01-14', sent: 2820, opened: 2115, clicked: 451, converted: 226 },
        { date: '2024-01-15', sent: 2890, opened: 2167, clicked: 462, converted: 231 },
        { date: '2024-01-16', sent: 2950, opened: 2242, clicked: 472, converted: 236 }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const totalSubscribers = cohortMetrics.reduce((sum, cohort) => sum + cohort.subscriberCount, 0);
  const totalRevenue = cohortMetrics.reduce((sum, cohort) => sum + cohort.revenue, 0);
  const avgOpenRate = cohortMetrics.reduce((sum, cohort) => sum + cohort.openRate, 0) / cohortMetrics.length;
  const avgClickRate = cohortMetrics.reduce((sum, cohort) => sum + cohort.clickRate, 0) / cohortMetrics.length;

  const pieChartData = cohortMetrics.map(cohort => ({
    name: cohort.cohortName,
    value: cohort.subscriberCount,
    revenue: cohort.revenue
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cohort Analytics</h1>
          <p className="text-gray-600">Track email performance and engagement across subscriber cohorts</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Subscribers</p>
                  <p className="text-2xl font-bold text-gray-900">{totalSubscribers.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+12.5% this month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Open Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{(avgOpenRate * 100).toFixed(1)}%</p>
                </div>
                <Mail className="h-8 w-8 text-green-500" />
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+8.3% vs industry</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Click Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{(avgClickRate * 100).toFixed(1)}%</p>
                </div>
                <MousePointer className="h-8 w-8 text-purple-500" />
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+15.7% vs industry</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+22.1% this month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cohort Performance Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Cohort Performance</CardTitle>
                <CardDescription>Email engagement metrics by subscriber cohort</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cohortMetrics.map((cohort) => (
                    <div key={cohort.cohortId} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{cohort.cohortName}</h4>
                          <p className="text-sm text-gray-600">{cohort.subscriberCount.toLocaleString()} subscribers</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">${cohort.revenue.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">revenue</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{cohort.emailsSent}</div>
                          <div className="text-xs text-gray-500">Emails Sent</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{(cohort.openRate * 100).toFixed(1)}%</div>
                          <div className="text-xs text-gray-500">Open Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">{(cohort.clickRate * 100).toFixed(1)}%</div>
                          <div className="text-xs text-gray-500">Click Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">{(cohort.conversionRate * 100).toFixed(1)}%</div>
                          <div className="text-xs text-gray-500">Conversion</div>
                        </div>
                      </div>

                      {/* Top Performing Subjects */}
                      <div className="border-t pt-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Top Performing Subjects</h5>
                        <div className="space-y-1">
                          {cohort.topSubjects.slice(0, 2).map((subject, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 truncate flex-1 mr-2">{subject.subject}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-green-600">{(subject.openRate * 100).toFixed(1)}%</span>
                                <span className="text-purple-600">{(subject.clickRate * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Sidebar */}
          <div className="space-y-6">
            {/* Subscriber Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Subscriber Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value.toLocaleString(), 'Subscribers']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {pieChartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-gray-600">{entry.name}</span>
                      </div>
                      <span className="font-medium">{entry.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekly Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={emailPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value, name) => [value.toLocaleString(), name]}
                    />
                    <Line type="monotone" dataKey="opened" stroke="#10B981" strokeWidth={2} name="Opened" />
                    <Line type="monotone" dataKey="clicked" stroke="#3B82F6" strokeWidth={2} name="Clicked" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Growth Seekers performing exceptionally</p>
                      <p className="text-xs text-gray-600">85% open rate, 22% click rate - consider increasing frequency</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Tech specialists engage with technical content</p>
                      <p className="text-xs text-gray-600">Deep analysis emails show 15% higher engagement</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">New investors need more education</p>
                      <p className="text-xs text-gray-600">Consider adding beginner-friendly content series</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CohortAnalytics;

