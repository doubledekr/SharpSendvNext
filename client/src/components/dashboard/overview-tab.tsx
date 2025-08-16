import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  UserMinus, 
  Lightbulb, 
  Target, 
  PieChart 
} from "lucide-react";
import type { Analytics } from "@shared/schema";

export default function OverviewTab() {
  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ['/api/analytics'],
  });

  if (isLoading) {
    return <div className="text-slate-300">Loading analytics...</div>;
  }

  const metrics = [
    {
      title: "Total Subscribers",
      value: analytics?.totalSubscribers?.toLocaleString() || "0",
      change: "+12.5% from last month",
      icon: Users,
      color: "brand-blue"
    },
    {
      title: "Engagement Rate",
      value: `${analytics?.engagementRate || "0"}%`,
      change: "+8.3% improvement",
      icon: TrendingUp,
      color: "brand-green"
    },
    {
      title: "Monthly Revenue",
      value: `$${parseFloat(analytics?.monthlyRevenue || "0").toLocaleString()}`,
      change: "+23.8% vs baseline",
      icon: DollarSign,
      color: "yellow-500"
    },
    {
      title: "Churn Rate",
      value: `${analytics?.churnRate || "0"}%`,
      change: "-15.2% reduction",
      icon: UserMinus,
      color: "brand-red"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="bg-dark-surface border-dark-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">{metric.title}</p>
                    <p className="text-3xl font-bold text-white mt-1" data-testid={`text-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {metric.value}
                    </p>
                    <p className="text-brand-green text-sm mt-1">
                      {metric.change}
                    </p>
                  </div>
                  <div className={`w-12 h-12 bg-${metric.color}/20 rounded-lg flex items-center justify-center`}>
                    <Icon className={`text-${metric.color} text-xl`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-dark-surface border-dark-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white">Engagement Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <TrendingUp className="h-16 w-16 mx-auto mb-4 text-brand-green" />
                <p>Engagement trending upward</p>
                <p className="text-sm">34.7% current rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white">Revenue Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <DollarSign className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
                <p>Revenue growth: +23.8%</p>
                <p className="text-sm">$89,450 monthly</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="bg-gradient-to-r from-brand-blue/10 to-purple-500/10 border-brand-blue/20">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-brand-blue rounded-lg flex items-center justify-center flex-shrink-0">
              <Lightbulb className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">AI Insights & Recommendations</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Lightbulb className="text-yellow-500 mt-1 h-4 w-4" />
                  <p className="text-slate-300">Your financial newsletter engagement peaks on Tuesday mornings. Consider scheduling premium content for optimal impact.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Target className="text-brand-green mt-1 h-4 w-4" />
                  <p className="text-slate-300">Subscribers responding to "Market Outlook" subject lines show 47% higher lifetime value. Expand this content strategy.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <PieChart className="text-blue-400 mt-1 h-4 w-4" />
                  <p className="text-slate-300">Implement personalized stock recommendations for the "High-Value Investor" segment to increase engagement by an estimated 12%.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}