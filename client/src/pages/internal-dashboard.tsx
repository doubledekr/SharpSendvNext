import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import NavigationHeader from "@/components/dashboard/navigation-header";
import { 
  Users, 
  Mail, 
  Clock, 
  Send, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Filter,
  Search,
  Tag,
  TrendingUp,
  Activity,
  Zap,
  Eye,
  Archive,
  Database
} from "lucide-react";
import { format } from "date-fns";

interface Segment {
  id: string;
  name: string;
  userCount: number;
  tags: string[];
  lastActive: string;
  engagementScore: number;
}

interface User {
  id: string;
  email: string;
  segment: string;
  cohort: string;
  subscribedDate: string;
  lastActive: string;
  status: 'active' | 'inactive' | 'churned';
  engagementScore: number;
}

interface EmailSend {
  id: string;
  campaign: string;
  segment: string;
  status: 'sent' | 'pending' | 'failed' | 'scheduled';
  sentAt?: string;
  scheduledFor?: string;
  recipients: number;
  opens: number;
  clicks: number;
  platform: string;
}

interface EventTrigger {
  id: string;
  name: string;
  type: 'market' | 'behavior' | 'time' | 'segment';
  condition: string;
  action: string;
  status: 'active' | 'paused';
  lastTriggered?: string;
  triggerCount: number;
}

export default function InternalDashboard() {
  const [activeTab, setActiveTab] = useState("segments");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Mock data - replace with actual API calls
  const segments: Segment[] = [
    {
      id: "1",
      name: "Day Traders",
      userCount: 3420,
      tags: ["active", "high-value", "options"],
      lastActive: "2 hours ago",
      engagementScore: 92
    },
    {
      id: "2",
      name: "Long-term Investors",
      userCount: 5680,
      tags: ["value", "dividend", "passive"],
      lastActive: "1 day ago",
      engagementScore: 78
    },
    {
      id: "3",
      name: "Options Traders",
      userCount: 2150,
      tags: ["advanced", "volatility", "premium"],
      lastActive: "30 minutes ago",
      engagementScore: 88
    },
    {
      id: "4",
      name: "Crypto Enthusiasts",
      userCount: 1890,
      tags: ["crypto", "defi", "altcoins"],
      lastActive: "4 hours ago",
      engagementScore: 85
    }
  ];

  const users: User[] = [
    {
      id: "1",
      email: "john.trader@example.com",
      segment: "Day Traders",
      cohort: "Q1 2025",
      subscribedDate: "2025-01-15",
      lastActive: "2025-08-16",
      status: "active",
      engagementScore: 95
    },
    {
      id: "2",
      email: "sarah.investor@example.com",
      segment: "Long-term Investors",
      cohort: "Q4 2024",
      subscribedDate: "2024-11-20",
      lastActive: "2025-08-15",
      status: "active",
      engagementScore: 82
    },
    {
      id: "3",
      email: "mike.options@example.com",
      segment: "Options Traders",
      cohort: "Q1 2025",
      subscribedDate: "2025-02-01",
      lastActive: "2025-08-16",
      status: "active",
      engagementScore: 91
    },
    {
      id: "4",
      email: "inactive.user@example.com",
      segment: "Day Traders",
      cohort: "Q3 2024",
      subscribedDate: "2024-07-10",
      lastActive: "2025-06-01",
      status: "churned",
      engagementScore: 25
    }
  ];

  const emailSends: EmailSend[] = [
    {
      id: "1",
      campaign: "Market Alert: NASDAQ Breakout",
      segment: "Day Traders",
      status: "sent",
      sentAt: "2025-08-16T10:30:00Z",
      recipients: 3420,
      opens: 2890,
      clicks: 485,
      platform: "SendGrid"
    },
    {
      id: "2",
      campaign: "Weekly Dividend Report",
      segment: "Long-term Investors",
      status: "scheduled",
      scheduledFor: "2025-08-17T09:00:00Z",
      recipients: 5680,
      opens: 0,
      clicks: 0,
      platform: "Mailchimp"
    },
    {
      id: "3",
      campaign: "Options Expiry Alert",
      segment: "Options Traders",
      status: "pending",
      recipients: 2150,
      opens: 0,
      clicks: 0,
      platform: "ExactTarget"
    },
    {
      id: "4",
      campaign: "Crypto Market Update",
      segment: "Crypto Enthusiasts",
      status: "failed",
      sentAt: "2025-08-16T08:00:00Z",
      recipients: 1890,
      opens: 0,
      clicks: 0,
      platform: "Mailgun"
    }
  ];

  const eventTriggers: EventTrigger[] = [
    {
      id: "1",
      name: "VIX Spike Alert",
      type: "market",
      condition: "VIX > 25",
      action: "Send volatility alert email",
      status: "active",
      lastTriggered: "2025-08-15T14:30:00Z",
      triggerCount: 12
    },
    {
      id: "2",
      name: "New Subscriber Welcome",
      type: "behavior",
      condition: "User subscribes",
      action: "Send welcome series",
      status: "active",
      lastTriggered: "2025-08-16T11:00:00Z",
      triggerCount: 156
    },
    {
      id: "3",
      name: "Earnings Season Reminder",
      type: "time",
      condition: "3 days before earnings",
      action: "Send earnings preview",
      status: "active",
      lastTriggered: "2025-08-14T06:00:00Z",
      triggerCount: 8
    },
    {
      id: "4",
      name: "Churn Prevention",
      type: "segment",
      condition: "Engagement < 30%",
      action: "Send re-engagement campaign",
      status: "paused",
      lastTriggered: "2025-08-10T12:00:00Z",
      triggerCount: 42
    }
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active':
      case 'sent':
        return 'bg-green-500';
      case 'pending':
      case 'scheduled':
        return 'bg-yellow-500';
      case 'failed':
      case 'churned':
      case 'paused':
        return 'bg-red-500';
      case 'inactive':
        return 'bg-gray-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'active':
      case 'sent':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'pending':
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'failed':
      case 'churned':
      case 'paused':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <NavigationHeader currentPage="internal" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Internal System Dashboard</h1>
          <p className="text-slate-400">Manage segments, users, email sends, and triggers</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">13,140</p>
                  <p className="text-green-400 text-xs mt-1">+12% this month</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Segments</p>
                  <p className="text-2xl font-bold text-white">{segments.length}</p>
                  <p className="text-slate-400 text-xs mt-1">All optimized</p>
                </div>
                <Tag className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Emails Today</p>
                  <p className="text-2xl font-bold text-white">8,942</p>
                  <p className="text-green-400 text-xs mt-1">98.7% delivered</p>
                </div>
                <Mail className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Triggers</p>
                  <p className="text-2xl font-bold text-white">12</p>
                  <p className="text-yellow-400 text-xs mt-1">3 triggered today</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800 border-slate-700 mb-6">
            <TabsTrigger value="segments" data-testid="tab-segments">
              <Tag className="mr-2 h-4 w-4" />
              Segments
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="mr-2 h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="sends" data-testid="tab-sends">
              <Mail className="mr-2 h-4 w-4" />
              Email Sends
            </TabsTrigger>
            <TabsTrigger value="triggers" data-testid="tab-triggers">
              <Zap className="mr-2 h-4 w-4" />
              Event Triggers
            </TabsTrigger>
          </TabsList>

          {/* Segments Tab */}
          <TabsContent value="segments">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Segment Management</CardTitle>
                    <CardDescription>Categorize and manage user segments</CardDescription>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Tag className="mr-2 h-4 w-4" />
                    Create Segment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {segments.map((segment) => (
                    <div key={segment.id} className="p-4 bg-slate-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{segment.name}</h3>
                            <p className="text-slate-400 text-sm">{segment.userCount.toLocaleString()} users</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-slate-400 text-sm">Engagement</p>
                            <p className="text-white font-semibold">{segment.engagementScore}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-400 text-sm">Last Active</p>
                            <p className="text-white text-sm">{segment.lastActive}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        {segment.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="bg-slate-600">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">User Management</CardTitle>
                    <CardDescription>View and manage individual users</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Search users..." 
                      className="w-64 bg-slate-700 border-slate-600 text-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                      <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Segments</SelectItem>
                        {segments.map((segment) => (
                          <SelectItem key={segment.id} value={segment.name}>
                            {segment.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-400">Email</TableHead>
                      <TableHead className="text-slate-400">Segment</TableHead>
                      <TableHead className="text-slate-400">Cohort</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Engagement</TableHead>
                      <TableHead className="text-slate-400">Last Active</TableHead>
                      <TableHead className="text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users
                      .filter(user => 
                        (selectedSegment === "all" || user.segment === selectedSegment) &&
                        (searchTerm === "" || user.email.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .map((user) => (
                        <TableRow key={user.id} className="border-slate-700">
                          <TableCell className="text-white font-medium">{user.email}</TableCell>
                          <TableCell className="text-slate-300">{user.segment}</TableCell>
                          <TableCell className="text-slate-300">{user.cohort}</TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(user.status)} text-white`}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">{user.engagementScore}%</TableCell>
                          <TableCell className="text-slate-300">
                            {format(new Date(user.lastActive), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Sends Tab */}
          <TabsContent value="sends">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Email Send History</CardTitle>
                    <CardDescription>Track past and pending email campaigns</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" className="border-slate-600 text-slate-300">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emailSends
                    .filter(send => selectedStatus === "all" || send.status === selectedStatus)
                    .map((send) => (
                      <div key={send.id} className="p-4 bg-slate-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(send.status)} bg-opacity-20`}>
                              {getStatusIcon(send.status)}
                            </div>
                            <div>
                              <h4 className="text-white font-medium">{send.campaign}</h4>
                              <p className="text-slate-400 text-sm">
                                {send.segment} • {send.recipients.toLocaleString()} recipients • {send.platform}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            {send.status === 'sent' && (
                              <>
                                <div className="text-center">
                                  <p className="text-slate-400 text-xs">Opens</p>
                                  <p className="text-white font-semibold">
                                    {((send.opens / send.recipients) * 100).toFixed(1)}%
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-slate-400 text-xs">Clicks</p>
                                  <p className="text-white font-semibold">
                                    {((send.clicks / send.recipients) * 100).toFixed(1)}%
                                  </p>
                                </div>
                              </>
                            )}
                            <Badge className={`${getStatusColor(send.status)} text-white`}>
                              {send.status}
                            </Badge>
                            <div className="text-right">
                              <p className="text-slate-400 text-xs">
                                {send.status === 'scheduled' ? 'Scheduled for' : 
                                 send.status === 'sent' ? 'Sent at' : 'Status'}
                              </p>
                              <p className="text-white text-sm">
                                {send.sentAt ? format(new Date(send.sentAt), 'MMM d, h:mm a') :
                                 send.scheduledFor ? format(new Date(send.scheduledFor), 'MMM d, h:mm a') :
                                 'Pending'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Event Triggers Tab */}
          <TabsContent value="triggers">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Event Triggers</CardTitle>
                    <CardDescription>Automated email triggers based on events</CardDescription>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Zap className="mr-2 h-4 w-4" />
                    Create Trigger
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {eventTriggers.map((trigger) => (
                    <div key={trigger.id} className="p-4 bg-slate-700 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            trigger.type === 'market' ? 'bg-purple-600' :
                            trigger.type === 'behavior' ? 'bg-blue-600' :
                            trigger.type === 'time' ? 'bg-green-600' : 'bg-orange-600'
                          }`}>
                            <Zap className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{trigger.name}</h4>
                            <Badge variant="outline" className="text-xs mt-1">
                              {trigger.type}
                            </Badge>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(trigger.status)} text-white`}>
                          {trigger.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Condition:</span>
                          <span className="text-slate-300">{trigger.condition}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Action:</span>
                          <span className="text-slate-300">{trigger.action}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Trigger Count:</span>
                          <span className="text-white font-medium">{trigger.triggerCount}</span>
                        </div>
                        {trigger.lastTriggered && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Last Triggered:</span>
                            <span className="text-slate-300">
                              {format(new Date(trigger.lastTriggered), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                          {trigger.status === 'active' ? 'Pause' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}