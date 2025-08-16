import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NavigationHeader from "@/components/dashboard/navigation-header";
import Sidebar from "@/components/dashboard/sidebar";
import {
  User,
  CreditCard,
  Settings,
  Shield,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  ChevronRight,
  Check,
  AlertCircle,
  Download,
  Upload
} from "lucide-react";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("account");
  const [sidebarTab, setSidebarTab] = useState("overview");
  
  const subscriptionData = {
    plan: "Enterprise",
    price: "$799/month",
    nextBilling: "February 1, 2025",
    cohorts: "Unlimited",
    emailsIncluded: "20,000/month",
    currentUsage: "14,235",
    overageRate: "$0.08/email",
    status: "active"
  };

  const billingHistory = [
    { date: "Jan 1, 2025", amount: "$799.00", status: "Paid", invoice: "#INV-2025-001" },
    { date: "Dec 1, 2024", amount: "$852.40", status: "Paid", invoice: "#INV-2024-012", overage: "$53.40" },
    { date: "Nov 1, 2024", amount: "$799.00", status: "Paid", invoice: "#INV-2024-011" },
    { date: "Oct 1, 2024", amount: "$921.20", status: "Paid", invoice: "#INV-2024-010", overage: "$122.20" },
  ];

  const accountInfo = {
    name: "John Doe",
    email: "john.doe@financialpublisher.com",
    company: "Financial Insights Weekly",
    role: "Marketing Director",
    timezone: "America/New_York",
    joinDate: "March 15, 2024",
    apiKey: "sk_live_******************************3f9a",
    twoFactorEnabled: true
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <NavigationHeader currentPage="profile" />
      
      <div className="flex">
        <Sidebar activeTab={sidebarTab} onTabChange={setSidebarTab} />
        
        <div className="flex-1 ml-64 px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Account & Profile</h1>
          <p className="text-slate-400">Manage your account settings, subscription, and billing</p>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="account">
              <User className="mr-2 h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <CreditCard className="mr-2 h-4 w-4" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="billing">
              <DollarSign className="mr-2 h-4 w-4" />
              Billing History
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Account Information</CardTitle>
                <CardDescription>Update your personal and company details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-slate-300">Full Name</Label>
                    <Input 
                      defaultValue={accountInfo.name}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Email Address</Label>
                    <Input 
                      type="email"
                      defaultValue={accountInfo.email}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Company</Label>
                    <Input 
                      defaultValue={accountInfo.company}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Role</Label>
                    <Input 
                      defaultValue={accountInfo.role}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Timezone</Label>
                    <select className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white mt-2">
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-slate-300">Member Since</Label>
                    <div className="flex items-center mt-2 text-slate-400">
                      <Calendar className="h-4 w-4 mr-2" />
                      {accountInfo.joinDate}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <div className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">Current Plan</CardTitle>
                      <CardDescription>Enterprise subscription details</CardDescription>
                    </div>
                    <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400">Plan Type</span>
                        <TrendingUp className="h-4 w-4 text-blue-400" />
                      </div>
                      <p className="text-2xl font-bold text-white">{subscriptionData.plan}</p>
                      <p className="text-sm text-slate-400 mt-1">{subscriptionData.price}</p>
                    </div>
                    
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400">Email Usage</span>
                        <Mail className="h-4 w-4 text-purple-400" />
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {parseInt(subscriptionData.currentUsage).toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        of {subscriptionData.emailsIncluded}
                      </p>
                      <div className="w-full bg-slate-600 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: '71%' }}
                        />
                      </div>
                    </div>
                    
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400">Next Billing</span>
                        <Calendar className="h-4 w-4 text-green-400" />
                      </div>
                      <p className="text-2xl font-bold text-white">Feb 1</p>
                      <p className="text-sm text-slate-400 mt-1">
                        {subscriptionData.nextBilling}
                      </p>
                    </div>
                  </div>

                  <Alert className="bg-slate-700 border-slate-600">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-slate-300">
                      Overage charges: {subscriptionData.overageRate} per email after {subscriptionData.emailsIncluded}
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-3 mt-6">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Upgrade Plan
                    </Button>
                    <Button variant="outline" className="border-slate-600 text-slate-300">
                      Change Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Enterprise Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "Unlimited cohorts",
                      "20,000 emails/month included",
                      "AI content generation",
                      "Multi-platform redundancy",
                      "Advanced analytics",
                      "Priority support",
                      "Custom integrations",
                      "API access",
                      "White-label options",
                      "Dedicated success manager"
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-400" />
                        <span className="text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Billing History Tab */}
          <TabsContent value="billing">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Billing History</CardTitle>
                <CardDescription>Download invoices and view payment history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {billingHistory.map((bill, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{bill.invoice}</p>
                          <p className="text-sm text-slate-400">{bill.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-white font-medium">{bill.amount}</p>
                          {bill.overage && (
                            <p className="text-xs text-yellow-400">
                              Includes {bill.overage} overage
                            </p>
                          )}
                        </div>
                        <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                          {bill.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Payment Method</p>
                      <p className="text-sm text-slate-400">Visa ending in 4242</p>
                    </div>
                    <Button variant="outline" className="border-slate-600 text-slate-300">
                      Update Card
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Security Settings</CardTitle>
                <CardDescription>Manage your account security and API access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-white font-medium mb-4">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-green-400" />
                      <div>
                        <p className="text-white">2FA Status</p>
                        <p className="text-sm text-slate-400">Extra security for your account</p>
                      </div>
                    </div>
                    <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                      Enabled
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-4">API Key</h3>
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <code className="text-slate-300 text-sm">{accountInfo.apiKey}</code>
                      <Button variant="ghost" size="sm">
                        Regenerate
                      </Button>
                    </div>
                    <Alert className="bg-slate-600 border-slate-500">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-slate-300 text-xs">
                        Keep your API key secure. Never share it or commit it to version control.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-4">Password</h3>
                  <Button variant="outline" className="border-slate-600 text-slate-300">
                    Change Password
                  </Button>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-4">Login Activity</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded">
                      <span className="text-slate-300">Last login</span>
                      <span className="text-slate-400">Today at 9:45 AM from New York</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded">
                      <span className="text-slate-300">Previous login</span>
                      <span className="text-slate-400">Yesterday at 3:22 PM from New York</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
}