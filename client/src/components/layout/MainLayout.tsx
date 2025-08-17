import React, { useState } from "react";
import NavigationHeader from "@/components/dashboard/navigation-header";
import Sidebar from "@/components/dashboard/sidebar";
import { useLocation } from "wouter";

interface MainLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

export default function MainLayout({ children, currentPage }: MainLayoutProps) {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Check if we're on a page that should have the full layout
  const shouldShowLayout = !['/login', '/register', '/'].some(path => 
    location === path
  );

  if (!shouldShowLayout) {
    return <>{children}</>;
  }

  // Pass the activeTab and setActiveTab to children if they're on the dashboard
  const childrenWithProps = location === '/dashboard' 
    ? React.cloneElement(children as React.ReactElement, { activeTab, setActiveTab })
    : children;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Fixed Navigation Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <NavigationHeader currentPage={currentPage || location.substring(1)} />
      </div>
      
      <div className="flex">
        {/* Fixed Sidebar */}
        <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 z-40">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        
        {/* Main Content Area with proper spacing */}
        <div className="flex-1 ml-64 mt-16 overflow-auto">
          {childrenWithProps}
        </div>
      </div>
    </div>
  );
}