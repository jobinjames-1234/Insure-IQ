import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, TrendingUp, AlertTriangle, MoreVertical } from 'lucide-react'
import { api } from '../../lib/api'

export function CustomerPortfolioPage() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/agent/customers')
      .then(res => setCustomers(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-text-secondary animate-pulse font-body text-body">Loading portfolio...</div>

  // Use mock data if API is empty for UI showcase
  const displayCustomers = customers.length > 0 ? customers : [
    { id: '1', first_name: 'Sarah', last_name: 'Jenkins', customer_id: 'CUST-8492', policy_count: 3, total_premium: '$4,250.00', next_renewal: 'Oct 12, 2024', lapse_risk: 'None' },
    { id: '2', first_name: 'Michael', last_name: 'Ross', customer_id: 'CUST-7110', policy_count: 1, total_premium: '$1,100.00', next_renewal: 'Sep 28, 2024', lapse_risk: 'Medium' },
    { id: '3', first_name: 'Arthur', last_name: 'Pendelton', customer_id: 'CUST-3329', policy_count: 4, total_premium: '$8,920.00', next_renewal: 'Sep 15, 2024', lapse_risk: 'High' },
    { id: '4', first_name: 'Lin', last_name: 'Chen', customer_id: 'CUST-9011', policy_count: 2, total_premium: '$2,450.50', next_renewal: 'Nov 05, 2024', lapse_risk: 'None' }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-background min-h-screen animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-8">
          <h2 className="font-h1 text-h1 text-on-surface mb-2">Customer Portfolio</h2>
          <p className="font-body text-body text-text-secondary">Overview and management of assigned policies and renewals.</p>
        </header>

        {/* Metrics Summary (Bento Grid Style) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface rounded-xl p-6 shadow-xs border border-outline-variant flex flex-col justify-between">
            <span className="font-overline text-overline text-text-secondary uppercase mb-2 block tracking-wider">Total Assigned Customers</span>
            <div className="font-h1 text-[32px] tracking-tight font-medium text-on-surface">1,248</div>
            <div className="font-caption text-caption text-success mt-2 flex items-center gap-1">
              <TrendingUp className="w-[14px] h-[14px]" /> +3.2% vs last month
            </div>
          </div>
          
          <div className="bg-surface rounded-xl p-6 shadow-xs border border-outline-variant flex flex-col justify-between">
            <span className="font-overline text-overline text-text-secondary uppercase mb-2 block tracking-wider">Active Renewals (30d)</span>
            <div className="font-h1 text-[32px] tracking-tight font-medium text-on-surface">86</div>
            <div className="font-caption text-caption text-text-muted mt-2">Requires action by end of month</div>
          </div>
          
          <div className="bg-danger-bg rounded-xl p-6 shadow-xs border border-danger/20 flex flex-col justify-between">
            <span className="font-overline text-overline text-danger uppercase mb-2 block tracking-wider">Lapse Risk Flags</span>
            <div className="font-h1 text-[32px] tracking-tight font-medium text-danger">12</div>
            <div className="font-caption text-caption text-danger mt-2 flex items-center gap-1">
              <AlertTriangle className="w-[14px] h-[14px]" /> Immediate review recommended
            </div>
          </div>
        </section>

        {/* Data Table Section */}
        <section className="bg-surface rounded-xl shadow-xs border border-outline-variant overflow-hidden">
          
          {/* Toolbar */}
          <div className="p-4 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container-low">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                className="w-full pl-10 pr-4 py-2 h-10 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-body text-body bg-surface" 
                placeholder="Search customers..." 
                type="text"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select className="h-10 border border-outline-variant rounded-lg font-body text-body bg-surface focus:ring-2 focus:ring-primary focus:border-primary px-3 cursor-pointer">
                <option>All Policy Types</option>
                <option>Auto</option>
                <option>Home</option>
                <option>Life</option>
              </select>
              <select className="h-10 border border-outline-variant rounded-lg font-body text-body bg-surface focus:ring-2 focus:ring-primary focus:border-primary px-3 cursor-pointer">
                <option>Any Renewal Window</option>
                <option>Next 30 Days</option>
                <option>Next 60 Days</option>
                <option>Overdue</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="p-4 font-overline text-overline text-text-secondary font-medium tracking-wider">Customer</th>
                  <th className="p-4 font-overline text-overline text-text-secondary font-medium tracking-wider text-right">Policy Count</th>
                  <th className="p-4 font-overline text-overline text-text-secondary font-medium tracking-wider text-right">Total Premium</th>
                  <th className="p-4 font-overline text-overline text-text-secondary font-medium tracking-wider text-right">Next Renewal</th>
                  <th className="p-4 font-overline text-overline text-text-secondary font-medium tracking-wider text-center">Lapse Risk</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant font-body text-body">
                {displayCustomers.map((cust: any, idx: number) => {
                  const isHighRisk = cust.lapse_risk === 'High';
                  const isMediumRisk = cust.lapse_risk === 'Medium';
                  
                  return (
                    <tr key={idx} className="hover:bg-surface-container-low transition-colors group cursor-pointer" onClick={() => navigate(`/b2b/agent/customers/${cust.id}`)}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-caption text-caption font-bold ${
                            idx % 2 === 0 ? 'bg-primary-container text-on-primary-container' : 'bg-secondary-container text-on-secondary-container'
                          }`}>
                            {cust.first_name[0]}{cust.last_name[0]}
                          </div>
                          <div>
                            <div className="font-body text-body text-on-surface font-medium">{cust.first_name} {cust.last_name}</div>
                            <div className="font-caption text-caption text-text-muted">ID: {cust.customer_id || `CUST-10${idx}9`}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono-data text-mono-data text-on-surface text-right">{cust.policy_count || Math.floor(Math.random() * 3) + 1}</td>
                      <td className="p-4 font-mono-data text-mono-data text-on-surface text-right">{cust.total_premium || `$${(Math.random() * 5000 + 500).toFixed(2)}`}</td>
                      <td className={`p-4 font-mono-data text-mono-data text-right ${isHighRisk ? 'text-danger font-medium' : 'text-on-surface'}`}>
                        {cust.next_renewal || new Date().toLocaleDateString()}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full font-caption text-caption uppercase tracking-wider ${
                          isHighRisk ? 'bg-danger-bg text-danger' : 
                          isMediumRisk ? 'bg-warning-bg text-warning' : 
                          'bg-success-bg text-success'
                        }`}>
                          {cust.lapse_risk || 'None'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-text-muted hover:text-primary transition-colors opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); }}>
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-outline-variant flex items-center justify-between bg-surface">
            <span className="font-caption text-caption text-text-secondary">Showing 1 to {displayCustomers.length} of 1,248 entries</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 border border-outline-variant rounded font-caption text-caption text-text-secondary hover:bg-surface-container-low disabled:opacity-50" disabled>Previous</button>
              <button className="px-3 py-1 border border-outline-variant rounded font-caption text-caption text-text-secondary bg-surface-container-low">1</button>
              <button className="px-3 py-1 border border-outline-variant rounded font-caption text-caption text-text-secondary hover:bg-surface-container-low">2</button>
              <button className="px-3 py-1 border border-outline-variant rounded font-caption text-caption text-text-secondary hover:bg-surface-container-low">3</button>
              <span className="font-caption text-caption text-text-secondary">...</span>
              <button className="px-3 py-1 border border-outline-variant rounded font-caption text-caption text-text-secondary hover:bg-surface-container-low">Next</button>
            </div>
          </div>
          
        </section>
      </div>
    </div>
  )
}

