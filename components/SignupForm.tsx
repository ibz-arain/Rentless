'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateUserPayload } from '@/lib/types';
import { User, Mail, Phone, Calendar, ChevronRight, ChevronLeft, Image as ImageIcon, MessageSquare, Upload } from 'lucide-react';

// Define step types
type Step = 'email' | 'verify' | 'names' | 'details' | 'profile' | 'complete';

export default function SignupForm() {
  const [currentStep, setCurrentStep] = useState<Step>('email');
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const router = useRouter();

  // Phone number formatting function
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length >= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    } else if (phoneNumber.length >= 3) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else if (phoneNumber.length > 0) {
      return `(${phoneNumber}`;
    }
    return phoneNumber;
  };

  // Extract only digits from formatted phone number
  const getPhoneDigits = (formattedPhone: string) => {
    return formattedPhone.replace(/\D/g, '');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone_number') {
      const formatted = formatPhoneNumber(value);
      setFormData({ ...formData, [name]: formatted });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateEmail = async () => {
    if (!formData.email) {
      setError('Please enter your email address.');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    
    // Check if email already exists
    setCheckingEmail(true);
    try {
      const response = await fetch('/api/users/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.exists) {
        setError('An account with this email already exists. Please sign in instead.');
        return false;
      }
    } catch (err) {
      console.error('Error checking email:', err);
      // Continue with signup if check fails
    } finally {
      setCheckingEmail(false);
    }
    
    return true;
  };

  const sendVerificationEmail = async () => {
    setSendingVerification(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to send verification email');
        return false;
      }
      
      return true;
    } catch (err) {
      setError('Failed to send verification email. Please try again.');
      return false;
    } finally {
      setSendingVerification(false);
    }
  };

  const verifyEmailCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return false;
    }
    
    setVerifyingCode(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          code: verificationCode 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Invalid verification code');
        return false;
      }
      
      setMessage('Email verified successfully!');
      return true;
    } catch (err) {
      setError('Failed to verify code. Please try again.');
      return false;
    } finally {
      setVerifyingCode(false);
    }
  };

  const validateNames = () => {
    if (!formData.first_name || !formData.last_name) {
      setError('Please enter both first and last name.');
      return false;
    }
    
    return true;
  };

  const validateDetails = () => {
    if (!formData.date_of_birth || !formData.phone_number) {
      setError('Please enter both date of birth and phone number.');
      return false;
    }
    
    // Validate phone number has exactly 10 digits
    const phoneDigits = getPhoneDigits(formData.phone_number);
    if (phoneDigits.length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      return false;
    }
    
    return true;
  };

  const handleNext = async () => {
    setError(null);
    
    if (currentStep === 'email') {
      const isValid = await validateEmail();
      if (!isValid) return;
      
      const emailSent = await sendVerificationEmail();
      if (!emailSent) return;
      
      setCurrentStep('verify');
    } else if (currentStep === 'verify') {
      const isValid = await verifyEmailCode();
      if (!isValid) return;
      setCurrentStep('names');
    } else if (currentStep === 'names') {
      if (!validateNames()) return;
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      if (!validateDetails()) return;
      setCurrentStep('profile');
    } else if (currentStep === 'profile') {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    setError(null);
    
    if (currentStep === 'verify') {
      setCurrentStep('email');
    } else if (currentStep === 'names') {
      setCurrentStep('verify');
    } else if (currentStep === 'details') {
      setCurrentStep('names');
    } else if (currentStep === 'profile') {
      setCurrentStep('details');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB.');
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          
          // Upload to Cloudinary
          const response = await fetch('/api/cloudinary/signature', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 }),
          });

          if (!response.ok) {
            throw new Error('Failed to upload image');
          }

          const data = await response.json();
          setFormData({ ...formData, profile_picture: data.url });
        } catch (err) {
          setError('Failed to upload image. Please try again.');
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      // Generate a temporary password for now (in real app, you'd send verification email)
      const tempPassword = Math.random().toString(36).slice(-8);
      
      // Extract only digits from phone number for storage
      const phoneDigits = getPhoneDigits(formData.phone_number || '');
      
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phone_number: phoneDigits, // Save only 10 digits
          password: tempPassword, // Temporary password
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setMessage('Account created successfully!');
        setCurrentStep('complete');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
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
      case 'email': return 20;
      case 'verify': return 40;
      case 'names': return 60;
      case 'details': return 80;
      case 'profile': return 100;
      case 'complete': return 100;
      default: return 0;
    }
  };

  // Render email step
  const renderEmailStep = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Let's get started</h3>
        <p className="text-sm text-muted-foreground">Enter your email address to begin</p>
        
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
      </div>
    );
  };

  // Render verification step
  const renderVerificationStep = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Verify your email</h3>
        <p className="text-sm text-muted-foreground">
          We've sent a 6-digit verification code to <strong>{formData.email}</strong>
        </p>
        
        <div className="space-y-1">
          <label htmlFor="verification_code" className="block text-sm font-medium text-foreground">
            Verification Code <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              id="verification_code"
              name="verification_code"
              type="text"
              maxLength={6}
              required
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className="block w-full pl-10 px-4 py-2.5 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-center text-lg tracking-widest"
              disabled={isLoading || verifyingCode}
              placeholder="123456"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Enter the 6-digit code from your email. Code expires in 5 minutes.
          </p>
        </div>
        
        <div className="text-center">
          <button
            type="button"
            onClick={async () => {
              setError(null);
              await sendVerificationEmail();
            }}
            disabled={sendingVerification}
            className="text-sm text-primary hover:text-primary/80 underline disabled:opacity-50"
          >
            {sendingVerification ? 'Sending...' : "Didn't receive the code? Resend"}
          </button>
        </div>
      </div>
    );
  };

  // Render names step
  const renderNamesStep = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Personal Information</h3>
        <p className="text-sm text-muted-foreground">Tell us your name</p>
        
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
      </div>
    );
  };

  // Render details step
  const renderDetailsStep = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Contact Details</h3>
        <p className="text-sm text-muted-foreground">We need your date of birth and phone number</p>
        
        <div className="space-y-1">
          <label htmlFor="date_of_birth" className="block text-sm font-medium text-foreground">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              required
              value={formData.date_of_birth}
              onChange={handleChange}
              className="block w-full pl-10 px-4 py-2.5 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              disabled={isLoading}
            />
          </div>
        </div>
        
        <div className="space-y-1">
          <label htmlFor="phone_number" className="block text-sm font-medium text-foreground">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              id="phone_number"
              name="phone_number"
              type="tel"
              required
              value={formData.phone_number}
              onChange={handleChange}
              className="block w-full pl-10 px-4 py-2.5 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              disabled={isLoading}
              placeholder="(123) 456-7890"
              maxLength={14} // (XXX) XXX-XXXX format
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Enter your 10-digit phone number</p>
        </div>
      </div>
    );
  };

  // Render profile step
  const renderProfileStep = () => {
    const getInitials = () => {
      const first = formData.first_name.charAt(0).toUpperCase();
      const last = formData.last_name.charAt(0).toUpperCase();
      return `${first}${last}`;
    };

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-foreground">Profile Setup</h3>
        <p className="text-sm text-muted-foreground">Add a profile picture and tell us about yourself (optional)</p>
        
        {/* Profile Picture Section */}
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="text-sm font-medium text-foreground mb-2">
              {formData.first_name} {formData.last_name}
            </h4>
            
            {/* Profile Picture Upload Area */}
            <div className="relative inline-block">
              <div className="relative">
                {/* Profile Picture Display */}
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
                  {formData.profile_picture ? (
                    <img 
                      src={formData.profile_picture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {getInitials()}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Upload Button */}
                <label 
                  htmlFor="profile_picture"
                  className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary hover:bg-primary/90 cursor-pointer flex items-center justify-center transition-colors ${
                    uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadingImage ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                </label>
                
                {/* Hidden File Input */}
                <input
                  id="profile_picture"
                  name="profile_picture"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isLoading || uploadingImage}
                />
              </div>
            </div>
            
            {/* Upload Status */}
            {uploadingImage && (
              <p className="text-sm text-blue-600 mt-2">Uploading image...</p>
            )}
            
            {/* Change/Remove Options */}
            {formData.profile_picture && (
              <div className="mt-3 space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const fileInput = document.getElementById('profile_picture') as HTMLInputElement;
                    fileInput?.click();
                  }}
                  className="text-xs text-primary hover:text-primary/80 underline"
                  disabled={isLoading || uploadingImage}
                >
                  Change photo
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, profile_picture: '' })}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                  disabled={isLoading || uploadingImage}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Bio Section */}
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

  // Render complete step
  const renderCompleteStep = () => {
    return (
      <div className="text-center space-y-4 py-6">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      case 'email':
        return renderEmailStep();
      case 'verify':
        return renderVerificationStep();
      case 'names':
        return renderNamesStep();
      case 'details':
        return renderDetailsStep();
      case 'profile':
        return renderProfileStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'email': return 'Email';
      case 'verify': return 'Verify';
      case 'names': return 'Name';
      case 'details': return 'Details';
      case 'profile': return 'Profile';
      case 'complete': return 'Complete';
      default: return '';
    }
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'email': return 1;
      case 'verify': return 2;
      case 'names': return 3;
      case 'details': return 4;
      case 'profile': return 5;
      case 'complete': return 5;
      default: return 0;
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
            Step {getStepNumber()} of 5
          </div>
          <div className="text-xs font-medium text-foreground">
            {getStepTitle()}
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
          {error}
          {error.includes('already exists') && (
            <div className="mt-2">
              <a 
                href="/login" 
                className="text-primary hover:text-primary/80 underline font-medium"
              >
                Go to Sign In →
              </a>
            </div>
          )}
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
          {currentStep !== 'email' ? (
            <button
              type="button"
              onClick={handlePrevious}
              disabled={isLoading || uploadingImage || verifyingCode}
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
            disabled={isLoading || uploadingImage || checkingEmail || sendingVerification || verifyingCode}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors flex items-center"
          >
            {currentStep === 'profile' ? (
              isLoading ? 'Creating Account...' : 'Create Account'
            ) : currentStep === 'email' && checkingEmail ? (
              'Checking email...'
            ) : currentStep === 'email' && sendingVerification ? (
              'Sending verification...'
            ) : currentStep === 'verify' && verifyingCode ? (
              'Verifying...'
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