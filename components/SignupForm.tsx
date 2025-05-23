'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateUserPayload } from '@/lib/types';
import { User, Mail, Phone, Calendar, Lock, ChevronRight, ChevronLeft, Image as ImageIcon, MessageSquare } from 'lucide-react';

// Define step types
type Step = 'account' | 'profile' | 'verify' | 'complete';

export default function SignupForm() {
  const [currentStep, setCurrentStep] = useState<Step>('account');
  const [formData, setFormData] = useState<CreateUserPayload>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone_number: '',
    date_of_birth: '',
    profile_picture: '',
    bio: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateAccountInfo = () => {
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      setError('Please fill in all required fields.');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    setError(null);
    
    if (currentStep === 'account') {
      if (!validateAccountInfo()) return;
      setCurrentStep('profile');
    } else if (currentStep === 'profile') {
      setCurrentStep('verify');
    } else if (currentStep === 'verify') {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    setError(null);
    
    if (currentStep === 'profile') {
      setCurrentStep('account');
    } else if (currentStep === 'verify') {
      setCurrentStep('profile');
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setCurrentStep('account'); // Go back to first step on error
      } else {
        setMessage('Account created successfully!');
        setCurrentStep('complete');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setCurrentStep('account'); // Go back to first step on error
    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    router.push('/login');
  };

  // Progress bar calculation
  const getProgressPercentage = () => {
    switch (currentStep) {
      case 'account': return 33;
      case 'profile': return 66;
      case 'verify': return 100;
      case 'complete': return 100;
      default: return 0;
    }
  };

  // Render account step
  const renderAccountStep = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Account Information</h3>
        <p className="text-sm text-muted-foreground">Please provide your basic account information</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="first_name" className="block text-sm font-medium text-foreground">
              First Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                value={formData.first_name}
                onChange={handleChange}
                className="block w-full pl-10 px-4 py-2.5 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                disabled={isLoading}
                placeholder="John"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label htmlFor="last_name" className="block text-sm font-medium text-foreground">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              required
              value={formData.last_name}
              onChange={handleChange}
              className="block w-full px-4 py-2.5 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              disabled={isLoading}
              placeholder="Doe"
            />
          </div>
        </div>
        
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="block w-full pl-10 px-4 py-2.5 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              disabled={isLoading}
              placeholder="you@example.com"
            />
          </div>
        </div>
        
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="block w-full pl-10 px-4 py-2.5 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              disabled={isLoading}
              placeholder="••••••••"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Minimum 6 characters</p>
        </div>
        
        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="block w-full px-4 py-2.5 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            disabled={isLoading}
            placeholder="••••••••"
          />
        </div>
      </div>
    );
  };

  // Render profile step
  const renderProfileStep = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Profile Details</h3>
        <p className="text-sm text-muted-foreground">Tell us more about yourself (optional)</p>
        
        <div className="space-y-1">
          <label htmlFor="phone_number" className="block text-sm font-medium text-foreground">
            Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              id="phone_number"
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleChange}
              className="block w-full pl-10 px-4 py-2.5 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              disabled={isLoading}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
        
        <div className="space-y-1">
          <label htmlFor="date_of_birth" className="block text-sm font-medium text-foreground">
            Date of Birth
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="block w-full pl-10 px-4 py-2.5 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              disabled={isLoading}
            />
          </div>
        </div>
        
        <div className="space-y-1">
          <label htmlFor="profile_picture" className="block text-sm font-medium text-foreground">
            Profile Picture URL
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              id="profile_picture"
              name="profile_picture"
              type="text"
              value={formData.profile_picture || ''}
              onChange={handleChange}
              className="block w-full pl-10 px-4 py-2.5 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              disabled={isLoading}
              placeholder="https://example.com/your-image.jpg"
            />
          </div>
        </div>
        
        <div className="space-y-1">
          <label htmlFor="bio" className="block text-sm font-medium text-foreground">
            Bio
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 flex items-start pointer-events-none">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              value={formData.bio || ''}
              onChange={handleChange}
              className="block w-full pl-10 px-4 py-2.5 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
              disabled={isLoading}
              placeholder="Tell us a bit about yourself..."
            />
          </div>
        </div>
      </div>
    );
  };

  // Render verify step
  const renderVerifyStep = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Review Information</h3>
        <p className="text-sm text-muted-foreground">Please review your information before creating your account</p>
        
        <div className="bg-background/50 border border-border rounded-lg p-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">Account</p>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="text-sm">
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium">{formData.first_name} {formData.last_name}</p>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{formData.email}</p>
              </div>
            </div>
          </div>
          
          {(formData.phone_number || formData.date_of_birth) && (
            <div>
              <p className="text-sm font-medium text-foreground">Contact</p>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {formData.phone_number && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Phone:</span>
                    <p className="font-medium">{formData.phone_number}</p>
                  </div>
                )}
                {formData.date_of_birth && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Birthday:</span>
                    <p className="font-medium">{formData.date_of_birth}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {formData.bio && (
            <div>
              <p className="text-sm font-medium text-foreground">Bio</p>
              <p className="text-sm mt-1">{formData.bio}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render complete step
  const renderCompleteStep = () => {
    return (
      <div className="text-center space-y-4 py-6">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-foreground">Registration Complete!</h3>
        <p className="text-muted-foreground">
          Your account has been successfully created. You can now log in and start exploring Rentless.
        </p>
      </div>
    );
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'account':
        return renderAccountStep();
      case 'profile':
        return renderProfileStep();
      case 'verify':
        return renderVerifyStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      {currentStep !== 'complete' && (
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      )}
      
      {/* Step indicators */}
      {currentStep !== 'complete' && (
        <div className="flex justify-between">
          <div className="text-xs text-muted-foreground">
            Step {currentStep === 'account' ? '1' : currentStep === 'profile' ? '2' : '3'} of 3
          </div>
          <div className="text-xs font-medium text-foreground">
            {currentStep === 'account' ? 'Account' : currentStep === 'profile' ? 'Profile' : 'Review'}
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Success message */}
      {message && currentStep !== 'complete' && (
        <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg">
          {message}
        </div>
      )}
      
      {/* Form content */}
      <div>
        {renderStepContent()}
      </div>
      
      {/* Navigation buttons */}
      {currentStep !== 'complete' ? (
        <div className="flex justify-between pt-2">
          {currentStep !== 'account' ? (
            <button
              type="button"
              onClick={handlePrevious}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </button>
          ) : (
            <div></div> // Empty div to maintain flex layout
          )}
          
          <button
            type="button"
            onClick={handleNext}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors flex items-center"
          >
            {currentStep === 'verify' ? (
              isLoading ? 'Creating Account...' : 'Create Account'
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={goToLogin}
          className="w-full px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
        >
          Go to Login
        </button>
      )}
    </div>
  );
} 