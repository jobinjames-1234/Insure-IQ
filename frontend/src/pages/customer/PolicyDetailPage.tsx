import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, HelpCircle, Shield, CheckCircle, CreditCard, Car, Edit, FileText, Download, BarChart, RefreshCw, Wallet, PlusCircle } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'

export function PolicyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [policy, setPolicy] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/policies/${id}`)
      .then((res: any) => setPolicy(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-8 text-center text-text-secondary animate-pulse">Loading policy details...</div>
  if (!policy) return <div className="p-8 text-center text-error">Policy not found.</div>

  const isAuto = policy.policy_type?.toLowerCase().includes('auto') || policy.policy_type?.toLowerCase().includes('motor')
  const isHome = policy.policy_type?.toLowerCase().includes('home') || policy.policy_type?.toLowerCase().includes('property')
  
  const icon = isAuto ? <Car className="w-4 h-4" /> : <Shield className="w-4 h-4" />
  const policyTitle = policy.policy_type || 'Insurance Policy'
  
  const daysToRenewal = Math.ceil((new Date(policy.end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
  const needsRenewal = daysToRenewal <= 30 && daysToRenewal >= 0

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      {/* Header / TopNav */}
      <header className="bg-surface border-b border-outline-variant sticky top-0 z-10">
        <div className="max-w-max-width mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center text-text-secondary hover:text-primary transition-colors group">
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-body-lg font-medium">Back to Policies</span>
          </button>
          <div className="flex items-center gap-4">
            <button className="p-2 text-text-secondary hover:text-primary transition-colors rounded-full hover:bg-surface-container">
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-max-width mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-margin space-y-8 animate-in fade-in duration-500">
        {/* Policy Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-outline-variant pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full font-caption text-caption font-semibold flex items-center gap-1 ${policy.status === 'active' ? 'bg-success-bg text-success' : 'bg-surface-container-highest text-text-secondary'}`}>
                <CheckCircle className="w-3.5 h-3.5" /> {policy.status === 'active' ? 'Active' : policy.status}
              </span>
              <span className="text-text-muted font-body text-body flex items-center gap-1 uppercase tracking-tight">
                {icon} {policyTitle}
              </span>
            </div>
            <h1 className="font-h1 text-h1 font-bold text-on-surface mb-2">Comprehensive {isAuto ? 'Auto' : isHome ? 'Home' : 'Coverage'}</h1>
            <p className="font-mono-data text-mono-data text-text-secondary">Policy #{policy.policy_number}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="bg-surface-container rounded-lg p-4 flex flex-col justify-center border border-outline-variant">
              <span className="font-overline text-overline text-text-secondary uppercase mb-1 font-semibold tracking-wider">Next Payment</span>
              <span className="font-h3 text-h3 font-bold font-mono-data text-on-surface">${policy.total_premium}</span>
              <span className="font-caption text-caption text-text-muted mt-1">Due {new Date(policy.end_date).toLocaleDateString()}</span>
            </div>
            <button className="h-10 px-6 bg-primary text-white rounded font-medium hover:bg-primary-container transition-colors shadow-sm flex items-center justify-center gap-2">
              <CreditCard className="w-5 h-5" /> Pay Now
            </button>
          </div>
        </section>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Coverage Terms */}
          <div className="md:col-span-8 space-y-6">
            
            {/* Vehicle/Property Info Card */}
            <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-xs relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-surface-container-low to-transparent opacity-50 z-0 pointer-events-none"></div>
              <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="w-full sm:w-1/3 aspect-video sm:aspect-square bg-surface-container rounded-lg flex items-center justify-center border border-outline-variant shrink-0 overflow-hidden text-outline">
                  {isAuto ? <Car className="w-16 h-16" /> : isHome ? <Shield className="w-16 h-16" /> : <Shield className="w-16 h-16" />}
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-h3 text-h3 font-semibold mb-1 text-on-surface">{isAuto ? '2023 Insured Vehicle' : isHome ? 'Insured Property' : 'Insured Asset'}</h3>
                    {isAuto && <p className="font-body text-body text-text-secondary font-mono-data">VIN: 4T1B11HK5MU09XXXX</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant">
                    <div>
                      <span className="block font-caption text-caption text-text-muted mb-1 uppercase tracking-wider">Primary Insured</span>
                      <span className="font-body text-body font-medium text-on-surface">{user?.first_name} {user?.last_name}</span>
                    </div>
                    <div>
                      <span className="block font-caption text-caption text-text-muted mb-1 uppercase tracking-wider">{isAuto ? 'Annual Mileage' : 'Year Built'}</span>
                      <span className="font-body text-body font-medium font-mono-data text-on-surface">{isAuto ? '12,000' : '2015'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coverage Breakdown */}
            <div className="bg-surface border border-outline-variant rounded-xl shadow-xs overflow-hidden">
              <div className="p-6 border-b border-outline-variant bg-bg-subtle flex justify-between items-center">
                <h3 className="font-h3 text-h3 font-semibold text-on-surface">Coverage Details</h3>
                <button className="text-primary hover:text-primary-container font-body text-body font-medium flex items-center gap-1 transition-colors">
                  <Edit className="w-4 h-4" /> Modify
                </button>
              </div>
              <div className="divide-y divide-outline-variant">
                
                <div className="p-6 flex flex-col sm:flex-row justify-between gap-4 hover:bg-bg-subtle transition-colors">
                  <div className="flex-1">
                    <h4 className="font-body-lg text-body-lg font-semibold mb-1 text-on-surface">Liability Limits</h4>
                    <p className="font-body text-body text-text-secondary mb-2 max-w-prose">Covers expenses and damages for others if you're at fault in an incident.</p>
                  </div>
                  <div className="text-left sm:text-right min-w-[120px]">
                    <span className="block font-h3 text-h3 font-bold font-mono-data text-on-surface">$100k / $300k</span>
                    <span className="font-caption text-caption text-text-muted">Per Incident / Total</span>
                  </div>
                </div>

                <div className="p-6 flex flex-col sm:flex-row justify-between gap-4 hover:bg-bg-subtle transition-colors">
                  <div className="flex-1">
                    <h4 className="font-body-lg text-body-lg font-semibold mb-1 text-on-surface">Property Damage</h4>
                    <p className="font-body text-body text-text-secondary mb-2 max-w-prose">Covers damage you cause to someone else's property.</p>
                  </div>
                  <div className="text-left sm:text-right min-w-[120px]">
                    <span className="block font-h3 text-h3 font-bold font-mono-data text-on-surface">$100k</span>
                    <span className="font-caption text-caption text-text-muted">Per Incident</span>
                  </div>
                </div>

                <div className="p-6 flex flex-col sm:flex-row justify-between gap-4 hover:bg-bg-subtle transition-colors">
                  <div className="flex-1">
                    <h4 className="font-body-lg text-body-lg font-semibold mb-1 text-on-surface flex items-center gap-2">
                      Comprehensive
                      <span className="bg-surface-container-high text-text-secondary px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Deductible</span>
                    </h4>
                    <p className="font-body text-body text-text-secondary mb-2 max-w-prose">Covers damage from events outside your control (weather, vandalism).</p>
                  </div>
                  <div className="text-left sm:text-right min-w-[120px]">
                    <span className="block font-h3 text-h3 font-bold font-mono-data text-on-surface">$500</span>
                    <span className="font-caption text-caption text-text-muted">Deductible</span>
                  </div>
                </div>
                
              </div>
            </div>

          </div>

          {/* Right Column: Documents, Premium History, Renewal */}
          <div className="md:col-span-4 space-y-6">
            
            {/* Renewal Action Card (Highlight) */}
            {needsRenewal && (
              <div className="bg-surface border-2 border-primary rounded-xl p-6 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -z-10"></div>
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-h3 text-h3 font-semibold text-primary">Renewal Available</h3>
                  <RefreshCw className="text-primary w-5 h-5" />
                </div>
                <p className="font-body text-body text-text-secondary mb-6">Your current policy expires on {new Date(policy.end_date).toLocaleDateString()}. Review and renew now to avoid gaps in coverage.</p>
                <button className="w-full h-10 bg-primary text-white rounded font-medium hover:bg-primary-container transition-colors shadow-sm flex items-center justify-center gap-2">
                  Renew Policy
                </button>
              </div>
            )}

            {/* Documents */}
            <div className="bg-surface border border-outline-variant rounded-xl shadow-xs p-6">
              <h3 className="font-h3 text-h3 font-semibold mb-4 flex items-center gap-2 text-on-surface">
                <FileText className="w-5 h-5 text-text-secondary" /> Documents
              </h3>
              <div className="space-y-3">
                <a className="flex items-center p-3 rounded-lg border border-outline-variant hover:border-primary hover:bg-bg-subtle transition-all group cursor-pointer">
                  <FileText className="text-error w-6 h-6 mr-3" />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-body font-medium truncate group-hover:text-primary transition-colors text-on-surface">Declaration Page</p>
                    <p className="font-caption text-caption text-text-muted font-mono-data">PDF • 1.2 MB</p>
                  </div>
                  <Download className="w-4 h-4 text-text-muted group-hover:text-primary" />
                </a>
                <a className="flex items-center p-3 rounded-lg border border-outline-variant hover:border-primary hover:bg-bg-subtle transition-all group cursor-pointer">
                  <FileText className="text-error w-6 h-6 mr-3" />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-body font-medium truncate group-hover:text-primary transition-colors text-on-surface">Full Policy Wording</p>
                    <p className="font-caption text-caption text-text-muted font-mono-data">PDF • 4.5 MB</p>
                  </div>
                  <Download className="w-4 h-4 text-text-muted group-hover:text-primary" />
                </a>
                <a className="flex items-center p-3 rounded-lg border border-outline-variant hover:border-primary hover:bg-bg-subtle transition-all group cursor-pointer">
                  <Wallet className="text-primary w-6 h-6 mr-3" />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-body font-medium truncate group-hover:text-primary transition-colors text-on-surface">Digital ID Card</p>
                    <p className="font-caption text-caption text-text-muted font-mono-data">Apple Wallet / GPay</p>
                  </div>
                  <PlusCircle className="w-4 h-4 text-text-muted group-hover:text-primary" />
                </a>
              </div>
            </div>

            {/* Premium History (Simplified Bar Chart) */}
            <div className="bg-surface border border-outline-variant rounded-xl shadow-xs p-6">
              <h3 className="font-h3 text-h3 font-semibold mb-4 flex items-center gap-2 text-on-surface">
                <BarChart className="w-5 h-5 text-text-secondary" /> Premium History
              </h3>
              <div className="space-y-4">
                <div className="flex items-end h-32 gap-2 border-b border-outline-variant pb-2 relative">
                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between font-caption text-caption text-text-muted font-mono-data w-8">
                    <span>$150</span>
                    <span>$100</span>
                    <span>$50</span>
                  </div>
                  <div className="flex-1 flex items-end justify-between ml-10 h-full">
                    <div className="w-1/5 flex flex-col items-center group relative h-full justify-end">
                      <div className="w-full bg-surface-container-highest rounded-t-sm h-[60%] group-hover:bg-primary/20 transition-colors"></div>
                    </div>
                    <div className="w-1/5 flex flex-col items-center group relative h-full justify-end">
                      <div className="w-full bg-surface-container-highest rounded-t-sm h-[65%] group-hover:bg-primary/20 transition-colors"></div>
                    </div>
                    <div className="w-1/5 flex flex-col items-center group relative h-full justify-end">
                      <div className="w-full bg-surface-container-highest rounded-t-sm h-[70%] group-hover:bg-primary/20 transition-colors"></div>
                    </div>
                    <div className="w-1/5 flex flex-col items-center group relative h-full justify-end">
                      <div className="w-full bg-primary rounded-t-sm h-[80%]"></div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between ml-10 font-caption text-caption text-text-muted">
                  <span className="w-1/5 text-center">2020</span>
                  <span className="w-1/5 text-center">2021</span>
                  <span className="w-1/5 text-center">2022</span>
                  <span className="w-1/5 text-center font-semibold text-on-surface">2023</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
