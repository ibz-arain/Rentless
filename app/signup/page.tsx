import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import SignupForm from '@/components/SignupForm';
import Image from 'next/image';
import Link from 'next/link';

export default async function SignupPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/'); // Redirect to homepage if already logged in
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left side - Image/Branding */}
      <div className="hidden md:flex md:w-1/2 bg-primary/5 flex-col items-center justify-center p-12">
        <div className="max-w-md mx-auto text-center">
          <Image 
            src="/rentless.png" 
            alt="Rentless" 
            width={240} 
            height={80} 
            className="mx-auto mb-8"
          />
          <h2 className="text-3xl font-bold text-foreground mb-4">Start Your Journey With Us</h2>
          <p className="text-muted-foreground mb-8">
            Create an account today and unlock the full potential of Rentless. Find your dream property with ease.
          </p>
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg shadow-sm flex items-start">
              <div className="bg-primary/10 p-2 rounded-full mr-3">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">Create your profile</p>
                <p className="text-sm text-muted-foreground">Share your preferences to find the perfect match</p>
              </div>
            </div>
            
            <div className="p-4 bg-white rounded-lg shadow-sm flex items-start">
              <div className="bg-primary/10 p-2 rounded-full mr-3">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">Browse properties</p>
                <p className="text-sm text-muted-foreground">Access exclusive listings and detailed information</p>
              </div>
            </div>
            
            <div className="p-4 bg-white rounded-lg shadow-sm flex items-start">
              <div className="bg-primary/10 p-2 rounded-full mr-3">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">Schedule viewings</p>
                <p className="text-sm text-muted-foreground">Book property tours with a few clicks</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Signup form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="md:hidden mb-6">
              <Image 
                src="/rentless.png" 
                alt="Rentless" 
                width={160} 
                height={60} 
                className="mx-auto"
              />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
            <p className="text-muted-foreground mt-2">Join Rentless in just a few steps</p>
          </div>
          
          <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
            <SignupForm />
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center text-xs text-muted-foreground">
            <p>By creating an account, you agree to our</p>
            <p className="mt-1">
              <Link href="/terms" className="hover:underline">Terms of Service</Link>
              {' '}&amp;{' '}
              <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 