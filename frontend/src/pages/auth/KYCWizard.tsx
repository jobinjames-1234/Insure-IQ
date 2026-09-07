import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShieldCheck, CloudUpload, ArrowRight, ArrowLeft } from 'lucide-react'
import { api } from '../../lib/api'

const kycSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  dob: z.string().min(1, "Date of Birth is required"),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "Zip code is required")
})

type KYCFormData = z.infer<typeof kycSchema>

export function KYCWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState<number>(1)
  const [document, setDocument] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  
  const { register, handleSubmit, formState: { errors } } = useForm<KYCFormData>({
    resolver: zodResolver(kycSchema)
  })

  const handleDetailsSubmit = (_data: KYCFormData) => {
    // In a real app we'd save this to state or context.
    setStep(2)
  }

  const handleDocumentSubmit = async () => {
    if (!document) {
      setGlobalError("Please upload a valid identity document.")
      return
    }
    
    setIsSubmitting(true)
    setGlobalError(null)
    
    try {
      // Create FormData if sending real files, but for MVP mock JSON
      await api.post('/auth/kyc/submit', { has_document: true })
      setStep(3)
    } catch (err: any) {
      setGlobalError("Failed to upload document. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-background text-on-background font-body min-h-screen flex flex-col">
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
        <div className="w-full max-w-2xl bg-surface rounded-xl shadow-xs border border-outline-variant p-6 sm:p-8">
          
          <div className="text-center mb-8">
            <h1 className="font-display text-display text-primary mb-2">InsureIQ</h1>
            <p className="font-body-lg text-body-lg text-text-secondary">Create your account</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8 relative px-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-outline-variant z-0"></div>
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-px bg-primary z-0 transition-all duration-500 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`}></div>
            
            <div className="relative z-10 flex flex-col items-center bg-surface px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-caption text-caption mb-1 transition-colors ${step >= 1 ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant'}`}>
                1
              </div>
              <span className={`font-caption text-caption ${step >= 1 ? 'text-primary' : 'text-on-surface-variant'}`}>Details</span>
            </div>
            
            <div className="relative z-10 flex flex-col items-center bg-surface px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-caption text-caption mb-1 transition-colors ${step >= 2 ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant'}`}>
                2
              </div>
              <span className={`font-caption text-caption ${step >= 2 ? 'text-primary' : 'text-on-surface-variant'}`}>Documents</span>
            </div>
            
            <div className="relative z-10 flex flex-col items-center bg-surface px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-caption text-caption mb-1 transition-colors ${step >= 3 ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant'}`}>
                3
              </div>
              <span className={`font-caption text-caption ${step >= 3 ? 'text-primary' : 'text-on-surface-variant'}`}>Verification</span>
            </div>
          </div>

          {step === 1 && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <div className="mb-6 border-b border-outline-variant pb-4">
                <h2 className="font-h2 text-h2 text-on-surface mb-1">Personal Details</h2>
                <p className="font-body text-body text-text-secondary">Please provide your legal name and contact information.</p>
              </div>
              
              <form className="space-y-6" onSubmit={handleSubmit(handleDetailsSubmit)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="font-caption text-caption text-text-secondary block" htmlFor="firstName">First Name</label>
                    <input 
                      className={`w-full h-11 px-3 border ${errors.firstName ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} rounded bg-surface text-on-surface text-sm focus:outline-none focus:ring-4 transition-all`} 
                      id="firstName" 
                      placeholder="Enter first name" 
                      type="text"
                      {...register('firstName')}
                    />
                    {errors.firstName && <p className="font-caption text-caption text-error mt-1">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="font-caption text-caption text-text-secondary block" htmlFor="lastName">Last Name</label>
                    <input 
                      className={`w-full h-11 px-3 border ${errors.lastName ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} rounded bg-surface text-on-surface text-sm focus:outline-none focus:ring-4 transition-all`} 
                      id="lastName" 
                      placeholder="Enter last name" 
                      type="text"
                      {...register('lastName')}
                    />
                    {errors.lastName && <p className="font-caption text-caption text-error mt-1">{errors.lastName.message}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="font-caption text-caption text-text-secondary block" htmlFor="dob">Date of Birth</label>
                    <input 
                      className={`w-full h-11 px-3 border ${errors.dob ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} rounded bg-surface text-on-surface text-sm focus:outline-none focus:ring-4 transition-all`} 
                      id="dob" 
                      type="date"
                      {...register('dob')}
                    />
                    {errors.dob && <p className="font-caption text-caption text-error mt-1">{errors.dob.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="font-caption text-caption text-text-secondary block" htmlFor="phone">Phone Number</label>
                    <input 
                      className={`w-full h-11 px-3 border ${errors.phone ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} rounded bg-surface text-on-surface text-sm focus:outline-none focus:ring-4 transition-all`} 
                      id="phone" 
                      placeholder="(555) 000-0000" 
                      type="tel"
                      {...register('phone')}
                    />
                    {errors.phone && <p className="font-caption text-caption text-error mt-1">{errors.phone.message}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-caption text-caption text-text-secondary block" htmlFor="email">Email Address</label>
                  <input 
                    className={`w-full h-11 px-3 border ${errors.email ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} rounded bg-surface text-on-surface text-sm focus:outline-none focus:ring-4 transition-all`} 
                    id="email" 
                    placeholder="name@example.com" 
                    type="email"
                    {...register('email')}
                  />
                  {errors.email && <p className="font-caption text-caption text-error mt-1">{errors.email.message}</p>}
                </div>
                
                <div className="space-y-1">
                  <label className="font-caption text-caption text-text-secondary block" htmlFor="address">Home Address</label>
                  <input 
                    className={`w-full h-11 px-3 border ${errors.address ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} rounded bg-surface text-on-surface text-sm focus:outline-none focus:ring-4 transition-all`} 
                    id="address" 
                    placeholder="Street address" 
                    type="text"
                    {...register('address')}
                  />
                  {errors.address && <p className="font-caption text-caption text-error mt-1">{errors.address.message}</p>}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-1 sm:col-span-1">
                    <label className="font-caption text-caption text-text-secondary block" htmlFor="city">City</label>
                    <input 
                      className={`w-full h-11 px-3 border ${errors.city ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} rounded bg-surface text-on-surface text-sm focus:outline-none focus:ring-4 transition-all`} 
                      id="city" 
                      placeholder="City" 
                      type="text"
                      {...register('city')}
                    />
                    {errors.city && <p className="font-caption text-caption text-error mt-1">{errors.city.message}</p>}
                  </div>
                  <div className="space-y-1 sm:col-span-1">
                    <label className="font-caption text-caption text-text-secondary block" htmlFor="state">State</label>
                    <select 
                      className={`w-full h-11 px-3 border ${errors.state ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} rounded bg-surface text-on-surface text-sm focus:outline-none focus:ring-4 transition-all appearance-none`} 
                      id="state"
                      {...register('state')}
                    >
                      <option value="">Select state</option>
                      <option value="NY">New York</option>
                      <option value="CA">California</option>
                      <option value="TX">Texas</option>
                    </select>
                    {errors.state && <p className="font-caption text-caption text-error mt-1">{errors.state.message}</p>}
                  </div>
                  <div className="space-y-1 sm:col-span-1">
                    <label className="font-caption text-caption text-text-secondary block" htmlFor="zip">ZIP Code</label>
                    <input 
                      className={`w-full h-11 px-3 border ${errors.zipCode ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} rounded bg-surface text-on-surface text-sm focus:outline-none focus:ring-4 transition-all`} 
                      id="zip" 
                      placeholder="10001" 
                      type="text"
                      {...register('zipCode')}
                    />
                    {errors.zipCode && <p className="font-caption text-caption text-error mt-1">{errors.zipCode.message}</p>}
                  </div>
                </div>
                
                <div className="pt-6 flex justify-end">
                  <button 
                    className="h-10 px-6 bg-primary text-white text-sm font-medium rounded shadow-sm hover:bg-primary-hover transition-colors flex items-center gap-2" 
                    type="submit"
                  >
                    Continue to Documents
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <div className="mb-6 border-b border-outline-variant pb-4">
                <h2 className="font-h2 text-h2 text-on-surface mb-1">Upload Identity Document</h2>
                <p className="font-body text-body text-text-secondary">Please upload a clear, color photo of your driver's license or passport.</p>
              </div>
              
              <div className="mt-8 mb-8 border-2 border-dashed border-outline-variant rounded-lg p-10 text-center hover:bg-surface-container-highest transition-colors cursor-pointer group relative">
                <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                  <CloudUpload className="text-primary w-8 h-8" />
                </div>
                <h3 className="font-body text-body font-medium text-on-surface mb-2">Click to upload or drag and drop</h3>
                <p className="font-caption text-caption text-text-muted">JPG, PNG or PDF (max. 5MB)</p>
                <input 
                  accept="image/png, image/jpeg, application/pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setDocument(e.target.files[0]);
                      setGlobalError(null);
                    }
                  }}
                />
              </div>
              
              {document && (
                <div className="mb-8 p-3 bg-success-bg border border-success/20 rounded-md font-body text-body text-success flex items-center justify-between">
                  <span className="font-medium truncate mr-4">Selected: {document.name}</span>
                  <span className="font-semibold text-xs whitespace-nowrap">{(document.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              )}

              {globalError && (
                <div className="mb-8 p-3 rounded-md bg-error-container border border-error/20">
                  <p className="font-body text-body text-error font-medium text-center">{globalError}</p>
                </div>
              )}

              <div className="pt-2 flex justify-between">
                <button 
                  className="h-10 px-6 bg-surface border border-outline-variant text-on-surface font-body text-body font-medium rounded hover:bg-surface-container-highest transition-colors flex items-center gap-2" 
                  onClick={() => setStep(1)}
                  type="button"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button 
                  className="h-10 px-6 bg-primary text-white font-body text-body font-medium rounded shadow-sm hover:bg-primary-hover transition-colors flex items-center gap-2 disabled:opacity-50" 
                  onClick={handleDocumentSubmit}
                  disabled={isSubmitting}
                  type="button"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Verification'}
                  {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-12 animate-in zoom-in-95 duration-500 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-success-bg flex items-center justify-center mb-6">
                <ShieldCheck className="w-10 h-10 text-success" />
              </div>
              <h2 className="font-h2 text-h2 text-on-surface mb-3">Verification Pending</h2>
              <p className="font-body text-body text-text-secondary max-w-md mx-auto mb-10 leading-relaxed">
                Your documents have been securely uploaded. Our automated systems usually verify identity within 5 minutes. You can proceed to your dashboard.
              </p>
              <button 
                className="h-11 px-8 bg-primary text-white font-body text-body font-medium rounded-lg shadow-sm hover:bg-primary-hover transition-colors w-full sm:w-auto"
                onClick={() => navigate('/portal')}
              >
                Go to Dashboard
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
