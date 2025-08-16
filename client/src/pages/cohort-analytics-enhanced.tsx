import React, { useState, useEffect } from 'react';
import NavigationHeader from "@/components/dashboard/navigation-header";
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
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import "../styles/dashboard-improvements.css";

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

const CohortAnalyticsEnhanced: React.FC = () => {
  const [cohortMetrics, setCohortMetrics] = useState<CohortMetrics[]>([]);
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
            { subject: 'Bond Market Update: Stability in Uncertain Times', openRate: 0.74, clickRate: 0.13 }
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
            { subject: 'Growth Alert: Semiconductor Surge Continues', openRate: 0.87, clickRate: 0.24 }
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
            { subject: 'AI Infrastructure: Investment Thesis Update', openRate: 0.79, clickRate: 0.19 }
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
            { subject: 'Market Basics: Understanding Stock Fundamentals', openRate: 0.68, clickRate: 0.12 }
          ]
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const totalSubscribers = cohortMetrics.reduce((sum, cohort) => sum + cohort.subscriberCount, 0);
  const totalRevenue = cohortMetrics.reduce((sum, cohort) => sum + cohort.revenue, 0);
  const avgOpenRate = cohortMetrics.reduce((sum, cohort) => sum + cohort.openRate, 0) / cohortMetrics.length;
  const avgClickRate = cohortMetrics.reduce((sum, cohort) => sum + cohort.clickRate, 0) / cohortMetrics.length;

  const pieChartData = cohortMetrics.map((cohort, index) => ({
    name: cohort.cohortName,
    value: cohort.subscriberCount,
    revenue: cohort.revenue,
    color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index]
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <NavigationHeader currentPage="analytics" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <NavigationHeader currentPage="analytics" />
      
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Cohort Analytics</h1>
            <p className="text-slate-400">Track email performance and engagement across subscriber cohorts</p>
          </div>

          {/* Key Metrics */}
          <div className="metrics-grid mb-8">
            <div className="metric-card-enhanced interactive-element">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="metric-label-enhanced">Total Subscribers</p>
                  <p className="metric-value-animated">{totalSubscribers.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                    <span className="text-sm text-green-400">+12.5% this month</span>
                  </div>
                </div>
                <div className="metric-icon-container">
                  <Users className="metric-icon" style={{ color: '#3b82f6' }} />
                </div>
              </div>
            </div>

            <div className="metric-card-enhanced interactive-element">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="metric-label-enhanced">Avg Open Rate</p>
                  <p className="metric-value-animated">{(avgOpenRate * 100).toFixed(1)}%</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                    <span className="text-sm text-green-400">+8.3% vs industry</span>
                  </div>
                </div>
                <div className="metric-icon-container">
                  <Mail className="metric-icon" style={{ color: '#10b981' }} />
                </div>
              </div>
            </div>

            <div className="metric-card-enhanced interactive-element">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="metric-label-enhanced">Avg Click Rate</p>
                  <p className="metric-value-animated">{(avgClickRate * 100).toFixed(1)}%</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                    <span className="text-sm text-green-400">+15.7% vs industry</span>
                  </div>
                </div>
                <div className="metric-icon-container">
                  <MousePointer className="metric-icon" style={{ color: '#8b5cf6' }} />
                </div>
              </div>
            </div>

            <div className="metric-card-enhanced interactive-element">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="metric-label-enhanced">Total Revenue</p>
                  <p className="metric-value-animated">${totalRevenue.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                    <span className="text-sm text-green-400">+22.1% this month</span>
                  </div>
                </div>
                <div className="metric-icon-container">
                  <DollarSign className="metric-icon" style={{ color: '#f59e0b' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cohort Performance */}
            <div className="lg:col-span-2">
              <div className="chart-card-enhanced">
                <h3 className="text-xl font-semibold text-white mb-2">Cohort Performance</h3>
                <p className="text-slate-400 mb-6">Email engagement metrics by subscriber cohort</p>
                
                <div className="space-y-4">
                  {cohortMetrics.map((cohort) => (
                    <div key={cohort.cohortId} className="cohort-performance-card">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-white">{cohort.cohortName}</h4>
                          <p className="text-slate-400">{cohort.subscriberCount.toLocaleString()} subscribers</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-400">${cohort.revenue.toLocaleString()}</p>
                          <p className="text-sm text-slate-500">revenue</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-400">{cohort.emailsSent}</div>
                          <div className="text-xs text-slate-500">Emails Sent</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-400">{(cohort.openRate * 100).toFixed(1)}%</div>
                          <div className="text-xs text-slate-500">Open Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-purple-400">{(cohort.clickRate * 100).toFixed(1)}%</div>
                          <div className="text-xs text-slate-500">Click Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-orange-400">{(cohort.conversionRate * 100).toFixed(1)}%</div>
                          <div className="text-xs text-slate-500">Conversion</div>
                        </div>
                      </div>

                      {/* Top Performing Subjects */}
                      <div className="border-t border-slate-700 pt-4">
                        <h5 className="text-sm font-medium text-slate-300 mb-3">Top Performing Subjects</h5>
                        <div className="space-y-2">
                          {cohort.topSubjects.map((subject, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="text-slate-300 truncate flex-1 mr-4">{subject.subject}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-green-400 font-medium">{(subject.openRate * 100).toFixed(1)}%</span>
                                <span className="text-purple-400 font-medium">{(subject.clickRate * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Charts Sidebar */}
            <div className="space-y-6">
              {/* Subscriber Distribution */}
              <div className="chart-card-enhanced">
                <h3 className="text-lg font-semibold text-white mb-4">Subscriber Distribution</h3>
                
                {/* Simple Pie Chart Representation */}
                <div className="relative w-48 h-48 mx-auto mb-4">
                  <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-500 opacity-80"></div>
                  <div className="absolute inset-4 bg-slate-800 rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{totalSubscribers.toLocaleString()}</div>
                      <div className="text-sm text-slate-400">Total</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {pieChartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-slate-300">{entry.name}</span>
                      </div>
                      <span className="text-white font-medium">{entry.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Performance */}
              <div className="chart-card-enhanced">
                <h3 className="text-lg font-semibold text-white mb-4">Weekly Performance</h3>
                
                {/* Simple Chart Representation */}
                <div className="h-32 flex items-end justify-between gap-2 mb-4">
                  {[2400, 1800, 1200, 600].map((height, index) => (
                    <div key={index} className="flex-1 bg-gradient-to-t from-blue-500 to-green-500 rounded-t opacity-80" style={{ height: `${(height / 2400) * 100}%` }}></div>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400">This Week</div>
                    <div className="text-white font-semibold">2,890 opens</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Trend</div>
                    <div className="text-green-400 font-semibold">+8.3% ↗</div>
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="ai-insights-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">AI Insights</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="insight-item">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-medium text-white">Growth Seekers performing exceptionally</span>
                    </div>
                    <p className="text-sm text-slate-300 ml-6">85% open rate, 22% click rate - consider increasing frequency</p>
                  </div>
                  
                  <div className="insight-item">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-medium text-white">Tech specialists engage with technical content</span>
                    </div>
                    <p className="text-sm text-slate-300 ml-6">Deep analysis emails show 15% higher engagement</p>
                  </div>
                  
                  <div className="insight-item">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-orange-400" />
                      <span className="text-sm font-medium text-white">New investors need more education</span>
                    </div>
                    <p className="text-sm text-slate-300 ml-6">Consider adding beginner-friendly content series</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CohortAnalyticsEnhanced;

