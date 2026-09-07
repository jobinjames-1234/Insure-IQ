import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../../lib/api'

export function TenantDirectoryPage() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/console/tenants')
      .then((res: any) => setTenants(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.slug.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="p-8 text-text-secondary animate-pulse text-[14px]">Loading tenants...</div>

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden w-full">
      {/* Top Bar */}
      <header className="h-16 border-b border-outline-variant bg-surface flex items-center justify-between px-gutter shrink-0">
        <div className="flex items-center">
          <h2 className="font-h2 text-h2 font-semibold text-on-surface">Tenant Directory</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
            <input 
              className="h-10 w-full pl-10 pr-4 bg-surface-container-lowest border border-outline-variant text-on-surface rounded font-body text-body placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none" 
              placeholder="Search tenants..." 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => navigate('/admin/tenants/new')} className="bg-primary text-white font-caption text-caption font-medium h-[40px] px-4 rounded-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
            <Plus className="w-[18px] h-[18px]" />
            Provision New Tenant
          </button>
        </div>
      </header>

      {/* Table Container */}
      <div className="flex-1 p-gutter overflow-auto bg-surface-container pb-24">
        <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                <th className="py-3 px-6 font-caption text-caption text-text-muted uppercase tracking-wider font-semibold">Tenant Name</th>
                <th className="py-3 px-6 font-caption text-caption text-text-muted uppercase tracking-wider font-semibold">Plan Tier</th>
                <th className="py-3 px-6 font-caption text-caption text-text-muted uppercase tracking-wider font-semibold">Isolation Mode</th>
                <th className="py-3 px-6 font-caption text-caption text-text-muted uppercase tracking-wider font-semibold">Status</th>
                <th className="py-3 px-6 font-caption text-caption text-text-muted uppercase tracking-wider font-semibold text-right">MRR</th>
                <th className="py-3 px-6 font-caption text-caption text-text-muted uppercase tracking-wider font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-surface-container-low transition-colors group cursor-pointer" onClick={() => navigate(`/admin/tenants/${tenant.id}`)}>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden flex items-center justify-center border border-outline-variant">
                        <div className="w-full h-full bg-surface-container-low flex items-center justify-center font-display text-h3 text-on-surface-variant">
                          {tenant.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <span className="font-body text-body font-medium text-on-surface">{tenant.name}</span>
                        {/* Optionally can show slug underneath */}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full font-caption text-caption font-medium bg-primary-container text-white">
                      Enterprise
                    </span>
                  </td>
                  <td className="py-4 px-6 text-on-surface-variant font-body text-body">Dedicated Schema</td>
                  <td className="py-4 px-6">
                    {tenant.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-caption text-caption font-medium bg-success-bg text-success">
                        <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-caption text-caption font-medium bg-danger-bg text-danger">
                        <span className="w-1.5 h-1.5 rounded-full bg-danger"></span>
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right font-mono-data text-mono-data text-on-surface tabular-nums">$12,500</td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-outline hover:text-on-surface transition-colors p-1 rounded hover:bg-surface-container-high" onClick={(e) => { e.stopPropagation(); navigate(`/admin/tenants/${tenant.id}/edit`); }}>
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 px-6 text-center text-text-secondary font-body text-body">
                    No tenants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between bg-surface">
            <span className="font-caption text-caption text-text-muted">Showing {filteredTenants.length} entries</span>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-text-muted hover:text-on-surface hover:border-outline transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={true}>
                <ChevronLeft className="w-[18px] h-[18px]" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded bg-primary-container text-white font-caption text-caption font-medium">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-text-muted hover:text-on-surface hover:border-outline transition-colors">
                <ChevronRight className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
