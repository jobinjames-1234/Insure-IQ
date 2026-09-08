import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, History, AlertTriangle, X, Check, Image as ImageIcon, ZoomIn, ZoomOut, RotateCw, Maximize, Verified, Info } from 'lucide-react'
import { api } from '../../lib/api'

export function ClaimsWorkspacePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState("")
  const [approvedAmount, setApprovedAmount] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get(`/claims/${id}`)
      .then((res: any) => {
        setData(res.data)
        if (res.data?.claim) {
          setApprovedAmount(res.data.claim.claimed_amount?.toString() || "")
        }
      })
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  const handleDecision = async (status: string) => {
    setSubmitting(true)
    try {
      await api.put(`/claims/${id}/decide`, {
        status,
        comments,
        approved_amount: parseFloat(approvedAmount) || undefined
      })
      navigate('/b2b/claims')
    } catch (err) {
      console.error(err)
      alert("Failed to submit decision")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-on-surface-variant animate-pulse font-body text-body">Loading claim...</div>
  if (!data || !data.claim) {
    return <div className="p-8 text-on-surface-variant font-body text-body">Claim not found.</div>
  }

  const claim = data.claim
  const customer = data.customer || { first_name: 'Unknown', last_name: 'Customer' }
  const documentUrl = data.documents?.[0]?.file_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuAmVQewOfmj7-KJ2xxc6YEwiC8zwIgBsGgrzYIJQvAL66IDOB4KeSuDjshA-kB4i7uP8DIJVbTgB9TV4-JICc7GQrBF5J6k7gN8ZFww1zu9hL9MzHTUkaJGolqEwDgHPV8IsGwKgjxwVgjSdveTRdJv63wIQRKxf_GgfCCwIdyJH5ZsEjrOaqlMrKTi1LjfSBq8BKK8rJEkXCBR6gMIoBBWfZ62Ma-nMfj1MpqQ6qNWVMIRKwp3SgmfgA"

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] bg-surface-bright">
      
      {/* Top Header Navigation / Action Bar */}
      <header className="h-14 flex justify-between items-center px-6 border-b border-outline-variant bg-surface-container-lowest shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/b2b/claims')} className="flex items-center text-on-surface-variant hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h2 className="font-h3 text-h3 leading-tight text-on-surface">Claim #{claim.claim_number}</h2>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning-bg text-warning uppercase">
                {claim.status}
              </span>
              <span className="text-[11px] text-text-muted font-mono-data">SLA: 4h 12m remaining</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="px-4 h-9 flex items-center justify-center gap-2 text-on-surface-variant hover:bg-surface-container transition-all rounded-lg border border-outline-variant">
            <History className="w-[18px] h-[18px]" />
            <span className="font-caption text-caption">Logs</span>
          </button>
          <div className="h-6 w-px bg-outline-variant mx-1"></div>
          <button 
            className="px-4 h-9 flex items-center justify-center gap-2 text-tertiary hover:bg-tertiary-fixed transition-all rounded-lg border border-tertiary/20"
          >
            <AlertTriangle className="w-[18px] h-[18px]" />
            <span className="font-caption text-caption">Escalate</span>
          </button>
          <button 
            onClick={() => handleDecision('rejected')} 
            disabled={submitting}
            className="px-4 h-9 flex items-center justify-center gap-2 text-danger hover:bg-danger-bg transition-all rounded-lg border border-danger/20"
          >
            <X className="w-[18px] h-[18px]" />
            <span className="font-caption text-caption">Reject</span>
          </button>
          <button 
            onClick={() => handleDecision('approved')} 
            disabled={submitting}
            className="px-6 h-9 flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary-container transition-all rounded-lg shadow-xs active:scale-95"
          >
            <Check className="w-[18px] h-[18px]" strokeWidth={3} />
            <span className="font-caption text-caption">Approve</span>
          </button>
        </div>
      </header>

      {/* Two-Pane Layout Wrapper */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Pane: Document Viewer */}
        <section className="w-3/5 h-full flex flex-col border-r border-outline-variant bg-surface-dim/30">
          
          <div className="flex items-center justify-between p-3 border-b border-outline-variant bg-surface-container-lowest">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              <span className="font-caption text-caption text-on-surface font-semibold">Incident Evidence: Damage_Rear_01.jpg</span>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 hover:bg-surface-container-high rounded text-on-surface-variant"><ZoomIn className="w-[18px] h-[18px]" /></button>
              <button className="p-1.5 hover:bg-surface-container-high rounded text-on-surface-variant"><ZoomOut className="w-[18px] h-[18px]" /></button>
              <button className="p-1.5 hover:bg-surface-container-high rounded text-on-surface-variant"><RotateCw className="w-[18px] h-[18px]" /></button>
              <div className="w-px h-4 bg-outline-variant mx-1"></div>
              <button className="p-1.5 hover:bg-surface-container-high rounded text-on-surface-variant"><Maximize className="w-[18px] h-[18px]" /></button>
            </div>
          </div>
          
          <div className="flex-1 relative overflow-auto p-8 flex items-center justify-center bg-[#2e303a]">
            {/* Image with prompt */}
            <div className="relative max-w-full shadow-2xl rounded-sm border-8 border-white group overflow-hidden">
              <img 
                className="max-w-full h-auto object-contain transition-transform duration-300 hover:scale-105" 
                src={documentUrl} 
                alt="Incident Evidence"
              />
              
              {/* AI Annotation Overlay Example */}
              <div className="absolute top-1/4 left-1/3 w-24 h-24 border-2 border-primary/60 rounded-full animate-pulse flex items-center justify-center bg-primary/10">
                <span className="bg-primary text-white text-[10px] px-1 py-0.5 rounded absolute -top-4">Point of Impact</span>
              </div>
            </div>
            
            <div className="absolute bottom-6 right-6 flex flex-col gap-2">
              <div className="bg-surface-container-lowest/90 backdrop-blur shadow-md border border-outline-variant rounded p-3 max-w-[240px]">
                <div className="flex items-center gap-2 text-success font-bold mb-1">
                  <Verified className="w-[16px] h-[16px]" />
                  <span className="font-caption text-caption">AI Confidence: 94%</span>
                </div>
                <p className="text-on-surface-variant text-[12px]">Damage signature consistent with low-speed rear collision involving a stationary object.</p>
              </div>
            </div>
          </div>
          
        </section>

        {/* Right Pane: Claim Details Form */}
        <section className="w-2/5 h-full flex flex-col bg-surface-container-lowest overflow-y-auto">
          <div className="p-6 space-y-8">
            
            {/* Section: Claim Identity */}
            <div>
              <h3 className="font-overline text-overline text-text-muted mb-4 uppercase tracking-wider">Insured Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-text-secondary uppercase tracking-wider mb-1 block">Full Name</label>
                  <p className="font-body-lg text-body-lg text-on-surface font-semibold">{customer.first_name} {customer.last_name}</p>
                </div>
                <div>
                  <label className="text-[11px] text-text-secondary uppercase tracking-wider mb-1 block">Policy ID</label>
                  <p className="font-mono-data text-mono-data text-on-surface">{customer.id || 'POL-4412-9908'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] text-text-secondary uppercase tracking-wider mb-1 block">Coverage Type</label>
                  <p className="font-body text-body text-on-surface">Comprehensive Platinum — $500 Deductible</p>
                </div>
              </div>
            </div>
            
            <div className="h-px bg-outline-variant"></div>
            
            {/* Section: Extracted Data Form */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-overline text-overline text-text-muted uppercase tracking-wider">Extracted Claim Data</h3>
                <span className="text-[10px] bg-secondary-fixed text-on-secondary-fixed px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">OCR SYNCED</span>
              </div>
              <div className="space-y-5">
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider">Incident Date</label>
                  <div className="relative">
                    <input 
                      className="w-full h-10 px-3 bg-surface-container rounded border border-outline focus:ring-2 focus:ring-primary focus:border-primary font-body text-body text-on-surface" 
                      type="date" 
                      defaultValue={new Date(claim.incident_date).toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider">Diagnosis Code (ICD-X)</label>
                  <div className="relative group">
                    <input 
                      className="w-full h-10 px-3 pr-10 bg-surface-container rounded border border-outline focus:ring-2 focus:ring-primary focus:border-primary font-mono-data text-mono-data text-on-surface" 
                      type="text" 
                      defaultValue="V43.52XA"
                    />
                    <Info className="absolute right-3 top-2.5 text-outline w-5 h-5" />
                    <p className="text-[11px] text-text-secondary mt-1">Car driver injured in collision with sport utility vehicle in traffic accident</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider">Estimated Repair Cost</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-text-secondary text-sm">$</span>
                      <input 
                        className="w-full h-10 pl-7 pr-3 bg-surface-container rounded border border-outline focus:ring-2 focus:ring-primary focus:border-primary font-mono-data text-mono-data text-right text-on-surface" 
                        type="number" 
                        value={approvedAmount}
                        onChange={(e) => setApprovedAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider">Labor Hours</label>
                    <div className="relative">
                      <input 
                        className="w-full h-10 px-3 bg-surface-container rounded border border-outline focus:ring-2 focus:ring-primary focus:border-primary font-mono-data text-mono-data text-right text-on-surface" 
                        type="text" 
                        defaultValue="18.5"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider">Adjuster's Notes</label>
                  <textarea 
                    className="w-full px-3 py-2 bg-surface-container rounded border border-outline focus:ring-2 focus:ring-primary focus:border-primary font-body text-body text-on-surface" 
                    placeholder="Add observations regarding damage severity..." 
                    rows={4}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  ></textarea>
                </div>
                
              </div>
            </div>
            
            {/* SLA & Risk indicators */}
            <div className="bg-surface-container-high rounded-xl p-4 border border-outline-variant space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-on-surface uppercase tracking-wider">Risk Assessment</span>
                <span className="text-[11px] text-success font-bold uppercase tracking-wider">Low Risk</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div className="bg-success h-full" style={{ width: '12%' }}></div>
              </div>
              <p className="text-[10px] text-on-surface-variant">Policy history shows 0 claims in 5 years. Address verification successful.</p>
            </div>
            
          </div>
        </section>
      </div>
    </div>
  )
}
