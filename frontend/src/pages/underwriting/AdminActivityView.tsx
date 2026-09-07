import { useState } from 'react'
import { ArrowBack, Search, FilterList, FactCheck, PersonAdd, NotificationsActive, Policy, LockOpen, FileDownload } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

export function AdminActivityView() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const mockActivities = [
    { id: 'ACT-001', type: 'Underwriting', title: 'Underwriting Approval', desc: 'Policy #AX-9023 was approved by System Auto.', time: '2 minutes ago', icon: <FactCheck className="text-sm" />, color: 'bg-success-bg text-success' },
    { id: 'ACT-002', type: 'Team', title: 'New Agent Onboarded', desc: 'Sarah Jenkins joined the Northeast team.', time: '45 minutes ago', icon: <PersonAdd className="text-sm" />, color: 'bg-primary-fixed text-primary' },
    { id: 'ACT-003', type: 'Billing', title: 'Billing Alert', desc: 'Stripe payment failed for Tenant ID: 5521.', time: '2 hours ago', icon: <NotificationsActive className="text-sm" />, color: 'bg-warning-bg text-warning' },
    { id: 'ACT-004', type: 'Claims', title: 'Rejection Issued', desc: 'Claim #C-882 denied due to documentation lapse.', time: '5 hours ago', icon: <Policy className="text-sm" />, color: 'bg-danger-bg text-danger' },
    { id: 'ACT-005', type: 'Security', title: 'Admin Login', desc: 'Root access detected from IP 192.168.1.1.', time: '8 hours ago', icon: <LockOpen className="text-sm" />, color: 'bg-surface-container text-outline' },
    { id: 'ACT-006', type: 'System', title: 'Data Export', desc: 'Global policy data exported by Admin User.', time: '1 day ago', icon: <FileDownload className="text-sm" />, color: 'bg-secondary-fixed text-secondary' },
  ]

  const displayActivities = mockActivities.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.desc.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Header */}
      <header className="flex justify-between items-center px-gutter w-full h-16 bg-surface border-b border-outline-variant z-40 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/b2b/admin')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
            <ArrowBack className="text-on-surface-variant" />
          </button>
          <div className="flex flex-col">
            <h2 className="font-h3 text-h3 text-on-surface">System Activity Log</h2>
            <span className="text-caption text-text-secondary font-body">Chronological feed of all system audit logs and recent activities</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-gutter space-y-6">
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col max-w-4xl mx-auto">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
              <input 
                className="w-full h-10 pl-10 pr-4 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body text-body text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted" 
                placeholder="Search logs..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-2 px-4 h-10 border border-outline-variant rounded-DEFAULT text-on-surface hover:bg-surface-container-low transition-colors font-body text-body">
              <FilterList className="text-[18px]" />
              Filter
            </button>
          </div>

          <div className="p-6">
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-outline-variant before:to-transparent">
              {displayActivities.map((activity, index) => (
                <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface ${activity.color} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10`}>
                    {activity.icon}
                  </div>
                  
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:border-primary transition-colors">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-semibold text-on-surface font-body">{activity.title}</div>
                      <time className="font-mono-data text-[11px] text-text-muted uppercase">{activity.time}</time>
                    </div>
                    <div className="text-body text-text-secondary font-body">{activity.desc}</div>
                  </div>
                </div>
              ))}
              
              {displayActivities.length === 0 && (
                <div className="py-12 text-center text-text-secondary font-body">No activities found matching your search.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
