import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Target, 
  Calculator,
  PieChart,
  Download,
  RefreshCw
} from "lucide-react";

export default function RevenueTab() {
  return (
    <div className="space-y-8">
      {/* Revenue Impact Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Monthly Revenue", value: "$89,450", change: "+23.8%", icon: DollarSign, color: "brand-green" },
          { title: "Revenue per Subscriber", value: "$1.89", change: "+15.2%", icon: Users, color: "blue-500" },
          { title: "AI Revenue Lift", value: "$47,200", change: "+34.7%", icon: Target, color: "purple-500" },
          { title: "Annual Projection", value: "$1.07M", change: "+28.5%", icon: TrendingUp, color: "yellow-500" }
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="bg-dark-surface border-dark-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">{metric.title}</p>
                    <p className="text-2xl font-bold text-white mt-1" data-testid={`text-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {metric.value}
                    </p>
                    <p className="text-brand-green text-sm mt-1">{metric.change}</p>
                  </div>
                  <Icon className={`text-${metric.color} h-8 w-8`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue Calculator */}
      <Card className="bg-gradient-to-r from-brand-green/10 to-blue-500/10 border-brand-green/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white flex items-center space-x-3">
            <Calculator className="h-6 w-6" />
            <span>SharpSend.io Revenue Impact Calculator</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Before SharpSend.io */}
            <div className="p-6 bg-dark-bg rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Before SharpSend.io</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-300">Subscribers</span>
                  <span className="text-white font-semibold">47,300</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Open Rate</span>
                  <span className="text-white font-semibold">22.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Click Rate</span>
                  <span className="text-white font-semibold">4.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Revenue/Month</span>
                  <span className="text-white font-semibold">$65,200</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Annual Revenue</span>
                  <span className="text-white font-semibold">$782,400</span>
                </div>
              </div>
            </div>

            {/* After SharpSend.io */}
            <div className="p-6 bg-gradient-to-br from-brand-green/20 to-blue-500/20 rounded-lg border border-brand-green/30">
              <h3 className="text-lg font-semibold text-white mb-4">With SharpSend.io</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-300">Subscribers</span>
                  <span className="text-brand-green font-semibold">47,300</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Open Rate</span>
                  <span className="text-brand-green font-semibold">34.7% (+55%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Click Rate</span>
                  <span className="text-brand-green font-semibold">12.4% (+195%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Revenue/Month</span>
                  <span className="text-brand-green font-semibold">$89,450 (+37%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Annual Revenue</span>
                  <span className="text-brand-green font-semibold">$1,073,400 (+37%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Summary */}
          <div className="mt-6 p-4 bg-brand-green/10 border border-brand-green/20 rounded-lg">
            <div className="text-center">
              <p className="text-brand-green text-lg font-semibold">
                Annual Revenue Increase: $291,000
              </p>
              <p className="text-slate-300 text-sm mt-1">
                ROI: 312% • Payback Period: 3.8 months
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-center space-x-4">
            <Button variant="outline" data-testid="button-download-report">
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
            <Button variant="outline" data-testid="button-update-calculator">
              <RefreshCw className="h-4 w-4 mr-2" />
              Update Calculator
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-dark-surface border-dark-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Revenue by Segment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { segment: "High-Value Investors", revenue: "$52,340", percentage: "58.5%", color: "brand-green" },
                { segment: "Medium Engagement", revenue: "$23,890", percentage: "26.7%", color: "blue-500" },
                { segment: "New Subscribers", revenue: "$8,940", percentage: "10.0%", color: "yellow-500" },
                { segment: "At-Risk", revenue: "$4,280", percentage: "4.8%", color: "brand-red" }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg" data-testid={`card-revenue-segment-${index}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full bg-${item.color}`}></div>
                    <span className="text-white">{item.segment}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{item.revenue}</p>
                    <p className="text-slate-400 text-sm">{item.percentage}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">AI Feature Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { feature: "Personalized Subject Lines", impact: "+$18,400", lift: "+34%" },
                { feature: "Content Personalization", impact: "+$15,200", lift: "+28%" },
                { feature: "Send Time Optimization", impact: "+$8,900", lift: "+16%" },
                { feature: "A/B Testing", impact: "+$4,700", lift: "+9%" }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg" data-testid={`card-ai-impact-${index}`}>
                  <div>
                    <p className="text-white">{item.feature}</p>
                    <p className="text-slate-400 text-sm">Monthly impact</p>
                  </div>
                  <div className="text-right">
                    <p className="text-brand-green font-semibold">{item.impact}</p>
                    <Badge variant="secondary" className="bg-brand-green/20 text-brand-green text-xs">
                      {item.lift}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SharpSend Demo Case Study */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">Success Story: Financial Publisher</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <PieChart className="h-12 w-12 mx-auto text-purple-500 mb-3" />
              <h4 className="text-lg font-semibold text-white">Before</h4>
              <p className="text-slate-300">$782K annual revenue</p>
              <p className="text-slate-400 text-sm">22.4% engagement</p>
            </div>
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-brand-green mb-3" />
              <h4 className="text-lg font-semibold text-white">Implementation</h4>
              <p className="text-slate-300">3 months setup</p>
              <p className="text-slate-400 text-sm">Full AI personalization</p>
            </div>
            <div className="text-center">
              <Target className="h-12 w-12 mx-auto text-yellow-500 mb-3" />
              <h4 className="text-lg font-semibold text-white">Results</h4>
              <p className="text-brand-green">$1.07M annual revenue</p>
              <p className="text-brand-green text-sm">+37% increase</p>
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-slate-300">
              "SharpSend.io transformed our newsletter business. The revenue impact exceeded our most optimistic projections, 
              and our subscribers are more engaged than ever with truly personalized financial insights."
            </p>
            <p className="text-slate-400 text-sm mt-2">
              — Sarah Chen, Chief Marketing Officer, Financial Publisher
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}