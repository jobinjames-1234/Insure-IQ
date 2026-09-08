import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { TrendingUp, Clock, DollarSign, Download, Search } from 'lucide-react'

export function CommissionTrackerPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/agent/commission')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-text-secondary animate-pulse font-body text-body">Loading commissions...</div>

  const ledger = data?.ledger || []

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background min-w-full">
      {/* Header */}
      <header className="px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant bg-surface shrink-0 gap-4">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface">Commission Tracker</h1>
          <p className="font-body text-body text-text-secondary mt-2">Monitor your earnings and pending payouts.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <select className="appearance-none bg-surface border border-outline-variant rounded-lg px-4 py-2 pr-10 font-body text-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm cursor-pointer hover:bg-surface-container-low transition-colors">
              <option>This Month</option>
              <option>Last Month</option>
              <option>Q3 2023</option>
              <option>Year to Date</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-muted">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-primary font-body text-body hover:bg-surface-container-low transition-colors border border-transparent shadow-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-surface-dim">
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
          
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface rounded-xl p-6 shadow-xs border border-outline-variant flex flex-col hover:shadow-md transition-shadow">
              <p className="font-overline text-overline text-text-secondary uppercase tracking-wider mb-2">Earnings This Month</p>
              <p className="font-mono-data text-[32px] font-medium text-on-surface tracking-tight mt-auto">
                ${(data?.mtd_commission || 12450).toLocaleString(undefined, {minimumFractionDigits: 2})}
              </p>
              <div className="flex items-center gap-1 mt-2 text-success font-caption text-caption">
                <TrendingUp className="w-4 h-4" />
                <span>+8.2% vs last month</span>
              </div>
            </div>
            
            <div className="bg-surface rounded-xl p-6 shadow-xs border border-outline-variant flex flex-col hover:shadow-md transition-shadow">
              <p className="font-overline text-overline text-text-secondary uppercase tracking-wider mb-2">Pending Commissions</p>
              <p className="font-mono-data text-[32px] font-medium text-warning tracking-tight mt-auto">
                ${(data?.pending_commission || 3120.50).toLocaleString(undefined, {minimumFractionDigits: 2})}
              </p>
              <p className="font-caption text-caption text-text-muted mt-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Expected payout in 5 days
              </p>
            </div>
            
            <div className="bg-surface rounded-xl p-6 shadow-xs border border-outline-variant flex flex-col hover:shadow-md transition-shadow">
              <p className="font-overline text-overline text-text-secondary uppercase tracking-wider mb-2">Total Year-to-Date</p>
              <p className="font-mono-data text-[32px] font-medium text-on-surface tracking-tight mt-auto">
                ${(data?.ytd_commission || 84900).toLocaleString(undefined, {minimumFractionDigits: 2})}
              </p>
              <div className="flex items-center gap-2 mt-2 text-text-secondary font-caption text-caption">
                <div className="w-full bg-outline-variant rounded-full h-1.5 flex-1 max-w-[100px]">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <span>85% of annual goal</span>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-surface rounded-xl shadow-xs border border-outline-variant overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="font-h3 text-h3 text-on-surface">Recent Commissions</h3>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg font-body text-body text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface transition-colors" 
                  placeholder="Search policies..." 
                  type="text"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="px-6 py-3 font-overline text-overline text-text-secondary font-medium">Date</th>
                    <th className="px-6 py-3 font-overline text-overline text-text-secondary font-medium">Policy ID</th>
                    <th className="px-6 py-3 font-overline text-overline text-text-secondary font-medium">Customer Name</th>
                    <th className="px-6 py-3 font-overline text-overline text-text-secondary font-medium text-right">Premium Amount</th>
                    <th className="px-6 py-3 font-overline text-overline text-text-secondary font-medium text-right">Commission Earned</th>
                    <th className="px-6 py-3 font-overline text-overline text-text-secondary font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="font-body text-body">
                  {ledger.map((item: any) => (
                    <tr key={item.id} className="hover:bg-surface-container-low transition-colors border-b border-outline-variant">
                      <td className="px-6 py-4 text-on-surface">{item.date}</td>
                      <td className="px-6 py-4 font-mono-data text-mono-data text-text-secondary">{item.policy_id}</td>
                      <td className="px-6 py-4 text-on-surface">{item.customer}</td>
                      <td className="px-6 py-4 font-mono-data text-mono-data text-right text-text-secondary">
                        ${item.premium.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-4 font-mono-data text-mono-data text-right text-on-surface font-medium">
                        ${item.commission.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full font-caption text-caption ${
                          item.status === 'Paid' ? 'bg-success-bg text-success' : 
                          'bg-warning-bg text-warning'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-outline-variant flex items-center justify-between bg-surface">
              <span className="font-caption text-caption text-text-secondary">Showing 1 to {ledger.length} of {ledger.length} entries</span>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 border border-outline-variant rounded font-caption text-caption text-text-secondary disabled:opacity-50" disabled>Previous</button>
                <button className="px-3 py-1 border border-outline-variant rounded font-caption text-caption text-text-secondary bg-surface-container-low">1</button>
                <button className="px-3 py-1 border border-outline-variant rounded font-caption text-caption text-text-secondary disabled:opacity-50" disabled>Next</button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}

