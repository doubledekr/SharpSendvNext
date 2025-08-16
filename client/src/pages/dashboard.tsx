import { useState } from "react";
import Sidebar from "@/components/dashboard/sidebar";
import OverviewTab from "@/components/dashboard/overview-tab";
import SubscribersTab from "@/components/dashboard/subscribers-tab";
import PersonalizationTab from "@/components/dashboard/personalization-tab";
import AnalyticsTab from "@/components/dashboard/analytics-tab";
import ABTestingTab from "@/components/dashboard/abtesting-tab";
import RevenueTab from "@/components/dashboard/revenue-tab";
import EmailTab from "@/components/dashboard/email-tab";
import AdvancedTab from "@/components/dashboard/advanced-tab";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const tabTitles = {
  overview: 'Dashboard Overview',
  subscribers: 'Subscriber Management',
  personalization: 'AI Personalization',
  analytics: 'Analytics Dashboard',
  abtesting: 'A/B Testing Lab',
  revenue: 'Revenue Impact',
  email: 'Email Integration',
  advanced: 'Advanced Features'
};

const tabDescriptions = {
  overview: 'AI-powered newsletter personalization insights',
  subscribers: 'Manage and segment your subscriber base',
  personalization: 'Generate personalized content with AI',
  analytics: 'Detailed performance and engagement analytics',
  abtesting: 'Optimize campaigns with automated testing',
  revenue: 'Calculate ROI and revenue projections',
  email: 'Connect and manage email platform integrations',
  advanced: 'Advanced AI configuration and system monitoring'
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'subscribers':
        return <SubscribersTab />;
      case 'personalization':
        return <PersonalizationTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'abtesting':
        return <ABTestingTab />;
      case 'revenue':
        return <RevenueTab />;
      case 'email':
        return <EmailTab />;
      case 'advanced':
        return <AdvancedTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-bg text-slate-100">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 ml-64 overflow-auto">
        {/* Header */}
        <header className="bg-dark-surface border-b border-dark-border px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{tabTitles[activeTab as keyof typeof tabTitles]}</h2>
              <p className="text-slate-400 mt-1">{tabDescriptions[activeTab as keyof typeof tabDescriptions]}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-dark-bg px-4 py-2 rounded-lg">
                <div className="w-2 h-2 bg-brand-green rounded-full"></div>
                <span className="text-sm text-slate-300">AI Engine: Active</span>
              </div>
              <Button 
                className="bg-brand-blue hover:bg-blue-700 text-white font-medium"
                data-testid="button-export-report"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <main className="p-8">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}
