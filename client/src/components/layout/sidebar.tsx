import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart2,
  Database,
  File,
  HelpCircle,
  LogOut,
  Menu,
  SettingsIcon,
  LayoutDashboard,
  Layers
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = () => setMobileOpen(!mobileOpen);

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="mr-3 text-lg" />,
    },
    {
      name: "Projects",
      href: "/projects",
      icon: <File className="mr-3 text-lg" />,
    },
    {
      name: "Datasets",
      href: "/datasets",
      icon: <Database className="mr-3 text-lg" />,
    },
    {
      name: "Models",
      href: "/models",
      icon: <BarChart2 className="mr-3 text-lg" />,
    },
    {
      name: "Optimizations",
      href: "/optimizations",
      icon: <Layers className="mr-3 text-lg" />,
    },
  ];

  const bottomNavItems = [
    {
      name: "Settings",
      href: "/settings",
      icon: <SettingsIcon className="mr-3 text-lg" />,
    },
    {
      name: "Help",
      href: "/help",
      icon: <HelpCircle className="mr-3 text-lg" />,
    },
    {
      name: "Logout",
      href: "/logout",
      icon: <LogOut className="mr-3 text-lg" />,
    },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden absolute top-4 left-4 z-50"
        onClick={toggleMobile}
      >
        <Menu className="h-6 w-6" />
      </Button>
      
      {/* Sidebar for mobile */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={toggleMobile}
        >
          <aside className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-neutral-900 z-50" onClick={e => e.stopPropagation()}>
            <SidebarContent 
              navItems={navItems}
              bottomNavItems={bottomNavItems}
              location={location}
              onNavClick={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Sidebar for desktop */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <SidebarContent 
            navItems={navItems}
            bottomNavItems={bottomNavItems}
            location={location}
          />
        </div>
      </aside>
    </>
  );
}

function SidebarContent({ 
  navItems, 
  bottomNavItems, 
  location,
  onNavClick
}: { 
  navItems: any[]; 
  bottomNavItems: any[]; 
  location: string;
  onNavClick?: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-center h-16 px-4 border-b border-neutral-200 dark:border-neutral-700">
        <h1 className="text-xl font-semibold text-primary-700 dark:text-primary-400">MarketMixPro</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto">
        <div className="px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                location === item.href
                  ? "text-white bg-primary-700 dark:bg-primary-800"
                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              )}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </div>
        
        <div className="pt-4 pb-3 border-t border-neutral-200 dark:border-neutral-700">
          <div className="px-2 space-y-1">
            {bottomNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavClick}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  location === item.href
                    ? "text-white bg-primary-700 dark:bg-primary-800"
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
