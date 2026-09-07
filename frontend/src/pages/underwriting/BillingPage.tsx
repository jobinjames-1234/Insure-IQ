import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { FileText, ClipboardCheck, CreditCard, Edit2, ArrowUpCircle, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function BillingPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    api.get('/admin/billing')
      .then((res: any) => setData(res.data))
      .catch(console.error)
  }, [])

  if (!data) return <div className="p-8 text-text-secondary animate-pulse text-[14px]">Loading...</div>

  const PLAN_DETAILS: Record<string, { price: string, policyLimit: number, claimLimit: number }> = {
    'Basic': { price: '$499.00', policyLimit: 1000, claimLimit: 500 },
    'Professional': { price: '$1,299.00', policyLimit: 5000, claimLimit: 2500 },
    'Enterprise AI': { price: '$4,250.00', policyLimit: 10000, claimLimit: 5000 },
  }

  const activePlanName = data.plan || 'Enterprise AI'
  const activePlan = PLAN_DETAILS[activePlanName] || PLAN_DETAILS['Enterprise AI']
  
  // Compute mock usage scaled to the limits to look realistic
  const policiesIssued = Math.floor(activePlan.policyLimit * 0.842)
  const policyPercent = 84
  const claimsProcessed = Math.floor(activePlan.claimLimit * 0.241)
  const claimPercent = 24

  return (
    <div className="flex-1 overflow-y-auto w-full bg-surface">
      <div className="max-w-max-width mx-auto p-4 md:p-gutter pb-24">
        
        {/* Page Header */}
        <div className="mb-margin">
          <h2 className="font-h1 text-h1 text-on-surface mb-2">Billing & Invoices</h2>
          <p className="font-body-lg text-body-lg text-text-secondary">Manage your subscription and view usage-based billing history.</p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-margin">
          
          {/* Current Plan Card (Bento Large) */}
          <div className="lg:col-span-8 bg-surface rounded-xl border border-outline-variant shadow-xs p-gutter">
            <div className="flex justify-between items-start mb-6 border-b border-outline-variant pb-4">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-primary-container text-white font-overline text-overline mb-2 tracking-wider">CURRENT PLAN</span>
                <h3 className="font-h2 text-h2 text-on-surface">{activePlanName}</h3>
                <p className="font-body text-body text-text-secondary mt-1">Usage-based billing cycle resets on Nov 1, 2026</p>
              </div>
              <div className="text-right">
                <p className="font-caption text-caption text-text-secondary">Est. Next Bill</p>
                <p className="font-h2 text-h2 text-on-surface font-mono-data">{activePlan.price}</p>
              </div>
            </div>

            {/* Usage Meters */}
            <div className="space-y-6">
              
              {/* Policies Issued */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h4 className="font-h3 text-h3 text-on-surface flex items-center gap-2">
                      <FileText className="text-text-muted w-5 h-5" />
                      Policies Issued
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="font-mono-data text-mono-data text-on-surface">{policiesIssued.toLocaleString()}</span>
                    <span className="font-caption text-caption text-text-secondary"> / {activePlan.policyLimit.toLocaleString()} limit</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${policyPercent}%` }}></div>
                </div>
                <p className="font-caption text-caption text-text-secondary mt-1 text-right">{policyPercent}% utilized</p>
              </div>

              {/* Claims Processed */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h4 className="font-h3 text-h3 text-on-surface flex items-center gap-2">
                      <ClipboardCheck className="text-text-muted w-5 h-5" />
                      Claims Processed
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="font-mono-data text-mono-data text-on-surface">{claimsProcessed.toLocaleString()}</span>
                    <span className="font-caption text-caption text-text-secondary"> / {activePlan.claimLimit.toLocaleString()} limit</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${claimPercent}%` }}></div>
                </div>
                <p className="font-caption text-caption text-text-secondary mt-1 text-right">{claimPercent}% utilized</p>
              </div>
            </div>
          </div>

          {/* Quick Actions / Status Card (Bento Small) */}
          <div className="lg:col-span-4 bg-surface rounded-xl border border-outline-variant shadow-xs p-gutter flex flex-col">
            <h3 className="font-h3 text-h3 text-on-surface mb-4">Payment Method</h3>
            <div 
              onClick={() => navigate('/b2b/admin/billing/payment')} 
              className="bg-surface-container rounded-lg p-4 mb-auto border border-outline-variant cursor-pointer hover:border-primary hover:bg-surface-container-high transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="text-on-surface-variant w-5 h-5" />
                <span className="font-body-lg text-body-lg font-medium text-on-surface">•••• 4242</span>
              </div>
              <p className="font-caption text-caption text-text-secondary">Expires 12/25</p>
            </div>
            
            <div className="mt-6 space-y-3">
              <Button onClick={() => navigate('/b2b/admin/billing/payment')} variant="outline" className="w-full gap-2">
                <Edit2 className="w-4 h-4" />
                Update Payment
              </Button>
              <Button onClick={() => navigate('/b2b/admin/billing/plan')} variant="outline" className="w-full gap-2">
                <ArrowUpCircle className="w-4 h-4" />
                Change Plan
              </Button>
            </div>
          </div>
          
        </div>

        {/* Invoice History Table */}
        <div className="bg-surface rounded-xl border border-outline-variant shadow-xs overflow-hidden">
          <div className="p-6 border-b border-outline-variant">
            <h3 className="font-h2 text-h2 text-on-surface">Invoice History</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container">
                  <th className="py-3 px-6 font-overline text-overline text-text-secondary uppercase">Invoice ID</th>
                  <th className="py-3 px-6 font-overline text-overline text-text-secondary uppercase">Date</th>
                  <th className="py-3 px-6 font-overline text-overline text-text-secondary uppercase">Status</th>
                  <th className="py-3 px-6 font-overline text-overline text-text-secondary uppercase text-right">Amount</th>
                  <th className="py-3 px-6 font-overline text-overline text-text-secondary uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="font-body text-body">
                
                {data?.invoices?.length > 0 ? (
                  data.invoices.map((inv: any) => (
                    <tr key={inv.id} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                      <td className="py-4 px-6 font-mono-data text-mono-data text-on-surface">{inv.id}</td>
                      <td className="py-4 px-6 text-on-surface">{inv.date}</td>
                      <td className="py-4 px-6">
                        <Badge variant={inv.status === 'Paid' ? 'success' : 'default'} className="gap-1">
                          {inv.status === 'Paid' && <span className="w-1.5 h-1.5 rounded-full bg-success"></span>}
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 font-mono-data text-mono-data text-on-surface text-right">${inv.amount.toFixed(2)}</td>
                      <td className="py-4 px-6 text-right">
                        <Button variant="ghost" size="sm" className="text-primary hover:opacity-80 gap-1 font-medium px-2">
                          <Download className="w-4 h-4" />
                          PDF
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <>
                    <tr className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                      <td className="py-4 px-6 font-mono-data text-mono-data text-on-surface">INV-2023-10</td>
                      <td className="py-4 px-6 text-on-surface">Oct 1, 2023</td>
                      <td className="py-4 px-6">
                        <Badge variant="success" className="gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                          Paid
                        </Badge>
                      </td>
                      <td className="py-4 px-6 font-mono-data text-mono-data text-on-surface text-right">$3,850.00</td>
                      <td className="py-4 px-6 text-right">
                        <Button variant="ghost" size="sm" className="text-primary hover:opacity-80 gap-1 font-medium px-2">
                          <Download className="w-4 h-4" />
                          PDF
                        </Button>
                      </td>
                    </tr>
                    <tr className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                      <td className="py-4 px-6 font-mono-data text-mono-data text-on-surface">INV-2023-09</td>
                      <td className="py-4 px-6 text-on-surface">Sep 1, 2023</td>
                      <td className="py-4 px-6">
                        <Badge variant="success" className="gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                          Paid
                        </Badge>
                      </td>
                      <td className="py-4 px-6 font-mono-data text-mono-data text-on-surface text-right">$4,100.50</td>
                      <td className="py-4 px-6 text-right">
                        <Button variant="ghost" size="sm" className="text-primary hover:opacity-80 gap-1 font-medium px-2">
                          <Download className="w-4 h-4" />
                          PDF
                        </Button>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low transition-colors">
                      <td className="py-4 px-6 font-mono-data text-mono-data text-on-surface">INV-2023-08</td>
                      <td className="py-4 px-6 text-on-surface">Aug 1, 2023</td>
                      <td className="py-4 px-6">
                        <Badge variant="success" className="gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                          Paid
                        </Badge>
                      </td>
                      <td className="py-4 px-6 font-mono-data text-mono-data text-on-surface text-right">$3,920.25</td>
                      <td className="py-4 px-6 text-right">
                        <Button variant="ghost" size="sm" className="text-primary hover:opacity-80 gap-1 font-medium px-2">
                          <Download className="w-4 h-4" />
                          PDF
                        </Button>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
