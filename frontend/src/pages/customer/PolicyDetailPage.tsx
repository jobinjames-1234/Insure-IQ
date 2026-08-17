import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { api } from '../../lib/api'

export function PolicyDetailPage() {
  const { id } = useParams()
  const [policy, setPolicy] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/policies/${id}`)
      .then((res: any) => setPolicy(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-8">Loading policy...</div>
  if (!policy) return <div className="p-8">Policy not found.</div>

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader 
          title={`Policy ${policy.policy_number}`} 
          description="Detailed coverage information." 
        />
        <Badge variant="success">Active</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Policy Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <div>
              <dt className="text-sm font-medium text-slate-500">Effective Date</dt>
              <dd className="mt-1 text-sm text-slate-900">{new Date(policy.start_date).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Expiration Date</dt>
              <dd className="mt-1 text-sm text-slate-900">{new Date(policy.end_date).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Total Premium</dt>
              <dd className="mt-1 text-sm text-slate-900">${policy.total_premium}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Status</dt>
              <dd className="mt-1 text-sm text-slate-900">Active</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
