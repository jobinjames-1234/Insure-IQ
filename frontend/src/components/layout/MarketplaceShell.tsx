import React, { useState, useRef, useEffect } from "react"
import { Search, LogOut, User as UserIcon } from "lucide-react"
import { useAuthStore } from "../../store/authStore"
import { Link, useNavigate } from "react-router-dom"

interface MarketplaceShellProps {
  children: React.ReactNode
  isLoggedIn?: boolean
  userName?: string
}

export function MarketplaceShell({ children, isLoggedIn, userName }: MarketplaceShellProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const logout = useAuthStore(state => state.logout)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const basePath = isLoggedIn ? "/portal" : "/marketplace"

  return (
    <div className="bg-background text-on-background font-body text-body antialiased min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="bg-surface dark:bg-on-surface border-b border-outline-variant w-full sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-base max-w-max-width mx-auto h-16 px-gutter md:px-margin">
          
          {/* Brand & Nav */}
          <div className="flex items-center gap-8">
            <Link className="font-display text-h2 font-black text-primary hover:text-primary-container transition-colors" to={basePath}>InsureMarket</Link>
            <nav className="hidden md:flex gap-6">
              <Link className="text-primary font-bold border-b-2 border-primary pb-1 font-body text-body scale-95 active:opacity-80" to={isLoggedIn ? "/portal/apply" : "/marketplace"}>Browse</Link>
              <Link className="text-text-secondary pb-1 font-body text-body hover:text-primary transition-colors scale-95 active:opacity-80" to={isLoggedIn ? "/portal" : "/login"}>My Policies</Link>
              <Link className="text-text-secondary pb-1 font-body text-body hover:text-primary transition-colors scale-95 active:opacity-80" to={isLoggedIn ? "/portal/claims" : "/login"}>Claims</Link>
              <a className="text-text-secondary pb-1 font-body text-body hover:text-primary transition-colors scale-95 active:opacity-80" href="mailto:support@insureiq.com">Support</a>
            </nav>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-[18px] h-[18px]" />
              <input className="h-10 pl-9 pr-4 rounded bg-surface-container border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none font-body text-body w-48 text-on-surface" placeholder="Search..." type="text"/>
            </div>
            
            {isLoggedIn ? (
              <>
                <button onClick={() => navigate("/portal/apply")} className="bg-primary-container text-white h-10 px-4 rounded font-body text-body hover:bg-primary transition-colors flex items-center gap-2">
                    Get Quote
                </button>
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center overflow-hidden hover:border-primary transition-colors" aria-label={userName}
                  >
                    <img alt="Customer Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD13KrDz_qfChSUDS1mHkjUbYrDBp9xh8-87qJSd2v_rsg3MvA3xLTAo35FE8SAS-xfBdSe_33REh-yd1qAkH2r24FXCVIESt-sPaKpJdngL3z0hggSQxwsBuq3SsX9c0a6TB7xoKetmxUwN8GiPNt3INmWJ4RuZTkRzQidL4XrPsCgM0yp21K2jqrM-1zlDmk2vtTOSgBf5wg2xiZ-ORyTfJmrze2ZRJipbxeiRWBz9wVv_enrOILZkQ"/>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg border border-outline-variant py-1 z-50">
                      <div className="px-4 py-2 border-b border-outline-variant">
                        <p className="text-sm font-medium text-on-surface truncate">{userName}</p>
                      </div>
                      <Link to="/portal/profile" className="flex items-center px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container transition-colors">
                        <UserIcon className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                      <button 
                        onClick={() => logout()}
                        className="flex w-full items-center px-4 py-2 text-sm text-danger hover:bg-danger-bg transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <Link to="/login" className="text-sm font-medium text-text-secondary hover:text-primary">
                    Log in
                  </Link>
                  <Link to="/register" className="text-sm font-medium text-text-secondary hover:text-primary">
                    Register
                  </Link>
                  <button onClick={() => navigate("/marketplace/quote")} className="bg-primary-container text-white h-10 px-4 rounded font-body text-body hover:bg-primary transition-colors flex items-center gap-2">
                    Get Quote
                  </button>
                </div>
              </>
            )}
          </div>
          
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-outline-variant mt-auto">
        <div className="max-w-max-width mx-auto py-8 px-gutter md:px-margin text-center text-caption text-text-muted">
          &copy; {new Date().getFullYear()} InsureMarket. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
