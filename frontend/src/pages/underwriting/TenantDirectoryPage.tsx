import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { api } from '../../lib/api'

export function TenantDirectoryPage() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/console/tenants')
      .then((res: any) => setTenants(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8">Loading tenants...</div>

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <PageHeader 
          title="Tenant Directory" 
          description="View all organizations using the platform." 
        />
        <Button onClick={() => navigate('/b2b/console/tenants/new')}>
          Provision New Tenant
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <DataTable
          data={tenants}
          rowKey={(item: any) => item.id}
          columns={[
            { key: 'name', title: 'Tenant Name', render: (item: any) => <span className="font-medium text-slate-900">{item.name}</span> },
            { key: 'slug', title: 'Slug', render: (item: any) => <span className="font-mono text-sm">{item.slug}</span> },
            { key: 'status', title: 'Status', render: (item: any) => <Badge variant={item.is_active ? 'success' : 'default'}>{item.is_active ? 'Active' : 'Inactive'}</Badge> },
            { key: 'actions', title: '', render: () => (
              <div className="text-right">
                <Button variant="ghost" size="sm">Manage</Button>
              </div>
            )}
          ]}
        />
      </div>
    </div>
  )
}
