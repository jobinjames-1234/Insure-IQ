import { useState, useEffect } from 'react'
import { FileText, ChevronRight, Check, Activity, MapPin, Info, User, CheckCircle2, Clock, Camera } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { api } from '../../lib/api'

export function ClaimTrackerPage() {
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null)

  useEffect(() => {
    api.get('/claims/my')
      .then((res: any) => setClaims(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="success">Approved</Badge>
      case 'rejected': return <Badge variant="danger">Rejected</Badge>
      case 'under_review': return <Badge variant="warning">Under Review</Badge>
      case 'submitted': return <Badge variant="default">Submitted</Badge>
      default: return <Badge variant="default">{status}</Badge>
    }
  }

  if (loading) return <div className="p-8 text-center text-text-secondary animate-pulse">Loading claims...</div>

  if (selectedClaim) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-64px)] bg-background">
        <main className="max-w-max-width mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full animate-in fade-in duration-500">
          
          {/* Header Section */}
          <header className="mb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <nav className="flex items-center gap-2 mb-2 text-text-muted cursor-pointer" onClick={() => setSelectedClaim(null)}>
                  <span className="font-caption text-caption hover:text-primary transition-colors">Claims</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="font-caption text-caption text-on-surface">#{selectedClaim.id.substring(0,8)}</span>
                </nav>
                <h1 className="font-h1 text-h1 font-bold text-on-surface">Track your claim</h1>
              </div>
              <div className="flex gap-3">
                <button className="px-6 py-2 border border-outline text-on-surface rounded-lg font-body text-body hover:bg-surface-container transition-all">
                  Download Report
                </button>
                <button className="px-6 py-2 bg-primary text-white rounded-lg font-body text-body hover:opacity-90 transition-all shadow-sm">
                  Contact Support
                </button>
              </div>
            </div>
          </header>

          {/* Main Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Tracker (Stepper) Column */}
            <div className="lg:col-span-4 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant shadow-xs">
              <h3 className="font-h3 text-h3 mb-8 text-on-surface">Claim Status</h3>
              
              <div className="relative space-y-12">
                
                {/* Step 1: Submitted */}
                <div className="relative flex items-start gap-4">
                  <div className="absolute w-0.5 bg-success top-8 bottom-[-3rem] left-[15px]"></div>
                  <div className="z-10 w-8 h-8 rounded-full bg-success text-on-primary flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 font-bold" />
                  </div>
                  <div>
                    <p className="font-body text-body font-semibold text-on-surface">Submitted</p>
                    <p className="font-caption text-caption text-text-secondary">{new Date(selectedClaim.incident_date).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Step 2: Under Review */}
                <div className="relative flex items-start gap-4">
                  <div className={`absolute w-0.5 top-8 bottom-[-3rem] left-[15px] ${selectedClaim.status === 'under_review' || selectedClaim.status === 'approved' ? 'bg-success' : 'bg-outline-variant'}`}></div>
                  <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedClaim.status === 'under_review' || selectedClaim.status === 'approved' ? 'bg-success text-on-primary' : 'bg-surface-container-high border-2 border-outline-variant text-text-muted'}`}>
                    {selectedClaim.status === 'under_review' || selectedClaim.status === 'approved' ? <Check className="w-4 h-4 font-bold" /> : <div className="w-2 h-2 rounded-full bg-outline"></div>}
                  </div>
                  <div>
                    <p className={`font-body text-body font-semibold ${selectedClaim.status === 'under_review' || selectedClaim.status === 'approved' ? 'text-on-surface' : 'text-text-muted'}`}>Under Review</p>
                    <p className="font-caption text-caption text-text-secondary">{selectedClaim.status === 'under_review' || selectedClaim.status === 'approved' ? 'In Progress' : 'Pending'}</p>
                  </div>
                </div>

                {/* Step 3: Approved */}
                <div className="relative flex items-start gap-4">
                  <div className={`absolute w-0.5 top-8 bottom-[-3rem] left-[15px] ${selectedClaim.status === 'approved' ? 'bg-success' : 'bg-outline-variant'}`}></div>
                  <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedClaim.status === 'approved' ? 'bg-success text-on-primary' : 'bg-surface-container-high border-2 border-outline-variant text-text-muted'}`}>
                    {selectedClaim.status === 'approved' ? <Check className="w-4 h-4 font-bold" /> : <div className="w-2 h-2 rounded-full bg-outline"></div>}
                  </div>
                  <div>
                    <p className={`font-body text-body font-semibold ${selectedClaim.status === 'approved' ? 'text-on-surface' : 'text-text-muted'}`}>Approved</p>
                    <p className="font-caption text-caption text-text-secondary">{selectedClaim.status === 'approved' ? 'Complete' : 'Pending'}</p>
                  </div>
                </div>

                {/* Step 4: Payment Sent */}
                <div className="relative flex items-start gap-4">
                  <div className="z-10 w-8 h-8 rounded-full bg-surface-container-high border-2 border-outline-variant flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-outline"></div>
                  </div>
                  <div>
                    <p className="font-body text-body font-semibold text-text-muted">Payment Sent</p>
                    <p className="font-caption text-caption text-text-muted">Pending</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Right: Details Panels */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Incident Details Panel */}
              <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant shadow-xs">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="font-h3 text-h3 text-on-surface">Incident Details</h3>
                  <span className="px-3 py-1 bg-success-bg text-success font-caption text-caption rounded-full font-medium capitalize">
                    Claim
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="font-caption text-caption text-text-muted block mb-1 uppercase tracking-wider">Description</label>
                      <p className="font-body text-body text-on-surface">{selectedClaim.description || 'No description provided.'}</p>
                    </div>
                    <div>
                      <label className="font-caption text-caption text-text-muted block mb-1 uppercase tracking-wider">Date of Incident</label>
                      <p className="font-body text-body text-on-surface">{new Date(selectedClaim.incident_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="font-caption text-caption text-text-muted block mb-1 uppercase tracking-wider">Estimated Amount</label>
                      <p className="font-body text-body text-on-surface font-mono-data">${selectedClaim.estimated_amount}</p>
                    </div>
                  </div>
                  <div className="relative h-32 rounded-lg overflow-hidden border border-outline-variant bg-surface-container-highest flex items-center justify-center">
                    <MapPin className="text-text-secondary w-8 h-8" />
                  </div>
                </div>
              </div>

              {/* Adjuster Note & Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Note Panel */}
                <div className="bg-warning-bg p-8 rounded-xl border border-warning/20 shadow-xs relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="text-warning w-5 h-5" />
                    <h4 className="font-body text-body font-bold text-warning">Adjuster Note</h4>
                  </div>
                  <p className="font-body text-body text-on-surface leading-relaxed">
                    "Damage assessment in progress. Expected resolution in 24 hours."
                  </p>
                  <div className="mt-6 pt-6 border-t border-warning/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center border border-warning/20">
                      <User className="text-warning w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-caption text-caption font-bold text-on-surface">Marcus Sterling</p>
                      <p className="font-caption text-caption text-text-secondary">Senior Claims Adjuster</p>
                    </div>
                  </div>
                </div>

                {/* Summary / Next Steps Panel */}
                <div className="bg-bg-subtle p-8 rounded-xl border border-outline-variant shadow-xs">
                  <h4 className="font-body text-body font-bold mb-4 text-on-surface">Immediate Actions</h4>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="text-success w-5 h-5" />
                      <span className="font-body text-body text-on-surface">Photos uploaded</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Activity className="text-primary w-5 h-5" />
                      <span className="font-body text-body text-on-surface">Signature required for release</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Clock className="text-text-muted w-5 h-5" />
                      <span className="font-body text-body text-on-surface">Assessment review</span>
                    </li>
                  </ul>
                  <button className="w-full mt-6 py-2 bg-text-primary text-on-primary rounded-lg font-body text-body hover:opacity-90 transition-all">
                    Complete Signature
                  </button>
                </div>

              </div>

              {/* Documentation Carousel (Visual placeholder) */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-h3 text-h3 text-on-surface">Attached Documentation</h3>
                  <a className="text-primary font-caption text-caption hover:underline cursor-pointer">View All</a>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="aspect-square rounded-lg border border-outline-variant bg-surface-container-lowest flex items-center justify-center">
                    <FileText className="text-text-muted w-8 h-8" />
                  </div>
                  <div className="aspect-square rounded-lg border border-outline-variant bg-surface-container-lowest flex items-center justify-center">
                    <FileText className="text-text-muted w-8 h-8" />
                  </div>
                  <div className="aspect-square rounded-lg border border-outline-variant bg-surface-container-lowest flex items-center justify-center">
                    <FileText className="text-text-muted w-8 h-8" />
                  </div>
                  <div className="aspect-square rounded-lg border border-outline-variant bg-surface-container-highest flex flex-col items-center justify-center gap-2 hover:bg-bg-subtle transition-all cursor-pointer">
                    <Camera className="text-text-muted w-6 h-6" />
                    <span className="font-caption text-caption text-text-muted">Add Photo</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-max-width mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="My Claims" 
        description="Track the status of your reported incidents." 
      />

      {claims.length === 0 ? (
        <EmptyState 
          icon={<FileText className="h-8 w-8 text-slate-400" />}
          title="No claims filed"
          description="You haven't filed any claims yet."
        />
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant">
          <DataTable
            data={claims}
            rowKey={(item: any) => item.id}
            columns={[
              { key: 'id', title: 'Claim ID', render: (item: any) => <span className="font-mono-data text-mono-data font-semibold">{item.id.substring(0,8)}</span> },
              { key: 'incident_date', title: 'Incident Date', render: (item: any) => new Date(item.incident_date).toLocaleDateString() },
              { key: 'estimated_amount', title: 'Claim Amount', render: (item: any) => `$${item.estimated_amount}` },
              { key: 'status', title: 'Status', render: (item: any) => getStatusBadge(item.status) },
              { key: 'actions', title: '', render: (item: any) => (
                <button 
                  onClick={() => setSelectedClaim(item)}
                  className="text-primary hover:text-primary-container font-body text-body font-medium flex items-center gap-1"
                >
                  Track <ChevronRight className="w-4 h-4" />
                </button>
              ) }
            ]}
          />
        </div>
      )}
    </div>
  )
}
