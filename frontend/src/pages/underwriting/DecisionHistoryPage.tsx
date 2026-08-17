import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'

export function DecisionHistoryPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <PageHeader title="Decision History" description="View past underwriting decisions and AI confidence scores." />
      <Card>
        <CardContent className="p-8 text-center text-slate-500">
          Decision history will appear here once applications are processed.
        </CardContent>
      </Card>
    </div>
  )
}
