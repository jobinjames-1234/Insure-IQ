import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Car, CheckCircle, FileText, BarChart, Clock, CreditCard, ExternalLink, Download } from 'lucide-react'
import { api } from '../../lib/api'

export function AgentPolicyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [policy, setPolicy] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app, this would be an endpoint returning policy + customer info
    api.get(`/policies/${id}`)
      .then((res: any) => setPolicy(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-8 text-center text-text-secondary animate-pulse font-body text-body">Loading policy details...</div>
  if (!policy && !loading) return <div className="p-8 text-center text-text-secondary font-body text-body">Policy not found.</div>

  const isAuto = policy?.policy_type?.toLowerCase().includes('auto') || policy?.policy_type?.toLowerCase().includes('motor')
  const isHome = policy?.policy_type?.toLowerCase().includes('home') || policy?.policy_type?.toLowerCase().includes('property')
  
  const icon = isAuto ? <Car className="w-5 h-5" /> : <Shield className="w-5 h-5" />
  const policyTitle = policy?.policy_type || 'Insurance Policy'

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 lg:p-8 min-h-screen animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center text-text-secondary hover:text-primary transition-colors group">
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-body font-medium">Back to Customer</span>
          </button>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none h-10 px-4 rounded border border-outline-variant bg-surface text-on-surface font-body text-body flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors shadow-xs">
              <Download className="w-4 h-4" /> Download DEC Page
            </button>
            <button className="flex-1 md:flex-none h-10 px-6 rounded bg-primary-container text-white font-body text-body flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-xs">
              <CreditCard className="w-4 h-4" /> Process Payment
            </button>
          </div>
        </div>

        {/* Policy Header */}
        <div className="bg-surface rounded-2xl p-6 md:p-8 shadow-sm border border-outline-variant mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-container/10 to-transparent -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-full font-caption text-caption font-semibold flex items-center gap-1.5 ${policy.status === 'active' ? 'bg-success-bg text-success' : 'bg-surface-container-highest text-text-secondary'}`}>
                <CheckCircle className="w-3.5 h-3.5" /> {policy.status === 'active' ? 'Active Policy' : policy.status}
              </span>
              <span className="text-text-muted font-body text-body flex items-center gap-1.5 uppercase tracking-wide font-medium">
                {icon} {policyTitle}
              </span>
            </div>
            <h1 className="font-h1 text-h1 text-on-surface mb-2 font-bold tracking-tight">Policy #{policy.policy_number}</h1>
            <p className="font-body text-body text-text-secondary">Primary Insured: <span className="text-on-surface font-medium cursor-pointer hover:underline">Eleanor Vance</span></p>
          </div>
          
          <div className="relative z-10 flex gap-8">
            <div className="text-right">
              <p className="font-caption text-caption text-text-secondary uppercase tracking-wider mb-1">Total Premium</p>
              <p className="font-h2 text-h2 font-mono-data text-on-surface font-bold">${policy.total_premium}</p>
              <p className="font-caption text-caption text-text-muted mt-1">Paid in full</p>
            </div>
            <div className="w-px bg-outline-variant hidden sm:block"></div>
            <div className="text-right hidden sm:block">
              <p className="font-caption text-caption text-text-secondary uppercase tracking-wider mb-1">Effective Date</p>
              <p className="font-h3 text-h3 text-on-surface">{new Date(policy.start_date).toLocaleDateString()}</p>
              <p className="font-caption text-caption text-text-muted mt-1">Renews {new Date(policy.end_date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Policy Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Coverage Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Coverage Summary */}
            <section className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
              <div className="p-6 border-b border-outline-variant bg-surface-container-lowest">
                <h2 className="font-h3 text-h3 font-semibold text-on-surface flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" /> Coverage Limits
                </h2>
              </div>
              <div className="p-0">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-lowest border-b border-outline-variant text-text-secondary font-caption text-caption uppercase tracking-wider">
                      <th className="py-4 px-6 font-medium">Coverage Type</th>
                      <th className="py-4 px-6 font-medium text-right">Limit</th>
                      <th className="py-4 px-6 font-medium text-right">Deductible</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {/* Mock Coverage Data */}
                    <tr className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-body text-body font-medium text-on-surface">Bodily Injury Liability</p>
                        <p className="font-caption text-caption text-text-muted mt-0.5">Per person / Per accident</p>
                      </td>
                      <td className="py-4 px-6 font-mono-data text-right font-medium text-on-surface">$250k / $500k</td>
                      <td className="py-4 px-6 font-mono-data text-right text-text-secondary">N/A</td>
                    </tr>
                    <tr className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-body text-body font-medium text-on-surface">Property Damage</p>
                        <p className="font-caption text-caption text-text-muted mt-0.5">Per accident</p>
                      </td>
                      <td className="py-4 px-6 font-mono-data text-right font-medium text-on-surface">$100,000</td>
                      <td className="py-4 px-6 font-mono-data text-right text-text-secondary">N/A</td>
                    </tr>
                    <tr className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-body text-body font-medium text-on-surface">Comprehensive</p>
                        <p className="font-caption text-caption text-text-muted mt-0.5">Actual cash value</p>
                      </td>
                      <td className="py-4 px-6 font-mono-data text-right font-medium text-on-surface">ACV</td>
                      <td className="py-4 px-6 font-mono-data text-right text-on-surface">$500</td>
                    </tr>
                    <tr className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-body text-body font-medium text-on-surface">Collision</p>
                        <p className="font-caption text-caption text-text-muted mt-0.5">Actual cash value</p>
                      </td>
                      <td className="py-4 px-6 font-mono-data text-right font-medium text-on-surface">ACV</td>
                      <td className="py-4 px-6 font-mono-data text-right text-on-surface">$500</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
            
            {/* Insured Items */}
            <section className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-6">
              <h2 className="font-h3 text-h3 font-semibold text-on-surface mb-6 flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" /> Insured Vehicles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-outline-variant rounded-xl p-5 bg-surface-container-lowest flex items-start gap-4">
                  <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center shrink-0">
                    <Car className="w-6 h-6 text-text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-body text-body font-bold text-on-surface">2023 Tesla Model Y</h4>
                    <p className="font-caption text-caption text-text-muted mb-2">Long Range AWD</p>
                    <p className="font-mono-data text-caption text-text-secondary">VIN: 5YJYGDEE1LFP1XXXX</p>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            
            {/* Quick Actions */}
            <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-6">
              <h3 className="font-h4 text-h4 font-semibold text-on-surface mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors group text-left border border-transparent hover:border-outline-variant">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-body text-body text-on-surface font-medium group-hover:text-primary transition-colors">Issue Certificate</span>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-text-muted rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors group text-left border border-transparent hover:border-outline-variant">
                  <div className="flex items-center gap-3">
                    <BarChart className="w-5 h-5 text-primary" />
                    <span className="font-body text-body text-on-surface font-medium group-hover:text-primary transition-colors">Endorse Policy</span>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-text-muted rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button onClick={() => navigate('/b2b/claims')} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors group text-left border border-transparent hover:border-outline-variant">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-5 h-5 text-primary" />
                    <span className="font-body text-body text-on-surface font-medium group-hover:text-primary transition-colors">File a Claim</span>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-text-muted rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>

            {/* Claims History */}
            <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-6">
              <h3 className="font-h4 text-h4 font-semibold text-on-surface mb-4">Recent Claims</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b border-outline-variant last:border-0 last:pb-0">
                  <div className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-text-secondary" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-body text-body font-medium text-on-surface">Glass Damage</h4>
                      <span className="font-caption text-caption text-text-muted">Oct 12, 2023</span>
                    </div>
                    <p className="font-caption text-caption text-text-secondary mb-1">Claim #CLM-8821-44</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-surface-container-highest text-text-secondary">Closed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Info */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm p-6">
              <h3 className="font-caption text-caption uppercase tracking-wider text-text-secondary mb-3 font-semibold">Agent of Record</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                  SJ
                </div>
                <div>
                  <p className="font-body text-body font-medium text-on-surface">Sarah Jenkins</p>
                  <p className="font-caption text-caption text-text-muted">ID: AGT-5542</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
