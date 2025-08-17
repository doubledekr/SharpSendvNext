import React, { useState } from "react";
import OverviewTab from "@/components/dashboard/overview-tab";
import SubscribersTab from "@/components/dashboard/subscribers-tab";
import PersonalizationTab from "@/components/dashboard/personalization-tab";
import AnalyticsTab from "@/components/dashboard/analytics-tab";
import ABTestingTab from "@/components/dashboard/abtesting-tab";
import RevenueTab from "@/components/dashboard/revenue-tab";
import EmailIntegrationsTab from "@/components/dashboard/email-integrations-tab";
import AdvancedTab from "@/components/dashboard/advanced-tab";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import '../styles/design-system.css';

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

interface DashboardProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function Dashboard({ activeTab = 'overview', setActiveTab }: DashboardProps) {
  // Use props if provided, otherwise use local state
  const [localActiveTab, setLocalActiveTab] = useState('overview');
  const currentTab = activeTab || localActiveTab;
  const updateTab = setActiveTab || setLocalActiveTab;

  const renderTabContent = () => {
    switch (currentTab) {
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
        return <EmailIntegrationsTab />;
      case 'advanced':
        return <AdvancedTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen">
      {/* Main Content Area with proper padding to avoid sidebar overlap */}
      <div>
        {/* Header - Content header for the active tab with extra left padding */}
        <header className="bg-slate-800 border-b border-slate-700 px-8 py-6 ml-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{tabTitles[currentTab as keyof typeof tabTitles]}</h2>
              <p className="text-slate-400 mt-1">{tabDescriptions[currentTab as keyof typeof tabDescriptions]}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-slate-700 px-4 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-300">AI Engine: Active</span>
              </div>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  data-testid="button-export-report"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>
          </header>

          {/* Tab Content with proper spacing */}
          <main className="p-8 bg-slate-900 ml-2">
            {renderTabContent()}
          </main>
        </div>
      </div>
  );
}
