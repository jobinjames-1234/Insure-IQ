import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'
import { useAuthStore } from '../../store/authStore'

export function ProfilePage() {
  const user = useAuthStore(state => state.user)
  
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <PageHeader title="My Profile" description="Manage your personal details and KYC documents." />
      <Card>
        <CardContent className="p-8 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-500">Email Address</label>
            <div className="text-lg font-medium">{user?.email}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-500">Role</label>
            <div className="text-lg font-medium capitalize">{user?.role}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
