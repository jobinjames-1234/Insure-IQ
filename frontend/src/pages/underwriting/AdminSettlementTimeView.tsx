import { useState } from 'react'
import { ArrowBack, Search, FilterList, Download, MoreVert } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

export function AdminSettlementTimeView() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const mockSettlements = [
    { id: 'SET-991', claimId: 'CLM-8820', customer: 'Acme Corp', duration: '3.2 Days', target: '5.0 Days', dateClosed: 'Oct 10, 2023', status: 'Met SLA' },
    { id: 'SET-992', claimId: 'CLM-8821', customer: 'Soylent', duration: '6.5 Days', target: '5.0 Days', dateClosed: 'Oct 09, 2023', status: 'Missed SLA' },
    { id: 'SET-993', claimId: 'CLM-8822', customer: 'Globex Inc', duration: '4.1 Days', target: '5.0 Days', dateClosed: 'Oct 08, 2023', status: 'Met SLA' },
    { id: 'SET-994', claimId: 'CLM-8823', customer: 'Umbrella Corp', duration: '2.8 Days', target: '5.0 Days', dateClosed: 'Oct 07, 2023', status: 'Met SLA' },
    { id: 'SET-995', claimId: 'CLM-8824', customer: 'Initech', duration: '8.2 Days', target: '5.0 Days', dateClosed: 'Oct 05, 2023', status: 'Missed SLA' },
  ]

  const displaySettlements = mockSettlements.filter(s => 
    s.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.claimId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Header */}
      <header className="flex justify-between items-center px-gutter w-full h-16 bg-surface border-b border-outline-variant z-40 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/b2b/admin')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
            <ArrowBack className="text-on-surface-variant" />
          </button>
          <div className="flex flex-col">
            <h2 className="font-h3 text-h3 text-on-surface">Avg Settlement Time</h2>
            <span className="text-caption text-text-secondary font-body">Historical breakdown of claim resolution speed and SLA</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-on-surface font-body text-body hover:bg-surface-container-low transition-colors">
            <Download className="text-[18px]" />
            Export CSV
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-gutter space-y-6">
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
              <input 
                className="w-full h-10 pl-10 pr-4 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body text-body text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted" 
                placeholder="Search by ID, Claim ID, or Customer..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-2 px-4 h-10 border border-outline-variant rounded-DEFAULT text-on-surface hover:bg-surface-container-low transition-colors font-body text-body">
              <FilterList className="text-[18px]" />
              Filter
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-lowest border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Settlement ID</th>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Claim ID</th>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Target SLA</th>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Date Closed</th>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant bg-surface">
                {displaySettlements.map((settlement) => (
                  <tr key={settlement.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4 font-mono-data text-body font-medium text-primary">{settlement.id}</td>
                    <td className="px-6 py-4 font-mono-data text-body text-text-secondary">{settlement.claimId}</td>
                    <td className="px-6 py-4 font-body text-body text-on-surface font-medium">{settlement.customer}</td>
                    <td className="px-6 py-4 font-mono-data text-body text-on-surface">{settlement.duration}</td>
                    <td className="px-6 py-4 font-mono-data text-body text-text-secondary">{settlement.target}</td>
                    <td className="px-6 py-4 font-body text-body text-text-secondary">{settlement.dateClosed}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold tracking-wide uppercase ${
                        settlement.status === 'Met SLA' ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'
                      }`}>
                        {settlement.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-on-surface-variant hover:text-on-surface transition-colors">
                        <MoreVert />
                      </button>
                    </td>
                  </tr>
                ))}
                {displaySettlements.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-text-secondary font-body">No settlements found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
