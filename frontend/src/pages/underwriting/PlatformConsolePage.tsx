import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Server, Users, DollarSign, Building } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { MetricCard } from '../../components/ui/MetricCard'
import { Button } from '../../components/ui/Button'
import { api } from '../../lib/api'

export function PlatformConsolePage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/console/stats')
      .then((res: any) => setStats(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8">Loading platform console...</div>

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Platform Console" 
          description="Super-admin dashboard for Insure-IQ global platform." 
        />
        <div className="flex gap-4">
          <Button variant="secondary" onClick={() => navigate('/b2b/console/tenants')}>
            Tenant Directory
          </Button>
          <Button variant="primary" onClick={() => navigate('/b2b/console/tenants/new')}>
            Provision New Tenant
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            title="Active Tenants" 
            value={stats.active_tenants} 
            trend={12} 
            icon={<Building className="w-5 h-5 text-indigo-500" />}
          />
          <MetricCard 
            title="Total Platform Users" 
            value={stats.total_platform_users} 
            trend={5} 
            icon={<Users className="w-5 h-5 text-emerald-500" />}
          />
          <MetricCard 
            title="Platform Revenue" 
            value={`$${stats.platform_revenue.toLocaleString()}`} 
            trend={18} 
            icon={<DollarSign className="w-5 h-5 text-slate-500" />}
          />
        </div>
      )}

      <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-8 h-8 text-slate-400" />
            <h3 className="text-lg font-medium text-slate-900">System Health</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4">All core systems are operational. Average latency is 45ms.</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Database</span>
              <span className="text-emerald-600 font-medium">Healthy</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">API Gateway</span>
              <span className="text-emerald-600 font-medium">Healthy</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-slate-500">Auth Service</span>
              <span className="text-emerald-600 font-medium">Healthy</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-slate-900 mb-4">Recent Audit Logs</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between items-center bg-white p-3 rounded border shadow-sm">
              <span className="text-slate-700">Tenant 'Acme Corp' provisioned</span>
              <span className="text-slate-400 text-xs">2 hours ago</span>
            </li>
            <li className="flex justify-between items-center bg-white p-3 rounded border shadow-sm">
              <span className="text-slate-700">Global feature flag 'KYC_V2' enabled</span>
              <span className="text-slate-400 text-xs">5 hours ago</span>
            </li>
            <li className="flex justify-between items-center bg-white p-3 rounded border shadow-sm">
              <span className="text-slate-700">System maintenance completed</span>
              <span className="text-slate-400 text-xs">1 day ago</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
