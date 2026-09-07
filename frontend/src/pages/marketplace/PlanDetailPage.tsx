import { useLocation, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Shield, CheckCircle2, ChevronLeft, CreditCard } from 'lucide-react'

export function PlanDetailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const quote = location.state?.quote

  if (!quote) {
    return (
      <div className="p-8 text-center bg-background">
        <p className="font-body text-body text-on-surface">Plan not found. Please start a new quote.</p>
        <Button className="mt-4" onClick={() => navigate('/marketplace')}>Return to Marketplace</Button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 bg-background">
      <div>
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center font-caption text-caption font-medium text-on-surface-variant hover:text-primary mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Comparisons
        </button>
        
        <PageHeader 
          title={`${quote.provider} Plan`} 
          description="Review the full details of this coverage and proceed to purchase when ready."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Coverage Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div>
                  <dt className="font-caption text-caption text-text-secondary">Deductible</dt>
                  <dd className="mt-1 font-h3 text-h3 text-on-surface">${quote.deductible}</dd>
                </div>
                <div>
                  <dt className="font-caption text-caption text-text-secondary">Coverage Limit</dt>
                  <dd className="mt-1 font-h3 text-h3 text-on-surface">${quote.coverage_limit.toLocaleString()}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-caption text-caption text-text-secondary mb-2">Included Features</dt>
                  <dd className="mt-1 space-y-3">
                    {quote.features.map((feat: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 font-body text-body text-on-surface bg-surface-container-low p-3 rounded-lg border border-outline-variant">
                        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>Terms & Conditions</CardTitle></CardHeader>
            <CardContent>
              <div className="font-body text-body text-text-secondary space-y-4">
                <p>This is a simulated quote for demonstration purposes.</p>
                <p>By proceeding, you agree to the terms of service and acknowledge that actual underwriting may result in different final premiums based on verified history.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardContent className="p-6 pt-6">
              <div className="text-center border-b border-outline-variant pb-6 mb-6">
                <div className="mx-auto w-12 h-12 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-h3 text-h3 text-on-surface mb-2">Summary</h3>
                <div className="flex items-end justify-center gap-1">
                  <span className="font-caption text-caption text-text-muted font-medium">$</span>
                  <span className="font-display text-display text-on-surface">{quote.monthly_premium}</span>
                  <span className="font-caption text-caption text-text-muted font-medium">/mo</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <Button 
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    alert("In a real app, this would route to a Stripe Checkout session or a B2C application flow.")
                    navigate('/login')
                  }}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Purchase Plan
                </Button>
                <p className="font-caption text-caption text-center text-text-muted">Secure 256-bit encryption</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
