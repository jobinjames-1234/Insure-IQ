import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { FileUpload } from '../../components/ui/FileUpload'
import { api } from '../../lib/api'

export function FileAClaimPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultPolicyId = searchParams.get('policy_id') || ''

  const [formData, setFormData] = useState({
    policy_id: defaultPolicyId,
    incident_date: '',
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
        estimated_amount: parseFloat(formData.estimated_amount || '0')
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
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6 md:space-y-8">
      <PageHeader 
        title="File a Claim" 
        description="Report an incident and begin the claims process." 
      />

      <Card>
        <CardHeader><CardTitle>Claim Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
              label="Policy ID" 
              value={formData.policy_id}
              onChange={(e: any) => setFormData({...formData, policy_id: e.target.value})}
              required
            />
            <Input 
              type="date"
              label="Date of Incident" 
              value={formData.incident_date}
              onChange={(e: any) => setFormData({...formData, incident_date: e.target.value})}
              required
            />
            <Input 
              type="number"
              label="Estimated Amount ($)" 
              value={formData.estimated_amount}
              onChange={(e: any) => setFormData({...formData, estimated_amount: e.target.value})}
            />
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description of Incident</label>
              <textarea 
                className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                rows={4}
                value={formData.description}
                onChange={(e: any) => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Supporting Evidence (Photos/Docs)</label>
              <FileUpload onFileSelect={(f: any) => setDocument(f)} />
            </div>

            <div className="pt-4 flex flex-col md:flex-row gap-4">
              <Button type="submit" isLoading={submitting} className="w-full md:w-auto">Submit Claim</Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/portal')} className="w-full md:w-auto">Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
