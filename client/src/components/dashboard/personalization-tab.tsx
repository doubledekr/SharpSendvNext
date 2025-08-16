import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Wand2, 
  Brain, 
  Target, 
  Zap, 
  Settings, 
  Send, 
  Eye, 
  RefreshCw 
} from "lucide-react";

export default function PersonalizationTab() {
  return (
    <div className="space-y-8">
      {/* AI Content Generator */}
      <Card className="bg-gradient-to-r from-brand-blue/10 to-purple-500/10 border-brand-blue/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white flex items-center space-x-3">
            <Brain className="h-6 w-6" />
            <span>AI Content Personalization Engine</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Newsletter Topic</label>
              <Input 
                placeholder="e.g., Federal Reserve Interest Rate Decision" 
                className="bg-dark-bg border-dark-border text-white"
                data-testid="input-newsletter-topic"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Target Segment</label>
              <select className="w-full p-3 bg-dark-bg border border-dark-border rounded-md text-white" data-testid="select-target-segment">
                <option>High-Value Investors</option>
                <option>Medium-Engagement</option>
                <option>New Subscribers</option>
                <option>At-Risk</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">Content Brief</label>
            <Textarea 
              placeholder="Describe the key points you want to cover..." 
              className="bg-dark-bg border-dark-border text-white min-h-[100px]"
              data-testid="textarea-content-brief"
            />
          </div>

          <div className="flex space-x-4">
            <Button className="bg-brand-blue hover:bg-brand-blue/90" data-testid="button-generate-content">
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Personalized Content
            </Button>
            <Button variant="outline" data-testid="button-generate-subjects">
              <Target className="h-4 w-4 mr-2" />
              Generate Subject Lines
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Content Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-dark-surface border-dark-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Generated Subject Lines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { text: "🚨 Fed Decision: Your Portfolio Impact Analysis", score: 94 },
                { text: "Breaking: How Today's Rate Cut Affects Your Investments", score: 89 },
                { text: "Exclusive: Fed Meeting Insider Analysis for Premium Investors", score: 87 },
                { text: "Market Alert: Position Your Portfolio Before Tomorrow", score: 82 }
              ].map((subject, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-dark-border rounded-lg hover:border-brand-blue/50 transition-colors" data-testid={`card-subject-line-${index}`}>
                  <span className="text-white text-sm">{subject.text}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-brand-green/20 text-brand-green">
                      {subject.score}%
                    </Badge>
                    <Button size="sm" variant="ghost" data-testid={`button-use-subject-${index}`}>
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Content Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-dark-bg border border-dark-border rounded-lg">
                <div className="text-slate-300 text-sm space-y-2">
                  <p><strong className="text-white">Dear High-Value Investor,</strong></p>
                  <p>Today's Federal Reserve decision will directly impact your portfolio strategy. Based on your investment profile and current holdings, here's your personalized analysis:</p>
                  <p><strong className="text-brand-blue">Key Insights for Your Portfolio:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Your tech holdings may see 12-15% volatility</li>
                    <li>Consider rebalancing your bond allocation</li>
                    <li>Dividend stocks in your watchlist show opportunity</li>
                  </ul>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button size="sm" variant="outline" data-testid="button-preview-content">
                  <Eye className="h-4 w-4 mr-2" />
                  Full Preview
                </Button>
                <Button size="sm" variant="outline" data-testid="button-regenerate-content">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personalization Settings */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white flex items-center space-x-3">
            <Settings className="h-6 w-6" />
            <span>AI Personalization Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Tone & Style</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Professional Level</span>
                  <Badge variant="secondary">Expert</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Urgency Factor</span>
                  <Badge variant="secondary">Medium</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Personalization Depth</span>
                  <Badge variant="secondary">High</Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Content Focus</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Market Analysis</span>
                  <Badge variant="secondary" className="bg-brand-green/20">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Portfolio Recommendations</span>
                  <Badge variant="secondary" className="bg-brand-green/20">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Risk Assessments</span>
                  <Badge variant="secondary" className="bg-brand-green/20">Enabled</Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Performance Metrics</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">AI Engagement Boost</span>
                  <span className="text-brand-green">+34.7%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Click-through Rate</span>
                  <span className="text-brand-green">+28.3%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Revenue Impact</span>
                  <span className="text-brand-green">+$47K/month</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <Zap className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Smart Personalization Insights</h3>
              <div className="space-y-2 text-slate-300">
                <p>• High-value investors respond 47% better to exclusive market analysis content</p>
                <p>• Tuesday morning sends show 23% higher engagement for financial newsletters</p>
                <p>• Personalized stock mentions increase click-through rates by 34%</p>
                <p>• Risk-focused content performs best with subscribers over 45 years old</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}