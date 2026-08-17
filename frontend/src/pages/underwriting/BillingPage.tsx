import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { api } from '../../lib/api'
import { useState, useEffect } from 'react'

export function BillingPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    api.get('/admin/billing')
      .then(res => setData(res.data))
      .catch(console.error)
  }, [])

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <PageHeader title="Billing & Invoices" description="Manage your tenant subscription and view past invoices." />
      <Card>
        <CardHeader><CardTitle>Current Subscription</CardTitle></CardHeader>
        <CardContent>
          {data ? (
            <div className="space-y-4">
              <p>Plan: <span className="font-bold">{data.plan}</span></p>
              <p>Next Billing Date: {data.next_billing_date}</p>
            </div>
          ) : <p>Loading...</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Past Invoices</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data?.invoices.map((inv: any) => (
              <li key={inv.id} className="flex justify-between border-b pb-2">
                <span>{inv.date}</span>
                <span>${inv.amount.toFixed(2)} - {inv.status}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
