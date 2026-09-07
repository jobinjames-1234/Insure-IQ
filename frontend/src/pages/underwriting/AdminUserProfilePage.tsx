import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowBack, Mail, Phone, Map, Shield, LockClock } from '@mui/icons-material'

export function AdminUserProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // In a real app, we'd fetch the user by ID: api.get(`/admin/users/${id}`)
    // For now, we simulate a network request and return mock data based on ID
    setTimeout(() => {
      const mockUsers = [
        { id: '1', name: 'Sarah Jenkins', email: 'sarah.j@insureiq.com', role: 'Administrator', status: 'Active', lastActive: '2 hours ago', department: 'Executive', phone: '+1 (555) 123-4567', location: 'New York, NY', joinDate: 'Jan 15, 2021' },
        { id: '2', name: 'Michael Ross', email: 'm.ross@insureiq.com', role: 'Underwriter', status: 'Active', lastActive: 'Oct 12, 2023', department: 'Risk Management', phone: '+1 (555) 987-6543', location: 'Chicago, IL', joinDate: 'Mar 10, 2022' },
        { id: '3', name: 'David Chen', email: 'd.chen@insureiq.com', role: 'Adjuster', status: 'Active', lastActive: 'Oct 10, 2023', department: 'Claims', phone: '+1 (555) 456-7890', location: 'San Francisco, CA', joinDate: 'Jun 22, 2023' },
        { id: '4', name: 'Elena Lopez', email: 'elena.l@insureiq.com', role: 'Agent', status: 'Suspended', lastActive: 'Sep 28, 2023', department: 'Sales', phone: '+1 (555) 321-0987', location: 'Miami, FL', joinDate: 'Aug 05, 2023' },
      ]
      
      const found = mockUsers.find(u => String(u.id) === String(id)) || mockUsers[0]
      setUser(found)
      setLoading(false)
    }, 500)
  }, [id])

  if (loading) {
    return <div className="p-8 text-on-surface-variant animate-pulse font-caption text-caption">Loading profile...</div>
  }

  return (
    <div className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
      <div className="max-w-4xl mx-auto p-gutter md:p-margin">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/b2b/admin/team')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface hover:bg-surface-container-low border border-outline-variant transition-colors"
          >
            <ArrowBack className="text-on-surface-variant text-[20px]" />
          </button>
          <div>
            <h2 className="font-h2 text-h2 text-on-surface mb-1">User Profile</h2>
            <p className="font-body text-body text-text-secondary">View and manage team member details.</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-surface border border-outline-variant rounded-xl p-8 mb-8 flex flex-col md:flex-row gap-8 items-start shadow-sm">
          <div className="w-24 h-24 rounded-full bg-primary-container text-white flex items-center justify-center text-3xl font-medium shrink-0">
            {user?.name?.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-semibold text-on-surface">{user?.name}</h3>
                <p className="font-body text-body text-text-secondary mt-1">{user?.role} &bull; {user?.department}</p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full font-caption text-caption border ${
                user?.status?.toLowerCase() === 'active' 
                  ? 'bg-success-bg text-success border-success/20' 
                  : 'bg-danger-bg text-danger border-danger/20'
              }`}>
                {user?.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="flex items-center gap-3 text-on-surface-variant">
                <Mail className="text-[20px]" />
                <span className="font-body text-body">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-on-surface-variant">
                <Phone className="text-[20px]" />
                <span className="font-body text-body">{user?.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-on-surface-variant">
                <Map className="text-[20px]" />
                <span className="font-body text-body">{user?.location}</span>
              </div>
              <div className="flex items-center gap-3 text-on-surface-variant">
                <LockClock className="text-[20px]" />
                <span className="font-body text-body">Joined: {user?.joinDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Access & Permissions Preview */}
        <div className="bg-surface border border-outline-variant rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-outline-variant pb-4">
            <Shield className="text-primary text-[24px]" />
            <h3 className="font-h3 text-h3 text-on-surface">Access & Permissions</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border border-outline-variant rounded-lg bg-surface-container-lowest">
              <div>
                <p className="font-body text-body font-medium text-on-surface">System Role</p>
                <p className="font-caption text-caption text-text-secondary">{user?.role} privileges active</p>
              </div>
              <button className="text-primary font-caption text-caption font-medium hover:underline">Change Role</button>
            </div>
            <div className="flex justify-between items-center p-4 border border-outline-variant rounded-lg bg-surface-container-lowest">
              <div>
                <p className="font-body text-body font-medium text-on-surface">Account Status</p>
                <p className="font-caption text-caption text-text-secondary">Currently {user?.status}</p>
              </div>
              <button className={`${user?.status?.toLowerCase() === 'active' ? 'text-danger' : 'text-success'} font-caption text-caption font-medium hover:underline`}>
                {user?.status?.toLowerCase() === 'active' ? 'Suspend Account' : 'Reactivate Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
