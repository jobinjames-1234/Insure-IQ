import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { api } from '../../lib/api'
import { Activity } from 'lucide-react'

export function ApplicationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [riskScore, setRiskScore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generatingRisk, setGeneratingRisk] = useState(false)
  const [comments, setComments] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get(`/applications/${id}`)
      .then((res: any) => setData(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  const generateRiskScore = async () => {
    setGeneratingRisk(true)
    try {
      const res = await api.post(`/ml/risk-score?application_id=${id}`)
      setRiskScore(res.data.data.risk_score)
    } catch (err) {
      console.error(err)
      alert("Failed to generate risk score.")
    } finally {
      setGeneratingRisk(false)
    }
  }

  const handleDecision = async (status: string) => {
    setSubmitting(true)
    try {
      await api.put(`/underwriting/applications/${id}/decide`, {
        status,
        comments
      })
      navigate('/b2b/underwriting')
    } catch (err) {
      console.error(err)
      alert("Failed to submit decision")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8">Loading application...</div>
  if (!data) return <div className="p-8">Application not found.</div>

  const app = data.application
  const isClosed = app.status === 'approved' || app.status === 'rejected'

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader 
          title={`Application ${app.id.split('-')[0]}`} 
          description="Review applicant details and make an underwriting decision." 
        />
        <Badge variant={app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'danger' : 'warning'}>
          {app.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Form Data</CardTitle></CardHeader>
            <CardContent>
              <pre className="bg-slate-50 p-4 rounded-md text-sm text-slate-700 font-mono">
                {JSON.stringify(app.application_data, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Attached Documents</CardTitle></CardHeader>
            <CardContent>
              {data.documents.length === 0 ? (
                <p className="text-sm text-slate-500">No documents attached.</p>
              ) : (
                <ul className="space-y-2">
                  {data.documents.map((doc: any) => (
                    <li key={doc.id} className="text-sm">
                      <a href={doc.file_url} className="text-indigo-600 hover:underline">{doc.document_type}</a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-500" /> AI Risk Analysis</CardTitle></CardHeader>
            <CardContent>
              {riskScore ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-slate-800">{riskScore.score_value.toFixed(0)}</div>
                    <Badge variant={riskScore.risk_band === 'Low' ? 'success' : riskScore.risk_band === 'High' ? 'danger' : 'warning'}>
                      {riskScore.risk_band} Risk
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">SHAP Feature Importance</h4>
                    <div className="space-y-2">
                      {riskScore.factors.map((factor: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">{factor.feature} ({factor.value})</span>
                          <span className={`font-medium ${factor.contribution > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {factor.contribution > 0 ? '+' : ''}{factor.contribution}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 space-y-4">
                  <p className="text-sm text-slate-500">No risk analysis has been generated for this application yet.</p>
                  <Button variant="secondary" onClick={generateRiskScore} isLoading={generatingRisk}>
                    Run XGBoost Risk Model
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader><CardTitle>Decision Panel</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isClosed ? (
                <div className="p-4 bg-slate-50 rounded-md text-sm text-slate-600 text-center">
                  This application is closed.
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rationale / Comments</label>
                    <textarea 
                      className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      rows={4}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Required for referral/rejection"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      onClick={() => handleDecision('approved')}
                      isLoading={submitting}
                    >
                      Approve & Issue Policy
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-full" 
                      onClick={() => handleDecision('referred')}
                      isLoading={submitting}
                    >
                      Refer to Senior
                    </Button>
                    <Button 
                      variant="danger" 
                      className="w-full" 
                      onClick={() => handleDecision('rejected')}
                      isLoading={submitting}
                    >
                      Reject
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
