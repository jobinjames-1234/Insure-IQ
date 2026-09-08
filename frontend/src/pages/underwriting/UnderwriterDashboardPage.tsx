import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, RefreshCw, Filter, Calendar, ChevronLeft, ChevronRight, AlertTriangle, ChevronDown } from 'lucide-react'
import { api } from '../../lib/api'

export function UnderwriterDashboardPage() {
  const navigate = useNavigate()
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/underwriting/queue')
      .then((res: any) => setQueue(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-text-secondary animate-pulse">Loading queue...</div>

  const displayQueue = queue;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
      
      {/* Header */}
      <header className="h-14 border-b border-outline-variant flex items-center justify-between px-gutter bg-surface shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="font-h3 text-h3 text-on-surface">Application Queue</h2>
          <span className="bg-primary-fixed text-primary px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider font-mono tabular-nums">Live Feed</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border border-white"></span>
          </button>
          <div className="h-6 w-px bg-outline-variant mx-1"></div>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-primary px-3 py-1.5 rounded-lg text-white hover:opacity-90 transition-opacity shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="font-caption text-caption">Sync Queue</span>
          </button>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-gutter space-y-6 animate-in fade-in duration-500">
        
        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-surface p-6 rounded-lg border border-outline-variant shadow-xs flex flex-col">
            <span className="text-overline text-text-muted uppercase mb-1">Pending Review</span>
            <div className="flex items-baseline gap-2">
              <span className="font-h1 text-h1 text-on-surface tabular-nums">{displayQueue.length}</span>
              <span className="text-success font-caption text-caption font-bold flex items-center">
                <ChevronDown className="w-4 h-4" /> 12%
              </span>
            </div>
            <div className="mt-4 w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[65%]"></div>
            </div>
          </div>
          
          <div className="bg-surface p-6 rounded-lg border border-outline-variant shadow-xs flex flex-col">
            <span className="text-overline text-text-muted uppercase mb-1">Avg Risk Score</span>
            <div className="flex items-baseline gap-2">
              <span className="font-h1 text-h1 text-warning tabular-nums">42</span>
              <span className="text-text-muted font-caption text-caption">/ 100</span>
            </div>
            <p className="font-caption text-caption text-text-muted mt-2">Moderate portfolio volatility</p>
          </div>
          
          <div className="bg-surface p-6 rounded-lg border border-outline-variant shadow-xs flex flex-col">
            <span className="text-overline text-text-muted uppercase mb-1">Approved Today</span>
            <div className="flex items-baseline gap-2">
              <span className="font-h1 text-h1 text-on-surface tabular-nums">5</span>
              <span className="text-primary-fixed-dim font-caption text-caption font-medium">Target: 12</span>
            </div>
            <div className="mt-4 flex gap-1">
              {[...Array(5)].map((_, i) => <div key={i} className="h-1 flex-1 bg-primary rounded-full"></div>)}
              {[...Array(3)].map((_, i) => <div key={i+5} className="h-1 flex-1 bg-surface-container-highest rounded-full"></div>)}
            </div>
          </div>
          
        </div>

        {/* Filters Row */}
        <div className="flex items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-2">
            <button className="bg-surface border border-outline-variant px-3 py-1.5 rounded flex items-center gap-2 font-caption text-caption font-semibold text-on-surface hover:bg-surface-container transition-colors shadow-xs">
              <Filter className="w-4 h-4" /> Filter View
            </button>
            <button className="bg-surface border border-outline-variant px-3 py-1.5 rounded flex items-center gap-2 font-caption text-caption font-semibold text-on-surface hover:bg-surface-container transition-colors shadow-xs">
              <Calendar className="w-4 h-4" /> All Dates
            </button>
          </div>
          <div className="font-caption text-caption text-text-muted">
            Showing 1-{displayQueue.length} of {displayQueue.length} records
          </div>
        </div>

        {/* Application Queue Table */}
        <div className="bg-surface rounded-lg border border-outline-variant shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-6 py-3 text-overline text-on-surface-variant font-bold uppercase tracking-wider">Applicant Name</th>
                  <th className="px-6 py-3 text-overline text-on-surface-variant font-bold uppercase tracking-wider">Policy Type</th>
                  <th className="px-6 py-3 text-overline text-on-surface-variant font-bold uppercase tracking-wider text-right">Premium</th>
                  <th className="px-6 py-3 text-overline text-on-surface-variant font-bold uppercase tracking-wider text-center">Risk Score</th>
                  <th className="px-6 py-3 text-overline text-on-surface-variant font-bold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-overline text-on-surface-variant font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {displayQueue.map((item, index) => (
                  <tr key={index} className="hover:bg-surface-container-low transition-colors group cursor-pointer" onClick={() => navigate(`/b2b/underwriting/${item.id}`)}>
                    <td className="px-6 py-4 font-semibold text-on-surface">{item.name || item.customer?.first_name + ' ' + item.customer?.last_name}</td>
                    <td className="px-6 py-4 text-text-secondary">{item.policy || 'General'}</td>
                    <td className="px-6 py-4 text-right font-mono-data tabular-nums text-on-surface">{item.premium || '$0.00'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-caption text-caption font-bold tabular-nums
                        ${item.riskLevel === 'low' || item.risk_score < 40 ? 'bg-success-bg text-success' : 
                          item.riskLevel === 'high' || item.risk_score > 70 ? 'bg-danger-bg text-danger' : 
                          'bg-warning-bg text-warning'}`}
                      >
                        {item.riskScore || item.risk_score} {item.riskLevel || (item.risk_score < 40 ? 'low' : item.risk_score > 70 ? 'high' : 'medium')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-2 font-medium
                        ${item.status === 'Critical' ? 'text-danger' : 
                          item.status === 'In Review' ? 'text-primary' : 'text-text-secondary'}`}
                      >
                        {item.status === 'Critical' && <AlertTriangle className="w-4 h-4" />}
                        {item.status === 'In Review' && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>}
                        {item.status || item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        className="text-primary hover:underline font-caption text-caption font-semibold"
                        onClick={(e) => { e.stopPropagation(); navigate(`/b2b/underwriting/${item.id}`) }}
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
        
        {/* Footer Pagination */}
        <div className="flex items-center justify-between border-t border-outline-variant pt-6 pb-12">
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded bg-surface hover:bg-surface-container transition-colors disabled:opacity-50 shadow-xs" disabled>
              <ChevronLeft className="w-4 h-4 text-text-secondary" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded font-caption text-caption shadow-xs">1</button>
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant bg-surface rounded hover:bg-surface-container transition-colors font-caption text-caption text-on-surface shadow-xs">2</button>
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded bg-surface hover:bg-surface-container transition-colors shadow-xs">
              <ChevronRight className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
          <div className="font-caption text-caption text-text-muted italic">
            All financial data reflects UTC+0 market rates.
          </div>
        </div>

      </div>
    </div>
  )
}
