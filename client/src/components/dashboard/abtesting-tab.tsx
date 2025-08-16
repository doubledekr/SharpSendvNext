import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FlaskConical, 
  Play, 
  Pause, 
  TrendingUp, 
  Target, 
  CheckCircle,
  AlertCircle,
  BarChart3
} from "lucide-react";
import type { ABTest } from "@shared/schema";

export default function ABTestingTab() {
  const { data: abTests, isLoading } = useQuery<ABTest[]>({
    queryKey: ['/api/ab-tests'],
  });

  if (isLoading) {
    return <div className="text-slate-300">Loading A/B tests...</div>;
  }

  const activeTests = abTests?.filter(test => test.status === 'running') || [];
  const completedTests = abTests?.filter(test => test.status === 'completed') || [];

  return (
    <div className="space-y-8">
      {/* A/B Testing Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Active Tests", value: activeTests.length.toString(), icon: FlaskConical, color: "brand-blue" },
          { title: "Completed Tests", value: completedTests.length.toString(), icon: CheckCircle, color: "brand-green" },
          { title: "Avg Lift", value: "+23.4%", icon: TrendingUp, color: "yellow-500" },
          { title: "Confidence Level", value: "95.2%", icon: Target, color: "purple-500" }
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
                  </div>
                  <Icon className={`text-${metric.color} h-8 w-8`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Tests */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-white">Active A/B Tests</CardTitle>
            <Button className="bg-brand-blue hover:bg-brand-blue/90" data-testid="button-create-test">
              <FlaskConical className="h-4 w-4 mr-2" />
              Create New Test
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {abTests?.slice(0, 3).map((test, index) => (
              <div key={test.id} className="p-6 border border-dark-border rounded-lg" data-testid={`card-ab-test-${index}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{test.name}</h3>
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className={`${test.status === 'running' ? 'bg-brand-green/20 text-brand-green' : 'bg-yellow-500/20 text-yellow-500'}`}>
                      {test.status}
                    </Badge>
                    <Button size="sm" variant="outline" data-testid={`button-${test.status === 'running' ? 'pause' : 'start'}-test-${index}`}>
                      {test.status === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Variant A */}
                  <div className="p-4 bg-dark-bg rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-white">Variant A (Control)</h4>
                      <Badge variant="outline" className="text-slate-300">
                        {test.variantA?.sent || 0} sent
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-300 mb-3">
                      "{test.variantA?.subjectLine}"
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Open Rate</p>
                        <p className="text-white font-semibold">{test.variantA?.openRate || 0}%</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Click Rate</p>
                        <p className="text-white font-semibold">{test.variantA?.clickRate || 0}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Variant B */}
                  <div className="p-4 bg-dark-bg rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-white">Variant B (Test)</h4>
                      <Badge variant="outline" className="text-slate-300">
                        {test.variantB?.sent || 0} sent
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-300 mb-3">
                      "{test.variantB?.subjectLine}"
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Open Rate</p>
                        <p className="text-white font-semibold">{test.variantB?.openRate || 0}%</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Click Rate</p>
                        <p className="text-white font-semibold">{test.variantB?.clickRate || 0}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test Progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Statistical Confidence</span>
                    <span className="text-white text-sm">{test.confidenceLevel}%</span>
                  </div>
                  <Progress value={parseFloat(test.confidenceLevel || "0")} className="h-2" />
                </div>

                {/* Winner Detection */}
                {parseFloat(test.confidenceLevel || "0") > 95 && (
                  <div className="mt-4 p-3 bg-brand-green/10 border border-brand-green/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-brand-green h-5 w-5" />
                      <div>
                        <p className="text-brand-green font-medium">Winner Detected!</p>
                        <p className="text-slate-300 text-sm">
                          Variant B outperforms by {((test.variantB?.openRate || 0) - (test.variantA?.openRate || 0)).toFixed(1)}% with 95%+ confidence
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Results History */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">Recent Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Subject Line Urgency Test", winner: "Variant B", lift: "+18.3%", metric: "Open Rate" },
              { name: "CTA Button Color Test", winner: "Variant A", lift: "+12.7%", metric: "Click Rate" },
              { name: "Email Timing Test", winner: "Variant B", lift: "+23.8%", metric: "Engagement" },
              { name: "Personalization Level Test", winner: "Variant B", lift: "+34.2%", metric: "Revenue" }
            ].map((result, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-dark-border rounded-lg hover:border-brand-blue/50 transition-colors" data-testid={`card-test-result-${index}`}>
                <div>
                  <h4 className="text-white font-medium">{result.name}</h4>
                  <p className="text-slate-400 text-sm">Winner: {result.winner}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-brand-green font-semibold">{result.lift}</p>
                    <p className="text-slate-400 text-xs">{result.metric} Lift</p>
                  </div>
                  <Badge variant="secondary" className="bg-brand-green/20 text-brand-green">
                    Significant
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* A/B Testing Insights */}
      <Card className="bg-gradient-to-r from-brand-blue/10 to-purple-500/10 border-brand-blue/20">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-brand-blue rounded-lg flex items-center justify-center">
              <BarChart3 className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">A/B Testing Insights</h3>
              <div className="space-y-2 text-slate-300">
                <p>• Urgency-based subject lines consistently outperform by 15-25%</p>
                <p>• Personalized content shows 34% higher engagement in financial newsletters</p>
                <p>• Tuesday morning sends achieve 23% higher open rates than other days</p>
                <p>• Tests reach statistical significance faster with 5,000+ subscriber segments</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}