import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'
import { api } from '../../lib/api'
import { useState, useEffect } from 'react'

export function CommissionTrackerPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    api.get('/agent/commission').then(res => setData(res.data)).catch(console.error)
  }, [])

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <PageHeader title="Commission Tracker" description="Track your earnings and pending payouts." />
      <Card>
        <CardContent className="p-8">
          {data ? (
            <div className="space-y-4">
              <div className="text-3xl font-bold text-emerald-600">${data.total_earned.toLocaleString()}</div>
              <p className="text-slate-500">Total Earned (YTD)</p>
            </div>
          ) : <p>Loading...</p>}
        </CardContent>
      </Card>
    </div>
  )
}
