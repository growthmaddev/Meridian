import { BellIcon } from "lucide-react";
import { Sidebar } from "./sidebar";
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

export function MainLayout({ 
  children, 
  title, 
  subtitle,
  breadcrumbs = [],
  actions
}: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navbar */}
        <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center">
              <h1 className="ml-3 text-xl font-semibold text-neutral-900 dark:text-neutral-100 md:hidden">MarketMixPro</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="text-neutral-500">
                <BellIcon className="h-5 w-5" />
              </Button>
              
              <div className="relative">
                <Avatar>
                  <AvatarImage src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=120&h=120" alt="User avatar" />
                  <AvatarFallback>US</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <nav className="mb-6 text-sm font-medium">
                <ol className="flex items-center space-x-2">
                  {breadcrumbs.map((item, i) => (
                    <li key={i}>
                      {i < breadcrumbs.length - 1 ? (
                        <>
                          {item.href ? (
                            <Link 
                              href={item.href} 
                              className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                            >
                              {item.name}
                            </Link>
                          ) : (
                            <span className="text-neutral-500 dark:text-neutral-400">{item.name}</span>
                          )}
                          <span className="text-neutral-400 dark:text-neutral-600 mx-2">/</span>
                        </>
                      ) : (
                        <span className="text-neutral-900 dark:text-neutral-100">{item.name}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            
            {/* Page header */}
            {(title || actions) && (
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  {title && (
                    <div>
                      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{title}</h1>
                      {subtitle && <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>}
                    </div>
                  )}
                  {actions && (
                    <div className="mt-4 sm:mt-0 flex flex-shrink-0 space-x-3">
                      {actions}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Main content */}
            {children}
          </div>
        </main>
      </div>
      
      <Toaster />
    </div>
  );
}
