import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShieldCheck } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required")
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
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
      // 1. Get tokens
      const res = await api.post('/auth/login', data)
      const { access_token, refresh_token } = res.data
      
      // 2. Temporarily set token in axios to fetch me
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      const meRes = await api.get('/auth/me')
      const { user, role, profile } = meRes.data
      
      const userForStore = {
        ...user,
        role: role,
        first_name: profile?.first_name,
        last_name: profile?.last_name
      }
      
      // 3. Save to store
      setAuth(userForStore, access_token, refresh_token)
      
      // 4. Redirect based on role or intended destination
      if (from) {
        navigate(from, { replace: true })
      } else {
        switch (role) {
          case 'superadmin': navigate('/admin', { replace: true }); break;
          case 'customer': navigate('/portal', { replace: true }); break;
          default: navigate('/b2b', { replace: true }); break;
        }
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-6 sm:p-10 rounded-xl shadow-xl border border-slate-100">
        <div className="flex flex-col items-center justify-center">
          <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white mb-4">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Or{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
              start your customer journey
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input 
              label="Email address"
              type="email" 
              placeholder="name@company.com"
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
            <div className="p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-600 font-medium text-center">{globalError}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
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
