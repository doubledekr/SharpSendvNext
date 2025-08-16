import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Settings, 
  BarChart3,
  Zap,
  Link as LinkIcon
} from "lucide-react";
import type { EmailIntegration } from "@shared/schema";

export default function EmailTab() {
  const { data: integrations, isLoading } = useQuery<EmailIntegration[]>({
    queryKey: ['/api/email-integrations'],
  });

  if (isLoading) {
    return <div className="text-slate-300">Loading email integrations...</div>;
  }

  const connectedPlatforms = integrations?.filter(i => i.isConnected) || [];
  const availablePlatforms = [
    { name: 'Mailchimp', logo: '🐵', status: 'connected', campaigns: 1240, subscribers: 47300 },
    { name: 'ConvertKit', logo: '📧', status: 'available', campaigns: 0, subscribers: 0 },
    { name: 'SendGrid', logo: '📨', status: 'connected', campaigns: 890, subscribers: 23400 },
    { name: 'Campaign Monitor', logo: '📊', status: 'available', campaigns: 0, subscribers: 0 }
  ];

  return (
    <div className="space-y-8">
      {/* Integration Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Connected Platforms", value: connectedPlatforms.length.toString(), icon: CheckCircle, color: "brand-green" },
          { title: "Total Campaigns", value: "2,130", icon: Mail, color: "blue-500" },
          { title: "Sync Status", value: "Active", icon: Zap, color: "yellow-500" },
          { title: "Last Sync", value: "2 min ago", icon: BarChart3, color: "purple-500" }
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

      {/* Email Platform Connections */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-white">Email Platform Integrations</CardTitle>
            <Button className="bg-brand-blue hover:bg-brand-blue/90" data-testid="button-add-integration">
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {availablePlatforms.map((platform, index) => (
              <div key={index} className="p-6 border border-dark-border rounded-lg hover:border-brand-blue/50 transition-colors" data-testid={`card-platform-${platform.name.toLowerCase()}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{platform.logo}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{platform.name}</h3>
                      <p className="text-slate-400 text-sm">
                        {platform.status === 'connected' ? 'Connected & Syncing' : 'Available for Integration'}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={platform.status === 'connected' ? 'bg-brand-green/20 text-brand-green' : 'bg-slate-500/20 text-slate-400'}
                  >
                    {platform.status}
                  </Badge>
                </div>

                {platform.status === 'connected' && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-slate-400 text-sm">Campaigns</p>
                      <p className="text-white font-semibold">{platform.campaigns.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Subscribers</p>
                      <p className="text-white font-semibold">{platform.subscribers.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  {platform.status === 'connected' ? (
                    <>
                      <Button size="sm" variant="outline" data-testid={`button-configure-${platform.name.toLowerCase()}`}>
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                      <Button size="sm" variant="outline" data-testid={`button-sync-${platform.name.toLowerCase()}`}>
                        <Zap className="h-4 w-4 mr-2" />
                        Sync Now
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" className="bg-brand-blue hover:bg-brand-blue/90" data-testid={`button-connect-${platform.name.toLowerCase()}`}>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sync Status */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">Synchronization Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrations?.map((integration, index) => (
              <div key={integration.id} className="flex items-center justify-between p-4 border border-dark-border rounded-lg" data-testid={`card-sync-status-${index}`}>
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${integration.isConnected ? 'bg-brand-green animate-pulse' : 'bg-brand-red'}`}></div>
                  <div>
                    <h4 className="text-white font-medium">{integration.platform}</h4>
                    <p className="text-slate-400 text-sm">
                      Last sync: {integration.lastSync ? new Date(integration.lastSync).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-white font-semibold">{integration.campaignsSent || 0}</p>
                    <p className="text-slate-400 text-xs">Campaigns</p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={integration.status === 'active' ? 'bg-brand-green/20 text-brand-green' : 'bg-brand-red/20 text-brand-red'}
                  >
                    {integration.status || 'inactive'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">API Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Webhook Endpoints</h4>
              <div className="space-y-3">
                <div className="p-3 bg-dark-bg rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Campaign Events</span>
                    <Badge variant="secondary" className="bg-brand-green/20 text-brand-green">Active</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">https://api.personalizeai.com/webhooks/campaigns</p>
                </div>
                <div className="p-3 bg-dark-bg rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Subscriber Updates</span>
                    <Badge variant="secondary" className="bg-brand-green/20 text-brand-green">Active</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">https://api.personalizeai.com/webhooks/subscribers</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Rate Limits</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">API Calls/Hour</span>
                  <span className="text-white">2,340 / 5,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Webhook Delivery</span>
                  <span className="text-brand-green">99.8% success</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Data Sync Latency</span>
                  <span className="text-white">&lt; 30 seconds</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Insights */}
      <Card className="bg-gradient-to-r from-brand-blue/10 to-purple-500/10 border-brand-blue/20">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-brand-blue rounded-lg flex items-center justify-center">
              <Mail className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Integration Insights</h3>
              <div className="space-y-2 text-slate-300">
                <p>• Multi-platform campaigns reach 47% more subscribers with consistent messaging</p>
                <p>• Real-time sync ensures personalization data is always current across platforms</p>
                <p>• Unified analytics provide complete view of cross-platform performance</p>
                <p>• Automated failover maintains service continuity during platform maintenance</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}