import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Notifications, Menu, Description, AssignmentLate, Schedule, Payments, TrendingUp, TrendingDown, LockOpen, Warning } from '@mui/icons-material'
import { api } from '../../lib/api'

// Lucide React doesn't map 1:1 to material symbols outlined used in the HTML. I'll use Lucide where applicable, or standard spans with material-symbols-outlined class if I include the font. The HTML includes the material-symbols-outlined font, so I can use standard spans with that class for exact visual parity.

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/activities')
    ]).then(([statsRes, activitiesRes]) => {
      setStats(statsRes.data)
      setActivities(activitiesRes.data.slice(0, 5))
    })
    .catch((err: any) => console.error(err))
    .finally(() => setLoading(false))
  }, [])

  if (loading && !stats) return <div className="p-8 text-text-secondary animate-pulse text-[14px]">Loading admin dashboard...</div>

  const chartData = stats?.lead_volume || [12000, 15000, 18000, 14000, 19000, 22000, 20000];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Top Bar */}
      <header className="flex justify-between items-center px-gutter w-full h-16 bg-surface border-b border-outline-variant z-40 shrink-0">
        <div className="flex items-center gap-4">
          <button className="md:hidden p-2 text-on-surface-variant">
            <Menu />
          </button>
          <div className="flex flex-col">
            <h2 className="font-h3 text-h3 text-primary">Admin Overview</h2>
            <span className="text-caption text-text-secondary font-body">{(new Date()).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric'})}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input className="pl-10 pr-4 py-2 h-10 w-64 bg-bg-muted border-none rounded-lg text-body font-body focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="Search policies or logs..." type="text"/>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors relative">
              <Notifications className="text-on-surface-variant" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full"></span>
            </button>
            <button className="px-4 py-2 bg-primary text-white font-body text-body rounded-lg hover:opacity-90 transition-all active:scale-95">
              New Report
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-gutter space-y-gutter max-w-max-width w-full mx-auto">
        
        {/* KPI Cards Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div onClick={() => navigate('/b2b/admin/policies-sold')} className="cursor-pointer bg-surface border border-outline-variant transition-all duration-200 ease-in-out hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:border-primary p-6 rounded-xl flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary-fixed rounded-lg text-primary">
                <Description />
              </div>
              <span className="text-success font-mono-data text-caption flex items-center">
                <TrendingUp className="text-sm mr-1" />+12.4%
              </span>
            </div>
            <div>
              <p className="text-on-surface-variant font-caption text-caption mb-1">Policies Sold (This Month)</p>
              <h3 className="font-h1 text-h1 text-on-background font-mono-data">{stats?.active_policies || '1,284'}</h3>
            </div>
          </div>
          
          {/* Card 2 */}
          <div onClick={() => navigate('/b2b/admin/claims-pending')} className="cursor-pointer bg-surface border border-outline-variant transition-all duration-200 ease-in-out hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:border-primary p-6 rounded-xl flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-secondary-fixed rounded-lg text-secondary">
                <AssignmentLate />
              </div>
              <span className="text-danger font-mono-data text-caption flex items-center">
                <Warning className="text-sm mr-1" />+3.1%
              </span>
            </div>
            <div>
              <p className="text-on-surface-variant font-caption text-caption mb-1">Claims Pending</p>
              <h3 className="font-h1 text-h1 text-on-background font-mono-data">42</h3>
            </div>
          </div>

          {/* Card 3 */}
          <div onClick={() => navigate('/b2b/admin/settlement-time')} className="cursor-pointer bg-surface border border-outline-variant transition-all duration-200 ease-in-out hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:border-primary p-6 rounded-xl flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-tertiary-fixed rounded-lg text-tertiary">
                <Schedule />
              </div>
              <span className="text-success font-mono-data text-caption flex items-center">
                <TrendingDown className="text-sm mr-1" />-1.2d
              </span>
            </div>
            <div>
              <p className="text-on-surface-variant font-caption text-caption mb-1">Avg Settlement Time</p>
              <h3 className="font-h1 text-h1 text-on-background font-mono-data">4.8<span className="text-h3 ml-1 font-body">days</span></h3>
            </div>
          </div>

          {/* Card 4 */}
          <div onClick={() => navigate('/b2b/admin/revenue')} className="cursor-pointer bg-surface border border-outline-variant transition-all duration-200 ease-in-out hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:border-primary p-6 rounded-xl flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-success-bg rounded-lg text-success">
                <Payments />
              </div>
              <span className="text-success font-mono-data text-caption flex items-center">
                <TrendingUp className="text-sm mr-1" />+8.5%
              </span>
            </div>
            <div>
              <p className="text-on-surface-variant font-caption text-caption mb-1">Total Revenue (MTD)</p>
              <h3 className="font-h1 text-h1 text-on-background font-mono-data">{stats?.monthly_premium ? `$${(stats.monthly_premium / 1000).toFixed(1)}M` : '$4.2M'}</h3>
            </div>
          </div>
        </section>

        {/* Main Interactive Section: Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Center Section: Chart & Detailed Insight */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 h-full min-h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="font-h3 text-h3 text-on-surface">Underwriting Performance</h3>
                  <p className="text-caption text-text-secondary font-body">Volume vs. Approval Rate over the last 30 days</p>
                </div>
                <select className="bg-bg-muted border-none rounded-lg text-caption font-body px-3 py-1 outline-none">
                  <option>Last 30 Days</option>
                  <option>Last 90 Days</option>
                </select>
              </div>
              
              {/* Visual Data Placeholder */}
              <div className="flex-1 w-full relative group">
                <div className="absolute inset-0 flex items-end justify-between px-2 gap-4 pb-6">
                  {chartData.map((val: number, i: number) => {
                    const isLast = i === chartData.length - 1;
                    return (
                      <div 
                        key={i} 
                        className={`w-full ${isLast ? 'bg-primary/20 border-x-2 border-primary' : 'bg-primary/10'} rounded-t hover:bg-primary/30 transition-all duration-500 cursor-pointer group/bar relative`} 
                        style={{ height: `${(val / 25000) * 100}%` }}
                      >
                        <span className={`absolute -top-10 left-1/2 -translate-x-1/2 ${isLast ? 'bg-primary' : 'bg-inverse-surface'} text-white text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap z-10 ${isLast ? 'block' : 'opacity-0 group-hover/bar:opacity-100 transition-opacity'}`}>
                          {isLast ? `Vol: ${val}` : `${val}`}
                        </span>
                        <div className="bg-primary w-full rounded-t absolute bottom-0 transition-all" style={{ height: `${(val / 25000) * 75}%` }}></div>
                      </div>
                    )
                  })}
                </div>
                <div className="absolute bottom-0 w-full flex justify-between text-[10px] text-text-muted font-mono-data px-1">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
              
              <div className="mt-6 flex gap-6 pt-6 border-t border-outline-variant">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-caption font-body text-text-secondary">Direct Approvals</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary/20"></div>
                  <span className="text-caption font-body text-text-secondary">Referrals</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: Recent Activity Feed */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-h3 text-h3 text-on-surface">Recent Activity</h3>
                <button onClick={() => navigate('/b2b/admin/activity')} className="text-primary font-caption text-caption hover:underline transition-all">View All</button>
              </div>
              <div className="space-y-6 flex-1">
                {/* Activity Items */}
                {activities.map((activity: any) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container text-outline flex-shrink-0 flex items-center justify-center">
                      <LockOpen className="text-sm" />
                    </div>
                    <div className="flex flex-col">
                      <p className="font-body text-body text-on-surface leading-tight">
                        <span className="font-semibold">{activity.title}:</span> {activity.description}
                      </p>
                      <span className="text-[11px] font-mono-data text-text-muted mt-1 uppercase">{new Date(activity.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Multi-purpose Insights */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-gutter">
          {/* Team Pulse */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <h3 className="font-h3 text-h3 text-on-surface mb-4">Team Availability</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-fixed">
                    <img className="w-full h-full object-cover rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuChm6YV1CpiTRLZOmYUZKL_IdrMQwSuzcvruuQqAf7H3m4L1Ku9xv47JfSKEhgfKO6KRImrwGX9aOzF7UHr7QQCa3VfgSpCvmev0pjEzheJwXBHY-TRYAOXUpNPg3vMECHudhoTAiM0A2stj6x4Jig5ewIm9n81kFiI2luvsyedAI9QRk2wSXFP0LpTcNDODFauIOrMEqO3uoBUcKz4ClUlmx9Z0Cp7sxJG5035aRVylOdHZj4m09AQVQ" alt="Elena Vance"/>
                  </div>
                  <span className="font-body text-body font-medium">Elena Vance</span>
                </div>
                <span className="px-2 py-1 bg-success-bg text-success text-[10px] rounded uppercase font-bold tracking-widest">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-fixed">
                    <img className="w-full h-full object-cover rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDepM3tgfvL8oHKzjFzxODV6kvFkxdzxRNVUe4fgvdw1o4QmXmtjl4a2jUErYRzVYfL6wnq6kF75Dja3P48ik8NpGDsb80_o80ycD18b-pa2NCVzWgbzvFLinpmd6_84xC_3HWAormYnJ8GsFS8R3NRcTRciTksyc3IgdzyH9VX5RY8CGtfzHRXhe6AZ_Den3ak3eFOIkR9kEUCgiBJ58L3YS-Vs072jziGcQIhziRra58_LjGn1wwPSw" alt="Marcus Chen"/>
                  </div>
                  <span className="font-body text-body font-medium">Marcus Chen</span>
                </div>
                <span className="px-2 py-1 bg-bg-muted text-text-muted text-[10px] rounded uppercase font-bold tracking-widest">Away</span>
              </div>
            </div>
            <button onClick={() => navigate('/b2b/admin/team')} className="w-full mt-6 py-2 border border-outline-variant rounded-lg font-caption text-caption text-on-surface-variant hover:bg-bg-muted transition-colors">Manage Team</button>
          </div>

          {/* Billing Snapshot */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <h3 className="font-h3 text-h3 text-on-surface mb-4">Billing Status</h3>
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-caption font-body text-text-secondary">Current Plan</span>
                <span className="text-caption font-body text-primary font-semibold">Enterprise</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-caption font-body text-text-secondary">Next Invoice</span>
                <span className="text-caption font-mono-data text-on-surface">Nov 15, 2023</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-caption font-body">
                <span className="text-text-secondary">Seats Used</span>
                <span className="text-on-surface font-semibold">42 / 100</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-full w-[42%]"></div>
              </div>
            </div>
            <button onClick={() => navigate('/b2b/admin/billing')} className="w-full mt-6 py-2 border border-outline-variant rounded-lg font-caption text-caption text-on-surface-variant hover:bg-bg-muted transition-colors">Upgrade Plan</button>
          </div>

          {/* System Health */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 relative overflow-hidden">
            <h3 className="font-h3 text-h3 text-on-surface mb-4">API & Integrations</h3>
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <span className="font-body text-body text-on-surface">Stripe Integration</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <span className="font-body text-body text-on-surface">DocuSign Webhooks</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-warning"></div>
                <span className="font-body text-body text-on-surface">Twilio SMS (Latent)</span>
              </div>
            </div>
            {/* Atmosphere Micro-animation */}
            <div className="absolute bottom-[-20%] right-[-10%] w-40 h-40 opacity-10 blur-3xl bg-primary-fixed rounded-full"></div>
          </div>
        </section>
      </div>
    </div>
  )
}
