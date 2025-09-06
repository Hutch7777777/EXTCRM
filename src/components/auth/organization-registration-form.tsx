'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Define the US states
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
]

type Step = 'account' | 'organization' | 'location'

interface FormData {
  // Account details
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  
  // Organization details
  organizationName: string
  phone: string
  
  // Location details
  addressLine1: string
  city: string
  state: string
  zipCode: string
}

export function OrganizationRegistrationForm() {
  const [currentStep, setCurrentStep] = useState<Step>('account')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    zipCode: ''
  })

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 'account':
        if (!formData.firstName.trim()) {
          setError('First name is required')
          return false
        }
        if (!formData.lastName.trim()) {
          setError('Last name is required')
          return false
        }
        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setError('Please enter a valid email address')
          return false
        }
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters long')
          return false
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match')
          return false
        }
        return true
        
      case 'organization':
        if (!formData.organizationName.trim()) {
          setError('Organization name is required')
          return false
        }
        return true
        
      case 'location':
        if (!formData.addressLine1.trim()) {
          setError('Address is required')
          return false
        }
        if (!formData.city.trim()) {
          setError('City is required')
          return false
        }
        if (!formData.state) {
          setError('State is required')
          return false
        }
        if (!formData.zipCode.trim() || !/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
          setError('Please enter a valid ZIP code')
          return false
        }
        return true
        
      default:
        return false
    }
  }

  const handleNext = () => {
    setError(null)
    if (!validateStep(currentStep)) return

    switch (currentStep) {
      case 'account':
        setCurrentStep('organization')
        break
      case 'organization':
        setCurrentStep('location')
        break
      case 'location':
        handleSubmit()
        break
    }
  }

  const handleBack = () => {
    setError(null)
    switch (currentStep) {
      case 'organization':
        setCurrentStep('account')
        break
      case 'location':
        setCurrentStep('organization')
        break
    }
  }

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)

    try {
      // Step 1: Create organization registration
      const registrationResponse = await fetch('/api/auth/register-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationName: formData.organizationName,
          ownerFirstName: formData.firstName,
          ownerLastName: formData.lastName,
          ownerEmail: formData.email,
          password: formData.password,
          phone: formData.phone || null,
          addressLine1: formData.addressLine1,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        }),
      })

      const registrationData = await registrationResponse.json()

      if (!registrationResponse.ok) {
        throw new Error(registrationData.error || 'Failed to register organization')
      }

      // Redirect to email verification page
      router.push('/auth/verify-email?type=registration')
      
    } catch (err) {
      console.error('Registration error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getStepProgress = () => {
    switch (currentStep) {
      case 'account': return 33
      case 'organization': return 66
      case 'location': return 100
      default: return 0
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span className={currentStep === 'account' ? 'text-blue-600 font-medium' : ''}>
            Account
          </span>
          <span className={currentStep === 'organization' ? 'text-blue-600 font-medium' : ''}>
            Organization
          </span>
          <span className={currentStep === 'location' ? 'text-blue-600 font-medium' : ''}>
            Location
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getStepProgress()}%` }}
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Account Step */}
      {currentStep === 'account' && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Create Your Account</h3>
            <p className="text-sm text-gray-600">Start by setting up your personal account details</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                First Name *
              </label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address *
            </label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password *
            </label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirm Password *
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
      )}

      {/* Organization Step */}
      {currentStep === 'organization' && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Organization Details</h3>
            <p className="text-sm text-gray-600">Tell us about your contracting business</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="organizationName" className="text-sm font-medium text-gray-700">
              Company Name *
            </label>
            <Input
              id="organizationName"
              type="text"
              placeholder="Acme Construction"
              value={formData.organizationName}
              onChange={(e) => handleChange('organizationName', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
      )}

      {/* Location Step */}
      {currentStep === 'location' && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Business Location</h3>
            <p className="text-sm text-gray-600">Where is your business located?</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="addressLine1" className="text-sm font-medium text-gray-700">
              Street Address *
            </label>
            <Input
              id="addressLine1"
              type="text"
              placeholder="123 Main Street"
              value={formData.addressLine1}
              onChange={(e) => handleChange('addressLine1', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="city" className="text-sm font-medium text-gray-700">
                City *
              </label>
              <Input
                id="city"
                type="text"
                placeholder="Springfield"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="state" className="text-sm font-medium text-gray-700">
                State *
              </label>
              <Select value={formData.state} onValueChange={(value) => handleChange('state', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="zipCode" className="text-sm font-medium text-gray-700">
              ZIP Code *
            </label>
            <Input
              id="zipCode"
              type="text"
              placeholder="12345"
              value={formData.zipCode}
              onChange={(e) => handleChange('zipCode', e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 'account' || loading}
          className={currentStep === 'account' ? 'invisible' : ''}
        >
          Back
        </Button>

        <Button
          onClick={handleNext}
          disabled={loading}
          className="min-w-24"
        >
          {loading ? (
            'Creating...'
          ) : currentStep === 'location' ? (
            'Create Organization'
          ) : (
            'Next'
          )}
        </Button>
      </div>
    </div>
  )
}