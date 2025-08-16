import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  CheckCircle, 
  XCircle, 
  Settings, 
  Mail, 
  Send, 
  Users, 
  BarChart3,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  TestTube
} from 'lucide-react';

interface EmailProvider {
  id: string;
  name: string;
  type: 'brevo' | 'exacttarget' | 'sendgrid' | 'mailgun' | 'ses';
  status: 'connected' | 'disconnected' | 'error';
  isActive: boolean;
  config: {
    apiKey?: string;
    senderEmail?: string;
    senderName?: string;
    listId?: string;
    domain?: string;
    region?: string;
  };
  stats?: {
    totalSent: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  };
  lastTested?: string;
}

const EmailProviderSettings: React.FC = () => {
  const [providers, setProviders] = useState<EmailProvider[]>([]);
  const [activeTab, setActiveTab] = useState('brevo');
  const [loading, setLoading] = useState(true);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  // Sample data for demo
  useEffect(() => {
    setTimeout(() => {
      setProviders([
        {
          id: 'brevo_1',
          name: 'Brevo (Primary)',
          type: 'brevo',
          status: 'connected',
          isActive: true,
          config: {
            apiKey: 'xkeysib-*********************',
            senderEmail: 'noreply@sharpsend.com',
            senderName: 'SharpSend',
            listId: '1'
          },
          stats: {
            totalSent: 15420,
            deliveryRate: 0.987,
            openRate: 0.742,
            clickRate: 0.168
          },
          lastTested: '2024-01-16T10:30:00Z'
        },
        {
          id: 'exacttarget_1',
          name: 'ExactTarget Marketing Cloud',
          type: 'exacttarget',
          status: 'connected',
          isActive: false,
          config: {
            apiKey: 'et_*********************',
            senderEmail: 'marketing@sharpsend.com',
            senderName: 'SharpSend Marketing'
          },
          stats: {
            totalSent: 8950,
            deliveryRate: 0.982,
            openRate: 0.698,
            clickRate: 0.142
          },
          lastTested: '2024-01-15T14:20:00Z'
        },
        {
          id: 'sendgrid_1',
          name: 'SendGrid (Backup)',
          type: 'sendgrid',
          status: 'disconnected',
          isActive: false,
          config: {
            apiKey: '',
            senderEmail: 'backup@sharpsend.com',
            senderName: 'SharpSend'
          }
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleTestConnection = async (providerId: string) => {
    setTestingProvider(providerId);
    
    // Simulate API call
    setTimeout(() => {
      setProviders(prev => prev.map(p => 
        p.id === providerId 
          ? { ...p, status: 'connected' as const, lastTested: new Date().toISOString() }
          : p
      ));
      setTestingProvider(null);
    }, 2000);
  };

  const handleToggleProvider = (providerId: string) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId 
        ? { ...p, isActive: !p.isActive }
        : p
    ));
  };

  const handleUpdateConfig = (providerId: string, config: any) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId 
        ? { ...p, config: { ...p.config, ...config } }
        : p
    ));
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'brevo': return '📧';
      case 'exacttarget': return '☁️';
      case 'sendgrid': return '📮';
      case 'mailgun': return '🔫';
      case 'ses': return '📨';
      default: return '✉️';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'disconnected': return 'text-gray-500';
      case 'error': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'disconnected': return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading email providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Provider Settings</h1>
          <p className="text-gray-600">Manage your email service providers and delivery settings</p>
        </div>

        {/* Provider Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Providers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {providers.filter(p => p.isActive).length}
                  </p>
                </div>
                <Mail className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sent (30d)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {providers.reduce((sum, p) => sum + (p.stats?.totalSent || 0), 0).toLocaleString()}
                  </p>
                </div>
                <Send className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Delivery Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(providers.reduce((sum, p) => sum + (p.stats?.deliveryRate || 0), 0) / providers.filter(p => p.stats).length * 100).toFixed(1)}%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="brevo">Brevo</TabsTrigger>
            <TabsTrigger value="exacttarget">ExactTarget</TabsTrigger>
            <TabsTrigger value="sendgrid">SendGrid</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          {/* Brevo Configuration */}
          <TabsContent value="brevo">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📧</span>
                  Brevo (Sendinblue) Configuration
                </CardTitle>
                <CardDescription>
                  Configure your Brevo email service provider for transactional and marketing emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {providers.filter(p => p.type === 'brevo').map(provider => (
                  <div key={provider.id} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{provider.name}</h3>
                        {getStatusIcon(provider.status)}
                        <Badge variant={provider.isActive ? 'default' : 'secondary'}>
                          {provider.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={provider.isActive}
                          onCheckedChange={() => handleToggleProvider(provider.id)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestConnection(provider.id)}
                          disabled={testingProvider === provider.id}
                        >
                          {testingProvider === provider.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                              Testing...
                            </>
                          ) : (
                            <>
                              <TestTube className="h-4 w-4 mr-2" />
                              Test Connection
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label htmlFor="brevo-api-key">API Key</Label>
                        <Input
                          id="brevo-api-key"
                          type="password"
                          value={provider.config.apiKey || ''}
                          onChange={(e) => handleUpdateConfig(provider.id, { apiKey: e.target.value })}
                          placeholder="Enter your Brevo API key"
                        />
                      </div>
                      <div>
                        <Label htmlFor="brevo-sender-email">Sender Email</Label>
                        <Input
                          id="brevo-sender-email"
                          type="email"
                          value={provider.config.senderEmail || ''}
                          onChange={(e) => handleUpdateConfig(provider.id, { senderEmail: e.target.value })}
                          placeholder="noreply@yourdomain.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="brevo-sender-name">Sender Name</Label>
                        <Input
                          id="brevo-sender-name"
                          value={provider.config.senderName || ''}
                          onChange={(e) => handleUpdateConfig(provider.id, { senderName: e.target.value })}
                          placeholder="Your Company Name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="brevo-list-id">Default List ID</Label>
                        <Input
                          id="brevo-list-id"
                          value={provider.config.listId || ''}
                          onChange={(e) => handleUpdateConfig(provider.id, { listId: e.target.value })}
                          placeholder="1"
                        />
                      </div>
                    </div>

                    {provider.stats && (
                      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{provider.stats.totalSent.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">Total Sent</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{(provider.stats.deliveryRate * 100).toFixed(1)}%</div>
                          <div className="text-sm text-gray-600">Delivery Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">{(provider.stats.openRate * 100).toFixed(1)}%</div>
                          <div className="text-sm text-gray-600">Open Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">{(provider.stats.clickRate * 100).toFixed(1)}%</div>
                          <div className="text-sm text-gray-600">Click Rate</div>
                        </div>
                      </div>
                    )}

                    {provider.lastTested && (
                      <p className="text-sm text-gray-500 mt-2">
                        Last tested: {new Date(provider.lastTested).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Add New Brevo Account</h3>
                  <p className="text-gray-600 mb-4">Connect additional Brevo accounts for different brands or regions</p>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Brevo Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ExactTarget Configuration */}
          <TabsContent value="exacttarget">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">☁️</span>
                  ExactTarget Marketing Cloud Configuration
                </CardTitle>
                <CardDescription>
                  Configure your Salesforce Marketing Cloud (ExactTarget) integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {providers.filter(p => p.type === 'exacttarget').map(provider => (
                  <div key={provider.id} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{provider.name}</h3>
                        {getStatusIcon(provider.status)}
                        <Badge variant={provider.isActive ? 'default' : 'secondary'}>
                          {provider.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={provider.isActive}
                          onCheckedChange={() => handleToggleProvider(provider.id)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestConnection(provider.id)}
                          disabled={testingProvider === provider.id}
                        >
                          {testingProvider === provider.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                              Testing...
                            </>
                          ) : (
                            <>
                              <TestTube className="h-4 w-4 mr-2" />
                              Test Connection
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label htmlFor="et-client-id">Client ID</Label>
                        <Input
                          id="et-client-id"
                          value={provider.config.apiKey || ''}
                          onChange={(e) => handleUpdateConfig(provider.id, { apiKey: e.target.value })}
                          placeholder="Enter your ExactTarget Client ID"
                        />
                      </div>
                      <div>
                        <Label htmlFor="et-client-secret">Client Secret</Label>
                        <Input
                          id="et-client-secret"
                          type="password"
                          placeholder="Enter your ExactTarget Client Secret"
                        />
                      </div>
                      <div>
                        <Label htmlFor="et-subdomain">Subdomain</Label>
                        <Input
                          id="et-subdomain"
                          placeholder="your-subdomain"
                        />
                      </div>
                      <div>
                        <Label htmlFor="et-sender-email">Sender Email</Label>
                        <Input
                          id="et-sender-email"
                          type="email"
                          value={provider.config.senderEmail || ''}
                          onChange={(e) => handleUpdateConfig(provider.id, { senderEmail: e.target.value })}
                          placeholder="marketing@yourdomain.com"
                        />
                      </div>
                    </div>

                    {provider.stats && (
                      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{provider.stats.totalSent.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">Total Sent</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{(provider.stats.deliveryRate * 100).toFixed(1)}%</div>
                          <div className="text-sm text-gray-600">Delivery Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">{(provider.stats.openRate * 100).toFixed(1)}%</div>
                          <div className="text-sm text-gray-600">Open Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">{(provider.stats.clickRate * 100).toFixed(1)}%</div>
                          <div className="text-sm text-gray-600">Click Rate</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SendGrid Configuration */}
          <TabsContent value="sendgrid">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📮</span>
                  SendGrid Configuration
                </CardTitle>
                <CardDescription>
                  Configure SendGrid as a backup or primary email provider
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Settings className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">SendGrid Not Configured</h3>
                  <p className="text-gray-600 mb-4">Add your SendGrid API key to enable email delivery through SendGrid</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Configure SendGrid
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Email Providers</CardTitle>
                  <CardDescription>Overview of all configured email service providers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {providers.map(provider => (
                      <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{getProviderIcon(provider.type)}</span>
                          <div>
                            <h4 className="font-semibold">{provider.name}</h4>
                            <p className="text-sm text-gray-600 capitalize">{provider.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {provider.stats && (
                            <div className="text-right">
                              <div className="text-sm font-medium">{provider.stats.totalSent.toLocaleString()} sent</div>
                              <div className="text-xs text-gray-500">{(provider.stats.openRate * 100).toFixed(1)}% open rate</div>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            {getStatusIcon(provider.status)}
                            <Badge variant={provider.isActive ? 'default' : 'secondary'}>
                              {provider.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Provider Recommendations</CardTitle>
                  <CardDescription>Optimize your email delivery setup</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Primary Provider Active</h4>
                        <p className="text-sm text-blue-700">Brevo is configured and performing well as your primary email provider.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900">Configure Backup Provider</h4>
                        <p className="text-sm text-yellow-700">Consider activating ExactTarget or configuring SendGrid as a backup to ensure email delivery reliability.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900">High Delivery Rates</h4>
                        <p className="text-sm text-green-700">Your current setup is achieving excellent delivery rates above 98%.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmailProviderSettings;

