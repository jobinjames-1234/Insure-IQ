import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShieldCheck } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Stepper } from '../../components/ui/Stepper'
import { FileUpload } from '../../components/ui/FileUpload'
import { api } from '../../lib/api'
import { EmptyState } from '../../components/ui/EmptyState'

const kycSchema = z.object({
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  zipCode: z.string().min(5, "Zip code is required"),
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, "Must be format XXX-XX-XXXX"),
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
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans flex flex-col items-center">
      <div className="max-w-2xl w-full mb-8">
        <Stepper steps={[
          { id: 1, title: "Personal Details", status: step > 1 ? "complete" : step === 1 ? "current" : "upcoming" },
          { id: 2, title: "Identity Document", status: step > 2 ? "complete" : step === 2 ? "current" : "upcoming" },
          { id: 3, title: "Verification", status: step > 3 ? "complete" : step === 3 ? "current" : "upcoming" }
        ]} />
      </div>
      
      <div className="max-w-xl w-full space-y-8 bg-white p-10 rounded-xl shadow-xl border border-slate-100">
        
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-6">Confirm Personal Details</h2>
            <form className="space-y-5" onSubmit={handleSubmit(handleDetailsSubmit)}>
              <Input label="Street Address" placeholder="123 Main St" error={errors.address?.message} {...register('address')} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="City" placeholder="Anytown" error={errors.city?.message} {...register('city')} />
                <Input label="Zip Code" placeholder="12345" error={errors.zipCode?.message} {...register('zipCode')} />
              </div>
              <Input label="SSN (Last 4 digits for verification)" placeholder="XXX-XX-1234" error={errors.ssn?.message} {...register('ssn')} />
              
              <div className="pt-4 flex justify-end">
                <Button type="submit">Continue to Document</Button>
              </div>
            </form>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-6">Upload Identity Document</h2>
            <p className="text-sm text-slate-500 mb-6">Please upload a clear, color photo of your driver's license or passport.</p>
            
            <FileUpload 
              onFileSelect={(f) => { setDocument(f); setGlobalError(null); }} 
              accept="image/png, image/jpeg, application/pdf"
            />
            
            {document && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-sm text-emerald-700 flex items-center justify-between">
                <span>Selected: {document.name}</span>
                <span className="font-semibold text-xs">{(document.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}

            {globalError && (
              <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-600 font-medium text-center">{globalError}</p>
              </div>
            )}

            <div className="pt-8 flex justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleDocumentSubmit} isLoading={isSubmitting}>Submit Verification</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="py-8">
            <EmptyState 
              icon={<ShieldCheck className="h-8 w-8 text-indigo-600" />}
              title="Verification Pending"
              description="Your documents have been securely uploaded. Our automated systems usually verify identity within 5 minutes. You can proceed to your dashboard."
              action={<Button onClick={() => navigate('/portal')}>Go to Dashboard</Button>}
            />
          </div>
        )}

      </div>
    </div>
  )
}
