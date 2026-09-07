import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Building2, Globe, ShieldCheck, Activity, ArrowLeft, Edit } from 'lucide-react'
import { api } from '../../lib/api'

export function TenantDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tenant, setTenant] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      api.get(`/console/tenants/${id}`)
        .then((res: any) => setTenant(res.data))
        .catch((err: any) => {
          console.error(err)
          alert("Failed to load tenant details")
        })
        .finally(() => setLoading(false))
    }
  }, [id])

  if (loading) {
    return <div className="p-8 text-text-secondary animate-pulse text-[14px]">Loading tenant...</div>
  }

  if (!tenant) {
    return (
      <div className="flex-1 p-8 bg-background h-full">
        <div className="bg-danger-bg text-danger p-4 rounded-lg font-body text-body">
          Tenant not found.
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden w-full">
      {/* Top Toolbar Area */}
      <header className="h-16 px-gutter flex items-center justify-between border-b border-outline-variant bg-surface sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/tenants')} className="text-text-secondary hover:text-primary transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-caption text-caption font-medium">Back to Tenants</span>
          </button>
          <div className="h-4 w-[1px] bg-outline-variant"></div>
          <h2 className="font-h3 text-h3 text-on-surface">Tenant Details</h2>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/admin/tenants/${id}/edit`)} className="bg-primary text-white font-caption text-caption font-medium h-[40px] px-4 rounded-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
            <Edit className="w-[18px] h-[18px]" />
            Edit Tenant
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-gutter overflow-auto bg-surface-container pb-24">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Header Card */}
          <div className="bg-surface rounded-xl border border-outline-variant p-8 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center border border-primary/20">
                <span className="font-display text-h1 text-on-primary-container">
                  {tenant.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="font-h1 text-h1 text-on-surface mb-1">{tenant.name}</h1>
                <div className="flex items-center gap-2 text-text-secondary font-body text-body">
                  <Building2 className="w-4 h-4" />
                  <span>{tenant.slug}</span>
                  <span className="text-outline-variant">•</span>
                  <Globe className="w-4 h-4" />
                  <span>{tenant.domain || `${tenant.slug}.insureiq.app`}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {tenant.is_active ? (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-body text-body font-medium bg-success-bg text-success border border-success/20">
                  <span className="w-2 h-2 rounded-full bg-success"></span>
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-body text-body font-medium bg-danger-bg text-danger border border-danger/20">
                  <span className="w-2 h-2 rounded-full bg-danger"></span>
                  Suspended
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Info */}
            <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
              <div className="p-4 border-b border-outline-variant bg-surface-container-low">
                <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  System Details
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="font-overline text-overline text-text-secondary uppercase tracking-wider block mb-1">Tenant ID</label>
                  <div className="font-mono-data text-mono-data text-on-surface bg-surface-container p-2 rounded border border-outline-variant truncate">
                    {tenant.id}
                  </div>
                </div>
                <div>
                  <label className="font-overline text-overline text-text-secondary uppercase tracking-wider block mb-1">Created At</label>
                  <div className="font-body text-body text-on-surface">
                    {new Date(tenant.created_at || Date.now()).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
                <div>
                  <label className="font-overline text-overline text-text-secondary uppercase tracking-wider block mb-1">Data Isolation</label>
                  <div className="font-body text-body text-on-surface">
                    Shared Database (Row Level Security)
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Placeholder */}
            <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
              <div className="p-4 border-b border-outline-variant bg-surface-container-low">
                <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-2">
                  <Activity className="w-5 h-5 text-secondary" />
                  Usage Overview
                </h3>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                 <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4">
                   <div className="font-caption text-caption text-text-secondary uppercase tracking-wider mb-2">Total Users</div>
                   <div className="font-display text-h2 text-on-surface">12</div>
                 </div>
                 <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4">
                   <div className="font-caption text-caption text-text-secondary uppercase tracking-wider mb-2">Active Policies</div>
                   <div className="font-display text-h2 text-on-surface">340</div>
                 </div>
                 <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 col-span-2">
                   <div className="font-caption text-caption text-text-secondary uppercase tracking-wider mb-2">Monthly Recurring Revenue</div>
                   <div className="font-mono-data text-h2 text-on-surface">$12,500.00</div>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
