import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, CloudUpload, Calendar, ChevronDown } from 'lucide-react'
import { api } from '../../lib/api'

export function FileAClaimPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultPolicyId = searchParams.get('policy_id') || ''

  const [formData, setFormData] = useState({
    policy_id: defaultPolicyId,
    incident_date: '',
    incident_type: '',
    description: '',
    estimated_amount: ''
  })
  const [, setDocument] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/claims', {
        ...formData,
        claimed_amount: parseFloat(formData.estimated_amount || '0')
      })
      // If we had a document, we would upload it here
      navigate('/portal/claims')
    } catch (err) {
      console.error(err)
      alert("Failed to file claim")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-background">
      <main className="flex-grow pt-8 pb-12 md:pb-margin px-4 sm:px-6 lg:px-8 w-full animate-in fade-in duration-500">
        <div className="max-w-2xl mx-auto w-full mt-4 md:mt-8">
          
          {/* Header Section */}
          <div className="mb-10 text-center md:text-left">
            <p className="font-overline text-overline font-semibold text-text-secondary uppercase mb-2 tracking-widest">Claim Intake</p>
            <h1 className="font-h1 text-h1 font-bold text-on-surface mb-3 tracking-tight">We're here to help.</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
              Let's get the details of your incident recorded so we can process your claim quickly. 
              Your progress is saved automatically.
            </p>
          </div>

          {/* Form Surface */}
          <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant p-6 md:p-10 mb-8">
            
            {/* Stepper Visual */}
            <div className="flex items-center justify-between mb-8 pb-8 border-b border-outline-variant">
              <div className="flex flex-col">
                <span className="font-caption text-caption text-text-muted mb-1 font-medium">Step 1 of 3</span>
                <h2 className="font-h3 text-h3 font-semibold text-on-surface">Incident Details</h2>
              </div>
              <div className="flex space-x-2">
                <div className="h-2 w-8 rounded-full bg-primary"></div>
                <div className="h-2 w-8 rounded-full bg-surface-container-highest"></div>
                <div className="h-2 w-8 rounded-full bg-surface-container-highest"></div>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {!defaultPolicyId && (
                <div>
                  <label className="block mb-2 font-caption text-caption font-medium text-on-surface-variant uppercase tracking-wider" htmlFor="policy-id">Policy ID *</label>
                  <input 
                    className="w-full h-11 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT px-4 font-body text-body text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-fixed transition-all" 
                    id="policy-id" 
                    required 
                    value={formData.policy_id}
                    onChange={(e) => setFormData({...formData, policy_id: e.target.value})}
                  />
                </div>
              )}

              {/* Row 1: Date & Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 font-caption text-caption font-medium text-on-surface-variant uppercase tracking-wider" htmlFor="incident-date">Incident Date *</label>
                  <div className="relative">
                    <input 
                      className="w-full h-11 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT pl-10 pr-4 font-body text-body text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-fixed transition-all" 
                      id="incident-date" 
                      required 
                      type="date"
                      value={formData.incident_date}
                      onChange={(e) => setFormData({...formData, incident_date: e.target.value})}
                    />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 font-caption text-caption font-medium text-on-surface-variant uppercase tracking-wider" htmlFor="incident-type">Type of Incident *</label>
                  <div className="relative">
                    <select 
                      className="w-full h-11 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT pl-4 pr-10 font-body text-body text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-fixed transition-all appearance-none" 
                      id="incident-type" 
                      required
                      value={formData.incident_type}
                      onChange={(e) => setFormData({...formData, incident_type: e.target.value})}
                    >
                      <option disabled value="">Select category...</option>
                      <option value="auto_collision">Auto Collision</option>
                      <option value="auto_theft">Auto Theft</option>
                      <option value="property_damage">Property Damage</option>
                      <option value="water_damage">Water Leak / Damage</option>
                      <option value="other">Other</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Row 2: Amount */}
              <div>
                <label className="block mb-2 font-caption text-caption font-medium text-on-surface-variant uppercase tracking-wider" htmlFor="amount-claimed">Estimated Amount Claimed (Optional)</label>
                <div className="relative max-w-sm">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-mono-data text-mono-data">$</span>
                  <input 
                    className="w-full h-11 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT pl-8 pr-4 font-mono-data text-mono-data text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-fixed transition-all" 
                    id="amount-claimed" 
                    min="0" 
                    placeholder="0.00" 
                    step="0.01" 
                    type="number"
                    value={formData.estimated_amount}
                    onChange={(e) => setFormData({...formData, estimated_amount: e.target.value})}
                  />
                </div>
                <p className="mt-2 font-caption text-caption text-text-muted">You can leave this blank if you are unsure.</p>
              </div>

              {/* Row 3: Description */}
              <div>
                <label className="block mb-2 font-caption text-caption font-medium text-on-surface-variant uppercase tracking-wider" htmlFor="description">What happened? *</label>
                <textarea 
                  className="w-full min-h-[120px] bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-4 font-body text-body text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-fixed transition-all resize-y" 
                  id="description" 
                  placeholder="Please provide a brief description of the incident, including any involved parties or context." 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              {/* Row 4: Upload */}
              <div>
                <label className="block mb-3 font-caption text-caption font-medium text-on-surface-variant uppercase tracking-wider">Supporting Documents & Photos</label>
                <div className="border-2 border-dashed border-outline-variant rounded-lg p-8 text-center hover:bg-surface-container-low transition-colors cursor-pointer group relative">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                    <CloudUpload className="text-primary w-6 h-6" />
                  </div>
                  <h3 className="font-body text-body font-medium text-on-surface mb-1">Click to upload or drag and drop</h3>
                  <p className="font-caption text-caption text-text-muted">SVG, PNG, JPG, PDF or MP4 (max. 10MB)</p>
                  <input 
                    accept="image/*,.pdf,video/mp4" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    multiple 
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setDocument(e.target.files[0])
                      }
                    }}
                  />
                </div>
              </div>

              {/* Divider */}
              <hr className="border-outline-variant mt-8 mb-8" />

              {/* Actions */}
              <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-4 pt-4">
                <button 
                  className="px-6 py-2 rounded-DEFAULT bg-transparent text-text-secondary font-body text-body font-medium hover:bg-bg-subtle transition-colors" 
                  type="button"
                  onClick={() => navigate('/portal/claims')}
                >
                  Save as Draft & Exit
                </button>
                <div className="flex gap-4">
                  <button 
                    className="flex-1 md:flex-none px-6 py-2.5 rounded-DEFAULT bg-surface-container-lowest border border-outline-variant text-on-surface font-body text-body font-medium hover:bg-surface-container-low transition-colors text-center" 
                    type="button"
                    onClick={() => navigate(-1)}
                  >
                    Back
                  </button>
                  <button 
                    className="flex-1 md:flex-none px-8 py-2.5 rounded-DEFAULT bg-primary text-white font-body text-body font-medium hover:bg-primary-container transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm" 
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Continue'}
                    {!submitting && <ArrowRight className="w-5 h-5" />}
                  </button>
                </div>
              </div>

            </form>
          </div>
          
          <div className="text-center font-caption text-caption text-text-muted">
            Need immediate assistance? Call <a className="text-primary hover:underline" href="tel:1-800-INSURE">1-800-INSURE</a>
          </div>
          
        </div>
      </main>
    </div>
  )
}
