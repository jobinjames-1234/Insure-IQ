import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'

export function SLATrackerPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <PageHeader title="SLA Tracker" description="Monitor time-to-resolution for active claims." />
      <Card>
        <CardContent className="p-8 text-center text-slate-500">
          No claims are currently breaching SLA.
        </CardContent>
      </Card>
    </div>
  )
}
