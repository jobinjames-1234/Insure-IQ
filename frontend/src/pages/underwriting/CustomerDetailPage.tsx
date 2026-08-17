import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { api } from '../../lib/api'

export function CustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/agent/customers/${id}`)
      .then((res: any) => setData(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-8">Loading customer profile...</div>
  if (!data) return <div className="p-8">Customer not found.</div>

  const cust = data.customer
  const policies = data.policies

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader 
          title={`${cust.first_name} ${cust.last_name}`} 
          description="Customer Profile and Policy Portfolio" 
        />
        <Button onClick={() => alert("Submitting on behalf of customer flow would open here")}>
          Submit New Application
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader><CardTitle>Profile Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-slate-500 font-medium">Date of Birth</dt>
                  <dd className="mt-1">{cust.date_of_birth ? new Date(cust.date_of_birth).toLocaleDateString() : 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">Phone</dt>
                  <dd className="mt-1">{cust.phone_number || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">Address</dt>
                  <dd className="mt-1">{cust.address_line1} {cust.address_line2}<br/>{cust.city}, {cust.state} {cust.postal_code}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader><CardTitle>Active Policies</CardTitle></CardHeader>
            <CardContent>
              {policies.length === 0 ? (
                <p className="text-slate-500 text-sm">No active policies found for this customer.</p>
              ) : (
                <div className="space-y-4">
                  {policies.map((p: any) => (
                    <div key={p.id} className="border border-slate-200 rounded-lg p-4 flex justify-between items-center hover:border-indigo-500 transition-colors cursor-pointer" onClick={() => navigate(`/b2b/agent/policies/${p.id}`)}>
                      <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-indigo-500" />
                        <div>
                          <p className="font-medium text-slate-900">{p.policy_number}</p>
                          <p className="text-xs text-slate-500">Expires: {new Date(p.end_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">${p.total_premium}/yr</p>
                        <Badge variant="success">Active</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
