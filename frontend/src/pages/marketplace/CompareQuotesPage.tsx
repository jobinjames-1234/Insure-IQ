import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { api } from '../../lib/api'
import { CheckCircle2 } from 'lucide-react'

export function CompareQuotesPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [comparison, setComparison] = useState<any[]>([])
  
  const quotes = location.state?.quotes
  
  useEffect(() => {
    if (!quotes) {
      navigate('/marketplace')
      return
    }
    
    // Fetch comparison matrix for these quotes
    const ids = quotes.map((q: any) => q.id).join(',')
    api.get(`/marketplace/compare?quote_ids=${ids}`)
      .then((res: any) => setComparison(res.data.comparison))
      .catch((err: any) => console.error(err))
      
  }, [quotes, navigate])

  if (!quotes) return null

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <PageHeader 
          title="Your Matches" 
          description="We've found the best rates across our network. Compare them below and choose the one that fits your needs."
        />
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max">
          {quotes.map((quote: any) => (
            <Card key={quote.id} className={`w-[350px] flex-shrink-0 relative ${quote.best_value ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500' : ''}`}>
              {quote.best_value && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">
                  Best Value
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="text-center border-b border-slate-100 pb-6 mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{quote.provider}</h3>
                  <div className="flex items-end justify-center gap-1 mb-1">
                    <span className="text-sm text-slate-500 font-medium">$</span>
                    <span className="text-4xl font-black text-slate-900">{quote.monthly_premium}</span>
                    <span className="text-sm text-slate-500 font-medium">/mo</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Deductible</span>
                    <span className="font-semibold text-slate-900">${quote.deductible}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Coverage</span>
                    <span className="font-semibold text-slate-900">${(quote.coverage_limit/1000).toFixed(0)}k</span>
                  </div>
                  
                  <div className="pt-4 space-y-3">
                    {quote.features.map((feat: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  variant={quote.best_value ? 'primary' : 'secondary'}
                  onClick={() => navigate(`/marketplace/plan/${quote.id}`, { state: { quote } })}
                >
                  Select Plan
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {comparison.length > 0 && (
        <Card className="mt-12 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Detailed Comparison</h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-white border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-900">Feature</th>
                {quotes.map((q: any) => (
                  <th key={q.id} className="px-6 py-3 font-semibold text-slate-900">{q.provider}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparison.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-700">{row.feature}</td>
                  {quotes.map((q: any) => (
                    <td key={q.id} className="px-6 py-4 text-slate-600">
                      {row[q.id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
