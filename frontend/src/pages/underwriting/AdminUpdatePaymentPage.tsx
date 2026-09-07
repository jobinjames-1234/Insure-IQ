import { useState } from 'react'
import { ArrowLeft, CreditCard, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

export function AdminUpdatePaymentPage() {
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: 'John Doe',
    cardNumber: '•••• •••• •••• 4242',
    expiration: '12/25',
    cvc: '•••'
  })
  
  const [realData] = useState({
    cardNumber: '4242 4242 4242 4242',
    cvc: '123'
  })
  const [isHoveringEye, setIsHoveringEye] = useState(false)
  const [isHoveringEyeCVC, setIsHoveringEyeCVC] = useState(false)
  
  const [isCardVisible, setIsCardVisible] = useState(false)
  const [isCVCVisible, setIsCVCVisible] = useState(false)
  
  const [validationState, setValidationState] = useState<'idle' | 'verifying' | 'approved' | 'rejected'>('idle')
  const [validationMessage, setValidationMessage] = useState('')

  const getCardValue = () => {
    if (!isEditing) return isHoveringEye ? realData.cardNumber : formData.cardNumber
    if (formData.cardNumber.includes('•')) return isCardVisible ? realData.cardNumber : formData.cardNumber
    return formData.cardNumber
  }

  const getCardTypeAttr = () => {
    if (!isEditing || formData.cardNumber.includes('•')) return "text"
    return isCardVisible ? "text" : "password"
  }

  const getCVCValue = () => {
    if (!isEditing) return isHoveringEyeCVC ? realData.cvc : formData.cvc
    if (formData.cvc.includes('•')) return isCVCVisible ? realData.cvc : formData.cvc
    return formData.cvc
  }

  const getCVCTypeAttr = () => {
    if (!isEditing || formData.cvc.includes('•')) return "text"
    return isCVCVisible ? "text" : "password"
  }

  const getCardType = (cardNumber: string) => {
    if (cardNumber.includes('•')) return 'Card'
    const firstDigit = cardNumber.replace(/\s/g, '').charAt(0)
    if (firstDigit === '4') return 'Visa'
    if (firstDigit === '5') return 'Mastercard'
    if (firstDigit === '3') return 'Amex'
    if (firstDigit === '6') return 'Discover'
    if (cardNumber.trim() === '') return 'Card'
    return 'Card'
  }

  const formatCardNumber = (value: string) => {
    // If it still has dots, just let it be (initial state) unless they add something else
    if (value.includes('•') && value.length <= 19) return value
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const parts = []
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.substring(i, i + 4))
    }
    return parts.length > 0 ? parts.join(' ') : v
  }

  const formatExpiration = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 3) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`
    }
    return v
  }

  const formatCVC = (value: string) => {
    if (value.includes('•')) return value
    return value.replace(/\s+/g, '').replace(/[^0-9]/gi, '').substring(0, 4)
  }

  const handleChange = (field: string, value: string) => {
    let formattedValue = value
    if (field === 'cardNumber') {
      if (formData.cardNumber.includes('•') && !value.includes('•')) {
        const justDigits = value.replace(/[^0-9]/g, '')
        formattedValue = formatCardNumber(justDigits.length > 0 ? justDigits : value)
      } else {
        formattedValue = formatCardNumber(value)
      }
    }
    if (field === 'expiration') formattedValue = formatExpiration(value)
    if (field === 'cvc') {
      if (formData.cvc.includes('•') && !value.includes('•')) {
        const justDigits = value.replace(/[^0-9]/g, '')
        formattedValue = formatCVC(justDigits.length > 0 ? justDigits : value)
      } else {
        formattedValue = formatCVC(value)
      }
    }
    setFormData(prev => ({ ...prev, [field]: formattedValue }))
  }

  const handleEdit = () => {
    setValidationState('idle')
    setValidationMessage('')
    setIsCardVisible(false)
    setIsCVCVisible(false)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setFormData({
      name: 'John Doe',
      cardNumber: '•••• •••• •••• 4242',
      expiration: '12/25',
      cvc: '•••'
    })
    setValidationState('idle')
    setValidationMessage('')
    setIsCardVisible(false)
    setIsCVCVisible(false)
    setIsEditing(false)
  }

  const rejectValidation = (msg: string) => {
    setValidationState('rejected')
    setValidationMessage(msg)
    setTimeout(() => {
      setValidationState(prev => prev === 'rejected' ? 'idle' : prev)
    }, 3000)
  }

  const handleSave = () => {
    // Basic validation
    const { name, cardNumber, expiration, cvc } = formData
    
    const isCardUnchanged = cardNumber.includes('•')
    const isCVCUnchanged = cvc.includes('•')

    // Check name
    if (!name.trim()) {
      rejectValidation('Cardholder name is required.')
      return
    }

    if (!isCardUnchanged) {
      // Check card number (15 or 16 digits)
      const cardDigits = cardNumber.replace(/\s/g, '').replace(/[^0-9]/g, '')
      if (cardDigits.length < 15 || cardDigits.length > 16) {
        rejectValidation('Card number must be 15 or 16 digits.')
        return
      }
    }

    // Check expiration (MM/YY, valid month and year >= current)
    const expRegex = /^(0[1-9]|1[0-2])\/(\d{2})$/
    const expMatch = expiration.match(expRegex)
    if (!expMatch) {
      rejectValidation('Invalid expiration date format (MM/YY).')
      return
    }
    const year = parseInt(expMatch[2], 10)
    const currentYear = new Date().getFullYear() % 100
    if (year < currentYear) {
      rejectValidation('Card has expired.')
      return
    }

    if (!isCVCUnchanged) {
      // Check CVC (3 or 4 digits)
      if (!/^\d{3,4}$/.test(cvc)) {
        rejectValidation('CVC must be 3 or 4 digits.')
        return
      }
    }

    // Passed basic validation, simulate network request
    setValidationState('verifying')
    setValidationMessage('Process ongoing')
    
    setTimeout(() => {
      // For this prototype, we'll approve if it passed validation.
      setValidationState('approved')
      setValidationMessage('Payment method updated successfully.')
      
      const last4 = isCardUnchanged 
        ? cardNumber.replace(/\s/g, '').slice(-4) 
        : cardNumber.replace(/\s/g, '').replace(/[^0-9]/g, '').slice(-4)
      
      // Keep state as 'approved' briefly before resetting editing mode
      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          cardNumber: `•••• •••• •••• ${last4}`,
          cvc: '•••'
        }))
        setIsEditing(false)
        setValidationState('idle')
      }, 3000)
    }, 2000)
  }

  return (
    <div className="flex-1 overflow-y-auto w-full bg-surface">
      <div className="max-w-max-width mx-auto p-4 md:p-gutter pb-24">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/b2b/admin/billing')}
            className="p-2 -ml-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-h1 text-h1 text-on-surface">Update Payment Method</h1>
            <p className="font-body text-body text-text-secondary mt-1">
              Manage your billing details and credit card on file.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side: Current Plan Info */}
          <div className="space-y-6">
            <div className="bg-primary-container/30 border border-primary/20 rounded-xl p-6">
              <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-overline text-overline mb-3 tracking-wider">
                CURRENT PLAN
              </div>
              <h2 className="font-h2 text-h2 text-primary mb-2">Enterprise AI Plan</h2>
              <p className="font-body text-body text-text-secondary mb-6">
                Your current subscription includes usage-based billing with premium tier limits.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-body-lg text-body-lg font-medium text-on-surface">10,000 Policies / month</span>
                    <span className="block font-caption text-caption text-text-secondary">Standard limit for Enterprise</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-body-lg text-body-lg font-medium text-on-surface">5,000 Claims Processed</span>
                    <span className="block font-caption text-caption text-text-secondary">AI-assisted claim evaluation</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-body-lg text-body-lg font-medium text-on-surface">Priority Support</span>
                    <span className="block font-caption text-caption text-text-secondary">24/7 dedicated account manager</span>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="flex items-center gap-3 text-text-secondary font-caption text-caption bg-surface-container-low p-4 rounded-lg border border-outline-variant">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <p>Your payment information is encrypted and securely stored using bank-level AES-256 encryption.</p>
            </div>
          </div>

          {/* Right Side: Form Container */}
          <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-xs flex flex-col h-full">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="w-5 h-5 text-text-secondary" />
              <h3 className="font-h3 text-h3 text-on-surface">Card Details</h3>
              
              {validationState !== 'idle' && (
                <div className={`ml-auto flex items-center gap-2 text-caption font-body px-3 py-1.5 rounded-full transition-colors ${
                  validationState === 'verifying' ? 'bg-primary/10 text-primary animate-pulse' :
                  validationState === 'approved' ? 'bg-success/20 text-success' :
                  'bg-danger/20 text-danger'
                }`}>
                  {validationState === 'verifying' && (
                    <span className="flex gap-1 items-center">
                      <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </span>
                  )}
                  {validationState === 'approved' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  {validationState === 'rejected' && <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span className="font-medium">{validationMessage}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-6 flex-1">
              <div>
                <label className="block text-caption font-body text-text-secondary mb-1">Cardholder Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  disabled={!isEditing || validationState === 'verifying'}
                  className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body text-body text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted disabled:opacity-70 disabled:bg-surface-container-low" 
                  placeholder="Name on card" 
                />
              </div>
              <div className="relative">
                <label className="block text-caption font-body text-text-secondary mb-1">Card Number</label>
                <div className="relative">
                  <input 
                    type={getCardTypeAttr()} 
                    value={getCardValue()}
                    onChange={(e) => handleChange('cardNumber', e.target.value)}
                    disabled={!isEditing || validationState === 'verifying'}
                    maxLength={19}
                    className="w-full h-10 pl-3 pr-24 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body text-body text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted disabled:opacity-70 disabled:bg-surface-container-low font-mono-data tracking-wide" 
                    placeholder="0000 0000 0000 0000" 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {!isEditing && formData.cardNumber.includes('•') && (
                      <Eye 
                        className="w-4 h-4 text-text-muted cursor-pointer hover:text-text-secondary transition-colors" 
                        onMouseEnter={() => setIsHoveringEye(true)}
                        onMouseLeave={() => setIsHoveringEye(false)}
                      />
                    )}
                    {isEditing && (
                      <div onClick={() => setIsCardVisible(!isCardVisible)}>
                        {isCardVisible ? (
                           <EyeOff className="w-4 h-4 text-text-muted cursor-pointer hover:text-text-secondary transition-colors" />
                        ) : (
                           <Eye className="w-4 h-4 text-text-muted cursor-pointer hover:text-text-secondary transition-colors" />
                        )}
                      </div>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted border border-outline-variant px-1.5 py-0.5 rounded bg-surface">
                      {getCardType(getCardValue())}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-caption font-body text-text-secondary mb-1">Expiration</label>
                  <input 
                    type="text" 
                    value={formData.expiration}
                    onChange={(e) => handleChange('expiration', e.target.value)}
                    disabled={!isEditing || validationState === 'verifying'}
                    maxLength={5}
                    className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body text-body text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted disabled:opacity-70 disabled:bg-surface-container-low font-mono-data tracking-wide" 
                    placeholder="MM/YY" 
                  />
                </div>
                <div className="relative">
                  <label className="block text-caption font-body text-text-secondary mb-1">CVC</label>
                  <div className="relative">
                    <input 
                      type={getCVCTypeAttr()} 
                      value={getCVCValue()}
                      onChange={(e) => handleChange('cvc', e.target.value)}
                      disabled={!isEditing || validationState === 'verifying'}
                      maxLength={4}
                      className="w-full h-10 pl-3 pr-10 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body text-body text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted disabled:opacity-70 disabled:bg-surface-container-low font-mono-data tracking-wide" 
                      placeholder="123" 
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                      {!isEditing && formData.cvc.includes('•') && (
                        <Eye 
                          className="w-4 h-4 text-text-muted cursor-pointer hover:text-text-secondary transition-colors" 
                          onMouseEnter={() => setIsHoveringEyeCVC(true)}
                          onMouseLeave={() => setIsHoveringEyeCVC(false)}
                        />
                      )}
                      {isEditing && (
                        <div onClick={() => setIsCVCVisible(!isCVCVisible)}>
                          {isCVCVisible ? (
                             <EyeOff className="w-4 h-4 text-text-muted cursor-pointer hover:text-text-secondary transition-colors" />
                          ) : (
                             <Eye className="w-4 h-4 text-text-muted cursor-pointer hover:text-text-secondary transition-colors" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 flex gap-3 justify-end border-t border-outline-variant">
              {isEditing ? (
                <>
                  <Button 
                    onClick={handleCancel} 
                    variant="outline"
                    disabled={validationState === 'verifying'}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={validationState === 'verifying'}
                    isLoading={validationState === 'verifying'}
                  >
                    Update and Save
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => navigate('/b2b/admin/billing')} variant="outline">Back to Billing</Button>
                  <Button onClick={handleEdit}>Edit</Button>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
