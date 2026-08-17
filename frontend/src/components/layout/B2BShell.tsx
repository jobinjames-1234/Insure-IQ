import React from "react"
import { Bell, Search, Menu, LogOut, Settings } from "lucide-react"

interface SidebarItem {
  icon: React.ReactNode
  label: string
  href: string
  active?: boolean
}

interface B2BShellProps {
  children: React.ReactNode
  tenantLogo?: React.ReactNode
  tenantName?: string
  sidebarItems: SidebarItem[]
  userName: string
  userRole: string
}

export function B2BShell({ children, tenantLogo, tenantName, sidebarItems, userName, userRole }: B2BShellProps) {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col transition-all">
        {/* Tenant Logo Slot */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          {tenantLogo ? (
            tenantLogo
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-indigo-600 rounded-md flex items-center justify-center text-white font-bold">
                {tenantName ? tenantName[0] : "T"}
              </div>
              <span className="font-semibold truncate">{tenantName || "Tenant Name"}</span>
            </div>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {sidebarItems.map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                item.active 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className={item.active ? "text-indigo-600" : "text-slate-400"}>
                {item.icon}
              </div>
              {item.label}
            </a>
          ))}
        </nav>
        
        {/* User Profile */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center font-medium text-slate-600">
              {userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
              <p className="text-xs text-slate-500 capitalize truncate">{userRole}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-500 hover:text-slate-700">
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search policies, claims..." 
                className="h-9 w-64 rounded-md border border-slate-200 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative text-slate-500 hover:text-slate-700 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            <button className="text-slate-500 hover:text-slate-700 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <button className="text-slate-500 hover:text-red-600 transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
