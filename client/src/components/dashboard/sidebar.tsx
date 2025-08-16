import { Brain, User } from "lucide-react";
import { 
  ChartLine, 
  Users, 
  Wand2, 
  BarChart3, 
  FlaskConical, 
  DollarSign, 
  Mail, 
  Settings 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationItems = [
  { id: 'overview', label: 'Overview', icon: ChartLine },
  { id: 'subscribers', label: 'Subscribers', icon: Users },
  { id: 'personalization', label: 'Personalization', icon: Wand2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'abtesting', label: 'A/B Testing', icon: FlaskConical },
  { id: 'revenue', label: 'Revenue Impact', icon: DollarSign },
  { id: 'email', label: 'Email Integration', icon: Mail },
  { id: 'advanced', label: 'Advanced Features', icon: Settings },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-dark-surface border-r border-dark-border fixed h-full overflow-y-auto">
      {/* Logo Section */}
      <div className="p-6 border-b border-dark-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-brand-blue to-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">SharpSend.io</h1>
            <p className="text-xs text-slate-400">Financial Publishers</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
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

      {/* User Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-border bg-dark-surface">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">PW</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">SharpSend Demo</p>
            <p className="text-xs text-slate-400">Enterprise Plan</p>
          </div>
          <User className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    </div>
  );
}