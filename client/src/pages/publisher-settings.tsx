import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Globe, 
  Mail, 
  Users, 
  Shield,
  Bell,
  CreditCard,
  Save,
  Upload,
  Link,
  Settings,
  ChevronRight,
  DollarSign,
  BarChart,
  Palette,
  FileText,
  Database,
  Key
} from 'lucide-react';

export default function PublisherSettings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  // Get demo publisher data from localStorage
  const publisherData = JSON.parse(localStorage.getItem('publisher') || '{}');
  
  const [settings, setSettings] = useState({
    // Company Information
    companyName: publisherData.name || 'Demo Publisher',
    subdomain: publisherData.subdomain || 'demo',
    website: 'https://demo-publisher.com',
    industry: 'Financial Services',
    timezone: 'America/New_York',
    
    // Branding
    primaryColor: '#2563eb',
    logo: '',
    favicon: '',
    
    // Email Settings
    defaultFromName: 'Demo Publisher Newsletter',
    defaultFromEmail: 'newsletter@demo-publisher.com',
    replyToEmail: 'hello@demo-publisher.com',
    footerText: '© 2025 Demo Publisher. All rights reserved.',
    
    // Tracking & Analytics
    googleAnalyticsId: '',
    facebookPixelId: '',
    customTrackingDomain: '',
    
    // Subscription Settings
    doubleOptIn: true,
    unsubscribeRequiresConfirmation: false,
    gdprEnabled: true,
    
    // API & Webhooks
    webhookUrl: '',
    apiRateLimit: '1000',
    
    // Billing
    billingEmail: 'billing@demo-publisher.com',
    plan: 'Professional',
    
    // Features
    aiAssistanceEnabled: true,
    customTemplatesEnabled: true,
    advancedSegmentationEnabled: true,
    multiUserEnabled: true
  });

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Settings Saved",
        description: "Your publisher settings have been updated successfully.",
      });
    }, 1000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Publisher Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure your publisher account, branding, and platform preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Basic information about your publishing organization
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                    placeholder="Your Company Name"
                  />
                </div>
                <div>
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="subdomain"
                      value={settings.subdomain}
                      onChange={(e) => setSettings({...settings, subdomain: e.target.value})}
                      placeholder="yourcompany"
                    />
                    <span className="text-sm text-muted-foreground">.sharpsend.io</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={settings.website}
                    onChange={(e) => setSettings({...settings, website: e.target.value})}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={settings.industry} onValueChange={(value) => setSettings({...settings, industry: value})}>
                    <SelectTrigger id="industry">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Financial Services">Financial Services</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="E-commerce">E-commerce</SelectItem>
                      <SelectItem value="Media">Media</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={settings.timezone} onValueChange={(value) => setSettings({...settings, timezone: value})}>
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Brand Settings
              </CardTitle>
              <CardDescription>
                Customize the appearance of your emails and public pages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="primaryColor">Primary Brand Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                    className="w-20 h-10"
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                    placeholder="#2563eb"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="logo">Logo</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG or SVG (max. 2MB)
                  </p>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                  />
                  <Button variant="outline" size="sm" className="mt-4">
                    Choose File
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="favicon">Favicon</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <Input
                    id="favicon"
                    type="file"
                    accept="image/*"
                    className="hidden"
                  />
                  <Button variant="outline" size="sm">
                    Upload Favicon
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                Default settings for your email campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultFromName">Default From Name</Label>
                  <Input
                    id="defaultFromName"
                    value={settings.defaultFromName}
                    onChange={(e) => setSettings({...settings, defaultFromName: e.target.value})}
                    placeholder="Your Newsletter"
                  />
                </div>
                <div>
                  <Label htmlFor="defaultFromEmail">Default From Email</Label>
                  <Input
                    id="defaultFromEmail"
                    type="email"
                    value={settings.defaultFromEmail}
                    onChange={(e) => setSettings({...settings, defaultFromEmail: e.target.value})}
                    placeholder="newsletter@yourdomain.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="replyToEmail">Reply-To Email</Label>
                <Input
                  id="replyToEmail"
                  type="email"
                  value={settings.replyToEmail}
                  onChange={(e) => setSettings({...settings, replyToEmail: e.target.value})}
                  placeholder="hello@yourdomain.com"
                />
              </div>

              <div>
                <Label htmlFor="footerText">Email Footer Text</Label>
                <Textarea
                  id="footerText"
                  value={settings.footerText}
                  onChange={(e) => setSettings({...settings, footerText: e.target.value})}
                  placeholder="© 2025 Your Company. All rights reserved."
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="doubleOptIn">Double Opt-In</Label>
                    <p className="text-sm text-muted-foreground">
                      Require email confirmation for new subscribers
                    </p>
                  </div>
                  <Switch
                    id="doubleOptIn"
                    checked={settings.doubleOptIn}
                    onCheckedChange={(checked) => setSettings({...settings, doubleOptIn: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="unsubscribeConfirm">Unsubscribe Confirmation</Label>
                    <p className="text-sm text-muted-foreground">
                      Require confirmation before unsubscribing
                    </p>
                  </div>
                  <Switch
                    id="unsubscribeConfirm"
                    checked={settings.unsubscribeRequiresConfirmation}
                    onCheckedChange={(checked) => setSettings({...settings, unsubscribeRequiresConfirmation: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="gdpr">GDPR Compliance</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable GDPR compliance features
                    </p>
                  </div>
                  <Switch
                    id="gdpr"
                    checked={settings.gdprEnabled}
                    onCheckedChange={(checked) => setSettings({...settings, gdprEnabled: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="w-5 h-5" />
                Tracking & Analytics
              </CardTitle>
              <CardDescription>
                Configure tracking pixels and analytics integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="googleAnalytics">Google Analytics ID</Label>
                <Input
                  id="googleAnalytics"
                  value={settings.googleAnalyticsId}
                  onChange={(e) => setSettings({...settings, googleAnalyticsId: e.target.value})}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>

              <div>
                <Label htmlFor="facebookPixel">Facebook Pixel ID</Label>
                <Input
                  id="facebookPixel"
                  value={settings.facebookPixelId}
                  onChange={(e) => setSettings({...settings, facebookPixelId: e.target.value})}
                  placeholder="XXXXXXXXXXXXXXXX"
                />
              </div>

              <div>
                <Label htmlFor="customDomain">Custom Tracking Domain</Label>
                <Input
                  id="customDomain"
                  value={settings.customTrackingDomain}
                  onChange={(e) => setSettings({...settings, customTrackingDomain: e.target.value})}
                  placeholder="track.yourdomain.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use your own domain for tracking links to improve deliverability
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                API & Webhooks
              </CardTitle>
              <CardDescription>
                Configure API access and webhook endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>API Key</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value="sk_live_****************************"
                    disabled
                    className="font-mono"
                  />
                  <Button variant="outline" size="sm">
                    Regenerate
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={settings.webhookUrl}
                  onChange={(e) => setSettings({...settings, webhookUrl: e.target.value})}
                  placeholder="https://yourapp.com/webhooks/sharpsend"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Receive real-time events for opens, clicks, and unsubscribes
                </p>
              </div>

              <div>
                <Label htmlFor="rateLimit">API Rate Limit (per hour)</Label>
                <Select value={settings.apiRateLimit} onValueChange={(value) => setSettings({...settings, apiRateLimit: value})}>
                  <SelectTrigger id="rateLimit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 requests</SelectItem>
                    <SelectItem value="500">500 requests</SelectItem>
                    <SelectItem value="1000">1,000 requests</SelectItem>
                    <SelectItem value="5000">5,000 requests</SelectItem>
                    <SelectItem value="10000">10,000 requests</SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Billing & Subscription
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Current Plan</span>
                  <Badge>Professional</Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>• Up to 100,000 subscribers</p>
                  <p>• Unlimited emails</p>
                  <p>• Advanced segmentation</p>
                  <p>• AI-powered features</p>
                </div>
                <Button className="w-full mt-4">
                  Upgrade Plan
                </Button>
              </div>

              <div>
                <Label htmlFor="billingEmail">Billing Email</Label>
                <Input
                  id="billingEmail"
                  type="email"
                  value={settings.billingEmail}
                  onChange={(e) => setSettings({...settings, billingEmail: e.target.value})}
                  placeholder="billing@yourdomain.com"
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Enabled Features</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="aiAssistance">AI Assistance</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable AI-powered content suggestions
                      </p>
                    </div>
                    <Switch
                      id="aiAssistance"
                      checked={settings.aiAssistanceEnabled}
                      onCheckedChange={(checked) => setSettings({...settings, aiAssistanceEnabled: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="customTemplates">Custom Templates</Label>
                      <p className="text-sm text-muted-foreground">
                        Create and save custom email templates
                      </p>
                    </div>
                    <Switch
                      id="customTemplates"
                      checked={settings.customTemplatesEnabled}
                      onCheckedChange={(checked) => setSettings({...settings, customTemplatesEnabled: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="advancedSegmentation">Advanced Segmentation</Label>
                      <p className="text-sm text-muted-foreground">
                        Use AI-powered audience segmentation
                      </p>
                    </div>
                    <Switch
                      id="advancedSegmentation"
                      checked={settings.advancedSegmentationEnabled}
                      onCheckedChange={(checked) => setSettings({...settings, advancedSegmentationEnabled: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="multiUser">Multi-User Access</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow team members to access the account
                      </p>
                    </div>
                    <Switch
                      id="multiUser"
                      checked={settings.multiUserEnabled}
                      onCheckedChange={(checked) => setSettings({...settings, multiUserEnabled: checked})}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}