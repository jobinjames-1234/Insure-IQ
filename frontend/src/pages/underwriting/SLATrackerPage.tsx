import { useState, useEffect } from 'react'
import { Filter, Search, Home, Car, Activity } from 'lucide-react'
import { api } from '../../lib/api'

// Define local interfaces for the mock data matching the UI
interface SLAClaim {
  id: string
  name: string
  type: string
  target: number
  elapsed: number
  icon: any
}

const FALLBACK_DATA: SLAClaim[] = [
  { id: 'CLM-89241', name: 'Sarah Jenkins', type: 'Property', target: 14, elapsed: 13, icon: Home },
  { id: 'CLM-89105', name: 'Marcus Thorne', type: 'Auto', target: 7, elapsed: 6, icon: Car },
  { id: 'CLM-89332', name: 'Elena Rostova', type: 'Medical', target: 21, elapsed: 15, icon: Activity },
  { id: 'CLM-89410', name: 'David Chen', type: 'Auto', target: 7, elapsed: 2, icon: Car },
]

export function SLATrackerPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [claims, setClaims] = useState<SLAClaim[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mocking a backend fetch for SLA data
    // In a real app this would hit an endpoint calculating real-time elapsed durations against SLA targets
    setTimeout(() => {
      setClaims(FALLBACK_DATA)
      setLoading(false)
    }, 600)
  }, [])

  const getSLAStatus = (elapsed: number, target: number) => {
    const ratio = elapsed / target
    if (ratio >= 0.8) return { type: 'Critical', color: 'danger', bg: 'bg-danger', text: 'text-danger', badge: 'bg-danger-bg text-danger' }
    if (ratio >= 0.6) return { type: 'Warning', color: 'warning', bg: 'bg-warning', text: 'text-warning', badge: 'bg-warning-bg text-warning' }
    return { type: 'On Track', color: 'success', bg: 'bg-success', text: 'text-success', badge: 'bg-success-bg text-success' }
  }

  const criticalCount = claims.filter(c => (c.elapsed / c.target) >= 0.8).length
  const warningCount = claims.filter(c => (c.elapsed / c.target) >= 0.6 && (c.elapsed / c.target) < 0.8).length
  const totalCount = 143 // Mock total open from prototype

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Header area */}
      <header className="px-6 py-6 bg-surface border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 shadow-xs">
        <div>
          <h2 className="font-h2 text-h2 text-on-surface mb-1">SLA Triage</h2>
          <p className="font-body text-body text-text-muted">Prioritize claims approaching settlement target limits.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-[18px] h-[18px]" />
            <input 
              className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body text-body text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-fixed-dim transition-all" 
              placeholder="Search Claim ID..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-2 hover:bg-surface-container-low transition-colors flex items-center justify-center text-on-surface-variant">
            <Filter className="w-[18px] h-[18px]" />
          </button>
        </div>
      </header>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto bg-surface-dim p-6">
        <div className="max-w-[1200px] mx-auto">
          
          {/* Status Summary */}
          <div className="flex gap-4 mb-6">
            <div className="bg-surface border border-outline-variant rounded-lg p-4 flex-1 shadow-xs">
              <p className="font-overline text-overline text-on-surface-variant uppercase mb-1">Critical (80%+ SLA)</p>
              <p className="font-h1 text-h1 text-danger">{loading ? '-' : criticalCount}</p>
            </div>
            <div className="bg-surface border border-outline-variant rounded-lg p-4 flex-1 shadow-xs">
              <p className="font-overline text-overline text-on-surface-variant uppercase mb-1">Warning (60-80% SLA)</p>
              <p className="font-h1 text-h1 text-warning">{loading ? '-' : warningCount}</p>
            </div>
            <div className="bg-surface border border-outline-variant rounded-lg p-4 flex-1 shadow-xs">
              <p className="font-overline text-overline text-on-surface-variant uppercase mb-1">Total Open</p>
              <p className="font-h1 text-h1 text-on-surface">{totalCount}</p>
            </div>
          </div>

          {/* List Header (Desktop) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-outline-variant text-on-surface-variant font-overline text-overline uppercase mb-2">
            <div className="col-span-2">Claim ID</div>
            <div className="col-span-3">Insured Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2 text-right">Target Days</div>
            <div className="col-span-3">SLA Progress</div>
          </div>

          {/* List Items */}
          <div className="space-y-3">
            {loading ? (
               <div className="p-8 text-center text-text-secondary animate-pulse font-body text-body">Loading SLA data...</div>
            ) : claims.filter(c => c.id.toLowerCase().includes(searchTerm.toLowerCase())).map((claim) => {
              const status = getSLAStatus(claim.elapsed, claim.target)
              const percent = Math.min(100, Math.round((claim.elapsed / claim.target) * 100))
              const Icon = claim.icon
              
              return (
                <div key={claim.id} className="bg-surface rounded-lg shadow-xs border border-outline-variant relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer">
                  {status.type !== 'On Track' && (
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${status.bg}`}></div>
                  )}
                  <div className={`p-4 md:px-6 md:py-4 md:grid md:grid-cols-12 md:gap-4 md:items-center flex flex-col gap-3 ${status.type === 'On Track' ? 'pl-5 md:pl-7' : ''}`}>
                    <div className="col-span-2 flex items-center justify-between md:block">
                      <span className="font-mono-data text-mono-data text-on-surface font-medium">{claim.id}</span>
                      <span className={`md:hidden px-2 py-0.5 rounded-full font-overline text-overline uppercase ${status.badge}`}>
                        {status.type}
                      </span>
                    </div>
                    
                    <div className="col-span-3 font-body text-body text-on-surface truncate">
                      {claim.name}
                    </div>
                    
                    <div className="col-span-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface-container-high font-caption text-caption font-medium text-on-surface">
                        <Icon className="w-[14px] h-[14px]" />
                        {claim.type}
                      </span>
                    </div>
                    
                    <div className="col-span-2 md:text-right font-mono-data text-mono-data text-text-secondary flex justify-between md:block">
                      <span className="md:hidden font-caption text-caption font-medium">Target: </span>
                      {claim.target} Days
                    </div>
                    
                    <div className="col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-caption text-caption font-medium ${status.text}`}>{claim.elapsed} Days Elapsed</span>
                        <span className="font-caption text-caption font-medium text-text-muted">{percent}%</span>
                      </div>
                      <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                        <div className={`h-1.5 rounded-full ${status.bg}`} style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
