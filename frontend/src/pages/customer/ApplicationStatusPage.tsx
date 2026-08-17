import { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { api } from '../../lib/api'

export function ApplicationStatusPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/applications/my')
      .then((res: any) => setApplications(res.data))
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

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="My Applications" 
        description="Track the status of your policy applications." 
      />

      {applications.length === 0 ? (
        <EmptyState 
          icon={<FileText className="h-8 w-8 text-slate-400" />}
          title="No applications found"
          description="You haven't submitted any applications yet."
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <DataTable
            data={applications}
            rowKey={(item: any) => item.id}
            columns={[
              { key: 'id', title: 'Application ID', render: (item: any) => <span className="font-mono text-xs">{item.id.split('-')[0]}</span> },
              { key: 'created_at', title: 'Date Submitted', render: (item: any) => new Date(item.created_at).toLocaleDateString() },
              { key: 'status', title: 'Status', render: (item: any) => getStatusBadge(item.status) }
            ]}
          />
        </div>
      )}
    </div>
  )
}
