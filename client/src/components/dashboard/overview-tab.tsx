import React from "react";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  UserMinus, 
  Lightbulb, 
  Target, 
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import "../../styles/dashboard-improvements.css";

export default function OverviewTab() {
  // Use demo data that matches the header values
  const analytics = {
    totalSubscribers: 12847,
    engagementRate: 74.2,
    monthlyRevenue: 89450,
    churnRate: 2.8
  };

  const metrics = [
    {
      title: "Total Subscribers",
      value: analytics.totalSubscribers.toLocaleString(),
      change: "+12.5% from last month",
      changeType: "positive",
      icon: Users,
      color: "#3b82f6"
    },
    {
      title: "Engagement Rate",
      value: `${analytics.engagementRate}%`,
      change: "+8.3% improvement",
      changeType: "positive",
      icon: TrendingUp,
      color: "#10b981"
    },
    {
      title: "Monthly Revenue",
      value: `$${analytics.monthlyRevenue.toLocaleString()}`,
      change: "+23.8% vs baseline",
      changeType: "positive",
      icon: DollarSign,
      color: "#f59e0b"
    },
    {
      title: "Churn Rate",
      value: `${analytics.churnRate}%`,
      change: "-15.2% reduction",
      changeType: "positive",
      icon: UserMinus,
      color: "#ef4444"
    }
  ];

  return (
    <div className="dashboard-container p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="dashboard-title">Dashboard Overview</h1>
        <p className="dashboard-subtitle">AI-powered newsletter personalization insights</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const ChangeIcon = metric.changeType === "positive" ? ArrowUpRight : ArrowDownRight;
          
          return (
            <div key={index} className="metric-card-enhanced interactive-element">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="metric-label-enhanced">{metric.title}</p>
                  <p className="metric-value-animated" data-testid={`text-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    {metric.value}
                  </p>
                  <div className={`${metric.changeType === 'positive' ? 'metric-change-positive' : 'metric-change-negative'}`}>
                    <ChangeIcon className="w-4 h-4" />
                    <span>{metric.change}</span>
                  </div>
                </div>
                <div className="metric-icon-container">
                  <Icon className="metric-icon" style={{ color: metric.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-card-enhanced">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white">Engagement Trends</h3>
            <p className="text-slate-400 text-sm mt-1">Real-time engagement analytics</p>
          </div>
          <div className="chart-content">
            <div className="chart-placeholder">
              <TrendingUp className="chart-icon text-green-500" />
              <p className="text-lg font-medium text-slate-300">Engagement trending upward</p>
              <p className="text-sm text-slate-400 mt-2">34.7% current rate</p>
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">+8.3%</p>
                  <p className="text-xs text-slate-400">This month</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">74.2%</p>
                  <p className="text-xs text-slate-400">Average rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-card-enhanced">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white">Revenue Impact</h3>
            <p className="text-slate-400 text-sm mt-1">Monthly revenue performance</p>
          </div>
          <div className="chart-content">
            <div className="chart-placeholder">
              <DollarSign className="chart-icon text-yellow-500" />
              <p className="text-lg font-medium text-slate-300">Revenue growth: +23.8%</p>
              <p className="text-sm text-slate-400 mt-2">$89,450 monthly</p>
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-500">+$17.2K</p>
                  <p className="text-xs text-slate-400">Increase</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">$2.98</p>
                  <p className="text-xs text-slate-400">Per subscriber</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="ai-insights-card">
        <div className="ai-insights-content">
          <div className="ai-insights-header">
            <div className="ai-insights-icon">
              <Lightbulb className="w-6 h-6" />
            </div>
            <h3 className="ai-insights-title">AI Insights & Recommendations</h3>
          </div>
          
          <div className="space-y-0">
            <div className="ai-insight-item">
              <Target className="ai-insight-icon text-yellow-500" />
              <p className="ai-insight-text">
                Your financial newsletter engagement peaks on Tuesday mornings. Consider scheduling premium content for optimal impact.
              </p>
            </div>
            
            <div className="ai-insight-item">
              <TrendingUp className="ai-insight-icon text-green-500" />
              <p className="ai-insight-text">
                Subscribers responding to "Market Outlook" subject lines show 47% higher lifetime value. Expand this content strategy.
              </p>
            </div>
            
            <div className="ai-insight-item">
              <PieChart className="ai-insight-icon text-blue-400" />
              <p className="ai-insight-text">
                Implement personalized stock recommendations for the "High-Value Investor" segment to increase engagement by an estimated 12%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}