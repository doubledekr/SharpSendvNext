import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import EmailComposer from "@/components/email/EmailComposer";
import { 
  Wand2, 
  Brain, 
  Target, 
  Zap, 
  Settings, 
  Send, 
  Eye, 
  RefreshCw,
  Edit
} from "lucide-react";

export default function PersonalizationTab() {
  const handleEmailSave = (content: any) => {
    console.log('Email saved:', content);
    // Handle saving to backend
  };

  const handleEmailSend = (content: any) => {
    console.log('Email sent:', content);
    // Handle sending through backend
  };

  return (
    <div className="space-y-8">
      {/* AI Content Generator */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-card-foreground flex items-center space-x-3">
            <Brain className="h-6 w-6" />
            <span>AI Content Personalization Engine</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">Newsletter Topic</label>
              <Input 
                placeholder="e.g., Federal Reserve Interest Rate Decision" 
                className="bg-input border-border text-foreground"
                data-testid="input-newsletter-topic"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">Target Segment</label>
              <select className="w-full p-3 bg-input border border-border rounded-md text-foreground" data-testid="select-target-segment">
                <option>High-Value Investors</option>
                <option>Medium-Engagement</option>
                <option>New Subscribers</option>
                <option>At-Risk</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">Content Brief</label>
            <Textarea 
              placeholder="Describe the key points you want to cover..." 
              className="bg-input border-border text-foreground min-h-[100px]"
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
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground">Generated Subject Lines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { text: "🚨 Fed Decision: Your Portfolio Impact Analysis", score: 94 },
                { text: "Breaking: How Today's Rate Cut Affects Your Investments", score: 89 },
                { text: "Exclusive: Fed Meeting Insider Analysis for Premium Investors", score: 87 },
                { text: "Market Alert: Position Your Portfolio Before Tomorrow", score: 82 }
              ].map((subject, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 transition-colors" data-testid={`card-subject-line-${index}`}>
                  <span className="text-card-foreground text-sm">{subject.text}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400">
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

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground">Content Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted border border-border rounded-lg">
                <div className="text-muted-foreground text-sm space-y-2">
                  <p><strong className="text-foreground">Dear High-Value Investor,</strong></p>
                  <p>Today's Federal Reserve decision will directly impact your portfolio strategy. Based on your investment profile and current holdings, here's your personalized analysis:</p>
                  <p><strong className="text-primary">Key Insights for Your Portfolio:</strong></p>
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

      {/* Email Composer with Image Support */}
      <EmailComposer 
        onSave={handleEmailSave}
        onSend={handleEmailSend}
      />

      {/* Personalization Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-card-foreground flex items-center space-x-3">
            <Settings className="h-6 w-6" />
            <span>AI Personalization Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-card-foreground mb-4">Tone & Style</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Professional Level</span>
                  <Badge variant="secondary">Expert</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Urgency Factor</span>
                  <Badge variant="secondary">Medium</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Personalization Depth</span>
                  <Badge variant="secondary">High</Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-card-foreground mb-4">Content Focus</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Market Analysis</span>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Portfolio Recommendations</span>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Risk Assessments</span>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400">Enabled</Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-card-foreground mb-4">Performance Metrics</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">AI Engagement Boost</span>
                  <span className="text-green-400">+34.7%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Click-through Rate</span>
                  <span className="text-green-400">+28.3%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Revenue Impact</span>
                  <span className="text-green-400">+$47K/month</span>
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
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Smart Personalization Insights</h3>
              <div className="space-y-2 text-muted-foreground">
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