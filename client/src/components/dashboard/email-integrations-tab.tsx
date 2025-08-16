import React, { useState } from "react";
import { 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Settings, 
  BarChart3,
  Zap,
  Link as LinkIcon,
  Eye,
  TestTube,
  Shield,
  Activity
} from "lucide-react";
import "../../styles/dashboard-improvements.css";

export default function EmailIntegrationsTab() {
  const [activeProvider, setActiveProvider] = useState("overview");

  const integrationMetrics = [
    {
      title: "Connected Providers",
      value: "3",
      icon: CheckCircle,
      color: "#10b981"
    },
    {
      title: "Total Emails Sent",
      value: "89.2K",
      icon: Mail,
      color: "#3b82f6"
    },
    {
      title: "Delivery Rate",
      value: "98.7%",
      icon: Activity,
      color: "#8b5cf6"
    },
    {
      title: "Last Sync",
      value: "2 min ago",
      icon: Zap,
      color: "#f59e0b"
    }
  ];

  const emailProviders = [
    {
      id: "brevo",
      name: "Brevo",
      logo: "📧",
      status: "connected",
      isPrimary: true,
      stats: {
        sent: 15420,
        deliveryRate: 98.7,
        openRate: 74.2,
        clickRate: 16.8
      },
      config: {
        apiKey: "xkeysib-••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••",
        senderEmail: "newsletter@sharpsend.com",
        senderName: "SharpSend Newsletter",
        listId: "2"
      }
    },
    {
      id: "exacttarget",
      name: "ExactTarget / Marketing Cloud",
      logo: "☁️",
      status: "connected",
      isPrimary: false,
      stats: {
        sent: 8950,
        deliveryRate: 98.2,
        openRate: 69.8,
        clickRate: 14.2
      },
      config: {
        clientId: "••••••••••••••••••••••••••••••••",
        clientSecret: "••••••••••••••••••••••••••••••••",
        subdomain: "mc563885gzs27c5t9-63k636ttgm",
        senderEmail: "alerts@sharpsend.com"
      }
    },
    {
      id: "sendgrid",
      name: "SendGrid",
      logo: "📨",
      status: "connected",
      isPrimary: false,
      stats: {
        sent: 12300,
        deliveryRate: 99.1,
        openRate: 71.5,
        clickRate: 15.3
      },
      config: {
        apiKey: "SG.••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••",
        senderEmail: "updates@sharpsend.com",
        senderName: "SharpSend Updates"
      }
    },
    {
      id: "mailgun",
      name: "Mailgun",
      logo: "🔫",
      status: "available",
      isPrimary: false,
      stats: {
        sent: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0
      },
      config: {}
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "text-green-500 bg-green-500/10 border-green-500/20";
      case "available": return "text-slate-500 bg-slate-500/10 border-slate-500/20";
      case "error": return "text-red-500 bg-red-500/10 border-red-500/20";
      default: return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", count: 0 },
    { id: "brevo", label: "Brevo", count: 0 },
    { id: "exacttarget", label: "ExactTarget", count: 0 },
    { id: "sendgrid", label: "SendGrid", count: 0 }
  ];

  return (
    <div className="space-y-8">
      {/* Integration Metrics */}
      <div className="metrics-grid">
        {integrationMetrics.map((metric, index) => {
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
              onClick={() => setActiveProvider(tab.id)}
              className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                activeProvider === tab.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {activeProvider === "overview" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">Email Provider Overview</h2>

          {/* Provider Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {emailProviders.map((provider) => (
              <div key={provider.id} className="chart-card-enhanced">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{provider.logo}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        {provider.name}
                        {provider.isPrimary && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                            Primary
                          </span>
                        )}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {provider.status === 'connected' ? 'Connected & Active' : 'Available for Setup'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(provider.status)}`}>
                    {provider.status}
                  </span>
                </div>

                {provider.status === 'connected' && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-slate-400 text-sm">Emails Sent</p>
                      <p className="text-white font-semibold">{provider.stats.sent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Delivery Rate</p>
                      <p className="text-white font-semibold">{provider.stats.deliveryRate}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Open Rate</p>
                      <p className="text-white font-semibold">{provider.stats.openRate}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Click Rate</p>
                      <p className="text-white font-semibold">{provider.stats.clickRate}%</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {provider.status === 'connected' ? (
                    <>
                      <button 
                        onClick={() => setActiveProvider(provider.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                      >
                        <Settings className="w-4 h-4" />
                        Configure
                      </button>
                      <button className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm">
                        <TestTube className="w-4 h-4" />
                        Test Connection
                      </button>
                    </>
                  ) : (
                    <button className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                      <LinkIcon className="w-4 h-4" />
                      Connect
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Provider Configuration */}
      {activeProvider !== "overview" && (
        <div className="space-y-6">
          {(() => {
            const provider = emailProviders.find(p => p.id === activeProvider);
            if (!provider) return null;

            return (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-3xl">{provider.logo}</div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white">{provider.name}</h2>
                    <p className="text-slate-400">Configure your {provider.name} integration settings</p>
                  </div>
                </div>

                {/* Performance Stats */}
                {provider.status === 'connected' && (
                  <div className="chart-card-enhanced mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Performance Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{provider.stats.sent.toLocaleString()}</p>
                        <p className="text-slate-400 text-sm">Emails Sent</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">{provider.stats.deliveryRate}%</p>
                        <p className="text-slate-400 text-sm">Delivery Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-400">{provider.stats.openRate}%</p>
                        <p className="text-slate-400 text-sm">Open Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-400">{provider.stats.clickRate}%</p>
                        <p className="text-slate-400 text-sm">Click Rate</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Configuration Form */}
                <div className="chart-card-enhanced">
                  <h3 className="text-lg font-semibold text-white mb-4">Configuration Settings</h3>
                  <div className="space-y-4">
                    {Object.entries(provider.config).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                        </label>
                        <input
                          type={key.includes('secret') || key.includes('key') ? 'password' : 'text'}
                          value={value as string}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          readOnly
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                      <Settings className="w-4 h-4" />
                      Update Configuration
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                      <TestTube className="w-4 h-4" />
                      Test Connection
                    </button>
                    {provider.status === 'connected' && (
                      <button className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors">
                        <Shield className="w-4 h-4" />
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

