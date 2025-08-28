import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  Users,
  Mail
} from "lucide-react";
import type { Campaign } from "@shared/schema";

interface AnalyticsData {
  totalSubscribers: number;
  engagementRate: string;
  churnRate: string;
  monthlyRevenue: string;
  revenueGrowth: string;
  openRate: string;
  clickRate: string;
  unsubscribeRate: string;
  date: string;
}

export default function AnalyticsTab() {
  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics'],
  });

  if (campaignsLoading || analyticsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-dark-surface border-dark-border">
              <CardContent className="p-6">
                <div className="h-16 bg-slate-700/50 animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-slate-300">Loading analytics data...</div>
      </div>
    );
  }

  const topCampaigns = (campaigns || [])
    .sort((a, b) => parseFloat(b.openRate || "0") - parseFloat(a.openRate || "0"))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Key Metrics - Real Data from Customer.io */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { 
            title: "Total Subscribers", 
            value: analytics?.totalSubscribers?.toString() || "0", 
            change: analytics?.totalSubscribers > 0 ? "From Customer.io" : "No integrations", 
            icon: Users, 
            color: "brand-green" 
          },
          { 
            title: "Engagement Rate", 
            value: `${analytics?.engagementRate || "0.0"}%`, 
            change: analytics?.totalSubscribers > 0 ? "Live data" : "Connect platform", 
            icon: TrendingUp, 
            color: "blue-500" 
          },
          { 
            title: "Monthly Revenue", 
            value: `$${analytics?.monthlyRevenue || "0.00"}`, 
            change: `Growth: ${analytics?.revenueGrowth || "0"}%`, 
            icon: DollarSign, 
            color: "yellow-500" 
          },
          { 
            title: "Open Rate", 
            value: `${analytics?.openRate || "0.0"}%`, 
            change: "Platform average", 
            icon: Eye, 
            color: "purple-500" 
          }
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="bg-dark-surface border-dark-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">{metric.title}</p>
                    <p className="text-2xl font-bold text-white mt-1" data-testid={`text-${metric.title.toLowerCase().replace(/[\/\s]+/g, '-')}`}>
                      {metric.value}
                    </p>
                    <p className={`text-sm mt-1 ${analytics?.totalSubscribers > 0 ? 'text-brand-green' : 'text-yellow-500'}`}>
                      {metric.change}
                    </p>
                  </div>
                  <Icon className={`text-${metric.color} h-8 w-8`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Chart */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-white">Campaign Performance</CardTitle>
            <div className="flex space-x-3">
              <Button variant="outline" size="sm" data-testid="button-filter-campaigns">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm" data-testid="button-export-analytics">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-slate-400 border border-dashed border-dark-border rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-brand-blue" />
              <p>Campaign performance visualization</p>
              <p className="text-sm">Interactive charts showing engagement trends</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Campaigns */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">Top Performing Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCampaigns.map((campaign, index) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 border border-dark-border rounded-lg hover:border-brand-blue/50 transition-colors" data-testid={`card-campaign-${index}`}>
                <div className="flex-1">
                  <h4 className="text-white font-medium">{campaign.name}</h4>
                  <p className="text-slate-400 text-sm mt-1">{campaign.subjectLine}</p>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-white text-sm font-semibold">{campaign.openRate}%</p>
                    <p className="text-slate-400 text-xs">Open Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white text-sm font-semibold">{campaign.clickRate}%</p>
                    <p className="text-slate-400 text-xs">Click Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white text-sm font-semibold">${campaign.revenue}</p>
                    <p className="text-slate-400 text-xs">Revenue</p>
                  </div>
                  <Badge variant="secondary" className="bg-brand-green/20 text-brand-green">
                    Top 10%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-dark-surface border-dark-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Subject Line Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { pattern: "Market Alert", performance: "+45% open rate", color: "brand-green" },
                { pattern: "Breaking News", performance: "+32% click rate", color: "blue-500" },
                { pattern: "Exclusive Analysis", performance: "+28% engagement", color: "yellow-500" },
                { pattern: "Portfolio Update", performance: "+15% retention", color: "purple-500" }
              ].map((pattern, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg" data-testid={`text-subject-pattern-${index}`}>
                  <span className="text-white">{pattern.pattern}</span>
                  <Badge variant="secondary" className={`bg-${pattern.color}/20 text-${pattern.color}`}>
                    {pattern.performance}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Engagement Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="text-brand-green h-5 w-5" />
                <div>
                  <p className="text-white text-sm">Peak engagement: Tuesday 9 AM EST</p>
                  <p className="text-slate-400 text-xs">47% higher open rates</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <TrendingUp className="text-blue-500 h-5 w-5" />
                <div>
                  <p className="text-white text-sm">Financial analysis content drives 34% more clicks</p>
                  <p className="text-slate-400 text-xs">Best performing content type</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <TrendingUp className="text-yellow-500 h-5 w-5" />
                <div>
                  <p className="text-white text-sm">Personalized content shows 28% better retention</p>
                  <p className="text-slate-400 text-xs">AI-driven personalization impact</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <TrendingUp className="text-purple-500 h-5 w-5" />
                <div>
                  <p className="text-white text-sm">Mobile opens account for 67% of traffic</p>
                  <p className="text-slate-400 text-xs">Device usage breakdown</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}