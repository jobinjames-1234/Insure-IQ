import React, { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { ShieldAlert, Database, Users, Activity, Settings, LogOut } from "lucide-react"
import { useAuthStore } from "../../store/authStore"

interface SuperAdminShellProps {
  children: React.ReactNode
  userName: string
}

export function SuperAdminShell({ children, userName }: SuperAdminShellProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const logout = useAuthStore(state => state.logout)
  const location = useLocation()
  
  const getLinkClass = (path: string) => {
    const isActive = location.pathname.startsWith(path)
    return isActive
      ? "flex items-center gap-3 px-4 py-2 rounded-full transition-all active:scale-95 bg-primary text-white"
      : "flex items-center gap-3 px-4 py-2 rounded-full transition-all active:scale-95 text-white/70 hover:bg-white/10"
  }

  return (
    <div className="flex h-screen bg-background font-body text-body text-on-surface antialiased overflow-hidden">
      {/* Dark Sidebar for SuperAdmin */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-outline-variant bg-[#0d0e14] text-white">
        <div className="h-16 flex items-center px-6 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2 text-white">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <span className="font-h3 text-h3 tracking-tight">InsureIQ</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <Link to="/admin/tenants" className={getLinkClass('/admin/tenants')}>
            <Database className="h-5 w-5" />
            <span className="font-caption font-medium">Tenants</span>
          </Link>
          <Link to="/admin/users" className={getLinkClass('/admin/users')}>
            <Users className="h-5 w-5" />
            <span className="font-caption font-medium">Platform Users</span>
          </Link>
          <Link to="/admin/console" className={getLinkClass('/admin/console')}>
            <Activity className="h-5 w-5" />
            <span className="font-caption font-medium">Platform Overview</span>
          </Link>
          <Link to="/admin/settings" className={getLinkClass('/admin/settings')}>
            <Settings className="h-5 w-5" />
            <span className="font-caption font-medium">Global Settings</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-4">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-[10px] uppercase">
              {userName.substring(0, 2)}
            </div>
            <div className="overflow-hidden">
              <p className="font-caption font-medium text-white truncate">{userName}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Root Access</p>
            </div>
          </div>
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-3 text-white/70 hover:text-danger px-2 py-2 transition-colors w-full"
          >
            <LogOut className="h-[20px] w-[20px]" />
            <span className="text-caption font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto relative bg-background">
        {/* Warning Banner */}
        <div className="bg-danger-bg border-b border-danger/20 px-6 py-2 shrink-0">
          <p className="text-caption font-medium text-danger flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
            </span>
            You are operating in the Global SuperAdmin context. Actions here affect all tenants.
          </p>
        </div>
        
        <div className="flex-1 w-full">
          {children}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-lg shadow-xl max-w-sm w-full border border-outline-variant overflow-hidden">
            <div className="p-6 text-on-surface">
              <div className="flex items-center gap-3 mb-4 text-danger">
                <ShieldAlert className="w-6 h-6" />
                <h3 className="font-h3 text-h3 text-on-surface">Confirm Logout</h3>
              </div>
              <p className="font-body text-body text-on-surface-variant mb-6">
                Are you sure you want to log out of the Global SuperAdmin console?
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 rounded-md border border-outline-variant text-on-surface-variant hover:bg-surface-container font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowLogoutConfirm(false)
                    logout()
                  }}
                  className="px-4 py-2 rounded-md bg-danger text-white hover:bg-danger/90 font-medium transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
