import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, FileText, Settings } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { MetricCard } from '../../components/ui/MetricCard'
import { Button } from '../../components/ui/Button'
import { api } from '../../lib/api'

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats')
      .then((res: any) => setStats(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8">Loading admin dashboard...</div>

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Tenant Administration" 
          description="Manage your team, settings, and view high-level metrics." 
        />
        <Button variant="secondary" onClick={() => navigate('/b2b/admin/team')}>
          Manage Team
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            title="Total Users" 
            value={stats.total_users} 
            trend={12} 
            icon={<Users className="w-5 h-5 text-indigo-500" />}
          />
          <MetricCard 
            title="Active Policies" 
            value={stats.active_policies} 
            trend={4} 
            icon={<FileText className="w-5 h-5 text-emerald-500" />}
          />
          <MetricCard 
            title="Monthly Premium" 
            value={`$${stats.monthly_premium.toLocaleString()}`} 
            trend={8} 
            icon={<Settings className="w-5 h-5 text-slate-500" />}
          />
        </div>
      )}
      
      <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-200 mt-8">
        <Settings className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900">Global Settings</h3>
        <p className="text-slate-500 max-w-md mx-auto mt-2">Configure tenant-level defaults, branding, and integration webhooks.</p>
        <Button variant="secondary" className="mt-6">Open Settings</Button>
      </div>
    </div>
  )
}
