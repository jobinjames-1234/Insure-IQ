import { useState } from 'react'
import { ArrowBack, Search, FilterList, Download, MoreVert } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

export function AdminPoliciesSoldView() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const mockPolicies = [
    { id: 'POL-10023', customer: 'Acme Corp', type: 'Commercial Auto', premium: '$12,400/yr', date: 'Oct 12, 2023', status: 'Active' },
    { id: 'POL-10024', customer: 'Globex Inc', type: 'General Liability', premium: '$8,200/yr', date: 'Oct 11, 2023', status: 'Active' },
    { id: 'POL-10025', customer: 'Initech', type: 'Cyber Security', premium: '$4,100/yr', date: 'Oct 10, 2023', status: 'Pending Review' },
    { id: 'POL-10026', customer: 'Umbrella Corp', type: 'Workers Comp', premium: '$22,000/yr', date: 'Oct 08, 2023', status: 'Active' },
    { id: 'POL-10027', customer: 'Soylent', type: 'Commercial Property', premium: '$15,600/yr', date: 'Oct 05, 2023', status: 'Cancelled' },
  ]

  const displayPolicies = mockPolicies.filter(p => 
    p.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h2 className="font-h3 text-h3 text-on-surface">Policies Sold</h2>
            <span className="text-caption text-text-secondary font-body">Overview of all active and historical policies</span>
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
                placeholder="Search policies by ID or Customer..." 
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
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Policy ID</th>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Premium</th>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant bg-surface">
                {displayPolicies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4 font-mono-data text-body font-medium text-primary">{policy.id}</td>
                    <td className="px-6 py-4 font-body text-body text-on-surface font-medium">{policy.customer}</td>
                    <td className="px-6 py-4 font-body text-body text-text-secondary">{policy.type}</td>
                    <td className="px-6 py-4 font-mono-data text-body text-on-surface">{policy.premium}</td>
                    <td className="px-6 py-4 font-body text-body text-text-secondary">{policy.date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold tracking-wide uppercase ${
                        policy.status === 'Active' ? 'bg-success-bg text-success' : 
                        policy.status === 'Cancelled' ? 'bg-danger-bg text-danger' : 
                        'bg-warning-bg text-warning'
                      }`}>
                        {policy.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-on-surface-variant hover:text-on-surface transition-colors">
                        <MoreVert />
                      </button>
                    </td>
                  </tr>
                ))}
                {displayPolicies.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-text-secondary font-body">No policies found matching your search.</td>
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
