import { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { api } from '../../lib/api'

export function ClaimTrackerPage() {
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/claims/my')
      .then((res: any) => setClaims(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="success">Approved</Badge>
      case 'rejected': return <Badge variant="danger">Rejected</Badge>
      case 'under_review': return <Badge variant="warning">Under Review</Badge>
      case 'submitted': return <Badge variant="default">Submitted</Badge>
      default: return <Badge variant="default">{status}</Badge>
    }
  }

  if (loading) return <div className="p-8">Loading claims...</div>

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="My Claims" 
        description="Track the status of your reported incidents." 
      />

      {claims.length === 0 ? (
        <EmptyState 
          icon={<FileText className="h-8 w-8 text-slate-400" />}
          title="No claims filed"
          description="You haven't filed any claims yet."
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <DataTable
            data={claims}
            rowKey={(item: any) => item.id}
            columns={[
              { key: 'claim_number', title: 'Claim Number', render: (item: any) => <span className="font-mono text-xs font-semibold">{item.claim_number}</span> },
              { key: 'incident_date', title: 'Incident Date', render: (item: any) => new Date(item.incident_date).toLocaleDateString() },
              { key: 'estimated_amount', title: 'Claim Amount', render: (item: any) => `$${item.estimated_amount}` },
              { key: 'status', title: 'Status', render: (item: any) => getStatusBadge(item.status) }
            ]}
          />
        </div>
      )}
    </div>
  )
}
