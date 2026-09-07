import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Terminal, Users, AlertTriangle, Cloud, BarChart2 } from 'lucide-react'
import { api } from '../../lib/api'

export function PlatformConsolePage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [leadPeriod, setLeadPeriod] = useState('24h')

  const fetchStats = () => {
    setLoading(true)
    api.get(`/console/stats?period=${leadPeriod}`)
      .then((res: any) => setStats(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchStats()
  }, [leadPeriod])

  if (loading && !stats) return <div className="p-8 text-text-secondary animate-pulse text-[14px]">Loading platform console...</div>

  return (
    <div className="flex-1 overflow-y-auto relative bg-surface-container-lowest bg-background w-full">
      
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md px-gutter py-6 flex justify-between items-center border-b border-outline-variant bg-surface">
        <div>
          <h2 className="font-h2 text-h2 text-on-background">Platform Overview</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-block w-2 h-2 bg-success rounded-full animate-pulse"></span>
            <span className="font-caption text-caption text-success font-medium">Global Systems Nominal</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={fetchStats} className="bg-surface-container-highest text-on-surface-variant font-body text-body font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-surface-dim transition-colors">
            <RefreshCw className="w-5 h-5" />
            Refresh Data
          </button>
          <button onClick={() => navigate('/admin/tenants')} className="bg-primary text-white font-body text-body font-medium px-4 py-2 rounded-lg shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            SysConsole
          </button>
        </div>
      </header>

      <div className="max-w-max-width mx-auto p-gutter space-y-8 pb-24">
        
        {/* High Level Metrics (Bento Style) */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Tenant Count */}
          <div className="bg-surface border border-outline-variant hover:border-primary hover:shadow-[0_4px_12px_rgba(0,63,209,0.05)] transition-all duration-200 p-6 rounded-xl col-span-1 md:col-span-2">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="font-overline text-overline text-text-secondary uppercase">Active Tenants</p>
                <h3 className="font-h1 text-h1 mt-1 text-on-surface">{stats?.active_tenants || '1,482'}</h3>
              </div>
              <div className="bg-primary-fixed p-3 rounded-lg text-primary flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-caption font-caption">
                <span className="text-text-secondary">Enterprise Tier</span>
                <span className="font-mono-data text-on-surface">{stats?.enterprise_tier_count || '428'}</span>
              </div>
              <div className="w-full bg-bg-muted h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full transition-all duration-500" style={{ width: `${stats ? (stats.enterprise_tier_count / (stats.active_tenants || 1)) * 100 : 28}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center text-caption font-caption">
                <span className="text-text-secondary">Growth Tier</span>
                <span className="font-mono-data text-on-surface">{stats?.growth_tier_count || '1,054'}</span>
              </div>
              <div className="w-full bg-bg-muted h-1.5 rounded-full overflow-hidden">
                <div className="bg-secondary h-full transition-all duration-500" style={{ width: `${stats ? (stats.growth_tier_count / (stats.active_tenants || 1)) * 100 : 72}%` }}></div>
              </div>
            </div>
          </div>

          {/* Platform Health */}
          <div className="bg-surface border border-outline-variant hover:border-primary hover:shadow-[0_4px_12px_rgba(0,63,209,0.05)] transition-all duration-200 p-6 rounded-xl flex flex-col justify-between">
            <div>
              <p className="font-overline text-overline text-text-secondary uppercase">Avg Uptime (30d)</p>
              <h3 className="font-h2 text-h2 mt-2 font-mono-data text-success">{stats?.uptime || '99.998'}%</h3>
            </div>
            <div className="mt-4 flex items-end gap-1 h-12">
              {stats?.uptime_history ? (
                stats.uptime_history.map((val: number, i: number) => (
                  <div key={i} className="flex-1 bg-success/20 transition-all duration-500 rounded-sm hover:bg-success/40" style={{ height: `${val}%` }}></div>
                ))
              ) : (
                <>
                  <div className="flex-1 bg-success/20 h-[80%] rounded-sm hover:bg-success/40 transition-colors"></div>
                  <div className="flex-1 bg-success/20 h-[90%] rounded-sm hover:bg-success/40 transition-colors"></div>
                  <div className="flex-1 bg-success/20 h-[85%] rounded-sm hover:bg-success/40 transition-colors"></div>
                  <div className="flex-1 bg-success/20 h-[95%] rounded-sm hover:bg-success/40 transition-colors"></div>
                  <div className="flex-1 bg-success/20 h-[100%] rounded-sm hover:bg-success/40 transition-colors"></div>
                  <div className="flex-1 bg-success/20 h-[98%] rounded-sm hover:bg-success/40 transition-colors"></div>
                  <div className="flex-1 bg-success/20 transition-all duration-500 rounded-sm hover:bg-success/40" style={{ height: `${(stats?.uptime || 99.998) - 90}%` }}></div>
                </>
              )}
            </div>
          </div>

          {/* Error Rate */}
          <div className="bg-surface border border-outline-variant hover:border-primary hover:shadow-[0_4px_12px_rgba(0,63,209,0.05)] transition-all duration-200 p-6 rounded-xl flex flex-col justify-between">
            <div>
              <p className="font-overline text-overline text-text-secondary uppercase">API Error Rate</p>
              <h3 className="font-h2 text-h2 mt-2 font-mono-data text-danger">{stats?.error_rate || '0.04'}%</h3>
            </div>
            <p className="text-caption font-caption text-text-muted mt-2">
              <span className={`font-bold ${stats?.error_trend > 0 ? 'text-danger' : 'text-success'}`}>
                {stats?.error_trend > 0 ? '↑' : '↓'} {Math.abs(stats?.error_trend || 0.01)}%
              </span> from last hour
            </p>
          </div>
          
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Alerts Panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-h3 text-h3 flex items-center gap-2 text-on-surface">
                <AlertTriangle className="w-6 h-6 text-danger" />
                System Alerts
              </h4>
              <span className="bg-danger-bg text-danger px-2 py-0.5 rounded font-overline text-overline">{stats?.alerts?.length || 0} Alerts</span>
            </div>
            
            {/* Alert Items */}
            {stats?.alerts?.map((alert: any) => (
              <div key={alert.id} className={`${alert.type === 'Critical' ? 'bg-danger-bg border-danger' : 'bg-warning-bg border-warning'} border-l-4 p-4 rounded-r-lg space-y-2 transition-all`}>
                <div className="flex justify-between items-center">
                  <p className={`font-body text-body font-bold ${alert.type === 'Critical' ? 'text-danger' : 'text-warning'}`}>{alert.title}</p>
                  <span className={`font-caption text-caption ${alert.type === 'Critical' ? 'text-danger' : 'text-warning'} opacity-70`}>{alert.time}</span>
                </div>
                <p className="font-caption text-caption text-on-surface-variant">
                  {alert.tenant.startsWith('TEN-') ? 'Tenant: ' : ''}
                  <span className="font-mono-data">{alert.tenant}</span>. {alert.message}
                </p>
                {alert.type === 'Critical' && (
                  <button className="font-caption text-caption font-bold text-danger hover:underline">Investigate</button>
                )}
              </div>
            ))}
          </div>

          {/* Marketplace Lead Volume */}
          <div className="lg:col-span-2 bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col hover:border-primary hover:shadow-[0_4px_12px_rgba(0,63,209,0.05)] transition-all duration-200">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <h4 className="font-h3 text-h3 text-on-surface">Marketplace Lead Volume</h4>
              <select 
                className="font-caption text-caption border border-outline-variant rounded-lg bg-surface text-on-surface focus:ring-primary focus:border-primary px-3 py-1.5 outline-none"
                value={leadPeriod}
                onChange={(e) => setLeadPeriod(e.target.value)}
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="6m">Last 6 Months</option>
              </select>
            </div>
            
            <div className="flex-1 p-6 flex items-center justify-center min-h-[300px]">
              <div className="w-full h-full relative">
                {/* Abstract Data Visualization Placeholder */}
                <div className="absolute inset-0 flex items-end justify-between gap-2 px-2">
                  {stats?.lead_volume?.map((val: number, i: number) => {
                    const isLast = i === stats.lead_volume.length - 1;
                    return (
                      <div 
                        key={i} 
                        className={`w-full ${isLast ? 'bg-primary/20 border-x-2 border-primary' : 'bg-primary/10'} rounded-t hover:bg-primary/30 transition-all duration-500 cursor-pointer group relative`} 
                        style={{ height: `${(val / 20000) * 100}%` }}
                      >
                        <span className={`absolute -top-10 left-1/2 -translate-x-1/2 ${isLast ? 'bg-primary' : 'bg-inverse-surface'} text-white text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap z-10 ${isLast ? 'block' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                          {isLast ? `CURRENT: ${val}` : val}
                        </span>
                      </div>
                    )
                  })}
                </div>
                
                <div className="absolute bottom-[-24px] w-full flex justify-between text-[10px] text-text-muted font-mono-data px-1">
                  <span>00:00</span>
                  <span>04:00</span>
                  <span>08:00</span>
                  <span>12:00</span>
                  <span>16:00</span>
                  <span>20:00</span>
                </div>
              </div>
            </div>
          </div>
          
        </section>

        {/* Latest Audit Entries Table */}
        <section className="bg-surface border border-outline-variant rounded-xl overflow-hidden hover:border-primary hover:shadow-[0_4px_12px_rgba(0,63,209,0.05)] transition-all duration-200">
          <div className="p-6 border-b border-outline-variant flex justify-between items-center">
            <h4 className="font-h3 text-h3 text-on-surface">Global Audit Feed</h4>
            <button className="text-primary font-body text-body font-medium hover:underline">View All Logs</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-bg-muted border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-3 font-overline text-overline text-text-secondary uppercase">Timestamp</th>
                  <th className="px-6 py-3 font-overline text-overline text-text-secondary uppercase">Actor</th>
                  <th className="px-6 py-3 font-overline text-overline text-text-secondary uppercase">Action</th>
                  <th className="px-6 py-3 font-overline text-overline text-text-secondary uppercase">Target</th>
                  <th className="px-6 py-3 font-overline text-overline text-text-secondary uppercase text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant bg-surface">
                {stats?.audit_logs?.map((log: any) => (
                  <tr key={log.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4 font-mono-data text-mono-data text-on-surface whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${log.status === 'SUCCESS' ? 'bg-primary' : (log.status === 'FORBIDDEN' ? 'bg-danger' : 'bg-warning')} text-white flex items-center justify-center text-[10px] font-bold`}>{log.actor_initials}</div>
                        <span className="font-caption text-caption text-on-surface font-medium">{log.actor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-caption text-caption text-on-surface">{log.action}</td>
                    <td className="px-6 py-4 font-caption text-caption font-mono-data text-on-surface">{log.target}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center justify-center ${log.status === 'SUCCESS' ? 'bg-success-bg text-success' : (log.status === 'FORBIDDEN' ? 'bg-danger-bg text-danger' : 'bg-warning-bg text-warning')} px-2 py-1 rounded-full text-[10px] font-bold tracking-wide`}>{log.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* Global System Status Overlay (Floating Action) */}
      <div className="fixed bottom-6 right-6">
        <button className="bg-inverse-surface text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-3 active:scale-95 group border-0 cursor-pointer">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-success animate-pulse" />
            <span className="font-caption text-caption group-hover:block hidden font-medium">All Regions Online</span>
          </div>
          <div className="w-px h-4 bg-white/20 group-hover:block hidden"></div>
          <BarChart2 className="w-6 h-6" />
        </button>
      </div>

    </div>
  )
}
