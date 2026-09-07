import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LayoutGrid, CheckCircle2, ArrowLeft } from 'lucide-react'
import { api } from '../../lib/api'

export function TenantEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    is_active: true
  })
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      api.get(`/console/tenants/${id}`)
        .then((res: any) => {
          setFormData({
            name: res.data.name || '',
            slug: res.data.slug || '',
            domain: res.data.domain || '',
            is_active: res.data.is_active
          })
        })
        .catch((err: any) => {
          console.error(err)
          alert("Failed to load tenant details")
        })
        .finally(() => setLoading(false))
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.put(`/console/tenants/${id}`, formData)
      navigate(`/admin/tenants/${id}`)
    } catch (err) {
      console.error(err)
      alert("Failed to update tenant")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-text-secondary animate-pulse text-[14px]">Loading tenant...</div>
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      {/* Top Toolbar Area */}
      <header className="h-16 px-gutter flex items-center justify-between border-b border-outline-variant bg-surface sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/admin/tenants/${id}`)} className="text-text-secondary hover:text-primary transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-caption text-caption font-medium">Cancel Edit</span>
          </button>
          <div className="h-4 w-[1px] bg-outline-variant"></div>
          <h2 className="font-h3 text-h3 text-on-surface">Edit Tenant</h2>
        </div>
      </header>

      {/* Main Form Content */}
      <div className="flex-1 p-gutter lg:p-margin max-w-5xl mx-auto w-full mt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-outline-variant bg-surface-container-low">
              <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-primary" />
                Tenant Settings
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-overline text-overline text-text-secondary uppercase tracking-wider block">Organization Name</label>
                <input 
                  className="w-full h-11 bg-surface-container-lowest border border-outline-variant rounded-lg px-4 font-body text-body text-on-surface placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                  placeholder="e.g. Acme Insurance Group"
                  value={formData.name}
                  onChange={(e: any) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="font-overline text-overline text-text-secondary uppercase tracking-wider block">Tenant Slug (Unique ID)</label>
                <input 
                  className="w-full h-11 bg-surface-container-lowest border border-outline-variant rounded-lg px-4 font-body text-body text-on-surface placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                  placeholder="e.g. acme-insurance"
                  value={formData.slug}
                  onChange={(e: any) => setFormData({...formData, slug: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="font-overline text-overline text-text-secondary uppercase tracking-wider block">Custom Domain</label>
                <input 
                  className="w-full h-11 bg-surface-container-lowest border border-outline-variant rounded-lg px-4 font-body text-body text-on-surface placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                  placeholder="e.g. acme.insureiq.app"
                  value={formData.domain}
                  onChange={(e: any) => setFormData({...formData, domain: e.target.value})}
                />
              </div>

              <div className="col-span-1 md:col-span-2 mt-4 space-y-3">
                <label className="font-overline text-overline text-text-secondary uppercase tracking-wider block">Tenant Status</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`relative rounded-lg p-4 cursor-pointer transition-all border shadow-sm ${formData.is_active ? 'border-success bg-success-bg ring-1 ring-success' : 'bg-surface-container-lowest border-outline-variant hover:border-success'}`}
                    onClick={() => setFormData({...formData, is_active: true})}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-body text-body font-semibold text-on-surface">Active</span>
                      {formData.is_active && <CheckCircle2 className="w-5 h-5 text-success" />}
                    </div>
                    <p className="font-caption text-caption text-text-secondary">Tenant is fully operational and accessible.</p>
                  </div>
                  <div 
                    className={`relative rounded-lg p-4 cursor-pointer transition-all border shadow-sm ${!formData.is_active ? 'border-danger bg-danger-bg ring-1 ring-danger' : 'bg-surface-container-lowest border-outline-variant hover:border-danger'}`}
                    onClick={() => setFormData({...formData, is_active: false})}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-body text-body font-semibold text-on-surface">Suspended</span>
                      {!formData.is_active && <CheckCircle2 className="w-5 h-5 text-danger" />}
                    </div>
                    <p className="font-caption text-caption text-text-secondary">Tenant is suspended. Users cannot log in.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
          <div className="flex justify-end gap-4 pt-4 border-t border-outline-variant">
            <button type="button" className="px-6 py-2.5 font-body text-body font-medium text-text-secondary hover:text-on-surface transition-colors" onClick={() => navigate(`/admin/tenants/${id}`)}>Cancel</button>
            <button disabled={submitting} type="submit" className="px-6 py-2.5 bg-primary text-white font-body text-body font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2">
              {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
