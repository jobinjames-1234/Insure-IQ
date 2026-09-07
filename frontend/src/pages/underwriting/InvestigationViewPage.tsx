import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ZoomIn, ZoomOut, Image as ImageIcon, ShieldAlert, GitMerge, MessageSquare, Send, Plus } from 'lucide-react'
import { api } from '../../lib/api'

export function InvestigationViewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/claims/${id}`)
      .then((res: any) => setData(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-8 text-on-surface-variant animate-pulse font-body text-body">Loading claim...</div>
  
  const claim = data?.claim || {
    claim_number: 'CL-2023-8942',
    incident_date: '2023-10-24T00:00:00.000Z'
  }
  const customer = data?.customer || {
    first_name: 'Jane',
    last_name: 'Doe'
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background">
      {/* Top Action Bar */}
      <header className="flex items-center justify-between px-6 h-16 border-b border-outline-variant bg-surface flex-shrink-0 z-10 shadow-xs">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/b2b/claims')} 
            className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-h2 text-h2 text-on-surface flex items-center gap-2">
              Claim #{claim.claim_number}
              <span className="inline-flex items-center justify-center px-2 py-0.5 bg-danger-bg text-danger font-overline text-overline rounded-full ml-2 uppercase tracking-wider">HIGH RISK</span>
            </h2>
            <p className="font-caption text-caption text-text-secondary">Filed: {new Date(claim.incident_date).toLocaleDateString()} | Insured: {customer.first_name} {customer.last_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-10 px-6 font-caption text-caption font-medium rounded bg-surface text-danger border border-outline-variant hover:bg-danger-bg transition-colors">
            Reject Claim
          </button>
          <button className="h-10 px-6 font-caption text-caption font-medium rounded bg-surface text-warning border border-outline-variant hover:bg-warning-bg transition-colors">
            Escalate to SIU
          </button>
          <button className="h-10 px-6 font-caption text-caption font-medium rounded bg-primary-container text-white hover:opacity-90 transition-opacity">
            Approve
          </button>
        </div>
      </header>

      {/* Two Pane Layout */}
      <div className="flex flex-grow overflow-hidden">
        {/* Left Pane: Document/Photo Viewer */}
        <section className="w-3/5 border-r border-outline-variant flex flex-col bg-surface-container-lowest overflow-hidden relative z-0">
          <div className="flex-grow p-6 flex items-center justify-center relative overflow-hidden bg-surface-dim">
            <div className="absolute inset-4 rounded-lg overflow-hidden border border-outline-variant shadow-sm bg-black group cursor-crosshair">
              {/* Simulated zoomed image view */}
              <img 
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500 ease-out origin-center" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCWp3Qe5P2LpvZ0B5LWplRIEG9dHvCv2CtsA0JK1CdDusA56zfVANUsekU9j220fXW8wVquR0CSbz7rbxCWQ02PvcFvmSI2sqGQmgTlTsafAk_XVCmerdBJFX6lHnWgTKSGBH7mHFVAYoEqM168gSxm31gdBeBd93ZOm_PSQddoj32Q0UDJB88Auawbfc8gNC28ncleZX7oykdEz2mQ-xyMdjN-sYmqjx4cl2r0vXyIA3DdxrU2s50vg"
                alt="Car damage"
              />
              
              {/* Simulated UI overlays on image */}
              <div className="absolute top-4 left-4 bg-surface/90 backdrop-blur-sm px-3 py-1.5 rounded border border-outline-variant font-mono-data text-mono-data text-on-surface flex items-center gap-2">
                <ImageIcon className="w-[18px] h-[18px]" /> IMG_4921.JPG
              </div>
              <div className="absolute bottom-4 right-4 bg-surface/90 backdrop-blur-sm px-3 py-1.5 rounded border border-outline-variant font-mono-data text-mono-data text-on-surface flex items-center gap-4">
                <button className="hover:text-primary"><ZoomOut className="w-[18px] h-[18px]" /></button>
                <span>150%</span>
                <button className="hover:text-primary"><ZoomIn className="w-[18px] h-[18px]" /></button>
              </div>

              {/* Bounding box overlay for AI detection */}
              <div className="absolute top-[30%] left-[20%] w-[40%] h-[35%] border-2 border-warning border-dashed bg-warning/10 pointer-events-none rounded-sm">
                <div className="absolute -top-6 left-0 bg-warning text-surface-container-lowest font-overline text-overline px-2 py-0.5 rounded-t-sm whitespace-nowrap tracking-wider">AI DETECTED: INCONSISTENT DAMAGE PATTERN</div>
              </div>
            </div>
          </div>
          
          {/* Thumbnail Strip */}
          <div className="h-32 border-t border-outline-variant bg-surface flex items-center gap-4 px-6 py-4 overflow-x-auto">
            <div className="w-24 h-20 rounded border-2 border-primary overflow-hidden flex-shrink-0 cursor-pointer">
              <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXeiM_uoYXZ8QjGeKfmaP6iDe4_N6StzBm9kSEsjCkMhEoWI14MTVctEtzGchn_enDhmG_ixEecoM_e0fY92imWevbwlBPF6RIsV1_LmUnLCUakcTkNVD5s3RVUv1MLZuhri1PoN9fY7yraB9RcaBEQ9qab1STXvoWWm5SqCDUGuMi_rMFonqaGMlu26ywkHl4U0XYVc3mAq3kXenVF-eZuGqnzCR2MsFxuuIRXYBSpgicDuOsCcBtFA" alt="Thumb 1" />
            </div>
            <div className="w-24 h-20 rounded border border-outline-variant overflow-hidden flex-shrink-0 cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
              <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCga8Vnkw6YNJy5FDhCSkmM6e4MRhOWqb7MjzuIBlkkBT_Qcfcn5WPe2fXmZlxbLiCNhGKq_Q1oYRCdhuEY3CL20zZi8Etou2LotEZ4R4IkorafIMuWO328-WV5unF-nUvWy5F2BWNGZSM6zDyl9FBx_9cxQIUwOlk-hcV1Jqp-7obUcBML7_2lY19MR3zvYgs8oGJgcgzlV7idXf8X1ek6L2UMRCHVEgQhPm3uVuzL7G5eu3maaWf0ag" alt="Thumb 2" />
            </div>
            <div className="w-24 h-20 rounded border border-outline-variant overflow-hidden flex-shrink-0 cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
              <img className="w-full h-full object-cover grayscale" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQ5bGar-EpeXelT3V60ROTEOjXq6uN8XOKz3vY6ZkQtpbi7zcimBmglpTj7EvD-AF8Qa_ABK6tSbT2hLc46pLbq9b1TvJpo6edaeddb5JKCrtuqBIfsBOLc05IyQtMEkxilJ-w5LyM4EPzq_9ukGS621H7P1dR9rbZ5yDt0WFk95TFZz2Kitp42lEKm-EdsBgA699QI9lt98WV4ugF512euoEB4sFXOXkhYEkb1RDAsef9uHSxDMeNyA" alt="Document Thumb" />
            </div>
            <div className="w-24 h-20 rounded border border-outline-variant overflow-hidden flex-shrink-0 flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer">
              <Plus className="text-on-surface-variant w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Right Pane: Context & Intelligence */}
        <section className="w-2/5 flex flex-col bg-surface overflow-y-auto">
          <div className="p-6 space-y-6 flex-grow flex flex-col">
            
            {/* Fraud Intelligence Panel */}
            <div className="bg-surface-container-lowest rounded-lg border border-danger p-5 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-danger"></div>
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-h3 text-h3 text-danger flex items-center gap-2">
                  <ShieldAlert className="w-[18px] h-[18px]" />
                  Fraud Intelligence
                </h3>
                <span className="bg-danger-bg text-danger font-overline text-overline px-2 py-1 rounded border border-danger/20 tracking-wider">CONFIDENCE: 92%</span>
              </div>
              <p className="font-body text-body text-on-surface mb-4">Multiple anomalous signals detected regarding policy inception timeline and claimed incident parameters.</p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-danger-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-danger text-xs font-bold">!</span>
                  </div>
                  <div>
                    <h4 className="font-caption text-caption font-semibold text-on-surface">Proximity to Policy Start</h4>
                    <p className="font-caption text-caption text-text-secondary">Claim filed exactly 3 days after policy inception.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-warning-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-warning text-xs font-bold">!</span>
                  </div>
                  <div>
                    <h4 className="font-caption text-caption font-semibold text-on-surface">Location Mismatch</h4>
                    <p className="font-caption text-caption text-text-secondary">Incident location is 450 miles from insured's primary garaging address.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Signals */}
            <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-5 shadow-xs">
              <h3 className="font-h3 text-h3 text-on-surface mb-4 flex items-center gap-2">
                <GitMerge className="w-[18px] h-[18px] text-primary" />
                Related Signals
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-outline-variant border-dashed last:border-0">
                  <span className="font-mono-data text-mono-data text-text-secondary">IP ADDR MATCH</span>
                  <span className="font-caption text-caption font-medium text-on-surface">3 previous denied claims</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-outline-variant border-dashed last:border-0">
                  <span className="font-mono-data text-mono-data text-text-secondary">BODY SHOP NETWORK</span>
                  <span className="font-caption text-caption font-medium text-warning">Flagged Entity: 'Xyz Auto'</span>
                </div>
              </div>
            </div>

            {/* Adjuster Notes Thread */}
            <div className="flex-grow flex flex-col">
              <h3 className="font-h3 text-h3 text-on-surface mb-4 flex items-center gap-2">
                <MessageSquare className="w-[18px] h-[18px] text-on-surface-variant" />
                Investigation Thread
              </h3>
              <div className="space-y-4 mb-6 flex-grow">
                {/* Note Item */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center flex-shrink-0 border border-outline-variant">
                    <span className="font-caption text-caption font-bold text-on-surface-variant">AJ</span>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3 border border-outline-variant w-full relative">
                    <div className="absolute -left-2 top-3 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-outline-variant"></div>
                    <div className="absolute -left-[7px] top-[13px] w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-surface-container-low"></div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-caption text-caption font-semibold text-on-surface">Alice Johnson</span>
                      <span className="font-caption text-caption text-text-secondary">Oct 25, 09:14 AM</span>
                    </div>
                    <p className="font-body text-body text-on-surface">Called insured. Sounded evasive regarding the exact sequence of events leading to the collision. Requested recorded statement.</p>
                  </div>
                </div>
                {/* Note Item */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0 border border-outline-variant">
                    <span className="font-caption text-caption font-bold text-on-secondary-container">SIU</span>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3 border border-outline-variant w-full relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-caption text-caption font-semibold text-on-surface">System (SIU Rules Engine)</span>
                      <span className="font-caption text-caption text-text-secondary">Oct 25, 09:15 AM</span>
                    </div>
                    <p className="font-body text-body text-on-surface">Automated trigger: Flagged for mandatory review based on Adjuster input 'evasive' + High Risk score.</p>
                  </div>
                </div>
              </div>

              {/* Add Note Input */}
              <div className="mt-auto">
                <textarea 
                  className="w-full bg-surface border border-outline-variant rounded p-3 font-body text-body text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none" 
                  placeholder="Add internal note or SIU referral justification..." 
                  rows={3}
                ></textarea>
                <div className="flex justify-end mt-2">
                  <button className="px-4 py-2 font-caption text-caption font-medium rounded bg-surface text-on-surface border border-outline-variant hover:bg-surface-container transition-colors flex items-center gap-2">
                    <Send className="w-[14px] h-[14px]" />
                    Post Note
                  </button>
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>
    </div>
  )
}
