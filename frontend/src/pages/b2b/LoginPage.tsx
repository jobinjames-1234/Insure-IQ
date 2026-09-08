import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShieldCheck } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'
import { getRoleDashboardRoute } from '../../utils/routing'

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required")
})

type LoginFormData = z.infer<typeof loginSchema>

export function B2BLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuthStore()
  const [globalError, setGlobalError] = useState<string | null>(null)
  
  const from = location.state?.from?.pathname || null

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setGlobalError(null)
      const res = await api.post('/auth/login/institution', data)
      const { access_token, refresh_token } = res.data
      
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      const meRes = await api.get('/auth/me')
      const { user, role, profile } = meRes.data
      
      const userForStore = {
        ...user,
        role: role,
        first_name: profile?.first_name,
        last_name: profile?.last_name
      }
      
      setAuth(userForStore, access_token, refresh_token)
      
      if (from) {
        navigate(from, { replace: true })
      } else {
        const dashboardRoute = getRoleDashboardRoute(role)
        navigate(dashboardRoute, { replace: true })
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setGlobalError("Invalid email or password.")
      } else if (err.response?.status === 403) {
        setGlobalError(err.response.data?.detail || "Account locked. Please try again later.")
      } else {
        setGlobalError("An error occurred. Please try again.")
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-surface p-6 sm:p-10 rounded-xl shadow-xl border border-outline-variant">
        <div className="flex flex-col items-center justify-center">
          <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-white mb-4">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="text-center font-h2 text-h2 text-on-surface">
            Sign in to Institution Portal
          </h2>
          <p className="mt-2 text-center font-body text-body text-text-secondary">
            Authorized personnel only
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input 
              label="Email address"
              type="email" 
              placeholder="agent@agency.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input 
              label="Password"
              type="password" 
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          {globalError && (
            <div className="p-3 rounded-md bg-error-container border border-error">
              <p className="font-body text-body text-on-error-container font-medium text-center">{globalError}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-outline rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block font-body text-body text-on-surface">
                Remember me
              </label>
            </div>

            <div className="font-body text-body">
              <a href="#" className="font-medium text-primary hover:text-primary-hover">
                Forgot your password?
              </a>
            </div>
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  )
}
