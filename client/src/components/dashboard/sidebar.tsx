import { Brain, User } from "lucide-react";
import { 
  ChartLine, 
  Users, 
  Wand2, 
  BarChart3, 
  FlaskConical, 
  DollarSign, 
  Mail, 
  Settings,
  Server,
  BookOpen,
  HelpCircle,
  Code,
  FileText,
  Database,
  LogOut,
  CreditCard,
  UserCircle,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationItems = [
  { id: 'overview', label: 'Overview', icon: ChartLine },
  { id: 'subscribers', label: 'Subscribers', icon: Users },
  { id: 'personalization', label: 'Personalization', icon: Wand2 },
  { id: 'campaigns', label: 'Campaign Projects', icon: Settings, isExternal: true, path: '/campaigns' },
  { id: 'internal', label: 'Internal System', icon: Database, isExternal: true, path: '/internal' },
  { id: 'analytics', label: 'Analytics & Insights', icon: BarChart3 },
  { id: 'abtesting', label: 'A/B Testing', icon: FlaskConical },
  { id: 'revenue', label: 'Revenue Impact', icon: DollarSign },
  { id: 'email', label: 'Email Integration', icon: Mail },
  { id: 'advanced', label: 'Advanced Features', icon: Settings },
];

const analyticsSubmenu = [
  { id: 'cohort-analytics', label: 'Cohort Analytics', icon: TrendingUp, path: '/analytics' },
  { id: 'comparative', label: 'Comparative Analysis', icon: BarChart3, path: '/comparative-analytics' },
  { id: 'intelligence', label: 'SharpSend Intelligence', icon: Brain, path: '/intelligence' },
];

const emailIntegrationItems = [
  { id: 'email-platforms', label: 'Platform Status', icon: Server, path: '/email-platforms', badge: '99.95%' },
];

const helpItems = [
  { id: 'documentation', label: 'Documentation', icon: BookOpen },
  { id: 'api', label: 'API Reference', icon: Code },
  { id: 'faq', label: 'FAQ & Help', icon: HelpCircle },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-dark-surface border-r border-dark-border fixed h-[calc(100vh-4rem)] overflow-y-auto top-16 shadow-xl">
      {/* Logo Section - Now a simplified version since main logo is in header */}
      <div className="p-4 border-b border-dark-border bg-slate-800/50">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-8 bg-gradient-to-b from-brand-blue to-blue-600 rounded-full"></div>
          <div>
            <p className="text-sm font-semibold text-white">Navigation</p>
            <p className="text-xs text-slate-400">Dashboard Menu</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          if ((item as any).isExternal) {
            return (
              <Link key={item.id} href={(item as any).path || "/campaigns"}>
                <Button
                  variant="ghost"
                  className="w-full justify-start space-x-3 px-4 py-3 rounded-lg transition-colors text-slate-300 hover:bg-slate-700"
                  data-testid={`button-tab-${item.id}`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          }

          if (item.id === 'analytics') {
            return (
              <div key={item.id}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-brand-blue text-white hover:bg-brand-blue' 
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                  onClick={() => onTabChange(item.id)}
                  data-testid={`button-tab-${item.id}`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Button>
                {/* Analytics Submenu */}
                {isActive && (
                  <div className="ml-4 mt-2 space-y-1">
                    {analyticsSubmenu.map((subItem) => {
                      const SubIcon = subItem.icon;
                      return (
                        <Link key={subItem.id} href={subItem.path}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start space-x-2 px-3 py-2 text-sm rounded-lg transition-colors text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                          >
                            <SubIcon className="h-4 w-4" />
                            <span className="flex-1">{subItem.label}</span>
                          </Button>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          if (item.id === 'email') {
            return (
              <div key={item.id}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-brand-blue text-white hover:bg-brand-blue' 
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                  onClick={() => onTabChange(item.id)}
                  data-testid={`button-tab-${item.id}`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Button>
                {/* Email Integration Submenu */}
                {isActive && (
                  <div className="ml-4 mt-2 space-y-1">
                    {emailIntegrationItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      return (
                        <Link key={subItem.id} href={subItem.path}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start space-x-2 px-3 py-2 text-sm rounded-lg transition-colors text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                          >
                            <SubIcon className="h-4 w-4" />
                            <span className="flex-1">{subItem.label}</span>
                            {subItem.badge && (
                              <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                                {subItem.badge}
                              </span>
                            )}
                          </Button>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Button
              key={item.id}
              variant="ghost"
              className={`w-full justify-start space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-brand-blue text-white hover:bg-brand-blue' 
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
              onClick={() => onTabChange(item.id)}
              data-testid={`button-tab-${item.id}`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Button>
          );
        })}
      </nav>

      {/* Documentation Section */}
      <div className="p-4 border-t border-dark-border mt-auto">
        <p className="text-xs text-slate-500 uppercase font-semibold mb-3">Resources</p>
        <div className="space-y-1">
          <Link href="/documentation">
            <Button
              variant="ghost"
              className="w-full justify-start space-x-2 px-3 py-2 text-sm rounded-lg transition-colors text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            >
              <BookOpen className="h-4 w-4" />
              <span>Documentation</span>
            </Button>
          </Link>
          {helpItems.filter(item => item.id !== 'documentation').map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.id} href="/documentation">
                <Button
                  variant="ghost"
                  className="w-full justify-start space-x-2 px-3 py-2 text-sm rounded-lg transition-colors text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* User Profile Section */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-dark-border bg-dark-surface">
        <Link href="/profile">
          <div className="p-4 hover:bg-slate-800 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">JD</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">John Doe</p>
                <p className="text-xs text-slate-400">Enterprise Plan</p>
              </div>
              <UserCircle className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </Link>
        
        <div className="px-4 pb-3 space-y-1">
          <Link href="/profile?tab=subscription">
            <Button
              variant="ghost"
              className="w-full justify-start space-x-2 px-3 py-2 text-sm rounded-lg transition-colors text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            >
              <CreditCard className="h-4 w-4" />
              <span>Subscription & Billing</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start space-x-2 px-3 py-2 text-sm rounded-lg transition-colors text-slate-400 hover:bg-red-900/20 hover:text-red-400"
            onClick={() => {
              // Handle logout
              localStorage.clear();
              window.location.href = '/login';
            }}
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
}