import React from "react"
import { ShoppingBag, ChevronDown, User as UserIcon } from "lucide-react"

interface MarketplaceShellProps {
  children: React.ReactNode
  isLoggedIn?: boolean
  userName?: string
}

export function MarketplaceShell({ children, isLoggedIn, userName }: MarketplaceShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">InsureIQ</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-sm font-medium text-slate-900 border-b-2 border-indigo-600 py-5">
                Auto
              </a>
              <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900 py-5 transition-colors">
                Home
              </a>
              <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900 py-5 transition-colors">
                Life
              </a>
              <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900 py-5 transition-colors">
                Claims
              </a>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <>
                  <a href="#" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hidden sm:block">
                    My Insurance
                  </a>
                  <div className="flex items-center gap-2 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 hidden sm:block">{userName}</span>
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </div>
                </>
              ) : (
                <>
                  <a href="#" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                    Log in
                  </a>
                  <button className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors">
                    Get a Quote
                  </button>
                </>
              )}
            </div>
            
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} InsureIQ, Inc. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
