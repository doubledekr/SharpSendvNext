import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  Brain, 
  BarChart3, 
  TestTube, 
  DollarSign, 
  Mail, 
  Settings,
  Edit3,
  FileText,
  Eye,
  TrendingUp,
  Zap,
  LogOut
} from 'lucide-react';

interface NavigationHeaderProps {
  currentPage?: string;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({ currentPage }) => {
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('publisher');
    localStorage.removeItem('user');
    setLocation('/login');
  };

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      description: 'Main overview and analytics'
    },
    {
      id: 'editorial',
      label: 'Editorial',
      path: '/editorial',
      icon: Edit3,
      description: 'Content creation and management',
      badge: 'New'
    },
    {
      id: 'copywriter',
      label: 'Copywriter',
      path: '/copywriter',
      icon: FileText,
      description: 'Writing tasks and AI assistance'
    },
    {
      id: 'email-preview',
      label: 'Email Preview',
      path: '/email-preview',
      icon: Eye,
      description: 'Preview and approve campaigns',
      badge: 'AI'
    },

  ];

  return (
    <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">SharpSend.io</h1>
              <p className="text-xs text-slate-400">Financial Publishers</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 ml-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-400 font-medium">AI Engine: Active</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex items-center gap-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || 
                           (currentPage === 'dashboard' && item.id === 'dashboard');
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => setLocation(item.path)}
                className={`
                  relative flex items-center gap-2 px-3 py-2 text-sm
                  ${isActive 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }
                `}
                title={item.description}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.label}</span>
                {item.badge && (
                  <Badge 
                    variant="secondary" 
                    className="ml-1 text-xs bg-blue-500 text-white"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
          
          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-400 hover:bg-slate-700 ml-2"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline ml-2">Logout</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="flex items-center gap-6 mt-3 pt-3 border-t border-slate-700">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-slate-400">Publisher:</span>
          <span className="text-white font-medium">SharpSend Demo</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-slate-400">Active Subscribers:</span>
          <span className="text-green-400 font-medium">12,847</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <span className="text-slate-400">Engagement Rate:</span>
          <span className="text-purple-400 font-medium">74.2%</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span className="text-slate-400">Monthly Revenue:</span>
          <span className="text-yellow-400 font-medium">$89,450</span>
        </div>
      </div>
    </div>
  );
};

export default NavigationHeader;

