import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Mail, Phone, MapPin, Car, Home, CheckCircle, Eye, FileText, Sparkles, ArrowRight } from 'lucide-react'
import { api } from '../../lib/api'

export function CustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('policies')

  useEffect(() => {
    api.get(`/agent/customers/${id}`)
      .then((res: any) => setData(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-8 text-center text-text-secondary animate-pulse font-body text-body">Loading customer profile...</div>
  if (!data && !loading) return <div className="p-8 text-center text-text-secondary font-body text-body">Customer not found.</div>

  // Mock data for UI alignment if api data is sparse
  const cust = data?.customer || {
    first_name: 'Eleanor',
    last_name: 'Vance',
    phone_number: '(555) 123-4567',
    email: 'eleanor.vance@example.com',
    address_line1: '142 Birchwood Ln',
    city: 'Seattle',
    state: 'WA',
  };
  
  const policies = data?.policies && data.policies.length > 0 ? data.policies : [
    { id: '1', type: 'auto', name: 'Auto Insurance - Comprehensive', number: 'POL-982-3341', premium: '$1,240.00', renewal: 'Oct 12, 2024', deductible: '$500.00' },
    { id: '2', type: 'home', name: 'Homeowners - HO3', number: 'POL-445-9902', premium: '$2,150.00', renewal: 'Mar 05, 2025', coverage: '$650,000' }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 lg:p-8 min-h-screen animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-primary-container border border-outline-variant shadow-xs flex items-center justify-center text-white font-h1 text-h1 font-bold">
              {cust.first_name[0]}{cust.last_name[0]}
            </div>
            <div>
              <h2 className="font-h1 text-h1 text-on-surface mb-1">{cust.first_name} {cust.last_name}</h2>
              <div className="flex flex-wrap items-center gap-4 text-text-secondary font-body text-body">
                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {cust.phone_number || 'N/A'}</span>
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {cust.email || 'N/A'}</span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> 
                  {cust.address_line1 ? `${cust.address_line1}, ${cust.city}, ${cust.state}` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none h-10 px-4 rounded border border-outline-variant bg-surface text-on-surface font-body text-body flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors shadow-xs">
              <Mail className="w-4 h-4" /> Email
            </button>
            <button className="flex-1 md:flex-none h-10 px-6 rounded bg-primary-container text-white font-body text-body flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-xs">
              <Phone className="w-4 h-4" /> Call
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="border-b border-outline-variant mb-8">
          <nav className="flex gap-8">
            <button 
              role="tab"
              className={`font-h3 text-h3 pb-3 px-1 border-b-2 transition-colors ${activeTab === 'policies' ? 'text-primary border-primary' : 'text-text-secondary border-transparent hover:text-on-surface'}`}
              onClick={() => setActiveTab('policies')}
            >
              Policies
            </button>
            <button 
              role="tab"
              className={`font-h3 text-h3 pb-3 px-1 border-b-2 transition-colors ${activeTab === 'claims' ? 'text-primary border-primary' : 'text-text-secondary border-transparent hover:text-on-surface'}`}
              onClick={() => setActiveTab('claims')}
            >
              Claims
            </button>
            <button 
              role="tab"
              className={`font-h3 text-h3 pb-3 px-1 border-b-2 transition-colors ${activeTab === 'notes' ? 'text-primary border-primary' : 'text-text-secondary border-transparent hover:text-on-surface'}`}
              onClick={() => setActiveTab('notes')}
            >
              Notes & Timeline
            </button>
          </nav>
        </div>

        {/* Bento Grid Layout for Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Policies (Cards) */}
          <div className="lg:col-span-8 space-y-6">
            {activeTab === 'policies' && policies.length > 0 ? (
              policies.map((p: any) => (
                <div key={p.id} className="bg-surface rounded-xl border border-outline-variant shadow-xs p-6 relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                        {p.type === 'home' ? <Home className="w-[18px] h-[18px]" /> : <Car className="w-[18px] h-[18px]" />}
                      </div>
                      <div>
                        <h3 className="font-h3 text-h3 text-on-surface">{p.name || p.policy_number}</h3>
                        <p className="font-mono-data text-mono-data text-text-muted mt-1">{p.number || p.policy_number}</p>
                      </div>
                    </div>
                    <span className="bg-success-bg text-success px-3 py-1 rounded-full font-caption text-caption flex items-center gap-1.5 border border-success/20">
                      <CheckCircle className="w-[14px] h-[14px]" /> Active
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6 relative z-10 border-t border-outline-variant pt-4 mt-4">
                    <div>
                      <p className="font-overline text-overline text-text-muted uppercase tracking-wider mb-1">Premium (Annual)</p>
                      <p className="font-mono-data text-mono-data text-on-surface font-semibold">{p.premium || `$${p.total_premium}`}</p>
                    </div>
                    <div>
                      <p className="font-overline text-overline text-text-muted uppercase tracking-wider mb-1">Renewal Date</p>
                      <p className="font-body text-body text-on-surface">{p.renewal || new Date(p.end_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="font-overline text-overline text-text-muted uppercase tracking-wider mb-1">{p.coverage ? 'Coverage' : 'Deductible'}</p>
                      <p className="font-mono-data text-mono-data text-on-surface font-semibold">{p.coverage || p.deductible || '$500'}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 relative z-10">
                    <button 
                      className="text-primary font-body text-body hover:underline flex items-center gap-1.5"
                      onClick={() => navigate(`/b2b/agent/policies/${p.id}`)}
                    >
                      <Eye className="w-4 h-4" /> View Details
                    </button>
                    <button className="text-text-secondary font-body text-body hover:text-on-surface transition-colors flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> {p.type === 'home' ? 'View Dec Page' : 'Edit Policy'}
                    </button>
                  </div>
                  
                  {/* Subtle background gradient decoration */}
                  <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
              ))
            ) : activeTab === 'policies' ? (
              <div className="bg-surface rounded-xl border border-outline-variant p-8 text-center text-text-secondary font-body text-body">
                No active policies found for this customer.
              </div>
            ) : (
              <div className="bg-surface rounded-xl border border-outline-variant p-8 text-center text-text-secondary font-body text-body">
                Content for {activeTab} goes here.
              </div>
            )}
          </div>

          {/* Right Column: AI Recommendations */}
          <div className="lg:col-span-4">
            <div className="bg-surface-container rounded-xl border border-outline-variant shadow-xs p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6 border-b border-outline-variant pb-4">
                <Sparkles className="w-5 h-5 text-secondary" />
                <h3 className="font-h3 text-h3 text-on-surface">AI Recommendations</h3>
              </div>
              
              <div className="space-y-6">
                {/* Rec 1 */}
                <div className="group cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-body text-body text-on-surface font-semibold group-hover:text-primary transition-colors">Umbrella Policy</h4>
                    <span className="bg-warning-bg text-warning px-2 py-0.5 rounded font-caption text-caption uppercase tracking-wider border border-warning/20">High Match</span>
                  </div>
                  <p className="font-body text-body text-text-secondary mb-3 leading-relaxed">
                    Customer has high net worth indicated by dwelling coverage and dual policies. Recommend $1M umbrella to cover liability gaps.
                  </p>
                  <button className="text-primary font-body text-body hover:underline flex items-center gap-1.5">
                    Generate Proposal <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                
                <hr className="border-outline-variant" />
                
                {/* Rec 2 */}
                <div className="group cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-body text-body text-on-surface font-semibold group-hover:text-primary transition-colors">Scheduled Personal Property</h4>
                  </div>
                  <p className="font-body text-body text-text-secondary mb-3 leading-relaxed">
                    Recent notes indicate purchase of fine art. Current homeowners policy has sub-limits. Suggest scheduling items.
                  </p>
                  <button className="text-primary font-body text-body hover:underline flex items-center gap-1.5">
                    Review Coverage Options <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}

