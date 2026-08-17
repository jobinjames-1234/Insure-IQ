import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { api } from '../../lib/api'
import { useState, useEffect } from 'react'

export function PolicyConfigPage() {
  const [config, setConfig] = useState<any>(null)

  useEffect(() => {
    api.get('/admin/policy-config').then(res => setConfig(res.data)).catch(console.error)
  }, [])

  if (!config) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <PageHeader title="Policy Configuration" description="Set up auto-approval limits and rules for your tenant." />
      <Card>
        <CardHeader><CardTitle>Underwriting Rules</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input 
            label="Auto Approval Limit ($)" 
            type="number" 
            value={config.auto_approval_limit} 
            onChange={(e: any) => setConfig({...config, auto_approval_limit: e.target.value})}
          />
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={config.require_two_adjusters} 
              onChange={(e: any) => setConfig({...config, require_two_adjusters: e.target.checked})}
            />
            <label>Require two adjusters for major claims</label>
          </div>
          <Button onClick={() => alert('Saved')}>Save Configuration</Button>
        </CardContent>
      </Card>
    </div>
  )
}
