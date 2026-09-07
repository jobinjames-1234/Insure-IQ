import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Menu, PersonStanding, Badge as BadgeIcon, Car, CheckCircle, ZoomIn, Download, AlertTriangle, X, Check, Users, Terminal } from 'lucide-react'
import { api } from '../../lib/api'

export function ApplicationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [riskScore, setRiskScore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get(`/applications/${id}`)
      .then((res: any) => setData(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  const handleDecision = async (status: string) => {
    setSubmitting(true)
    try {
      await api.put(`/underwriting/applications/${id}/decide`, {
        status,
        comments
      })
      navigate('/b2b/underwriting')
    } catch (err) {
      console.error(err)
      alert("Failed to submit decision")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-text-secondary animate-pulse">Loading application...</div>
  if (!data) return <div className="p-8 text-center text-text-secondary">Application not found.</div>

  const app = data.application
  const isClosed = app.status === 'approved' || app.status === 'rejected'

  // Mocks for rich UI based on HTML design
  const applicant = {
    name: app.customer?.first_name ? `${app.customer.first_name} ${app.customer.last_name}` : 'Eleanor M. Vance',
    dob: '1985-11-04',
    ssn: '***-**-8842',
    address: '442 Grove Street, Apt 3B, San Francisco, CA 94102',
    phone: '(415) 555-0198',
    email: app.customer?.email || 'eleanor.vance@email.com',
    job: 'Senior Architect at DataCorp Inc.',
    income: '$145,000 / yr'
  }

  // Use the HTML template's risk score (61) as fallback if none generated
  const displayScore = riskScore ? riskScore.score_value.toFixed(0) : '61'
  const displayRiskBand = riskScore ? riskScore.risk_band : 'Medium Risk'
  const isDanger = parseInt(displayScore) > 75
  const isWarning = parseInt(displayScore) > 40 && parseInt(displayScore) <= 75
  const isSuccess = parseInt(displayScore) <= 40

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b border-outline-variant bg-surface px-gutter flex items-center justify-between shrink-0 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-4">
          <button className="md:hidden text-on-surface p-2 -ml-2 rounded-lg hover:bg-surface-container-high transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-baseline gap-3">
            <h2 className="font-h2 text-h2 text-on-surface tracking-tight">APP-{id?.split('-')[0].toUpperCase()}</h2>
            <span className="font-mono-data text-mono-data text-text-muted uppercase tracking-wider">{app.policy_type || 'Auto Insurance'}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-caption text-caption border border-outline-variant">
            {app.status === 'under_review' && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>}
            {app.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </header>

      {/* Two Column Layout Container */}
      <div className="flex-1 flex flex-col lg:flex-row p-gutter gap-gutter max-w-[1400px] mx-auto w-full items-start animate-in fade-in duration-500">
        
        {/* LEFT COLUMN: Comprehensive Application Data */}
        <div className="flex-1 w-full space-y-6 min-w-0">
          
          {/* Section: Personal Details */}
          <section>
            <h3 className="font-overline text-overline text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
              <PersonStanding className="w-4 h-4" /> Primary Applicant
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* Identity Card */}
              <div className="bg-surface rounded-xl border border-outline-variant p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <p className="font-caption text-caption text-text-muted mb-1">Full Legal Name</p>
                  <p className="font-body-lg text-body-lg text-on-surface font-medium">{applicant.name}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-outline-variant/50 grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-caption text-caption text-text-muted mb-1">DOB</p>
                    <p className="font-mono-data text-mono-data text-on-surface">{applicant.dob}</p>
                  </div>
                  <div>
                    <p className="font-caption text-caption text-text-muted mb-1">SSN (Masked)</p>
                    <p className="font-mono-data text-mono-data text-on-surface">{applicant.ssn}</p>
                  </div>
                </div>
              </div>
              
              {/* Contact & Location Card */}
              <div className="bg-surface rounded-xl border border-outline-variant p-5 shadow-xs xl:col-span-2 flex flex-col justify-between">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="font-caption text-caption text-text-muted mb-1">Primary Residence</p>
                    <p className="font-body text-body text-on-surface">{applicant.address}</p>
                  </div>
                  <div>
                    <p className="font-caption text-caption text-text-muted mb-1">Contact Details</p>
                    <p className="font-mono-data text-mono-data text-on-surface mb-1">{applicant.phone}</p>
                    <p className="font-mono-data text-mono-data text-surface-tint">{applicant.email}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-outline-variant/50 flex items-center gap-6">
                  <div>
                    <p className="font-caption text-caption text-text-muted mb-1">Employment</p>
                    <p className="font-body text-body text-on-surface">{applicant.job}</p>
                  </div>
                  <div>
                    <p className="font-caption text-caption text-text-muted mb-1">Est. Income</p>
                    <p className="font-mono-data text-mono-data text-on-surface">{applicant.income}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Vehicle Details */}
          <section>
            <h3 className="font-overline text-overline text-text-muted uppercase tracking-widest mb-3 mt-8 flex items-center gap-2">
              <Car className="w-4 h-4" /> Asset Schedule
            </h3>
            <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="py-3 px-4 font-overline text-overline text-text-muted uppercase w-1/3">Vehicle</th>
                    <th className="py-3 px-4 font-overline text-overline text-text-muted uppercase">VIN Identifier</th>
                    <th className="py-3 px-4 font-overline text-overline text-text-muted uppercase">Primary Use</th>
                    <th className="py-3 px-4 font-overline text-overline text-text-muted uppercase text-right">Ann. Mileage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-4 px-4">
                      <p className="font-body text-body text-on-surface font-medium">2023 Tesla Model Y</p>
                      <p className="font-caption text-caption text-text-muted">Long Range Dual Motor</p>
                    </td>
                    <td className="py-4 px-4 font-mono-data text-mono-data text-text-secondary">5YJ3E1EA3MF<wbr/>123456</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container-highest text-on-surface font-caption text-caption">Commute</span>
                    </td>
                    <td className="py-4 px-4 font-mono-data text-mono-data text-on-surface text-right">12,500 mi</td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-4 px-4">
                      <p className="font-body text-body text-on-surface font-medium">2018 Toyota RAV4</p>
                      <p className="font-caption text-caption text-text-muted">XLE Premium</p>
                    </td>
                    <td className="py-4 px-4 font-mono-data text-mono-data text-text-secondary">2T3F1RFV6JW<wbr/>789012</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container-highest text-on-surface font-caption text-caption">Pleasure</span>
                    </td>
                    <td className="py-4 px-4 font-mono-data text-mono-data text-on-surface text-right">5,000 mi</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section: Document Verification */}
          <section>
            <h3 className="font-overline text-overline text-text-muted uppercase tracking-widest mb-3 mt-8 flex items-center gap-2">
              <BadgeIcon className="w-4 h-4" /> Verification Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="bg-surface rounded-xl border border-outline-variant p-4 shadow-xs flex gap-4 items-start group">
                <div className="w-24 h-16 rounded bg-surface-container-highest border border-outline-variant overflow-hidden shrink-0 relative">
                  <div className="bg-cover bg-center w-full h-full opacity-60 mix-blend-multiply bg-[url('https://images.unsplash.com/photo-1621252179027-94459d278660?w=300&h=200&fit=crop')]"></div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 backdrop-blur-sm cursor-pointer">
                    <ZoomIn className="w-5 h-5 text-surface-container-lowest" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-body text-body text-on-surface font-medium">CA Driver's License</p>
                  <p className="font-caption text-caption text-success flex items-center gap-1 mt-0.5 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified via API
                  </p>
                  <button className="text-surface-tint font-caption text-caption mt-2 hover:underline">View Full Image</button>
                </div>
              </div>

              <div className="bg-surface rounded-xl border border-outline-variant p-4 shadow-xs flex gap-4 items-start group">
                <div className="w-24 h-16 rounded bg-surface-container-highest border border-outline-variant overflow-hidden shrink-0 relative flex items-center justify-center">
                  <BadgeIcon className="w-6 h-6 text-outline" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 backdrop-blur-[2px] cursor-pointer">
                    <Download className="w-5 h-5 text-on-surface" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-body text-body text-on-surface font-medium">Vehicle Registration (Tesla)</p>
                  <p className="font-caption text-caption text-text-muted flex items-center gap-1 mt-0.5">
                    Uploaded 2 days ago
                  </p>
                  <button className="text-surface-tint font-caption text-caption mt-2 hover:underline">Download PDF</button>
                </div>
              </div>

            </div>
          </section>
          
          <div className="h-12"></div>
        </div>

        {/* RIGHT COLUMN: Sticky Decision Panel */}
        <aside className="w-full lg:w-[380px] xl:w-[420px] shrink-0 lg:sticky lg:top-[calc(64px+24px)] h-fit flex flex-col gap-4">
          
          <div className="bg-surface rounded-xl border border-outline-variant shadow-md flex flex-col overflow-hidden">
            {/* Header / Score Area */}
            <div className="p-6 border-b border-outline-variant bg-surface-container-low relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 ${isDanger ? 'bg-danger-bg' : isWarning ? 'bg-warning-bg' : 'bg-success-bg'}`}></div>
              <h3 className="font-overline text-overline text-text-muted uppercase tracking-widest mb-4">Risk Evaluation</h3>
              <div className="flex items-end gap-4 mb-2 relative z-10">
                <div className={`font-display text-display leading-none tracking-tighter ${isDanger ? 'text-danger' : isWarning ? 'text-warning' : 'text-success'}`}>{displayScore}</div>
                <div className="pb-1">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-caption text-caption font-semibold border
                    ${isDanger ? 'bg-danger-bg text-danger border-danger/20' : isWarning ? 'bg-warning-bg text-warning border-warning/20' : 'bg-success-bg text-success border-success/20'}`}>
                    {displayRiskBand}
                  </span>
                </div>
              </div>
              <p className="font-caption text-caption text-text-muted mt-2 relative z-10">Score derived from automated LexisNexis & MVR pull.</p>
            </div>

            {/* Breakdown Bars */}
            <div className="p-6 space-y-5">
              <h4 className="font-overline text-overline text-text-secondary uppercase tracking-widest mb-1">Key Drivers</h4>
              
              <div>
                <div className="flex justify-between font-caption text-caption mb-1.5">
                  <span className="text-on-surface">Credit History (Insurance Score)</span>
                  <span className="font-mono-data text-success">Favorable</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full w-[85%]"></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between font-caption text-caption mb-1.5">
                  <span className="text-on-surface">Claims History (5 yr)</span>
                  <span className="font-mono-data text-warning">1 At-Fault</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-warning rounded-full w-[45%]"></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between font-caption text-caption mb-1.5">
                  <span className="text-on-surface">Garaging Location Risk</span>
                  <span className="font-mono-data text-success">Low</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full w-[90%]"></div>
                </div>
              </div>
            </div>

            {/* Action Area (Form) */}
            <div className="p-6 pt-2 bg-surface">
              {isClosed ? (
                <div className="p-4 bg-surface-container rounded-lg text-sm font-medium text-text-secondary text-center border border-outline-variant">
                  This application is closed ({app.status}).
                </div>
              ) : (
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="mb-5">
                    <label className="block font-caption text-caption text-on-surface font-medium mb-2" htmlFor="justification">
                      Underwriter Justification <span className="text-danger">*</span>
                    </label>
                    <textarea 
                      id="justification"
                      className="w-full rounded-lg border border-outline bg-background px-3 py-2 font-body text-body text-on-surface placeholder-text-muted focus:outline-none focus:border-surface-tint focus:ring-1 focus:ring-surface-tint/20 transition-all resize-none shadow-inner" 
                      placeholder="Detail the reasoning for this decision..." 
                      required 
                      rows={4}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                    ></textarea>
                    <p className="font-caption text-caption text-text-muted mt-1 text-right">Required for submission</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button 
                      onClick={() => handleDecision('approved')}
                      disabled={submitting}
                      className="flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-surface-container-lowest font-body text-body font-medium h-11 rounded-lg transition-colors shadow-xs disabled:opacity-50" 
                      type="button"
                    >
                      <Check className="w-[18px] h-[18px]" /> Approve
                    </button>
                    <button 
                      onClick={() => handleDecision('rejected')}
                      disabled={submitting}
                      className="flex items-center justify-center gap-2 bg-danger hover:bg-danger/90 text-on-error font-body text-body font-medium h-11 rounded-lg transition-colors shadow-xs disabled:opacity-50" 
                      type="button"
                    >
                      <X className="w-[18px] h-[18px]" /> Reject
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => handleDecision('referred')}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-surface hover:bg-surface-container-low text-on-surface border border-outline-variant font-body text-body font-medium h-11 rounded-lg transition-colors shadow-xs disabled:opacity-50" 
                    type="button"
                  >
                    <Users className="w-[18px] h-[18px] text-text-muted" /> Refer to Senior Underwriter
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Auxiliary Data Snippet */}
          <div className="bg-transparent border border-outline-variant border-dashed rounded-xl p-4">
            <div className="flex items-center gap-2 text-text-secondary mb-2">
              <Terminal className="w-4 h-4" />
              <span className="font-mono-data text-[11px] uppercase tracking-wider">System Log</span>
            </div>
            <p className="font-mono-data text-[12px] text-text-muted leading-relaxed">
              &gt; MVR_PULL_SUCCESS [0.42s]<br/>
              &gt; CLUE_REPORT_MATCH: YES<br/>
              &gt; IDENTITY_VERIFIED: LEVEL_2<br/>
              &gt; RULE_ENGINE: FLAG_04 (CLAIMS_FREQ)
            </p>
          </div>
          
        </aside>
      </div>
    </div>
  )
}

