import { useState, useEffect } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { api } from '../../lib/api'

export function TeamManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("agent")
  const [inviting, setInviting] = useState(false)

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
      fetchUsers()
    } catch (err) {
      console.error(err)
      alert("Failed to send invite")
    } finally {
      setInviting(false)
    }
  }

  if (loading) return <div className="p-8">Loading team...</div>

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Team Management" 
        description="Invite and manage users for your organization." 
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Invite New Member</h3>
        <form onSubmit={handleInvite} className="flex gap-4 items-end max-w-2xl">
          <div className="flex-1">
            <Input 
              label="Email Address"
              type="email"
              value={inviteEmail}
              onChange={(e: any) => setInviteEmail(e.target.value)}
              required
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select 
              className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none h-10"
              value={inviteRole}
              onChange={(e: any) => setInviteRole(e.target.value)}
            >
              <option value="agent">Agent</option>
              <option value="adjuster">Claims Adjuster</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Button type="submit" isLoading={inviting}>Send Invite</Button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <DataTable
          data={users}
          rowKey={(item: any) => item.id}
          columns={[
            { key: 'email', title: 'Email', render: (item: any) => <span className="font-medium text-slate-900">{item.email}</span> },
            { key: 'role', title: 'Role', render: (item: any) => <span className="capitalize">{item.role}</span> },
            { key: 'status', title: 'Status', render: (item: any) => <Badge variant={item.status === 'active' ? 'success' : 'default'}>{item.status}</Badge> },
            { key: 'actions', title: '', render: () => (
              <div className="text-right">
                <Button variant="ghost" size="sm" className="text-red-600">Revoke</Button>
              </div>
            )}
          ]}
        />
      </div>
    </div>
  )
}
