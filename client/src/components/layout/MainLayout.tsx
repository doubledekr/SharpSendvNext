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
  const shouldShowLayout = !['/login', '/register', '/', '/assignment'].some(path => 
    location.startsWith(path)
  );

  if (!shouldShowLayout) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Fixed Navigation Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <NavigationHeader currentPage={currentPage || location.substring(1)} />
      </div>
      
      <div className="flex pt-16"> {/* Add padding-top to account for fixed header */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 ml-64 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}