import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { api } from '../../lib/api'
import { ShieldAlert, FileText } from 'lucide-react'

export function ClaimsWorkspacePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [fraudScore, setFraudScore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generatingFraud, setGeneratingFraud] = useState(false)
  const [extractingDoc, setExtractingDoc] = useState<string | null>(null)
  const [comments, setComments] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchClaim()
  }, [id])

  const fetchClaim = () => {
    setLoading(true)
    api.get(`/claims/${id}`)
      .then((res: any) => setData(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }

  const generateFraudScore = async () => {
    setGeneratingFraud(true)
    try {
      const res = await api.post(`/ml/fraud-score?claim_id=${id}`)
      setFraudScore(res.data.data.fraud_flag)
    } catch (err) {
      console.error(err)
      alert("Failed to generate fraud score.")
    } finally {
      setGeneratingFraud(false)
    }
  }

  const extractDocument = async (docId: string) => {
    setExtractingDoc(docId)
    try {
      await api.post(`/ml/document-extract?document_id=${docId}`)
      // Refresh claim to get extracted data
      fetchClaim()
    } catch (err) {
      console.error(err)
      alert("Failed to extract document data.")
    } finally {
      setExtractingDoc(null)
    }
  }

  const handleDecision = async (status: string) => {
    setSubmitting(true)
    try {
      await api.put(`/claims/${id}/decide`, {
        status,
        comments
      })
      navigate('/b2b/claims')
    } catch (err) {
      console.error(err)
      alert("Failed to submit decision")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8">Loading claim...</div>
  if (!data) return <div className="p-8">Claim not found.</div>

  const claim = data.claim
  const isClosed = claim.status === 'approved' || claim.status === 'rejected'

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader 
          title={`Claim ${claim.claim_number}`} 
          description="Review incident details, evidence, and make an adjustment decision." 
        />
        <Badge variant={claim.status === 'approved' ? 'success' : claim.status === 'rejected' ? 'danger' : 'warning'}>
          {claim.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Incident Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-slate-500 font-medium">Date of Incident</dt>
                  <dd className="mt-1">{new Date(claim.incident_date).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">Estimated Amount</dt>
                  <dd className="mt-1">${claim.estimated_amount}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500 font-medium">Description</dt>
                  <dd className="mt-1 p-3 bg-slate-50 rounded-md border border-slate-100">{claim.description}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Attached Evidence</CardTitle></CardHeader>
            <CardContent>
              {data.documents.length === 0 ? (
                <p className="text-sm text-slate-500">No documents attached.</p>
              ) : (
                <ul className="space-y-4">
                  {data.documents.map((doc: any) => (
                    <li key={doc.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <a href={doc.file_url} className="text-indigo-600 hover:underline font-medium">{doc.document_type}</a>
                        {!doc.extracted_data && (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => extractDocument(doc.id)}
                            isLoading={extractingDoc === doc.id}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Run OCR Extract
                          </Button>
                        )}
                      </div>
                      
                      {doc.extracted_data && (
                        <div className="mt-4 bg-slate-50 p-3 rounded-md text-sm border border-slate-100">
                          <p className="font-medium text-slate-700 mb-2">AI Extraction Results:</p>
                          <p className="text-slate-600 mb-2">{doc.extracted_data.summary}</p>
                          <div className="grid grid-cols-2 gap-2">
                            {doc.extracted_data.entities.map((ent: any, i: number) => (
                              <div key={i} className="flex justify-between bg-white px-2 py-1 rounded border border-slate-100 shadow-sm">
                                <span className="text-xs text-slate-500">{ent.label}</span>
                                <span className="text-xs font-medium text-slate-800">{ent.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-indigo-500" /> AI Fraud Analysis</CardTitle></CardHeader>
            <CardContent>
              {fraudScore ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold text-slate-800">
                      {(fraudScore.confidence_score * 100).toFixed(0)}%
                    </div>
                    <Badge variant={fraudScore.flag_type === 'Normal' ? 'success' : fraudScore.flag_type === 'Anomaly' ? 'danger' : 'warning'}>
                      {fraudScore.flag_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{fraudScore.description}</p>
                </div>
              ) : (
                <div className="text-center p-4 space-y-4">
                  <p className="text-sm text-slate-500">No fraud analysis run yet.</p>
                  <Button variant="secondary" onClick={generateFraudScore} isLoading={generatingFraud}>
                    Run Isolation Forest
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Adjuster Action</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isClosed ? (
                <div className="p-4 bg-slate-50 rounded-md text-sm text-slate-600 text-center">
                  This claim is closed.
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Adjuster Notes / Rationale</label>
                    <textarea 
                      className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      rows={4}
                      value={comments}
                      onChange={(e: any) => setComments(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      onClick={() => handleDecision('approved')}
                      isLoading={submitting}
                    >
                      Approve Payout
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-full" 
                      onClick={() => handleDecision('investigation_needed')}
                      isLoading={submitting}
                    >
                      Needs Investigation
                    </Button>
                    <Button 
                      variant="danger" 
                      className="w-full" 
                      onClick={() => handleDecision('rejected')}
                      isLoading={submitting}
                    >
                      Deny Claim
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
