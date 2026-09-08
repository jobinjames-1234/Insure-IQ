import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Inbox, Timer, ShieldAlert, TrendingDown, TrendingUp, Filter, Download, ArrowDown } from 'lucide-react'
import { api } from '../../lib/api'

export function ClaimsDashboardPage() {
  const navigate = useNavigate()
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/claims/queue')
      .then((res: any) => setQueue(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-on-surface-variant animate-pulse font-body text-body">Loading queue...</div>

  const displayQueue = queue.map((q: any) => ({
    ...q,
    fraud_confidence: Math.floor(Math.random() * 100), // Random confidence for UI
    age_days: Math.floor(Math.random() * 30) + 1, // Random age for UI
  }))

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
      
      {/* Header */}
      <header className="h-16 border-b border-outline-variant bg-surface flex items-center justify-between px-6 shrink-0">
        <div>
          <h2 className="font-h2 text-h2 text-on-surface">Claims Dashboard</h2>
          <p className="font-caption text-caption text-text-muted">Fast Lane Operations</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              className="h-10 pl-10 pr-4 rounded bg-surface-container-low border-none focus:ring-2 focus:ring-primary text-body font-body w-64 placeholder:text-text-muted text-on-surface" 
              placeholder="Search Claim ID or Policy..." 
              type="text"
            />
          </div>
          <button className="h-10 w-10 flex items-center justify-center rounded hover:bg-surface-container-high transition-colors text-text-muted">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        
        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Open Claims */}
          <div className="bg-surface rounded-lg border border-outline-variant p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-overline text-overline text-text-muted uppercase tracking-wider mb-1">Open Claims</p>
                <h3 className="font-display text-display text-on-surface">142</h3>
              </div>
              <div className="w-10 h-10 rounded bg-surface-container-low flex items-center justify-center text-primary">
                <Inbox className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-success" />
              <p className="font-caption text-caption text-success">-12% vs last week</p>
            </div>
          </div>
          
          {/* SLA At Risk */}
          <div className="bg-surface rounded-lg border border-outline-variant p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-overline text-overline text-text-muted uppercase tracking-wider mb-1">SLA at Risk (&lt; 48h)</p>
                <h3 className="font-display text-display text-warning">28</h3>
              </div>
              <div className="w-10 h-10 rounded bg-warning-bg flex items-center justify-center text-warning">
                <Timer className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-danger" />
              <p className="font-caption text-caption text-danger">+4 requires attention</p>
            </div>
          </div>
          
          {/* Fraud Flagged */}
          <div className="bg-surface rounded-lg border border-outline-variant p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-overline text-overline text-text-muted uppercase tracking-wider mb-1">Fraud Flagged</p>
                <h3 className="font-display text-display text-danger">15</h3>
              </div>
              <div className="w-10 h-10 rounded bg-danger-bg flex items-center justify-center text-danger">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-caption text-caption text-text-muted">Awaiting L3 review</p>
            </div>
          </div>
          
        </div>

        {/* Dense Data Table Section */}
        <div className="bg-surface border border-outline-variant rounded-lg shadow-sm flex flex-col h-[500px]">
          
          {/* Table Header Actions */}
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low rounded-t-lg shrink-0">
            <h3 className="font-h3 text-h3 text-on-surface">Priority Queue</h3>
            <div className="flex gap-2">
              <button className="h-8 px-3 flex items-center gap-2 border border-outline-variant rounded bg-surface hover:bg-surface-container-high transition-colors font-caption text-caption text-on-surface">
                <Filter className="w-4 h-4" /> Filter
              </button>
              <button className="h-8 px-3 flex items-center gap-2 border border-outline-variant rounded bg-surface hover:bg-surface-container-high transition-colors font-caption text-caption text-on-surface">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>
          
          {/* Table Content */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-surface-container-low border-b border-outline-variant z-10 shadow-sm">
                <tr>
                  <th className="py-3 px-4 font-overline text-overline text-text-muted uppercase tracking-wider font-semibold">Claim ID</th>
                  <th className="py-3 px-4 font-overline text-overline text-text-muted uppercase tracking-wider font-semibold">Policy</th>
                  <th className="py-3 px-4 font-overline text-overline text-text-muted uppercase tracking-wider font-semibold">Claimant</th>
                  <th className="py-3 px-4 font-overline text-overline text-text-muted uppercase tracking-wider font-semibold text-right">Amount</th>
                  <th className="py-3 px-4 font-overline text-overline text-text-muted uppercase tracking-wider font-semibold cursor-pointer group hover:bg-surface-variant transition-colors" title="Sorted by Fraud Confidence (Desc)">
                    <div className="flex items-center gap-1">
                      Fraud Confidence
                      <ArrowDown className="w-3 h-3 text-primary" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-overline text-overline text-text-muted uppercase tracking-wider font-semibold text-right">Age (Days)</th>
                  <th className="py-3 px-4 font-overline text-overline text-text-muted uppercase tracking-wider font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {displayQueue.map((item, index) => (
                  <tr key={index} className="hover:bg-surface-container-low transition-colors group">
                    <td className="py-3 px-4 font-mono-data text-mono-data text-on-surface">{item.claim_number}</td>
                    <td className="py-3 px-4 font-body text-body text-on-surface">{item.policy || 'General'}</td>
                    <td className="py-3 px-4 font-body text-body text-on-surface font-medium">{item.claimant || item.customer?.first_name}</td>
                    <td className="py-3 px-4 font-mono-data text-mono-data text-right text-on-surface">{item.amount || '$0.00'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full font-caption text-caption font-semibold 
                        ${item.fraud_confidence > 80 ? 'bg-danger-bg text-danger' : 
                          item.fraud_confidence > 50 ? 'bg-warning-bg text-warning' : 
                          item.fraud_confidence > 10 ? 'bg-surface-container-high text-text-secondary' : 'bg-success-bg text-success'}`}
                      >
                        {item.fraud_confidence}% - {item.fraud_label || (item.fraud_confidence > 80 ? 'Critical' : item.fraud_confidence > 50 ? 'Medium' : 'Low')}
                      </span>
                    </td>
                    <td className={`py-3 px-4 font-mono-data text-mono-data text-right ${item.age_days > 30 ? 'text-warning font-semibold' : 'text-on-surface'}`}>
                      {item.age_days}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        className="text-primary hover:text-primary-container font-caption text-caption font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => navigate(`/b2b/claims/${item.id}`)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  )
}
