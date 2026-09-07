import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Search, Filter, Download, ChevronDown, ChevronUp } from 'lucide-react'

export function DecisionHistoryPage() {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    api.get('/underwriting/history')
      .then((res: any) => setHistory(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-text-secondary animate-pulse">Loading history...</div>

  // Generate mock history if API doesn't have many
  const displayHistory = history.length > 0 ? history : [
    {
      id: 'UD-8924-A',
      created_at: '2023-10-24T10:00:00Z',
      customer: { first_name: 'Eleanor', last_name: 'Vance' },
      policy_type: 'Life Term - 20Yr',
      risk_score: 92,
      risk_grade: 'A+',
      status: 'approved',
      notes: 'Applicant shows excellent medical history with no pre-existing conditions. Financial standing is robust, comfortably meeting premium requirements for the $1M policy limit. System risk score of 92 aligns with manual review. Approved for standard premium tier without additional riders.',
      reviewed_by: 'Sarah Jenkins',
      time_to_decision: '2h 15m'
    },
    {
      id: 'UD-8923-R',
      created_at: '2023-10-23T14:30:00Z',
      customer: { first_name: 'Marcus', last_name: 'Sterling' },
      policy_type: 'Commercial Prop',
      risk_score: 45,
      risk_grade: 'C-',
      status: 'rejected',
      notes: 'Property is located in a high-risk flood zone (Zone AE) without adequate modern mitigation systems installed. Previous claim history shows two significant water damage claims in the last five years. Risk score is below threshold for standard or sub-standard tiers. Decline based on unacceptable location risk profile.',
      reviewed_by: 'David Chen',
      time_to_decision: '1d 4h'
    },
    {
      id: 'UD-8922-R',
      created_at: '2023-10-22T09:15:00Z',
      customer: { first_name: 'TechNova', last_name: 'Inc.' },
      policy_type: 'Cyber Liability',
      risk_score: 78,
      risk_grade: 'B',
      status: 'referred',
      notes: 'Applicant operates in a high-target industry segment (FinTech infrastructure). While their basic security posture appears solid (SOC2 Type II verified), the requested limit of $10M exceeds my current authority level for this specific class code. Referring to Chief Underwriting Officer for final sign-off on limits.',
      reviewed_by: 'Sarah Jenkins',
      referred_to: 'Amanda Reyes (CUO)',
      time_to_decision: '4h 30m'
    }
  ]

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success'
      case 'rejected': return 'bg-danger'
      case 'referred': return 'bg-warning'
      default: return 'bg-outline'
    }
  }

  const getScoreBadgeClass = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success-bg text-success'
      case 'rejected': return 'bg-danger-bg text-danger'
      case 'referred': return 'bg-warning-bg text-warning'
      default: return 'bg-surface-variant text-on-surface'
    }
  }

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="font-h1 text-h1 text-on-surface mb-2">Decision History</h1>
            <p className="font-body text-body text-text-secondary">Review past underwriting decisions and justifications.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-text-muted" />
              <input 
                type="text" 
                placeholder="Search applicant..." 
                className="pl-10 pr-4 py-2 h-[40px] rounded border border-outline-variant bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body text-body text-on-surface placeholder:text-text-muted w-64 shadow-xs"
              />
            </div>
            <button className="h-[40px] px-4 rounded bg-surface border border-outline-variant text-on-surface font-body text-body flex items-center gap-2 hover:bg-surface-container-low transition-colors shadow-xs">
              <Filter className="w-[18px] h-[18px]" /> Filter
            </button>
            <button className="h-[40px] px-4 rounded bg-primary text-white font-body text-body flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-xs">
              <Download className="w-[18px] h-[18px]" /> Export
            </button>
          </div>
        </header>

        {/* Table Container */}
        <div className="bg-surface rounded-lg shadow-xs border border-outline-variant overflow-hidden">
          
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-outline-variant bg-surface-container-low">
            <div className="col-span-1"></div>
            <div className="col-span-2 font-caption text-caption text-text-secondary uppercase tracking-wider font-semibold">Date</div>
            <div className="col-span-3 font-caption text-caption text-text-secondary uppercase tracking-wider font-semibold">Applicant Name</div>
            <div className="col-span-2 font-caption text-caption text-text-secondary uppercase tracking-wider font-semibold">Policy Type</div>
            <div className="col-span-2 font-caption text-caption text-text-secondary uppercase tracking-wider font-semibold text-right">Risk Score</div>
            <div className="col-span-2 font-caption text-caption text-text-secondary uppercase tracking-wider font-semibold text-right">Decision</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-outline-variant">
            {displayHistory.map((item, index) => {
              const isExpanded = expandedId === item.id
              const statusLabel = item.status.charAt(0).toUpperCase() + item.status.slice(1)
              const dateStr = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

              return (
                <div key={item.id || index} className={`group ${isExpanded ? 'bg-surface-container-low' : ''}`}>
                  <div 
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-surface-container-low cursor-pointer transition-colors"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <div className="col-span-1 flex justify-center text-text-muted">
                      <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                    <div className="col-span-2 font-mono-data text-mono-data text-on-surface">{dateStr}</div>
                    <div className="col-span-3 font-body text-body text-on-surface font-medium">
                      {item.customer?.first_name} {item.customer?.last_name}
                    </div>
                    <div className="col-span-2 font-body text-body text-text-secondary">
                      {item.policy_type}
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <span className={`px-2 py-1 rounded-full font-caption text-caption font-semibold ${getScoreBadgeClass(item.status)}`}>
                        {item.risk_grade || 'B'} ({item.risk_score})
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-end items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`}></span>
                      <span className="font-body text-body text-on-surface">{statusLabel}</span>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <div className="bg-bg-muted px-6 py-4 border-t border-outline-variant border-dashed">
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-1"></div>
                        <div className="col-span-11">
                          <div className="mb-4">
                            <h4 className="font-caption text-caption text-text-secondary uppercase tracking-wider mb-1">Underwriter Notes</h4>
                            <p className="font-body text-body text-on-surface max-w-3xl leading-relaxed">
                              {item.notes}
                            </p>
                          </div>
                          <div className="flex gap-6">
                            <div>
                              <span className="font-caption text-caption text-text-secondary block mb-1">Reviewed By</span>
                              <span className="font-body text-body text-on-surface">{item.reviewed_by}</span>
                            </div>
                            {item.referred_to && (
                              <div>
                                <span className="font-caption text-caption text-text-secondary block mb-1">Referred To</span>
                                <span className="font-body text-body text-on-surface">{item.referred_to}</span>
                              </div>
                            )}
                            <div>
                              <span className="font-caption text-caption text-text-secondary block mb-1">Time to Decision</span>
                              <span className="font-mono-data text-mono-data text-on-surface">{item.time_to_decision}</span>
                            </div>
                            <div>
                              <span className="font-caption text-caption text-text-secondary block mb-1">ID</span>
                              <span className="font-mono-data text-mono-data text-text-muted">#{item.id}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-outline-variant bg-surface flex items-center justify-between">
            <span className="font-body text-body text-text-secondary">Showing 1 to {displayHistory.length} of 128 decisions</span>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded flex items-center justify-center border border-outline-variant text-text-muted disabled:opacity-50" disabled>
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
              <button className="w-8 h-8 rounded flex items-center justify-center bg-primary text-white font-body text-body font-medium">1</button>
              <button className="w-8 h-8 rounded flex items-center justify-center border border-outline-variant text-on-surface font-body text-body hover:bg-surface-container-low transition-colors">2</button>
              <button className="w-8 h-8 rounded flex items-center justify-center border border-outline-variant text-on-surface font-body text-body hover:bg-surface-container-low transition-colors">3</button>
              <span className="font-body text-body text-text-muted px-1">...</span>
              <button className="w-8 h-8 rounded flex items-center justify-center border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors">
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
