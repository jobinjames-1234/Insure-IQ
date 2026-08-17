import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, ArrowRight } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { FileUpload } from '../../components/ui/FileUpload'
import { PageHeader } from '../../components/ui/PageHeader'
import { api } from '../../lib/api'

export function BrowseAndApplyPage() {
  const navigate = useNavigate()
  const [policyTypes, setPolicyTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null)
  const [formData, setFormData] = useState({ income: '', dependents: '0' })
  const [document, setDocument] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get('/applications/policy-types')
      .then((res: any) => setPolicyTypes(res.data))
      .catch((err: any) => console.error("Failed to load policy types", err))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPolicy) return
    
    setSubmitting(true)
    try {
      const res = await api.post('/applications', {
        policy_type_id: selectedPolicy,
        data: formData
      })
      const appId = res.data.id
      
      if (document) {
        await api.post(`/applications/${appId}/documents`, {
          type: 'supporting_document',
          url: `mock_url_${document.name}`
        })
      }
      
      navigate('/portal/applications')
    } catch (err) {
      console.error(err)
      alert("Error submitting application")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8">Loading products...</div>

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Insurance Products" 
        description="Select a policy type to start your application." 
      />

      {!selectedPolicy ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {policyTypes.length === 0 ? (
            <p>No products available.</p>
          ) : (
            policyTypes.map((pt) => (
              <Card key={pt.id} className="hover:border-indigo-500 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-indigo-600" />
                    {pt.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500 mb-4">Term: {pt.term_months} months</p>
                </CardContent>
                <div className="p-6 pt-0 mt-auto">
                  <Button className="w-full" onClick={() => setSelectedPolicy(pt.id)}>
                    Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input 
                label="Annual Income" 
                placeholder="e.g. 75000" 
                value={formData.income}
                onChange={(e: any) => setFormData({...formData, income: e.target.value})}
                required
              />
              <Input 
                label="Number of Dependents" 
                type="number"
                value={formData.dependents}
                onChange={(e: any) => setFormData({...formData, dependents: e.target.value})}
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Supporting Document (Optional)</label>
                <FileUpload onFileSelect={(f: any) => setDocument(f)} />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <Button variant="ghost" onClick={() => setSelectedPolicy(null)} type="button">Cancel</Button>
                <Button type="submit" isLoading={submitting}>Submit Application</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
