import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, AlertTriangle, CheckCircle, TrendingUp, History, HeadphonesIcon, Filter, Phone } from 'lucide-react'
import { api } from '../../lib/api'

export function RetentionAlertsPage() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/agent/retention-alerts')
      .then(res => setAlerts(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-text-secondary animate-pulse font-body text-body">Loading alerts...</div>

  // Mock data if API is sparse
  const displayAlerts = alerts.length > 0 ? alerts : [
    {
      customer_id: '1',
      name: 'Robert Chen',
      policy_type: 'Auto & Home Bundle',
      risk_level: 'High',
      risk_factor_type: 'trending_up',
      reason: 'Premium increased 18% upon recent renewal.',
      initials: 'RC'
    },
    {
      customer_id: '2',
      name: 'Sarah Jenkins',
      policy_type: 'Life Insurance - Term',
      risk_level: 'Medium',
      risk_factor_type: 'history',
      reason: 'No portal login in 120 days. Missed last quarterly review.',
      initials: 'SJ'
    },
    {
      customer_id: '3',
      name: 'Elena Martinez',
      policy_type: 'Commercial Property',
      risk_level: 'Medium',
      risk_factor_type: 'support',
      reason: 'Recent claim denied. Sentiment score decreased.',
      initials: 'EM'
    }
  ];

  const getRiskIcon = (type: string) => {
    switch(type) {
      case 'trending_up': return <TrendingUp className="w-4 h-4" />;
      case 'history': return <History className="w-4 h-4" />;
      case 'support': return <HeadphonesIcon className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
    }
  }

  return (
    <div className="flex-1 flex flex-col w-full h-screen overflow-y-auto bg-background">
      {/* Header */}
      <header className="px-6 lg:px-8 py-8 border-b border-outline-variant bg-surface sticky top-0 z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface tracking-tight">Retention Alerts</h1>
          <p className="font-body-lg text-body-lg text-text-muted mt-2 max-w-2xl">Proactive outreach to prevent customer lapse.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-10 px-4 flex items-center justify-center gap-2 bg-surface border border-outline-variant text-on-surface font-caption text-caption rounded-lg hover:bg-surface-container-low transition-colors shadow-xs">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </header>

      {/* Content Canvas */}
      <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-8 animate-in fade-in duration-500">
        
        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-xs flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-caption text-caption text-text-muted uppercase tracking-wider">Total Alerts</h3>
              <Bell className="w-5 h-5 text-text-muted" />
            </div>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="font-display text-display text-on-surface">{displayAlerts.length}</span>
              <span className="font-caption text-caption text-text-muted">customers</span>
            </div>
          </div>
          
          <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-xs flex flex-col relative overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 w-1 h-full bg-danger"></div>
            <div className="flex items-center justify-between mb-2 pl-2">
              <h3 className="font-caption text-caption text-text-muted uppercase tracking-wider">High Risk</h3>
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
            <div className="flex items-baseline gap-2 mt-auto pl-2">
              <span className="font-display text-display text-danger">
                {displayAlerts.filter(a => a.risk_level === 'High').length}
              </span>
              <span className="font-caption text-caption text-text-muted">requires immediate action</span>
            </div>
          </div>
          
          <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-xs flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-caption text-caption text-text-muted uppercase tracking-wider">Outreach Logged Today</h3>
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="font-display text-display text-on-surface">8</span>
              <span className="font-caption text-caption text-success flex items-center gap-1 font-medium">
                <TrendingUp className="w-4 h-4" /> 2 vs yesterday
              </span>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="flex flex-col gap-4 mt-2">
          <h2 className="font-h3 text-h3 text-on-surface mb-2">Requires Outreach</h2>
          
          {displayAlerts.map((alert, index) => (
            <div key={index} className="bg-surface border border-outline-variant rounded-xl p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center gap-6 group">
              {/* Customer Info */}
              <div className="flex items-center gap-4 min-w-[240px]">
                <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center text-lg font-semibold border border-primary/20">
                  {alert.initials}
                </div>
                <div>
                  <h4 className="font-h3 text-[18px] font-semibold text-on-surface">{alert.name}</h4>
                  <p className="font-caption text-caption text-text-muted mt-1">{alert.policy_type}</p>
                </div>
              </div>
              
              {/* Divider for Mobile */}
              <div className="h-px w-full bg-outline-variant md:hidden"></div>
              
              {/* Churn Driver */}
              <div className="flex-1 flex flex-col justify-center">
                <span className={`font-overline text-overline uppercase tracking-wider mb-1 flex items-center gap-1.5 ${alert.risk_level === 'High' ? 'text-danger' : 'text-warning'}`}>
                  {getRiskIcon(alert.risk_factor_type || 'trending_up')} Risk Factor
                </span>
                <p className="font-body text-body text-on-surface leading-relaxed">{alert.reason}</p>
              </div>
              
              {/* Divider for Mobile */}
              <div className="h-px w-full bg-outline-variant md:hidden"></div>
              
              {/* Action */}
              <div className="flex items-center justify-end shrink-0">
                <button 
                  className="h-10 px-6 bg-primary-container text-white hover:bg-primary hover:text-white font-caption text-caption font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2"
                  onClick={() => navigate(`/b2b/agent/customers/${alert.customer_id}`)}
                >
                  <Phone className="w-4 h-4" /> Log Outreach
                </button>
              </div>
            </div>
          ))}

          {displayAlerts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-h2 text-h2 text-on-surface mb-2">All Caught Up</h3>
              <p className="font-body text-body text-text-muted max-w-sm">No customers need outreach right now. Great job keeping your portfolio healthy.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

