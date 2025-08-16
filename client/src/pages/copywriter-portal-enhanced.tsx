import React, { useState } from "react";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Star,
  Calendar,
  User,
  Target,
  AlertCircle,
  Edit,
  Send,
  Eye,
  Brain,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Lightbulb
} from "lucide-react";
import "../styles/dashboard-improvements.css";

export default function CopywriterPortal() {
  const [activeTab, setActiveTab] = useState("tasks");

  const metrics = [
    {
      title: "Assigned Tasks",
      value: "3",
      icon: FileText,
      color: "#3b82f6"
    },
    {
      title: "In Progress",
      value: "1",
      icon: Clock,
      color: "#f59e0b"
    },
    {
      title: "Completed",
      value: "12",
      icon: CheckCircle,
      color: "#10b981"
    },
    {
      title: "Avg Rating",
      value: "4.8",
      icon: Star,
      color: "#8b5cf6"
    }
  ];

  const tasks = [
    {
      id: 1,
      title: "Weekly Market Outlook - Tech Sector Focus",
      status: "in progress",
      priority: "high",
      description: "Create engaging newsletter content focusing on tech sector performance and AI investment opportunities. Target growth-focused investors with actionable insights.",
      dueDate: "2025-08-18",
      reach: 15420,
      assignedBy: "Jennifer Martinez",
      marketContext: ["NVDA earnings beat expectations", "AI sector momentum building", "Tech volatility creating opportunities"],
      aiSuggestions: [
        "Include specific NVIDIA earnings data for credibility",
        "Mention AI infrastructure plays beyond NVIDIA",
        "Add risk management section for volatile tech positions"
      ]
    },
    {
      id: 2,
      title: "Fed Rate Decision Impact Analysis",
      status: "assigned",
      priority: "urgent",
      description: "Immediate analysis needed for Fed rate decision impact. Focus on portfolio positioning and asset class recommendations. Needs to be sent within 2 hours of Fed announcement.",
      dueDate: "2025-08-16",
      reach: 28750,
      assignedBy: "Jennifer Martinez",
      marketContext: ["Fed meeting concludes today", "Market expects 25bp cut", "Bond yields showing volatility"],
      aiSuggestions: [
        "Prepare multiple scenarios (cut/hold/hike)",
        "Focus on sector rotation implications",
        "Include immediate action items for subscribers"
      ]
    },
    {
      id: 3,
      title: "Q3 Earnings Season Prep Guide",
      status: "assigned",
      priority: "medium",
      description: "Comprehensive guide for Q3 earnings season with key dates, expectations, and trading strategies. Target active traders and earnings-focused subscribers.",
      dueDate: "2025-08-20",
      reach: 12300,
      assignedBy: "Jennifer Martinez",
      marketContext: ["Q3 earnings season starting", "Key tech earnings this week", "Market volatility expected"],
      aiSuggestions: [
        "Create earnings calendar with key dates",
        "Include historical earnings reaction patterns",
        "Add options strategies for earnings plays"
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-500 bg-green-500/10 border-green-500/20";
      case "in progress": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "assigned": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case "review": return "text-purple-500 bg-purple-500/10 border-purple-500/20";
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
    { id: "tasks", label: "My Tasks", count: 3 },
    { id: "drafts", label: "Drafts", count: 2 },
    { id: "completed", label: "Completed", count: 12 },
    { id: "ai-assistant", label: "AI Assistant", count: 0 }
  ];

  return (
    <div className="dashboard-container p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="dashboard-title">Copywriter Portal</h1>
        <p className="dashboard-subtitle">Manage your content assignments, collaborate with AI, and track your performance</p>
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
      {activeTab === "tasks" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">My Tasks</h2>

          {/* Task Cards */}
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="chart-card-enhanced">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-slate-400 mb-4">{task.description}</p>
                    
                    <div className="flex items-center gap-6 text-sm text-slate-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {task.dueDate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>Reach: {task.reach.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>From: {task.assignedBy}</span>
                      </div>
                    </div>

                    {/* Market Context */}
                    {task.marketContext && task.marketContext.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-slate-400 mb-2 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          Market Context:
                        </p>
                        <div className="space-y-1">
                          {task.marketContext.map((context, index) => (
                            <div key={index} className="text-sm text-slate-300 bg-slate-700/30 px-3 py-2 rounded">
                              {context}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Suggestions */}
                    {task.aiSuggestions && task.aiSuggestions.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-slate-400 mb-2 flex items-center gap-1">
                          <Brain className="w-4 h-4" />
                          AI Suggestions:
                        </p>
                        <div className="space-y-1">
                          {task.aiSuggestions.map((suggestion, index) => (
                            <div key={index} className="text-sm text-slate-300 bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {task.status === "in progress" ? (
                      <button className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm">
                        <Edit className="w-4 h-4" />
                        Continue
                      </button>
                    ) : (
                      <button className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                        <FileText className="w-4 h-4" />
                        Start Writing
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other tab content placeholders */}
      {activeTab !== "tasks" && (
        <div className="chart-card-enhanced">
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </h3>
            <p className="text-slate-400">Content for this section is coming soon.</p>
          </div>
        </div>
      )}
    </div>
  );
}

