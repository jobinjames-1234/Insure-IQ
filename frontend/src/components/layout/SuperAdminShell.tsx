import React from "react"
import { ShieldAlert, Database, Users, Activity, Settings, LogOut } from "lucide-react"

interface SuperAdminShellProps {
  children: React.ReactNode
  userName: string
}

export function SuperAdminShell({ children, userName }: SuperAdminShellProps) {
  // SuperAdmin uses a distinct dark-mode sidebar to visually separate it from tenant B2B views
  
  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      {/* Dark Sidebar for SuperAdmin */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 text-slate-300 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <span className="font-bold tracking-tight">InsureIQ System</span>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Super Admin</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium bg-slate-800 text-white">
            <Database className="h-4 w-4 text-slate-400" />
            Tenants
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors">
            <Users className="h-4 w-4 text-slate-400" />
            Platform Users
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors">
            <Activity className="h-4 w-4 text-slate-400" />
            System Metrics
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors">
            <Settings className="h-4 w-4 text-slate-400" />
            Global Settings
          </a>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-medium">
                {userName.charAt(0)}
              </div>
              <span className="text-sm font-medium text-white">{userName}</span>
            </div>
            <button className="text-slate-500 hover:text-red-400 transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Warning Banner */}
        <div className="bg-red-50 border-b border-red-100 px-6 py-2">
          <p className="text-xs font-medium text-red-600 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            You are operating in the Global SuperAdmin context. Actions here affect all tenants.
          </p>
        </div>
        
        <div className="p-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
