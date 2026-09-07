import { useState } from 'react'
import { MapPin, Edit, CheckCircle, TrendingUp, Star, FolderOpen, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export function AgentProfilePage() {
  const { user } = useAuthStore()
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  // Mock data for UI alignment if user data is sparse
  const agent = {
    first_name: user?.first_name || 'Sarah',
    last_name: user?.last_name || 'Jenkins',
    title: 'Senior Agent',
    location: 'Chicago Regional Office',
    email: user?.email || 's.jenkins@insureiq.com',
    phone: '+1 (312) 555-0192',
    employee_id: 'AG-8472-N',
    initials: 'SJ'
  };

  const metrics = {
    commission: 482500,
    rating: 4.9,
    policies: 342
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 lg:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
        
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="font-h1 text-h1 text-on-surface tracking-tight">Agent Profile</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">Manage your personal information, view performance, and configure account settings.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Profile Card & Personal Info */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Profile Summary Card */}
            <div className="bg-surface-container-lowest rounded-lg border border-outline-variant shadow-xs p-6 flex flex-col items-center text-center">
              <div className="relative w-24 h-24 mb-4">
                <div className="w-24 h-24 rounded-full bg-primary-container text-white border-2 border-surface shadow-sm flex items-center justify-center text-3xl font-semibold">
                  {agent.initials}
                </div>
                <button className="absolute bottom-0 right-0 bg-primary-container text-white rounded-full p-1.5 shadow-md hover:bg-primary hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-h3 text-h3 text-on-surface mb-1">{agent.first_name} {agent.last_name}</h3>
              <p className="font-body text-body text-primary mb-2 font-medium">{agent.title}</p>
              <div className="flex items-center gap-1 text-on-surface-variant font-caption text-caption mb-4">
                <MapPin className="w-3.5 h-3.5" />
                <span>{agent.location}</span>
              </div>
              <div className="w-full flex justify-between gap-4 mt-2">
                <button className="flex-1 border border-outline-variant bg-surface-container-lowest text-on-surface py-2 rounded-DEFAULT font-caption text-caption font-medium hover:bg-surface-container-low transition-colors">
                  View Public Profile
                </button>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-surface-container-lowest rounded-lg border border-outline-variant shadow-xs p-6">
              <h4 className="font-h3 text-h3 text-on-surface border-b border-outline-variant pb-4 mb-4">Personal Information</h4>
              <div className="space-y-4">
                <div>
                  <label className="font-overline text-overline text-on-surface-variant uppercase tracking-wider block mb-1">Email Address</label>
                  <div className="font-body text-body text-on-surface">{agent.email}</div>
                </div>
                <div>
                  <label className="font-overline text-overline text-on-surface-variant uppercase tracking-wider block mb-1">Phone Number</label>
                  <div className="font-mono-data text-mono-data text-on-surface">{agent.phone}</div>
                </div>
                <div>
                  <label className="font-overline text-overline text-on-surface-variant uppercase tracking-wider block mb-1">Employee ID</label>
                  <div className="font-mono-data text-mono-data text-on-surface">{agent.employee_id}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Performance & Settings */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Performance Metrics Bento */}
            <div className="bg-surface-container-lowest rounded-lg border border-outline-variant shadow-xs p-6">
              <div className="flex justify-between items-center border-b border-outline-variant pb-4 mb-6">
                <h4 className="font-h3 text-h3 text-on-surface">Performance Metrics</h4>
                <span className="bg-surface-container-low text-on-surface-variant px-3 py-1 rounded-full font-caption text-caption font-medium border border-outline-variant/20">YTD 2023</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Metric 1 */}
                <div className="bg-background p-4 rounded-lg border border-outline-variant flex flex-col">
                  <div className="flex items-center gap-2 mb-2 text-on-surface-variant">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-caption text-caption font-medium">Lifetime Commission</span>
                  </div>
                  <div className="font-h2 text-h2 font-mono-data text-on-surface mt-auto">
                    ${metrics.commission.toLocaleString()}
                  </div>
                  <div className="mt-2 text-success flex items-center gap-1 font-caption text-caption">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+12% vs last year</span>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-background p-4 rounded-lg border border-outline-variant flex flex-col">
                  <div className="flex items-center gap-2 mb-2 text-on-surface-variant">
                    <Star className="w-4 h-4" />
                    <span className="font-caption text-caption font-medium">Customer Rating</span>
                  </div>
                  <div className="flex items-end gap-1 mt-auto">
                    <div className="font-h2 text-h2 font-mono-data text-on-surface">{metrics.rating}</div>
                    <div className="font-caption text-caption text-text-muted mb-1 font-medium">/ 5.0</div>
                  </div>
                  <div className="mt-2 flex text-warning">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < 4 ? 'fill-warning text-warning' : 'fill-warning/30 text-warning/30'}`} />
                    ))}
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-background p-4 rounded-lg border border-outline-variant flex flex-col">
                  <div className="flex items-center gap-2 mb-2 text-on-surface-variant">
                    <FolderOpen className="w-4 h-4" />
                    <span className="font-caption text-caption font-medium">Active Policies</span>
                  </div>
                  <div className="font-h2 text-h2 font-mono-data text-on-surface mt-auto">{metrics.policies}</div>
                  <div className="mt-2 text-on-surface-variant font-caption text-caption font-medium">
                    <span>Across 4 product lines</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Notification Preferences */}
              <div className="bg-surface-container-lowest rounded-lg border border-outline-variant shadow-xs p-6">
                <h4 className="font-h3 text-h3 text-on-surface border-b border-outline-variant pb-4 mb-4">Notification Preferences</h4>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-body text-body font-medium text-on-surface">New Claim Assigned</div>
                        <div className="font-caption text-caption text-text-muted mt-1">Alerts when a new claim is routed to your queue.</div>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded-DEFAULT border-outline-variant text-primary focus:ring-primary h-4 w-4" />
                        <span className="font-caption text-caption text-on-surface-variant">Email</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded-DEFAULT border-outline-variant text-primary focus:ring-primary h-4 w-4" />
                        <span className="font-caption text-caption text-on-surface-variant">SMS</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-body text-body font-medium text-on-surface">Renewal Alerts</div>
                        <div className="font-caption text-caption text-text-muted mt-1">Notifications 30 days before client policy expiration.</div>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded-DEFAULT border-outline-variant text-primary focus:ring-primary h-4 w-4" />
                        <span className="font-caption text-caption text-on-surface-variant">Email</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded-DEFAULT border-outline-variant text-primary focus:ring-primary h-4 w-4" />
                        <span className="font-caption text-caption text-on-surface-variant">SMS</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="bg-surface-container-lowest rounded-lg border border-outline-variant shadow-xs p-6">
                <h4 className="font-h3 text-h3 text-on-surface border-b border-outline-variant pb-4 mb-4">Security</h4>
                <div className="space-y-4">
                  <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 shrink-0" />
                    <div>
                      <div className="font-body text-body font-medium text-on-surface">Two-Factor Authentication</div>
                      <div className="font-caption text-caption text-text-muted mt-1">Enabled via Authenticator App</div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <label className="font-overline text-overline text-on-surface-variant uppercase block mb-2 mt-4">Update Password</label>
                    <div className="space-y-3">
                      <div className="relative">
                        <input 
                          type={showCurrentPassword ? "text" : "password"} 
                          placeholder="Current Password" 
                          className="w-full h-[40px] px-3 pr-10 border border-outline-variant rounded-DEFAULT focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-body text-body bg-surface-container-lowest" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="relative">
                        <input 
                          type={showNewPassword ? "text" : "password"} 
                          placeholder="New Password" 
                          className="w-full h-[40px] px-3 pr-10 border border-outline-variant rounded-DEFAULT focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-body text-body bg-surface-container-lowest" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <button className="w-full h-[40px] bg-surface-container-lowest border border-outline-variant text-on-surface rounded-DEFAULT font-caption text-caption font-medium hover:bg-surface-container-low transition-colors mt-2">
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
            
            {/* Action Bar */}
            <div className="flex justify-end gap-4 pt-4 border-t border-outline-variant mt-8">
              <button className="px-6 py-2 border border-outline-variant bg-surface-container-lowest text-on-surface rounded-DEFAULT font-body text-body hover:bg-surface-container-low transition-colors h-[40px]">
                Cancel
              </button>
              <button className="px-6 py-2 bg-primary-container text-white rounded-DEFAULT font-body text-body font-medium hover:bg-primary hover:text-white transition-colors h-[40px] shadow-sm">
                Save Changes
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}
