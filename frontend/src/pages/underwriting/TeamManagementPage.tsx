import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { PersonAdd, Search, FilterList, MoreVert, ChevronLeft, ChevronRight } from '@mui/icons-material'

export function TeamManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("agent")
  const [inviting, setInviting] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [activeTab, setActiveTab] = useState('team')
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  // General Tab State
  const [teamName, setTeamName] = useState("Underwriting Alpha Team")
  const [primaryContact, setPrimaryContact] = useState("admin@insureiq.com")
  const [language, setLanguage] = useState("English (US)")
  const [notifications, setNotifications] = useState("All Alerts")
  const [savingGeneral, setSavingGeneral] = useState(false)

  // Security Tab State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)
  const [sessionTimeout, setSessionTimeout] = useState("15 Minutes")
  const [passwordComplexity, setPasswordComplexity] = useState(true)
  const [ssoEnabled, setSsoEnabled] = useState(false)
  const [savingSecurity, setSavingSecurity] = useState(false)

  // Roles Tab State
  const [roles, setRoles] = useState([
    { name: 'Administrator', permissions: ['Manage Users', 'View Reports', 'Edit Policies'] },
    { name: 'Underwriter', permissions: ['View Reports', 'Edit Policies'] },
    { name: 'Adjuster', permissions: ['View Reports'] },
    { name: 'Agent', permissions: [] }
  ])
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)



  const handleSaveGeneral = () => {
    setSavingGeneral(true)
    setTimeout(() => {
      setSavingGeneral(false)
      alert("General settings saved successfully.")
    }, 800)
  }

  const handleSaveSecurity = () => {
    setSavingSecurity(true)
    setTimeout(() => {
      setSavingSecurity(false)
      alert("Security preferences updated.")
    }, 800)
  }

  const fetchUsers = () => {
    api.get('/admin/users')
      .then((res: any) => setUsers(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    try {
      await api.post('/admin/users', { email: inviteEmail, role: inviteRole })
      alert("Invite sent")
      setInviteEmail("")
      setShowInviteModal(false)
      fetchUsers()
    } catch (err) {
      console.error(err)
      alert("Failed to send invite")
    } finally {
      setInviting(false)
    }
  }

  if (loading && users.length === 0) return <div className="p-8 text-on-surface-variant animate-pulse font-caption text-caption">Loading team...</div>

  const displayUsers = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.role && u.role.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
      <div className="max-w-max-width mx-auto p-gutter md:p-margin">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="font-h2 text-h2 text-on-surface mb-1">Team Management</h2>
            <p className="font-body text-body text-text-secondary">Manage your team's access and roles.</p>
          </div>
          <div>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="bg-primary text-white h-[40px] px-4 rounded-DEFAULT font-body text-body flex items-center justify-center hover:opacity-90 transition-opacity gap-2 shadow-sm"
            >
              <PersonAdd className="text-[18px]" />
              Invite User
            </button>
          </div>
        </div>

        {/* Settings Sub-Navigation */}
        <div className="mb-8 border-b border-outline-variant flex gap-6">
          <button 
            role="tab"
            className={`font-body text-body pb-3 transition-colors ${activeTab === 'general' ? 'text-on-surface border-b-2 border-primary font-medium' : 'text-text-secondary hover:text-on-surface'}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button 
            role="tab"
            className={`font-body text-body pb-3 transition-colors ${activeTab === 'team' ? 'text-on-surface border-b-2 border-primary font-medium' : 'text-text-secondary hover:text-on-surface'}`}
            onClick={() => setActiveTab('team')}
          >
            Team Members
          </button>
          <button 
            role="tab"
            className={`font-body text-body pb-3 transition-colors ${activeTab === 'roles' ? 'text-on-surface border-b-2 border-primary font-medium' : 'text-text-secondary hover:text-on-surface'}`}
            onClick={() => setActiveTab('roles')}
          >
            Roles & Permissions
          </button>
          <button 
            role="tab"
            className={`font-body text-body pb-3 transition-colors ${activeTab === 'security' ? 'text-on-surface border-b-2 border-primary font-medium' : 'text-text-secondary hover:text-on-surface'}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'team' && (
          <div className="bg-surface rounded-lg shadow-xs border border-outline-variant overflow-hidden">
            
            {/* Table Header/Filter Area */}
            <div className="p-6 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container-lowest">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
                <input 
                  className="w-full h-[40px] pl-10 pr-4 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body text-body text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all placeholder:text-text-muted" 
                  placeholder="Search team members..." 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button className="bg-surface-container-lowest border border-outline-variant text-on-surface h-[40px] px-4 rounded-DEFAULT font-body text-body flex items-center justify-center hover:bg-surface-container-low transition-colors gap-2 flex-1 sm:flex-none">
                  <FilterList className="text-[18px]" />
                  Filter
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-lowest">
                    <th className="font-caption text-caption text-text-secondary font-medium py-3 px-6 whitespace-nowrap">Name</th>
                    <th className="font-caption text-caption text-text-secondary font-medium py-3 px-6 whitespace-nowrap">Role</th>
                    <th className="font-caption text-caption text-text-secondary font-medium py-3 px-6 whitespace-nowrap">Status</th>
                    <th className="font-caption text-caption text-text-secondary font-medium py-3 px-6 text-right whitespace-nowrap">Last Login</th>
                    <th className="font-caption text-caption text-text-secondary font-medium py-3 px-6 text-right whitespace-nowrap w-[80px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {displayUsers.map((user: any, index: number) => {
                    const isSuspended = user.status === 'Suspended';
                    return (
                      <tr 
                        key={user.id || index} 
                        className="hover:bg-surface-container-low transition-colors group cursor-pointer"
                        onClick={() => navigate(`/b2b/admin/team/${user.id || index}`)}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {user.avatar ? (
                              <img alt={user.name || user.email} className="w-10 h-10 rounded-full object-cover border border-outline-variant" src={user.avatar}/>
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-body text-body font-medium ${isSuspended ? 'bg-surface-variant text-on-surface-variant' : 'bg-secondary-fixed text-on-secondary-fixed-variant'}`}>
                                {user.initials || user.email?.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className={`font-body text-body text-on-surface font-medium ${isSuspended ? 'opacity-60' : ''}`}>{user.name || user.email}</p>
                              <p className="font-caption text-caption text-text-muted">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`font-body text-body text-on-surface ${isSuspended ? 'opacity-60' : ''}`}>{user.role}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-caption text-caption border ${
                            user.status.toLowerCase() === 'active' 
                              ? 'bg-success-bg text-success border-success/20' 
                              : 'bg-danger-bg text-danger border-danger/20'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="font-mono-data text-mono-data text-text-secondary">{user.lastActive || 'Unknown'}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button 
                            onClick={(e) => { e.stopPropagation(); alert(`Action menu opened for ${user.name || user.email}`); }}
                            className="text-on-surface-variant hover:text-on-surface opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVert />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest">
              <p className="font-caption text-caption text-text-secondary">Showing 1 to {displayUsers.length} of 24 members</p>
              <div className="flex gap-1">
                <button className="w-8 h-8 flex items-center justify-center rounded-DEFAULT hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface disabled:opacity-50" disabled>
                  <ChevronLeft className="text-[18px]" />
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-DEFAULT bg-primary-container text-white font-caption text-caption">1</button>
                <button className="w-8 h-8 flex items-center justify-center rounded-DEFAULT hover:bg-surface-container-low text-on-surface font-caption text-caption">2</button>
                <button className="w-8 h-8 flex items-center justify-center rounded-DEFAULT hover:bg-surface-container-low text-on-surface font-caption text-caption">3</button>
                <button className="w-8 h-8 flex items-center justify-center rounded-DEFAULT hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface">
                  <ChevronRight className="text-[18px]" />
                </button>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'general' && (
          <div className="bg-surface rounded-lg shadow-xs border border-outline-variant p-6 space-y-6">
            <h3 className="font-h3 text-h3 text-on-surface border-b border-outline-variant pb-2">General Settings</h3>
            <div className="max-w-2xl space-y-4">
              <div>
                <label className="block font-caption text-caption text-on-surface mb-2 font-medium">Team Name</label>
                <input 
                  className="w-full h-[40px] px-3 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body text-body text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                  type="text" 
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-caption text-caption text-on-surface mb-2 font-medium">Primary Contact Email</label>
                <input 
                  className="w-full h-[40px] px-3 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body text-body text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                  type="email" 
                  value={primaryContact}
                  onChange={(e) => setPrimaryContact(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-caption text-caption text-on-surface mb-2 font-medium">Default Language</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-[40px] px-3 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body text-body text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option>English (US)</option>
                  <option>Spanish (ES)</option>
                  <option>French (FR)</option>
                </select>
              </div>
              <div>
                <label className="block font-caption text-caption text-on-surface mb-2 font-medium">Notification Preferences</label>
                <select 
                  value={notifications}
                  onChange={(e) => setNotifications(e.target.value)}
                  className="w-full h-[40px] px-3 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body text-body text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option>All Alerts</option>
                  <option>Critical Only</option>
                  <option>Muted</option>
                </select>
              </div>
              <div className="pt-4 border-t border-outline-variant">
                <button 
                  onClick={handleSaveGeneral}
                  disabled={savingGeneral}
                  className="bg-primary text-white h-[40px] px-6 rounded-DEFAULT font-body text-body font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {savingGeneral ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="bg-surface rounded-lg shadow-xs border border-outline-variant p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-outline-variant pb-2">
              <h3 className="font-h3 text-h3 text-on-surface">Roles & Permissions</h3>
              <button 
                onClick={() => { setEditingRole({ name: '', permissions: [] }); setShowRoleModal(true); }}
                className="bg-primary-container text-white h-[32px] px-4 rounded-DEFAULT font-caption text-caption font-medium hover:bg-primary hover:text-white transition-colors"
              >
                Add Role
              </button>
            </div>
            <div className="space-y-4">
              {roles.map(role => (
                <div key={role.name} className="flex justify-between items-center p-4 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors">
                  <div>
                    <p className="font-body text-body font-medium text-on-surface">{role.name}</p>
                    <p className="font-caption text-caption text-text-secondary">{role.permissions.length} permissions granted.</p>
                  </div>
                  <button 
                    onClick={() => { setEditingRole(role); setShowRoleModal(true); }}
                    className="text-primary font-caption text-caption font-medium hover:underline"
                  >
                    Edit Permissions
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-surface rounded-lg shadow-xs border border-outline-variant p-6 space-y-6">
            <h3 className="font-h3 text-h3 text-on-surface border-b border-outline-variant pb-2">Security Preferences</h3>
            <div className="max-w-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body text-body font-medium text-on-surface">Two-Factor Authentication (2FA)</p>
                  <p className="font-caption text-caption text-text-secondary">Require all team members to use 2FA.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={twoFactorEnabled}
                  onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                  className="w-5 h-5 text-primary rounded border-outline-variant focus:ring-primary" 
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body text-body font-medium text-on-surface">Session Timeout</p>
                  <p className="font-caption text-caption text-text-secondary">Automatically log out inactive users.</p>
                </div>
                <select 
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="h-[40px] px-3 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body text-body text-on-surface focus:outline-none focus:border-primary"
                >
                  <option>15 Minutes</option>
                  <option>30 Minutes</option>
                  <option>1 Hour</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body text-body font-medium text-on-surface">Require Password Complexity</p>
                  <p className="font-caption text-caption text-text-secondary">Enforce symbols, numbers, and uppercase letters.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={passwordComplexity}
                  onChange={(e) => setPasswordComplexity(e.target.checked)}
                  className="w-5 h-5 text-primary rounded border-outline-variant focus:ring-primary" 
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body text-body font-medium text-on-surface">Enable Single Sign-On (SSO)</p>
                  <p className="font-caption text-caption text-text-secondary">Allow login via organizational identity provider.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={ssoEnabled}
                  onChange={(e) => setSsoEnabled(e.target.checked)}
                  className="w-5 h-5 text-primary rounded border-outline-variant focus:ring-primary" 
                />
              </div>
              <div className="pt-4 border-t border-outline-variant">
                <button 
                  onClick={handleSaveSecurity}
                  disabled={savingSecurity}
                  className="bg-primary text-white h-[40px] px-6 rounded-DEFAULT font-body text-body font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {savingSecurity ? "Updating..." : "Update Security"}
                </button>
              </div>
            </div>
          </div>
        )}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-surface rounded-xl shadow-lg border border-outline-variant w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-outline-variant">
                <h3 className="font-h3 text-h3 text-on-surface">Invite Team Member</h3>
                <p className="font-caption text-caption text-text-secondary mt-1">Send an invitation to join the team.</p>
              </div>
              <form onSubmit={handleInvite} className="p-6 space-y-4">
                <div>
                  <label className="block font-caption text-caption text-on-surface mb-2 font-medium">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full h-[40px] px-3 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body text-body text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                    placeholder="colleague@insureiq.com"
                  />
                </div>
                <div>
                  <label className="block font-caption text-caption text-on-surface mb-2 font-medium">Role</label>
                  <select 
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full h-[40px] px-3 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body text-body text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="agent">Agent</option>
                    <option value="underwriter">Underwriter</option>
                    <option value="adjuster">Adjuster</option>
                    <option value="administrator">Administrator</option>
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowInviteModal(false)}
                    className="h-[40px] px-4 font-body text-body font-medium text-text-secondary hover:text-on-surface transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={inviting}
                    className="bg-primary text-white h-[40px] px-6 rounded-DEFAULT font-body text-body font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {inviting ? "Sending..." : "Send Invite"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {showRoleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-surface rounded-xl shadow-lg border border-outline-variant w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-outline-variant">
                <h3 className="font-h3 text-h3 text-on-surface">{editingRole?.name ? `Edit ${editingRole.name}` : 'New Role'}</h3>
              </div>
              <div className="p-6 space-y-4">
                {!roles.find(r => r.name === editingRole?.name) && (
                  <div>
                    <label className="block font-caption text-caption text-on-surface mb-2 font-medium">Role Name</label>
                    <input 
                      type="text" 
                      value={editingRole?.name || ''}
                      onChange={(e) => setEditingRole({...editingRole, name: e.target.value})}
                      className="w-full h-[40px] px-3 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body text-body text-on-surface focus:outline-none focus:border-primary" 
                    />
                  </div>
                )}
                <div>
                  <p className="font-caption text-caption font-medium mb-2">Permissions</p>
                  {['Manage Users', 'View Reports', 'Edit Policies', 'Manage Billing'].map(perm => (
                    <label key={perm} className="flex items-center gap-3 mb-2">
                      <input 
                        type="checkbox" 
                        checked={editingRole?.permissions?.includes(perm) || false}
                        onChange={(e) => {
                          const perms = editingRole.permissions || [];
                          if (e.target.checked) setEditingRole({...editingRole, permissions: [...perms, perm]})
                          else setEditingRole({...editingRole, permissions: perms.filter((p: string) => p !== perm)})
                        }}
                        className="w-4 h-4 text-primary rounded border-outline-variant"
                      />
                      <span className="font-body text-body">{perm}</span>
                    </label>
                  ))}
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button onClick={() => setShowRoleModal(false)} className="h-[40px] px-4 font-body text-body font-medium text-text-secondary hover:text-on-surface">Cancel</button>
                  <button 
                    onClick={() => {
                      if (!editingRole.name) return;
                      const updated = [...roles];
                      const idx = updated.findIndex(r => r.name === editingRole.name);
                      if (idx >= 0) updated[idx] = editingRole;
                      else updated.push(editingRole);
                      setRoles(updated);
                      setShowRoleModal(false);
                    }}
                    className="bg-primary text-white h-[40px] px-6 rounded-DEFAULT font-body text-body font-medium hover:opacity-90"
                  >
                    Save Role
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
