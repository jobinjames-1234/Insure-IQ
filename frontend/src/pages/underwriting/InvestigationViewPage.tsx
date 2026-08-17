import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'
import { useParams } from 'react-router-dom'

export function InvestigationViewPage() {
  const { id } = useParams()
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <PageHeader title="SIU Investigation View" description={`Deep dive investigation for claim #${id || 'Unknown'}`} />
      <Card>
        <CardContent className="p-8 text-center text-slate-500">
          Fraud scoring and investigation details will appear here.
        </CardContent>
      </Card>
    </div>
  )
}
