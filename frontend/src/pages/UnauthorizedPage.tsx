import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'

export function UnauthorizedPage() {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const role = user?.role || 'customer'

  const handleGoBack = () => {
    switch (role) {
      case 'superadmin': navigate('/admin', { replace: true }); break;
      case 'customer': navigate('/portal', { replace: true }); break;
      default: navigate('/b2b', { replace: true }); break;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
          <ShieldAlert className="h-8 w-8 text-red-600" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">Access Denied</h2>
          <p className="mt-2 text-sm text-slate-500">
            You don't have the required permissions to access this page. Please contact your system administrator if you believe this is a mistake.
          </p>
        </div>
        <div className="pt-4 flex justify-center">
          <Button onClick={handleGoBack}>Return to Dashboard</Button>
        </div>
      </div>
    </div>
  )
}
