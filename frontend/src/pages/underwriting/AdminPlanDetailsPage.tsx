import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'

const PLAN_DETAILS: Record<string, any> = {
  'basic': {
    name: 'Basic',
    price: '$499/mo',
    description: 'For small agencies starting out.',
    features: [
      'Up to 1,000 Policies',
      'Up to 500 Claims',
      'Standard Support',
      'Basic Reporting',
      'Email Integration'
    ],
    detailedDescription: 'The Basic plan is designed for independent agents or small agencies just getting started with modern insurance management. It provides all the essential tools you need to manage your book of business without the overhead of enterprise features. You get full access to our core policy management and claims processing engines, with limits designed for lower volume operations.'
  },
  'professional': {
    name: 'Professional',
    price: '$1,299/mo',
    description: 'For growing teams and moderate volume.',
    features: [
      'Up to 5,000 Policies',
      'Up to 2,500 Claims',
      'Priority Support',
      'Advanced Analytics',
      'Custom Workflows',
      'API Access'
    ],
    detailedDescription: 'Our Professional plan scales with your growing agency. It increases your volume limits significantly and introduces advanced features like custom workflows, allowing you to tailor the platform to your specific business processes. Priority support ensures your team gets help quickly when needed, and API access allows you to integrate Insure-IQ with your other business tools.'
  },
  'enterprise-ai': {
    name: 'Enterprise AI',
    price: '$4,250/mo',
    description: 'Unlimited scale with AI features.',
    features: [
      'Up to 10,000 Policies',
      'Up to 5,000 Claims',
      '24/7 Dedicated Support',
      'AI Risk Analysis',
      'Automated Underwriting',
      'Custom Integrations',
      'Dedicated Account Manager'
    ],
    detailedDescription: 'The Enterprise AI plan is our flagship offering, built for high-volume agencies and carriers who want to leverage the power of artificial intelligence. It includes our proprietary AI Risk Analysis engine to help you identify profitable policies, and automated underwriting rules to speed up processing. With 24/7 dedicated support and a personal account manager, you have a partner in scaling your business.'
  }
}

export function AdminPlanDetailsPage() {
  const { planId } = useParams()
  const navigate = useNavigate()
  
  const plan = planId ? PLAN_DETAILS[planId.toLowerCase()] : null

  if (!plan) {
    return (
      <div className="flex-1 overflow-y-auto w-full bg-surface p-8">
        <h2 className="text-h2 text-on-surface">Plan not found</h2>
        <Button onClick={() => navigate('/b2b/admin/billing/plan')} className="mt-4">Back to Plans</Button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto w-full bg-surface">
      <div className="max-w-max-width mx-auto p-4 md:p-gutter pb-24">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 border-b border-outline-variant pb-6">
          <button 
            onClick={() => navigate('/b2b/admin/billing/plan')}
            className="p-2 -ml-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-h1 text-h1 text-on-surface">{plan.name} Plan Details</h1>
            <p className="font-body text-body text-text-secondary mt-1">
              {plan.description}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-xs">
              <h2 className="font-h2 text-h2 text-on-surface mb-4">Overview</h2>
              <p className="font-body text-body text-on-surface leading-relaxed">
                {plan.detailedDescription}
              </p>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-surface-container rounded-xl p-6 border border-outline-variant">
              <h3 className="font-h3 text-h3 text-on-surface mb-2">Pricing</h3>
              <p className="text-h1 font-h1 font-mono-data text-on-surface mb-6">{plan.price}</p>
              
              <h4 className="font-h4 text-h4 text-on-surface mb-4">What's included:</h4>
              <ul className="space-y-3">
                {plan.features.map((feature: string, idx: number) => (
                  <li key={idx} className="flex gap-2 items-start">
                    <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <span className="text-body font-body text-on-surface">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
