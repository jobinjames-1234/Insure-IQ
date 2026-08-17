import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { api } from '../../lib/api'

export function ProvisionTenantPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    slug: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/console/tenants', formData)
      navigate('/b2b/console/tenants')
    } catch (err) {
      console.error(err)
      alert("Failed to provision tenant")
    } finally {
      setSubmitting(false)
    }
  }

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    setFormData({ name: val, slug })
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <PageHeader 
        title="Provision New Tenant" 
        description="Create a new workspace for an organization." 
      />

      <Card>
        <CardHeader><CardTitle>Tenant Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
              label="Organization Name" 
              value={formData.name}
              onChange={(e: any) => handleNameChange(e.target.value)}
              required
            />
            <Input 
              label="Tenant Slug (used in URLs and API routes)" 
              value={formData.slug}
              onChange={(e: any) => setFormData({...formData, slug: e.target.value})}
              required
            />
            
            <div className="pt-4 flex gap-4">
              <Button type="button" variant="ghost" onClick={() => navigate('/b2b/console')}>Cancel</Button>
              <Button type="submit" isLoading={submitting}>Provision Workspace</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
