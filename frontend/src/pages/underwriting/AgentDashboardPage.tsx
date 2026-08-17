import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, DollarSign, AlertCircle } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { MetricCard } from '../../components/ui/MetricCard'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { api } from '../../lib/api'

export function AgentDashboardPage() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [commission, setCommission] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/agent/customers'),
      api.get('/agent/retention-alerts'),
      api.get('/agent/commission')
    ])
    .then(([custRes, alertRes, commRes]) => {
      setCustomers(custRes.data)
      setAlerts(alertRes.data)
      setCommission(commRes.data)
    })
    .catch(err => console.error(err))
    .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8">Loading agent dashboard...</div>

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Agent Dashboard" 
        description="Overview of your portfolio and performance." 
      />

      {commission && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            title="MTD Commission" 
            value={`$${commission.mtd_commission.toLocaleString()}`} 
            trend={5} 
            icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
          />
          <MetricCard 
            title="Active Policies" 
            value={commission.active_policies} 
            trend={2} 
            icon={<Users className="w-5 h-5 text-indigo-500" />}
          />
          <MetricCard 
            title="Retention Alerts" 
            value={alerts.length} 
            trend={-100} 
            icon={<AlertCircle className="w-5 h-5 text-amber-500" />}
          />
        </div>
      )}

      {alerts.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-slate-900 mb-4">High Priority Alerts</h3>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 space-y-2">
            {alerts.map((alert: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center bg-white p-3 rounded shadow-sm border border-amber-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{alert.name}</p>
                    <p className="text-xs text-slate-500">{alert.reason}</p>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => navigate(`/b2b/agent/customers/${alert.customer_id}`)}>View Profile</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium text-slate-900 mb-4">My Customers</h3>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <DataTable
            data={customers}
            rowKey={(item: any) => item.id}
            columns={[
              { key: 'name', title: 'Customer', render: (item: any) => <span className="font-medium text-slate-900">{item.first_name} {item.last_name}</span> },
              { key: 'contact', title: 'Contact', render: (item: any) => <span className="text-slate-500 text-sm">{item.phone_number || 'N/A'}</span> },
              { key: 'status', title: 'Status', render: () => <Badge variant="success">Active</Badge> },
              { key: 'actions', title: '', render: (item: any) => (
                <div className="text-right">
                  <Button variant="secondary" onClick={() => navigate(`/b2b/agent/customers/${item.id}`)}>Profile</Button>
                </div>
              )}
            ]}
          />
        </div>
      </div>
    </div>
  )
}
