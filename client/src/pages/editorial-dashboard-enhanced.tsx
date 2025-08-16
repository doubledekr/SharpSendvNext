import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import NewContentRequestForm from "@/components/new-content-request-form";
import CohortAnalysisDashboard from "@/components/cohort-analysis-dashboard";
import { 
  FileText, 
  Clock, 
  Users, 
  TrendingUp, 
  Plus,
  Eye,
  Zap,
  Calendar,
  User,
  Target,
  AlertCircle,
  CheckCircle,
  Edit,
  BarChart3
} from "lucide-react";
import "../styles/dashboard-improvements.css";

export default function EditorialDashboard() {
  const [activeTab, setActiveTab] = useState("requests");
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);

  // Fetch content requests from API
  const { data: contentRequestsData } = useQuery({
    queryKey: ['/api/content/content-requests'],
    queryFn: async () => {
      const response = await fetch('/api/content/content-requests');
      if (!response.ok) throw new Error('Failed to fetch content requests');
      return response.json();
    },
  });

  // Fetch dashboard stats
  const { data: dashboardStats } = useQuery({
    queryKey: ['/api/content/dashboard/stats'],
    queryFn: async () => {
      const response = await fetch('/api/content/dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return response.json();
    },
  });

  const apiContentRequests = contentRequestsData?.data || [];
  const stats = dashboardStats?.data || {};

  const metrics = [
    {
      title: "Active Requests",
      value: stats.totalRequests?.toString() || "0",
      icon: FileText,
      color: "#3b82f6"
    },
    {
      title: "Pending Review",
      value: stats.pendingReview?.toString() || "0", 
      icon: Clock,
      color: "#f59e0b"
    },
    {
      title: "Total Reach",
      value: stats.totalReach ? `${(stats.totalReach / 1000).toFixed(1)}K` : "0",
      icon: Users,
      color: "#10b981"
    },
    {
      title: "In Progress",
      value: stats.inProgress?.toString() || "0",
      icon: TrendingUp,
      color: "#8b5cf6"
    }
  ];

  const contentRequests = [
    {
      id: 1,
      title: "Weekly Market Outlook - Tech Sector Focus",
      status: "review",
      priority: "high",
      description: "Weekly newsletter focusing on tech sector performance, upcoming earnings, and AI investment opportunities.",
      dueDate: "2025-08-18",
      reach: 15420,
      assignee: "Sarah Chen",
      marketTriggers: ["NVDA earnings", "AI sector momentum", "Tech volatility"]
    },
    {
      id: 2,
      title: "Fed Rate Decision Impact Analysis",
      status: "approved",
      priority: "urgent",
      description: "Immediate analysis of Fed rate decision impact on various asset classes and portfolio recommendations.",
      dueDate: "2025-08-16",
      reach: 28750,
      assignee: "Mike Rodriguez",
      marketTriggers: ["Fed announcement", "Rate decision", "Market volatility"]
    },
    {
      id: 3,
      title: "Q3 Earnings Season Prep Guide",
      status: "in progress",
      priority: "medium",
      description: "Comprehensive guide for Q3 earnings season with key dates, expectations, and trading strategies.",
      dueDate: "2025-08-20",
      reach: 12300,
      assignee: "Sarah Chen",
      marketTriggers: []
    },
    {
      id: 4,
      title: "New Subscriber Welcome Series - Part 3",
      status: "draft",
      priority: "low",
      description: "Third email in welcome series focusing on portfolio diversification strategies.",
      dueDate: "2025-08-22",
      reach: 890,
      assignee: "",
      marketTriggers: []
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "text-green-500 bg-green-500/10 border-green-500/20";
      case "review": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case "in progress": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "draft": return "text-gray-500 bg-gray-500/10 border-gray-500/20";
      default: return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-500 bg-red-500/10 border-red-500/20";
      case "high": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "medium": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case "low": return "text-green-500 bg-green-500/10 border-green-500/20";
      default: return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    }
  };

  const tabs = [
    { id: "requests", label: "Content Requests", count: apiContentRequests.length },
    { id: "review", label: "Review & Approve", count: stats.pendingReview || 0 },
    { id: "cohorts", label: "Cohort Intelligence", count: 0 },
    { id: "sharpening", label: "Email Sharpening", count: 0 }
  ];

  return (
    <div className="dashboard-container p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="dashboard-title">Editorial Dashboard</h1>
        <p className="dashboard-subtitle">Manage content requests, review AI-personalized content, and track campaign performance</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="metric-card-enhanced interactive-element">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="metric-label-enhanced">{metric.title}</p>
                  <p className="metric-value-animated">{metric.value}</p>
                </div>
                <div className="metric-icon-container">
                  <Icon className="metric-icon" style={{ color: metric.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  activeTab === tab.id ? "bg-blue-500" : "bg-slate-600"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          {/* New Request Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Content Requests</h2>
            <button 
              onClick={() => setShowNewRequestForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              data-testid="button-new-request"
            >
              <Plus className="w-4 h-4" />
              New Request
            </button>
          </div>

          {/* Content Request Cards */}
          <div className="space-y-4">
            {(apiContentRequests.length > 0 ? apiContentRequests : contentRequests).map((request) => (
              <div key={request.id} className="chart-card-enhanced">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{request.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                    </div>
                    <p className="text-slate-400 mb-4">{request.description}</p>
                    
                    <div className="flex items-center gap-6 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {request.dueDate || 'No deadline'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>Reach: {(request.reach || request.estimatedReach || 0).toLocaleString()}</span>
                      </div>
                      {request.assignee && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>Assigned: {request.assignee}</span>
                        </div>
                      )}
                    </div>

                    {(request.marketTriggers || []).length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-slate-400 mb-2">Market Triggers:</p>
                        <div className="flex flex-wrap gap-2">
                          {(request.marketTriggers || []).map((trigger, index) => (
                            <span key={index} className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded text-xs">
                              {trigger}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button className="flex items-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    {request.status === "review" && (
                      <button className="flex items-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm">
                        <Zap className="w-4 h-4" />
                        Process with AI
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cohort Intelligence Tab */}
      {activeTab === "cohorts" && (
        <div className="space-y-6">
          <CohortAnalysisDashboard />
        </div>
      )}

      {/* Email Sharpening Tab */}
      {activeTab === "sharpening" && (
        <div className="space-y-6">
          <CohortAnalysisDashboard />
        </div>
      )}

      {/* Other tab content placeholders */}
      {activeTab === "review" && (
        <div className="chart-card-enhanced">
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <h3 className="text-xl font-semibold text-white mb-2">Review & Approve</h3>
            <p className="text-slate-400">Content approval workflow coming soon.</p>
          </div>
        </div>
      )}

      {/* New Content Request Form Modal */}
      {showNewRequestForm && (
        <NewContentRequestForm
          onClose={() => setShowNewRequestForm(false)}
          onSuccess={() => setShowNewRequestForm(false)}
        />
      )}
    </div>
  );
}

