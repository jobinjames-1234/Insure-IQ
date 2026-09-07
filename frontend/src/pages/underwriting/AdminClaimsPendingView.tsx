import { useState } from 'react'
import { ArrowBack, Search, FilterList, Download, MoreVert } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

export function AdminClaimsPendingView() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const mockClaims = [
    { id: 'CLM-8829', customer: 'Globex Inc', type: 'Property Damage', amount: '$45,000', dateFiled: 'Oct 14, 2023', status: 'In Review' },
    { id: 'CLM-8830', customer: 'Acme Corp', type: 'Auto Liability', amount: '$12,500', dateFiled: 'Oct 13, 2023', status: 'Awaiting Docs' },
    { id: 'CLM-8831', customer: 'Initech', type: 'Cyber Breach', amount: '$120,000', dateFiled: 'Oct 12, 2023', status: 'In Review' },
    { id: 'CLM-8832', customer: 'Soylent', type: 'Workers Comp', amount: '$8,900', dateFiled: 'Oct 10, 2023', status: 'Processing' },
    { id: 'CLM-8833', customer: 'Umbrella Corp', type: 'General Liability', amount: '$34,200', dateFiled: 'Oct 09, 2023', status: 'Awaiting Docs' },
  ]

  const displayClaims = mockClaims.filter(c => 
    c.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h2 className="font-h3 text-h3 text-on-surface">Claims Pending</h2>
            <span className="text-caption text-text-secondary font-body">Overview of all active claims requiring attention</span>
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
                placeholder="Search claims by ID or Customer..." 
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
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Claim ID</th>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Est Amount</th>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Date Filed</th>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant bg-surface">
                {displayClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4 font-mono-data text-body font-medium text-primary">{claim.id}</td>
                    <td className="px-6 py-4 font-body text-body text-on-surface font-medium">{claim.customer}</td>
                    <td className="px-6 py-4 font-body text-body text-text-secondary">{claim.type}</td>
                    <td className="px-6 py-4 font-mono-data text-body text-on-surface">{claim.amount}</td>
                    <td className="px-6 py-4 font-body text-body text-text-secondary">{claim.dateFiled}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold tracking-wide uppercase ${
                        claim.status === 'Processing' ? 'bg-success-bg text-success' : 
                        claim.status === 'Awaiting Docs' ? 'bg-danger-bg text-danger' : 
                        'bg-warning-bg text-warning'
                      }`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-on-surface-variant hover:text-on-surface transition-colors">
                        <MoreVert />
                      </button>
                    </td>
                  </tr>
                ))}
                {displayClaims.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-text-secondary font-body">No claims found matching your search.</td>
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
