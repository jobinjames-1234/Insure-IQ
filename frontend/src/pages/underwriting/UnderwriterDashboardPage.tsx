import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Inbox } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import { api } from '../../lib/api'

export function UnderwriterDashboardPage() {
  const navigate = useNavigate()
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/underwriting/queue')
      .then((res: any) => setQueue(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8">Loading queue...</div>

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Underwriting Queue" 
        description="Applications awaiting review." 
      />

      {queue.length === 0 ? (
        <EmptyState 
          icon={<Inbox className="h-8 w-8 text-slate-400" />}
          title="Queue is empty"
          description="All caught up! No pending applications to review."
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <DataTable
            data={queue}
            rowKey={(item: any) => item.id}
            columns={[
              { key: 'id', title: 'App ID', render: (item: any) => <span className="font-mono text-xs">{item.id.split('-')[0]}</span> },
              { key: 'created_at', title: 'Submitted', render: (item: any) => new Date(item.created_at).toLocaleDateString() },
              { key: 'status', title: 'Status', render: (item: any) => <Badge variant={item.status === 'under_review' ? 'warning' : 'default'}>{item.status}</Badge> },
              { key: 'actions', title: '', render: (item: any) => (
                <div className="text-right">
                  <Button variant="secondary" onClick={() => navigate(`/b2b/underwriting/${item.id}`)}>Review</Button>
                </div>
              )}
            ]}
          />
        </div>
      )}
    </div>
  )
}
