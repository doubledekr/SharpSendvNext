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
  ChevronDown
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MasterNavigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainNavItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      description: "Overview & Analytics"
    },
    {
      title: "Assignments",
      href: "/assignments",
      icon: FileText,
      description: "Content Planning"
    },
    {
      title: "Approvals",
      href: "/approvals",
      icon: CheckCircle,
      description: "Review Workflows"
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
      title: "Campaigns",
      href: "/campaigns",
      icon: Mail,
      description: "Email Campaigns"
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      description: "Performance Metrics"
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
      href: "/settings/integrations",
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
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                SharpSend vNext
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
            {/* Publisher Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4" />
                  <span>Demo Publisher</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Switch Publisher</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Building2 className="w-4 h-4 mr-2" />
                  Demo Publisher
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Building2 className="w-4 h-4 mr-2" />
                  Financial Times
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Building2 className="w-4 h-4 mr-2" />
                  Market Watch Pro
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
                <DropdownMenuItem className="text-red-600">
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