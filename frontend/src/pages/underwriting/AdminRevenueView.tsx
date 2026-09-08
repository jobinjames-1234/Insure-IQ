import { useState, useEffect } from 'react'
import { ArrowBack, Search, FilterList, Download, AccountBalance } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
export function AdminRevenueView() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const [statements, setStatements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const { data } = await api.get('/admin/ledger')
        setStatements(data)
      } catch (err) {
        console.error("Failed to load financial ledger", err)
      } finally {
        setLoading(false)
      }
    }
    fetchLedger()
  }, [])

  const displayStatements = statements.filter(s => 
    s.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h2 className="font-h3 text-h3 text-on-surface">Total Revenue & Bank Statements</h2>
            <span className="text-caption text-text-secondary font-body">Ledger of all financial transactions and payouts</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-on-surface font-body text-body hover:bg-surface-container-low transition-colors">
            <Download className="text-[18px]" />
            Export Ledger
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-gutter space-y-6">
        
        {/* High-level Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-success-bg text-success flex items-center justify-center">
              <AccountBalance />
            </div>
            <div>
              <p className="text-caption font-body text-text-secondary">Current Balance</p>
              <h3 className="font-h2 text-h2 font-mono-data text-on-surface">$1,245,000.00</h3>
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <AccountBalance />
            </div>
            <div>
              <p className="text-caption font-body text-text-secondary">MTD Deposits</p>
              <h3 className="font-h2 text-h2 font-mono-data text-on-surface">$227,700.00</h3>
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-danger-bg text-danger flex items-center justify-center">
              <AccountBalance />
            </div>
            <div>
              <p className="text-caption font-body text-text-secondary">MTD Withdrawals</p>
              <h3 className="font-h2 text-h2 font-mono-data text-on-surface">$49,200.00</h3>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
              <input 
                className="w-full h-10 pl-10 pr-4 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body text-body text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted" 
                placeholder="Search statements by ID or Description..." 
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
            {loading ? (
              <div className="p-12 text-center">Loading...</div>
            ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-lowest border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Statement ID</th>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider text-right">Amount</th>
                  <th className="px-6 py-4 font-overline text-overline text-text-secondary uppercase tracking-wider text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant bg-surface">
                {displayStatements.map((stmt) => (
                  <tr key={stmt.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4 font-mono-data text-body font-medium text-primary">{stmt.id.split('-')[0]}</td>
                    <td className="px-6 py-4 font-body text-body text-text-secondary">{stmt.transaction_date}</td>
                    <td className="px-6 py-4 font-body text-body text-on-surface font-medium">{stmt.description}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold tracking-wide uppercase ${
                        stmt.transaction_type === 'Credit' ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'
                      }`}>
                        {stmt.transaction_type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-mono-data text-body text-right ${stmt.transaction_type === 'Credit' ? 'text-success' : 'text-danger'}`}>
                      ${stmt.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-4 font-mono-data text-body text-on-surface text-right font-medium">${stmt.running_balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  </tr>
                ))}
                {displayStatements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-text-secondary font-body">No statements found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
