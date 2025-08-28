import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Mail, 
  BarChart3, 
  Settings,
  FileText,
  CheckCircle,
  Target,
  FlaskConical,
  Menu,
  X,
  Building2,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronDown,
  Info,
  Zap
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MasterNavigation() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Check if this is a demo account
  const isDemoAccount = () => {
    const user = localStorage.getItem('user');
    if (!user) return false;
    try {
      const userData = JSON.parse(user);
      return userData.id === 'demo-user' || userData.id === 'demo-user-id';
    } catch {
      return false;
    }
  };
  
  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('publisher');
    localStorage.removeItem('user');
    // Redirect to login page
    setLocation('/login');
  };

  const mainNavItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      description: "Overview & Analytics"
    },
    {
      title: "Assignments",
      href: "/assignments",
      icon: FileText,
      description: "Content Planning & Reviews"
    },
    {
      title: "Segments",
      href: "/segments",
      icon: Target,
      description: "Audience Management"
    },
    {
      title: "A/B Testing",
      href: "/ab-testing",
      icon: FlaskConical,
      description: "Multi-variant Tests"
    },
    {
      title: "Integrations",
      href: "/integrations",
      icon: Zap,
      description: "Platform Connections"
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      description: "Performance Metrics"
    },
    {
      title: "Email Builder",
      href: "/email-builder",
      icon: Mail,
      description: "Drag & Drop Email Designer"
    }
  ];

  const platformItems = [
    {
      title: "Publisher Settings",
      href: "/settings/publisher",
      icon: Building2
    },
    {
      title: "Integrations",
      href: "/integrations",
      icon: Settings
    },
    {
      title: "Billing",
      href: "/settings/billing",
      icon: CreditCard
    },
    {
      title: "Documentation",
      href: "/docs",
      icon: FileText
    },
    {
      title: "Support",
      href: "/support",
      icon: HelpCircle
    }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <img 
                src="/sharpsend-logo.png" 
                alt="SharpSend" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                SharpSend
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }
                  `}
                  data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>

          {/* Platform Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Demo Environment Badge - only show for demo accounts */}
            {isDemoAccount() && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg cursor-help">
                    <Building2 className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-purple-500">Demo Environment</span>
                    <Info className="w-3 h-3 text-purple-400" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    You're in the demo environment with sample data. Perfect for exploring SharpSend's features without affecting real data.
                  </p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Settings Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Platform</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {platformItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center w-full">
                        <Icon className="w-4 h-4 mr-2" />
                        {item.title}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-base
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }
                  `}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                </Link>
              );
            })}
            <div className="border-t pt-2 mt-2">
              {platformItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-base text-muted-foreground hover:text-foreground hover:bg-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}