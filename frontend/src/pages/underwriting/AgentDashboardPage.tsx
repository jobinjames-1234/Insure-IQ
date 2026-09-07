import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, DollarSign, AlertCircle, TrendingUp, History, Mail, Phone, Search, Bell, Plus } from 'lucide-react'
import { api } from '../../lib/api'

export function AgentDashboardPage() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [commission, setCommission] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/agent/customers'),
      api.get('/agent/retention-alerts'),
      api.get('/agent/commission')
    ])
    .then(([custRes, alertRes, commRes]) => {
      setCustomers(custRes.data)
      setAlerts(alertRes.data)
      setCommission(commRes.data)
    })
    .catch(err => console.error(err))
    .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-text-secondary animate-pulse font-body text-body">Loading agent dashboard...</div>

  // Mock data for UI alignment since backend might not return all these specific fields yet
  const displayAlerts = alerts.length > 0 ? alerts : [
    { id: 1, customer_id: '123', name: 'David Miller', severity: 'Urgent', reason: 'Multiple claims in last 3 months. Policy premium increased by 15%. High churn risk.', action: 'Call Now' },
    { id: 2, customer_id: '124', name: 'Elena Rodriguez', severity: 'Medium', reason: 'Missed second payment reminder. Auto-pay card expired last week.', action: 'Update Card' },
    { id: 3, customer_id: '125', name: 'Mark Thompson', severity: 'Low', reason: 'Browsing competitor rates via partner portal link.', action: 'Offer Discount' }
  ];

  const displayCustomers = customers.length > 0 ? customers : [
    { id: '1', first_name: 'Sarah', last_name: 'Jenkins', type: 'Homeowner', date: 'Oct 24, 2023', premium: '$1,420.00' },
    { id: '2', first_name: 'Michael', last_name: 'Chen', type: 'Auto Gold', date: 'Oct 28, 2023', premium: '$850.50' },
    { id: '3', first_name: 'The', last_name: 'Robertsons', type: 'Comprehensive', date: 'Nov 02, 2023', premium: '$2,100.00' },
    { id: '4', first_name: 'Lila', last_name: 'Vance', type: 'Life Term', date: 'Nov 05, 2023', premium: '$125.00' }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-background min-h-screen relative animate-in fade-in duration-500">
      {/* Top Bar */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-outline-variant bg-surface/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h2 className="font-h2 text-h2 text-on-surface">Agent Overview</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="text-outline absolute left-3 top-1/2 -translate-y-1/2 w-[20px] h-[20px]" />
            <input 
              className="bg-surface-container border-none rounded-full pl-10 pr-4 py-1.5 font-body text-body focus:ring-2 focus:ring-primary w-64 transition-all" 
              placeholder="Quick search..." 
              type="text" 
            />
          </div>
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Metric Cards Bento Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-xs flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-overline text-overline text-text-secondary">Assigned Customers</span>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-h1 text-h1">{commission?.active_policies || '124'}</span>
              <span className="text-success font-caption text-caption flex items-center">+4% <TrendingUp className="w-3.5 h-3.5 ml-0.5" /></span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-xs flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-overline text-overline text-text-secondary">Renewal Pipeline</span>
              <History className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-h1 text-h1 font-mono-data text-mono-data">$42k</span>
              <span className="text-text-muted font-caption text-caption">Est. Rev</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-xs flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-overline text-overline text-text-secondary">Commission YTD</span>
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-h1 text-h1 font-mono-data text-mono-data">${(commission?.mtd_commission || 8500).toLocaleString()}</span>
              <span className="text-success font-caption text-caption flex items-center">+12% <TrendingUp className="w-3.5 h-3.5 ml-0.5" /></span>
            </div>
          </div>

          <div className="bg-danger-bg p-6 rounded-xl border border-danger/20 shadow-xs flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-overline text-overline text-danger">Retention Alerts</span>
              <AlertCircle className="w-5 h-5 text-danger fill-danger/20" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-h1 text-h1 text-danger">{displayAlerts.length}</span>
              <span className="text-danger font-caption text-caption">Urgent Action</span>
            </div>
          </div>
        </section>

        {/* Main Grid: Renewals & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Upcoming Renewals Table */}
          <section className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xs overflow-hidden flex flex-col">
            <div className="p-6 border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-h3 text-h3 text-on-surface">Upcoming Renewals</h3>
              <button className="text-primary font-caption text-caption hover:underline" onClick={() => navigate('/b2b/agent/customers')}>View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-dim border-b border-outline-variant">
                  <tr>
                    <th className="px-6 py-3 font-overline text-overline text-text-muted">Customer Name</th>
                    <th className="px-6 py-3 font-overline text-overline text-text-muted">Policy Type</th>
                    <th className="px-6 py-3 font-overline text-overline text-text-muted">Renewal Date</th>
                    <th className="px-6 py-3 font-overline text-overline text-text-muted text-right">Premium</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {displayCustomers.map((cust: any, idx: number) => (
                    <tr key={idx} className="hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => navigate(`/b2b/agent/customers/${cust.id}`)}>
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-variant border border-outline-variant flex items-center justify-center font-caption text-caption font-bold text-on-surface-variant">
                          {cust.first_name[0]}{cust.last_name[0]}
                        </div>
                        <span className="font-body text-body font-medium text-on-surface">{cust.first_name} {cust.last_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded bg-surface-container-high text-on-surface-variant font-overline text-overline">
                          {cust.type || 'Standard'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-body text-body text-on-surface">{cust.date || new Date().toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right font-mono-data text-mono-data font-medium text-on-surface">{cust.premium || '$0.00'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Retention Alerts List */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xs flex flex-col">
            <div className="p-6 border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-h3 text-h3 flex items-center gap-2">
                Retention Alerts
                <span className="w-5 h-5 bg-danger text-surface font-caption text-caption flex items-center justify-center rounded-full">{displayAlerts.length}</span>
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {displayAlerts.map((alert: any, idx: number) => {
                const isUrgent = alert.severity === 'Urgent';
                const isMedium = alert.severity === 'Medium';
                
                return (
                  <div key={idx} className={`p-4 rounded-lg border group cursor-pointer transition-colors ${
                    isUrgent ? 'bg-danger-bg border-danger/10 hover:bg-danger/5' : 
                    isMedium ? 'bg-warning-bg border-warning/10 hover:bg-warning/5' : 
                    'bg-surface-container-low border-outline-variant hover:bg-surface-container'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <span className={`font-caption text-caption font-bold ${isUrgent ? 'text-danger' : isMedium ? 'text-warning' : 'text-on-surface'}`}>{alert.name}</span>
                      <span className={`font-overline text-overline text-surface px-1.5 py-0.5 rounded ${isUrgent ? 'bg-danger' : isMedium ? 'bg-warning' : 'bg-on-surface-variant'}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="font-caption text-caption text-on-surface-variant mb-4">{alert.reason}</p>
                    <div className="flex gap-2">
                      <button className={`flex-1 bg-surface border font-caption text-caption font-medium py-2 rounded transition-all ${
                        isUrgent ? 'border-danger text-danger hover:bg-danger hover:text-surface' : 
                        isMedium ? 'border-warning text-warning hover:bg-warning hover:text-surface' : 
                        'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                      }`}>
                        {alert.action}
                      </button>
                      {isUrgent ? (
                        <button className="w-9 h-9 flex items-center justify-center border border-outline-variant rounded hover:bg-surface transition-all">
                          <Mail className="w-4 h-4 text-on-surface-variant" />
                        </button>
                      ) : isMedium && (
                        <button className="w-9 h-9 flex items-center justify-center border border-outline-variant rounded hover:bg-surface transition-all">
                          <Phone className="w-4 h-4 text-on-surface-variant" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* Performance Chart Area (Simulated) */}
        <section className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant shadow-xs">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-h3 text-h3 text-on-surface">Production Performance</h3>
              <p className="font-caption text-caption text-text-secondary mt-1">Monthly comparison of new vs. renewal premium</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="font-caption text-caption text-text-secondary">New Business</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <span className="w-3 h-3 rounded-full bg-secondary"></span>
                <span className="font-caption text-caption text-text-secondary">Renewals</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full flex items-end justify-between px-4 pb-4 border-b border-outline-variant gap-4">
            {['JUN', 'JUL', 'AUG', 'SEP', 'OCT'].map((month, i) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex justify-center gap-1 h-32 items-end">
                  <div className={`w-6 bg-primary rounded-t-sm ${i === 4 ? 'animate-pulse' : ''}`} style={{ height: `${[60, 45, 80, 65, 90][i]}%` }}></div>
                  <div className={`w-6 bg-secondary rounded-t-sm ${i === 4 ? 'animate-pulse' : ''}`} style={{ height: `${[85, 70, 95, 80, 40][i]}%` }}></div>
                </div>
                <span className={`font-overline text-overline ${i === 4 ? 'text-primary' : 'text-text-muted'}`}>{month}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 bg-primary/10 text-primary border border-primary/20 w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 hover:bg-primary hover:text-surface transition-all z-20 group">
        <Plus className="w-6 h-6" />
        <span className="absolute right-16 bg-on-surface text-surface px-3 py-1 rounded font-caption text-caption whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Quick Quote
        </span>
      </button>
    </div>
  )
}

