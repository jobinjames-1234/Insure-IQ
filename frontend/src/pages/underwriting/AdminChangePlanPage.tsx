import { useState, useEffect } from 'react'
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { api } from '../../lib/api'

export function AdminChangePlanPage() {
  const navigate = useNavigate()
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    api.get('/admin/billing')
      .then((res: any) => setCurrentPlan(res.data.plan))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSelectPlan = async (planName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setUpdating(planName)
    try {
      await api.post('/admin/billing/plan', { plan: planName })
      navigate('/b2b/admin/billing')
    } catch (error) {
      console.error("Failed to update plan", error)
      setUpdating(null)
    }
  }

  const handleDoubleClick = (planId: string) => {
    navigate(`/b2b/admin/billing/plans/${planId}`)
  }

  const getPlanClasses = (planName: string) => {
    const baseClasses = "bg-surface rounded-xl p-6 flex flex-col relative transition-shadow cursor-pointer select-none"
    if (currentPlan === planName) {
      return `${baseClasses} border-2 border-primary shadow-md hover:shadow-lg`
    }
    return `${baseClasses} border border-outline-variant shadow-xs hover:shadow-md`
  }

  if (loading) {
    return <div className="p-8 text-text-secondary animate-pulse text-[14px]">Loading plans...</div>
  }

  return (
    <div className="flex-1 overflow-y-auto w-full bg-surface">
      <div className="max-w-max-width mx-auto p-4 md:p-gutter pb-24">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/b2b/admin/billing')}
            className="p-2 -ml-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-h1 text-h1 text-on-surface">Change Subscription Plan</h1>
            <p className="font-body text-body text-text-secondary mt-1">
              Select the plan that best fits your agency's needs. Double-click a plan to view details.
            </p>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
          {/* Basic Plan */}
          <div 
            className={getPlanClasses('Basic')}
            onDoubleClick={() => handleDoubleClick('basic')}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-h3 text-h3 text-on-surface">Basic</h4>
              {currentPlan === 'Basic' && <span className="bg-surface-variant text-on-surface text-[10px] font-bold uppercase px-2 py-0.5 rounded">Current</span>}
            </div>
            <p className="text-h2 font-h2 font-mono-data text-on-surface mb-1">$499<span className="text-body font-body text-text-secondary">/mo</span></p>
            <p className="text-caption font-body text-text-secondary mb-6">For small agencies starting out.</p>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" /><span className="text-body font-body text-on-surface">Up to 1,000 Policies</span></li>
              <li className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" /><span className="text-body font-body text-on-surface">Up to 500 Claims</span></li>
              <li className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" /><span className="text-body font-body text-on-surface">Standard Support</span></li>
            </ul>
            <Button 
              onClick={(e) => handleSelectPlan('Basic', e)} 
              variant="outline"
              className="w-full" 
              disabled={currentPlan === 'Basic' || updating !== null}
            >
              {updating === 'Basic' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : currentPlan === 'Basic' ? 'Current Plan' : 'Select Basic'}
            </Button>
          </div>
          
          {/* Professional Plan */}
          <div 
            className={getPlanClasses('Professional')}
            onDoubleClick={() => handleDoubleClick('professional')}
          >
            {currentPlan !== 'Professional' && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">Recommended</div>}
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-h3 text-h3 text-on-surface">Professional</h4>
              {currentPlan === 'Professional' && <span className="bg-surface-variant text-on-surface text-[10px] font-bold uppercase px-2 py-0.5 rounded">Current</span>}
            </div>
            <p className="text-h2 font-h2 font-mono-data text-on-surface mb-1">$1,299<span className="text-body font-body text-text-secondary">/mo</span></p>
            <p className="text-caption font-body text-text-secondary mb-6">For growing teams and moderate volume.</p>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" /><span className="text-body font-body text-on-surface">Up to 5,000 Policies</span></li>
              <li className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" /><span className="text-body font-body text-on-surface">Up to 2,500 Claims</span></li>
              <li className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" /><span className="text-body font-body text-on-surface">Priority Support</span></li>
            </ul>
            <Button 
              onClick={(e) => handleSelectPlan('Professional', e)} 
              className="w-full" 
              disabled={currentPlan === 'Professional' || updating !== null}
              variant={currentPlan === 'Professional' ? 'outline' : undefined}
            >
              {updating === 'Professional' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : currentPlan === 'Professional' ? 'Current Plan' : 'Select Professional'}
            </Button>
          </div>
          
          {/* Enterprise Plan */}
          <div 
            className={getPlanClasses('Enterprise AI')}
            onDoubleClick={() => handleDoubleClick('enterprise-ai')}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-h3 text-h3 text-on-surface">Enterprise AI</h4>
              {currentPlan === 'Enterprise AI' && <span className="bg-surface-variant text-on-surface text-[10px] font-bold uppercase px-2 py-0.5 rounded">Current</span>}
            </div>
            <p className="text-h2 font-h2 font-mono-data text-on-surface mb-1">$4,250<span className="text-body font-body text-text-secondary">/mo</span></p>
            <p className="text-caption font-body text-text-secondary mb-6">Unlimited scale with AI features.</p>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" /><span className="text-body font-body text-on-surface">Up to 10,000 Policies</span></li>
              <li className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" /><span className="text-body font-body text-on-surface">Up to 5,000 Claims</span></li>
              <li className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" /><span className="text-body font-body text-on-surface">24/7 Dedicated Support</span></li>
              <li className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" /><span className="text-body font-body text-on-surface">AI Risk Analysis</span></li>
            </ul>
            <Button 
              onClick={(e) => handleSelectPlan('Enterprise AI', e)} 
              variant="outline"
              className="w-full" 
              disabled={currentPlan === 'Enterprise AI' || updating !== null}
            >
              {updating === 'Enterprise AI' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : currentPlan === 'Enterprise AI' ? 'Current Plan' : 'Select Enterprise AI'}
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
