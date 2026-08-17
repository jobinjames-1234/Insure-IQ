import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { api } from '../../lib/api'
import { Shield } from 'lucide-react'

export function GetAQuotePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const category = searchParams.get('type') || 'auto'
  
  const [formData, setFormData] = useState({
    zip_code: '',
    age: '',
    coverage_level: 'Standard'
  })
  
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/marketplace/quotes', {
        category,
        zip_code: formData.zip_code,
        age: parseInt(formData.age, 10),
        coverage_level: formData.coverage_level
      })
      // Pass the mock quotes data directly to the compare page via state
      navigate('/marketplace/compare', { state: { quotes: res.data.quotes, formData } })
    } catch (err) {
      console.error(err)
      alert("Failed to get quotes")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-6 h-6" />
        </div>
        <PageHeader 
          title="Let's get you a quote" 
          description="We just need a few details to find the best rates for you across our network."
        />
      </div>

      <Card>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
              label="ZIP Code" 
              placeholder="e.g. 90210" 
              required
              value={formData.zip_code}
              onChange={(e: any) => setFormData({...formData, zip_code: e.target.value})}
            />
            
            <Input 
              label="Age" 
              type="number" 
              placeholder="e.g. 35" 
              required
              value={formData.age}
              onChange={(e: any) => setFormData({...formData, age: e.target.value})}
            />
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Coverage Level</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Basic', 'Standard', 'Premium'].map(level => (
                  <div 
                    key={level}
                    className={`border rounded-lg p-4 cursor-pointer text-center transition-all ${
                      formData.coverage_level === level 
                        ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' 
                        : 'border-slate-200 hover:border-indigo-300'
                    }`}
                    onClick={() => setFormData({...formData, coverage_level: level})}
                  >
                    <div className="font-semibold text-slate-900">{level}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <Button type="submit" className="w-full h-12 text-lg" isLoading={loading}>
                Find My Matches
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
