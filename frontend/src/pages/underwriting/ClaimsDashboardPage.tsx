import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Inbox } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import { api } from '../../lib/api'

export function ClaimsDashboardPage() {
  const navigate = useNavigate()
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/claims/queue')
      .then((res: any) => setQueue(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8">Loading queue...</div>

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Claims Queue" 
        description="Pending claims requiring adjuster review." 
      />

      {queue.length === 0 ? (
        <EmptyState 
          icon={<Inbox className="h-8 w-8 text-slate-400" />}
          title="Queue is empty"
          description="All caught up! No pending claims to review."
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <DataTable
            data={queue}
            rowKey={(item: any) => item.id}
            columns={[
              { key: 'claim_number', title: 'Claim ID', render: (item: any) => <span className="font-mono text-xs">{item.claim_number}</span> },
              { key: 'incident_date', title: 'Incident Date', render: (item: any) => new Date(item.incident_date).toLocaleDateString() },
              { key: 'status', title: 'Status', render: (item: any) => <Badge variant={item.status === 'under_review' ? 'warning' : 'default'}>{item.status}</Badge> },
              { key: 'actions', title: '', render: (item: any) => (
                <div className="text-right">
                  <Button variant="secondary" onClick={() => navigate(`/b2b/claims/${item.id}`)}>Review</Button>
                </div>
              )}
            ]}
          />
        </div>
      )}
    </div>
  )
}
