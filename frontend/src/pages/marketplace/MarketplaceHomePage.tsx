import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Shield, ArrowRight, Home, Car, Heart, Building, Search } from 'lucide-react'

// Map icon strings from API to Lucide components
const iconMap: Record<string, any> = {
  'directions_car': Car,
  'home': Home,
  'favorite': Heart,
  'apartment': Building
}

export function MarketplaceHomePage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    api.get('/marketplace/products')
      .then(res => setCategories(res.data.categories))
      .catch(err => console.error(err))
  }, [])

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-surface-container-low min-h-[600px] flex items-center pt-8 pb-16">
        <div className="absolute inset-0 z-0">
          <div className="bg-cover bg-center w-full h-full" style={{ backgroundImage: "url('/images/insurance-collage.png')" }}></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-surface via-surface/80 to-surface/10 backdrop-blur-[2px]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Text */}
            <div className="flex flex-col gap-6 max-w-xl">
              <span className="inline-flex items-center gap-2 text-primary font-overline text-overline uppercase tracking-wider bg-primary-fixed px-3 py-1 rounded-full w-fit">
                <Shield className="w-4 h-4" />
                Marketplace Leader
              </span>
              
              <h1 className="font-display text-display text-on-surface leading-tight">
                Compare insurance with <span className="text-primary relative inline-block">confidence</span>
              </h1>
              
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Find the perfect coverage for your life, home, and family. We compare over 30 top-rated insurers in seconds so you can make the right choice.
              </p>
              
              <div className="flex flex-wrap gap-4 mt-2">
                <Button size="lg" className="shadow-lg hover:shadow-xl" onClick={() => navigate('/marketplace/quote')}>
                  Start Your Quote
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="ZIP Code..." 
                    className="h-12 pl-12 pr-4 rounded bg-surface-container border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none w-48 text-on-surface shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-h2 text-h2 text-on-surface mb-4">What do you need to protect?</h2>
            <p className="font-body text-body text-on-surface-variant max-w-2xl mx-auto">Select a category below to see plans from top providers instantly.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map(cat => {
              const Icon = iconMap[cat.icon] || Shield
              return (
                <div 
                  key={cat.id} 
                  className="group bg-surface rounded-xl border border-outline-variant p-6 shadow-sm hover:shadow-md hover:border-primary transition-all cursor-pointer flex flex-col items-center text-center gap-4"
                  onClick={() => navigate(`/marketplace/quote?type=${cat.id}`)}
                >
                  <div className="w-16 h-16 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-h3 text-h3 text-on-surface mb-1">{cat.name}</h3>
                    <p className="font-body text-body text-text-muted">{cat.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
