'use client';

import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type Step = 'email' | 'verify' | 'reset';

interface ForgotPasswordDialogProps {
  trigger: React.ReactNode;
}

export default function ForgotPasswordDialog({ trigger }: ForgotPasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  const resetDialog = () => {
    setStep('email');
    setEmail('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setMessage(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetDialog();
    }
  };

  const validatePassword = () => {
    if (!newPassword || !confirmPassword) {
      setError('Please enter both password and confirm password.');
      return false;
    }
    
    // Check password length
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return false;
    }
    
    // Check for at least one number
    if (!/\d/.test(newPassword)) {
      setError('Password must contain at least one number.');
      return false;
    }
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter.');
      return false;
    }
    
    // Check for at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>_+=~`\[\]]/.test(newPassword)) {
      setError('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
      return false;
    }
    
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(newPassword)) {
      setError('Password must contain at least one lowercase letter.');
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    
    return true;
  };

  const sendVerificationCode = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSendingCode(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/send-forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to send verification code');
        return;
      }
      
      setStep('verify');
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setSendingCode(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }
    
    setVerifyingCode(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/verify-forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          code: verificationCode 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Invalid verification code');
        return;
      }
      
      setMessage('Email verified successfully!');
      setStep('reset');
    } catch (err) {
      setError('Failed to verify code. Please try again.');
    } finally {
      setVerifyingCode(false);
    }
  };

  const resetPassword = async () => {
    if (!validatePassword()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          newPassword 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
        return;
      }
      
      setMessage('Password reset successfully!');
      setTimeout(() => {
        setOpen(false);
      }, 2000);
    } catch (err) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailStep = () => (
    <div className="space-y-4">
      <DialogDescription>
        Enter your email address and we'll send you a verification code to reset your password.
      </DialogDescription>
      
      <div className="space-y-1">
        <label htmlFor="forgot-email" className="block text-sm font-medium text-foreground">
          Email Address <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full pl-10 px-4 py-2.5 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            disabled={isLoading}
            placeholder="you@example.com"
          />
        </div>
      </div>
    </div>
  );

  const renderVerifyStep = () => (
    <div className="space-y-4">
      <DialogDescription>
        Enter the 6-digit verification code sent to <strong>{email}</strong>
      </DialogDescription>
      
      <div className="space-y-1">
        <label htmlFor="forgot-code" className="block text-sm font-medium text-foreground">
          Verification Code <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            id="forgot-code"
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
      </div>
    </div>
  );

  const renderResetStep = () => (
    <div className="space-y-4">
      <DialogDescription>
        Create a new password for your account
      </DialogDescription>
      
      <div className="space-y-1">
        <label htmlFor="new-password" className="block text-sm font-medium text-foreground">
          New Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="block w-full pl-10 px-4 py-2.5 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            disabled={isLoading}
            placeholder="••••••••"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Must be at least 8 characters with uppercase, lowercase, number, and special character
        </p>
      </div>
      
      <div className="space-y-1">
        <label htmlFor="confirm-new-password" className="block text-sm font-medium text-foreground">
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            id="confirm-new-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="block w-full pl-10 px-4 py-2.5 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            disabled={isLoading}
            placeholder="••••••••"
          />
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
            {error}
          </div>
        )}
        
        {message && (
          <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg">
            {message}
          </div>
        )}
        
        {step === 'email' && renderEmailStep()}
        {step === 'verify' && renderVerifyStep()}
        {step === 'reset' && renderResetStep()}
        
        <div className="flex justify-end gap-3 pt-2">
          {step !== 'email' && (
            <button
              type="button"
              onClick={() => {
                if (step === 'verify') {
                  setStep('email');
                  setVerificationCode('');
                } else if (step === 'reset') {
                  setStep('verify');
                  setNewPassword('');
                  setConfirmPassword('');
                }
                setError(null);
                setMessage(null);
              }}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              Back
            </button>
          )}
          
          <button
            type="button"
            onClick={() => {
              if (step === 'email') {
                sendVerificationCode();
              } else if (step === 'verify') {
                verifyCode();
              } else if (step === 'reset') {
                resetPassword();
              }
            }}
            disabled={isLoading || sendingCode || verifyingCode}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
          >
            {step === 'email' && (sendingCode ? 'Sending...' : 'Send Code')}
            {step === 'verify' && (verifyingCode ? 'Verifying...' : 'Verify')}
            {step === 'reset' && (isLoading ? 'Resetting...' : 'Reset Password')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

