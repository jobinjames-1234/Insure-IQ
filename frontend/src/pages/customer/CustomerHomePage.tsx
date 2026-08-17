import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { api } from '../../lib/api'

export function CustomerHomePage() {
  const navigate = useNavigate()
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/policies/my')
      .then((res: any) => setPolicies(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8">Loading policies...</div>

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <PageHeader 
          title="My Coverage" 
          description="Manage your active policies and file claims." 
        />
        <Button onClick={() => navigate('/portal/apply')}>
          Get New Quote
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {policies.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No active policies</h3>
            <p className="text-slate-500 mb-6">You don't have any active coverage right now.</p>
            <Button onClick={() => navigate('/portal/apply')}>Browse Products</Button>
          </div>
        ) : (
          policies.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2 text-indigo-700">
                    <Shield className="h-5 w-5" />
                    {p.policy_number}
                  </CardTitle>
                  <Badge variant="success">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Premium</span>
                    <span className="font-medium">${p.total_premium}/yr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Effective</span>
                    <span className="font-medium">{new Date(p.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expires</span>
                    <span className="font-medium">{new Date(p.end_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
              <div className="p-4 md:p-6 pt-0 mt-auto grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => navigate(`/portal/policies/${p.id}`)}>
                  View Details
                </Button>
                <Button variant="primary" onClick={() => navigate(`/portal/claims/new?policy_id=${p.id}`)}>
                  File Claim
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
