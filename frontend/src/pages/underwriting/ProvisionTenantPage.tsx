import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, Shield, LayoutGrid, CheckCircle2, ArrowLeft } from 'lucide-react'
import { api } from '../../lib/api'

export function ProvisionTenantPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    plan: 'professional',
    dbMode: 'shared'
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/console/tenants', formData)
      navigate('/admin/tenants')
    } catch (err) {
      console.error(err)
      alert("Failed to provision tenant")
    } finally {
      setSubmitting(false)
    }
  }

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    setFormData({ ...formData, name: val, slug })
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      {/* Top Toolbar Area */}
      <header className="h-16 px-gutter flex items-center justify-between border-b border-outline-variant bg-surface sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/tenants')} className="text-text-secondary hover:text-primary transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-caption text-caption font-medium">Back to Tenants</span>
          </button>
          <div className="h-4 w-[1px] bg-outline-variant"></div>
          <h2 className="font-h3 text-h3 text-on-surface">Provision New Tenant</h2>
        </div>
      </header>

      {/* Main Form Content */}
      <div className="flex-1 p-gutter lg:p-margin max-w-5xl mx-auto w-full mt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-outline-variant bg-surface-container-low">
              <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-primary" />
                Tenant Details
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-overline text-overline text-text-secondary uppercase tracking-wider block">Organization Name</label>
                <input 
                  className="w-full h-11 bg-surface-container-lowest border border-outline-variant rounded-lg px-4 font-body text-body text-on-surface placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                  placeholder="e.g. Acme Insurance Group"
                  value={formData.name}
                  onChange={(e: any) => handleNameChange(e.target.value)}
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
              
              <div className="col-span-1 md:col-span-2 mt-4 space-y-3">
                <label className="font-overline text-overline text-text-secondary uppercase tracking-wider block">Platform Plan Tier</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    className={`relative rounded-lg p-4 cursor-pointer transition-all border shadow-sm ${formData.plan === 'starter' ? 'border-primary bg-primary-container/20 ring-1 ring-primary' : 'bg-surface-container-lowest border-outline-variant hover:border-primary'}`}
                    onClick={() => setFormData({...formData, plan: 'starter'})}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-body text-body font-semibold text-on-surface">Starter</span>
                      {formData.plan === 'starter' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </div>
                    <p className="font-caption text-caption text-text-secondary">Core features for small teams.</p>
                  </div>
                  <div 
                    className={`relative rounded-lg p-4 cursor-pointer transition-all border shadow-sm ${formData.plan === 'professional' ? 'border-primary bg-primary-container/20 ring-1 ring-primary' : 'bg-surface-container-lowest border-outline-variant hover:border-primary'}`}
                    onClick={() => setFormData({...formData, plan: 'professional'})}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-body text-body font-semibold text-on-surface">Professional</span>
                      {formData.plan === 'professional' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </div>
                    <p className="font-caption text-caption text-text-secondary">Advanced workflows & rules engine.</p>
                  </div>
                  <div 
                    className={`relative rounded-lg p-4 cursor-pointer transition-all border shadow-sm ${formData.plan === 'enterprise' ? 'border-primary bg-primary-container/20 ring-1 ring-primary' : 'bg-surface-container-lowest border-outline-variant hover:border-primary'}`}
                    onClick={() => setFormData({...formData, plan: 'enterprise'})}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-body text-body font-semibold text-on-surface">Enterprise</span>
                      {formData.plan === 'enterprise' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </div>
                    <p className="font-caption text-caption text-text-secondary">Dedicated resources & custom models.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-outline-variant bg-surface-container-low">
              <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-2">
                <Database className="w-5 h-5 text-success" />
                Infrastructure Configuration
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="font-overline text-overline text-text-secondary uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Data Isolation Mode
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`relative rounded-lg p-4 cursor-pointer transition-all border shadow-sm ${formData.dbMode === 'shared' ? 'border-success bg-success-bg ring-1 ring-success' : 'bg-surface-container-lowest border-outline-variant hover:border-success'}`}
                    onClick={() => setFormData({...formData, dbMode: 'shared'})}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-body text-body font-semibold text-on-surface">Shared Multi-tenant DB</span>
                      {formData.dbMode === 'shared' && <CheckCircle2 className="w-5 h-5 text-success" />}
                    </div>
                    <p className="font-caption text-caption text-text-secondary">Data separated by tenant_id column policies.</p>
                  </div>
                  <div 
                    className={`relative rounded-lg p-4 cursor-pointer transition-all border shadow-sm ${formData.dbMode === 'dedicated' ? 'border-success bg-success-bg ring-1 ring-success' : 'bg-surface-container-lowest border-outline-variant hover:border-success'}`}
                    onClick={() => setFormData({...formData, dbMode: 'dedicated'})}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-body text-body font-semibold text-on-surface">Dedicated Postgres Schema</span>
                      {formData.dbMode === 'dedicated' && <CheckCircle2 className="w-5 h-5 text-success" />}
                    </div>
                    <p className="font-caption text-caption text-text-secondary">Isolated schema for enhanced compliance requirements.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-4 pt-4 border-t border-outline-variant">
            <button type="button" className="px-6 py-2.5 font-body text-body font-medium text-text-secondary hover:text-on-surface transition-colors" onClick={() => navigate('/admin/tenants')}>Cancel</button>
            <button disabled={submitting} type="submit" className="px-6 py-2.5 bg-primary text-white font-body text-body font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2">
              {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Provision Tenant Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
