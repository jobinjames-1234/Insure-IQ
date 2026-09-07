import React, { useState } from "react"
import { Bell, Search, Menu, LogOut, Settings } from "lucide-react"
import { useAuthStore } from "../../store/authStore"
import { Link } from "react-router-dom"

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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const logout = useAuthStore(state => state.logout)

  return (
    <div className="flex h-screen bg-background text-on-background font-body antialiased">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-surface border-r border-outline-variant flex flex-col p-4 transition-all">
        {/* Tenant Logo Slot */}
        <div className="flex items-center mb-8 gap-3">
          {tenantLogo ? (
            tenantLogo
          ) : (
            <>
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xl">{tenantName ? tenantName[0] : "T"}</span>
              </div>
              <div>
                <h1 className="font-h3 text-h3 text-on-surface">{tenantName || "Tenant Name"}</h1>
                <p className="font-caption text-caption text-text-muted">Agent Portal</p>
              </div>
            </>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {sidebarItems.map((item, idx) => (
            <Link
              key={idx}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                item.active 
                  ? "bg-secondary-container text-on-secondary-container active:scale-95 duration-150" 
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="flex items-center justify-center text-[20px]">
                {item.icon}
              </span>
              <span className="font-caption text-caption">{item.label}</span>
            </Link>
          ))}
        </nav>
        
        {/* User Profile */}
        <div className="mt-auto space-y-1">
          <button className="w-full flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:bg-surface-container-high transition-all rounded-lg">
            <Settings className="w-5 h-5" />
            <span className="font-caption text-caption">Settings</span>
          </button>
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:text-danger hover:bg-danger-bg transition-all rounded-lg"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-caption text-caption">Logout</span>
          </button>
          <div className="flex items-center gap-3 px-4 py-3 mt-4 bg-surface-container rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-xs uppercase">
              {userName.charAt(0)}
            </div>
            <div className="flex flex-col overflow-hidden text-left">
              <span className="text-caption font-semibold truncate text-on-surface">{userName}</span>
              <span className="text-[10px] text-text-muted uppercase tracking-tighter truncate">{userRole}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        {/* Top Header */}
        <header className="h-14 border-b border-outline-variant flex items-center justify-between px-gutter bg-surface shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-on-surface-variant hover:bg-surface-container p-2 rounded-full transition-colors">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-4">
              <h2 className="font-h3 text-h3 text-on-surface">Dashboard</h2>
              {/* Optional dynamic title tag */}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-on-surface-variant" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="h-9 w-64 rounded bg-surface-container border border-outline-variant pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
              />
            </div>
            <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border border-surface"></span>
            </button>
            <div className="h-6 w-px bg-outline-variant mx-1"></div>
            <button className="flex items-center gap-2 bg-primary px-3 py-1.5 rounded text-white hover:opacity-90 transition-opacity">
              <span className="font-caption text-caption">Action</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-gutter bg-background">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-lg shadow-xl max-w-sm w-full border border-outline-variant overflow-hidden">
            <div className="p-6 text-on-surface">
              <div className="flex items-center gap-3 mb-4 text-danger">
                <LogOut className="w-6 h-6" />
                <h3 className="font-h3 text-h3 text-on-surface">Confirm Logout</h3>
              </div>
              <p className="font-body text-body text-on-surface-variant mb-6">
                Are you sure you want to log out of your session?
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
