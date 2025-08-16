import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Settings, 
  Brain, 
  Shield, 
  Database, 
  Zap,
  Monitor,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

export default function AdvancedTab() {
  return (
    <div className="space-y-8">
      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "System Health", value: "99.8%", icon: Monitor, color: "brand-green" },
          { title: "AI Processing", value: "Active", icon: Brain, color: "brand-blue" },
          { title: "Data Security", value: "Secure", icon: Shield, color: "purple-500" },
          { title: "API Uptime", value: "100%", icon: Zap, color: "yellow-500" }
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

      {/* AI Configuration */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white flex items-center space-x-3">
            <Brain className="h-6 w-6" />
            <span>AI Model Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Model Settings</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-white font-medium">GPT-4 Content Generation</label>
                    <p className="text-slate-400 text-sm">Advanced AI-powered content personalization</p>
                  </div>
                  <Switch defaultChecked data-testid="switch-gpt4-content" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-white font-medium">Subject Line Optimization</label>
                    <p className="text-slate-400 text-sm">AI-generated subject line variations</p>
                  </div>
                  <Switch defaultChecked data-testid="switch-subject-optimization" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-white font-medium">Send Time Optimization</label>
                    <p className="text-slate-400 text-sm">ML-powered optimal send timing</p>
                  </div>
                  <Switch defaultChecked data-testid="switch-send-time-optimization" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-white font-medium">Sentiment Analysis</label>
                    <p className="text-slate-400 text-sm">Content tone and sentiment monitoring</p>
                  </div>
                  <Switch data-testid="switch-sentiment-analysis" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Performance Metrics</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-300">AI Processing Speed</span>
                    <span className="text-brand-green">94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-300">Model Accuracy</span>
                    <span className="text-brand-green">97.3%</span>
                  </div>
                  <Progress value={97.3} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-300">Content Quality Score</span>
                    <span className="text-brand-green">96.8%</span>
                  </div>
                  <Progress value={96.8} className="h-2" />
                </div>
                <div className="pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Daily API Calls</span>
                    <span className="text-white">12,450 / 50,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white flex items-center space-x-3">
            <Database className="h-6 w-6" />
            <span>Data Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Backup & Export</h4>
              <div className="space-y-3">
                <Button variant="outline" className="w-full" data-testid="button-export-subscribers">
                  <Download className="h-4 w-4 mr-2" />
                  Export Subscribers
                </Button>
                <Button variant="outline" className="w-full" data-testid="button-export-campaigns">
                  <Download className="h-4 w-4 mr-2" />
                  Export Campaigns
                </Button>
                <Button variant="outline" className="w-full" data-testid="button-export-analytics">
                  <Download className="h-4 w-4 mr-2" />
                  Export Analytics
                </Button>
                <p className="text-slate-400 text-xs mt-2">
                  Last backup: Today at 3:00 AM
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Data Import</h4>
              <div className="space-y-3">
                <Button variant="outline" className="w-full" data-testid="button-import-subscribers">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Subscribers
                </Button>
                <Button variant="outline" className="w-full" data-testid="button-import-historical">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Historical Data
                </Button>
                <Button variant="outline" className="w-full" data-testid="button-bulk-update">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Update
                </Button>
                <p className="text-slate-400 text-xs mt-2">
                  Supports CSV, JSON, and API formats
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Storage Usage</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Subscriber Data</span>
                    <span className="text-white">2.4 GB</span>
                  </div>
                  <Progress value={48} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Campaign Archive</span>
                    <span className="text-white">1.8 GB</span>
                  </div>
                  <Progress value={36} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Analytics Data</span>
                    <span className="text-white">0.9 GB</span>
                  </div>
                  <Progress value={18} className="h-2" />
                </div>
                <p className="text-slate-400 text-xs mt-2">
                  5.1 GB of 50 GB used
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Compliance */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white flex items-center space-x-3">
            <Shield className="h-6 w-6" />
            <span>Security & Compliance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Security Status</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-brand-green h-5 w-5" />
                  <div>
                    <p className="text-white text-sm">SSL/TLS Encryption</p>
                    <p className="text-slate-400 text-xs">All data encrypted in transit</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-brand-green h-5 w-5" />
                  <div>
                    <p className="text-white text-sm">Database Encryption</p>
                    <p className="text-slate-400 text-xs">AES-256 encryption at rest</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-brand-green h-5 w-5" />
                  <div>
                    <p className="text-white text-sm">API Authentication</p>
                    <p className="text-slate-400 text-xs">OAuth 2.0 + API keys</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-brand-green h-5 w-5" />
                  <div>
                    <p className="text-white text-sm">Access Logging</p>
                    <p className="text-slate-400 text-xs">Complete audit trail</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Compliance</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-brand-green h-5 w-5" />
                  <div>
                    <p className="text-white text-sm">GDPR Compliance</p>
                    <p className="text-slate-400 text-xs">EU data protection regulation</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-brand-green h-5 w-5" />
                  <div>
                    <p className="text-white text-sm">CCPA Compliance</p>
                    <p className="text-slate-400 text-xs">California privacy act</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-brand-green h-5 w-5" />
                  <div>
                    <p className="text-white text-sm">SOC 2 Type II</p>
                    <p className="text-slate-400 text-xs">Security controls certified</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="text-yellow-500 h-5 w-5" />
                  <div>
                    <p className="text-white text-sm">Data Retention Policy</p>
                    <p className="text-slate-400 text-xs">Review required by March 2025</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Insights */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <Settings className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Advanced System Insights</h3>
              <div className="space-y-2 text-slate-300">
                <p>• AI models process 50,000+ personalization requests daily with 97% accuracy</p>
                <p>• Real-time data synchronization across 4 email platforms with &lt; 30s latency</p>
                <p>• Advanced security monitoring detects and prevents 99.9% of threats</p>
                <p>• Enterprise-grade infrastructure ensures 99.9% uptime with global redundancy</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}