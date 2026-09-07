import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Bell, AlertCircle, Home, Car, ChevronRight, CheckCircle, FileText, Heart, Activity } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'

export function CustomerHomePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/policies/my')
      .then((res: any) => setPolicies(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading your dashboard...</div>

  const hasRenewal = policies.some(p => p.status === 'active' && new Date(p.end_date).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000)
  const activePolicies = policies.filter(p => p.status === 'active')

  return (
    <div className="max-w-max-width mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="font-overline text-overline text-primary uppercase tracking-wider">Dashboard</span>
          <h1 className="font-h1 text-h1 text-on-surface mt-1">Hello, {user?.first_name || 'Customer'}</h1>
          <p className="font-body text-body text-text-secondary mt-2">Manage your policies and explore new coverage options.</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="font-caption text-caption text-text-muted">Last login: Today, 10:42 AM</p>
        </div>
      </section>

      {/* Urgent Banner */}
      {hasRenewal && (
        <div className="relative overflow-hidden rounded-xl bg-surface-container-highest border border-outline-variant p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4 z-10">
            <div className="w-12 h-12 rounded-full bg-warning-bg flex items-center justify-center text-warning shrink-0 shadow-sm">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-h3 text-h3 text-on-surface">Renewal required</h3>
              <p className="font-body text-body text-on-surface-variant mt-1">One or more of your policies expires in less than 30 days.</p>
            </div>
          </div>
          <Button className="z-10 bg-primary-container text-white font-body font-semibold hover:shadow-md w-full md:w-auto">
            Renew Now
          </Button>
          {/* Decorative Subtle Background Element */}
          <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
            <Activity className="w-32 h-32 text-warning" />
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Active Policies (Main Content) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-h2 text-h2 text-on-surface">Active Policies</h2>
            <button className="text-primary font-body text-body font-semibold hover:underline">View All</button>
          </div>
          
          {activePolicies.length === 0 ? (
            <div className="text-center py-12 bg-surface rounded-xl border border-outline-variant shadow-sm">
              <Shield className="h-12 w-12 text-outline mx-auto mb-4" />
              <h3 className="font-h3 text-h3 text-on-surface">No active policies</h3>
              <p className="font-body text-body text-text-secondary mb-6">You don't have any active coverage right now.</p>
              <Button onClick={() => navigate('/portal/apply')}>Browse Products</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activePolicies.map((p) => {
                const isAuto = p.policy_type?.toLowerCase().includes('auto') || p.policy_type?.toLowerCase().includes('motor');
                const isHome = p.policy_type?.toLowerCase().includes('home') || p.policy_type?.toLowerCase().includes('property');
                return (
                  <div key={p.id} className="group bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-xs hover:shadow-md transition-all flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                        {isAuto ? <Car className="w-6 h-6" /> : isHome ? <Home className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                      </div>
                      <span className="px-3 py-1 rounded-full bg-success-bg text-success font-caption text-caption font-semibold">Active</span>
                    </div>
                    
                    <h3 className="font-h3 text-h3 text-on-surface">{p.policy_number}</h3>
                    <p className="font-caption text-caption text-text-muted uppercase tracking-tight">{p.policy_type || 'Insurance Policy'}</p>
                    
                    <div className="mt-8 space-y-3 flex-1">
                      <div className="flex justify-between py-2 border-b border-outline-variant">
                        <span className="font-body text-body text-text-secondary">Premium</span>
                        <span className="font-mono-data text-mono-data text-on-surface">${p.total_premium} / yr</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="font-body text-body text-text-secondary">Renewal</span>
                        <span className="font-mono-data text-mono-data text-on-surface">
                          {new Date(p.end_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => navigate(`/portal/policies/${p.id}`)}
                      className="w-full mt-6 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-body font-semibold hover:bg-surface-container-high transition-colors"
                    >
                      Manage Policy
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Get a Quote (Sidebar/CTA) */}
        <div className="lg:col-span-4">
          <div className="bg-primary p-8 rounded-xl text-white h-full flex flex-col justify-between relative overflow-hidden shadow-lg group">
            <div className="relative z-10">
              <h2 className="font-h2 text-h2 mb-4">Get a Quote</h2>
              <p className="font-body text-body opacity-90 mb-8">Ready to expand your protection? Get a personalized quote in minutes.</p>
              
              <div className="space-y-4">
                <button onClick={() => navigate('/portal/apply?type=auto')} className="w-full flex items-center justify-between p-4 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all">
                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5" />
                    <span className="font-body text-body font-medium">Auto Insurance</span>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button onClick={() => navigate('/portal/apply?type=health')} className="w-full flex items-center justify-between p-4 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5" />
                    <span className="font-body text-body font-medium">Health Insurance</span>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button onClick={() => navigate('/portal/apply?type=life')} className="w-full flex items-center justify-between p-4 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5" />
                    <span className="font-body text-body font-medium">Life Insurance</span>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Decorative Graphic */}
            <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Shield className="w-64 h-64" />
            </div>
            
            <p className="relative z-10 mt-12 font-caption text-caption opacity-70">
              Trusted by 2M+ customers worldwide.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity Bento */}
      <section className="space-y-6 pt-4">
        <h2 className="font-h2 text-h2 text-on-surface">Recent Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-outline-variant bg-surface-container-lowest flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-success-bg text-success flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-body text-body font-semibold text-on-surface">Account Created</p>
              <p className="font-caption text-caption text-text-muted">Welcome to InsureIQ!</p>
            </div>
          </div>
          
          <div className="p-6 rounded-xl border border-outline-variant bg-surface-container-lowest flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-surface-container-high text-primary flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="font-body text-body font-semibold text-on-surface">Profile Updated</p>
              <p className="font-caption text-caption text-text-muted">Personal details verified</p>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  )
}
