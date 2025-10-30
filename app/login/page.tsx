import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import LoginForm from '@/components/LoginForm';
import Image from 'next/image';
import Link from 'next/link';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/'); // Redirect to homepage if already logged in
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left side - Image/Branding */}
      <div className="hidden md:flex md:w-1/2 bg-primary/5 flex-col items-center justify-center p-12">
        <div className="max-w-md mx-auto text-center">
          <Link href="/">
            <Image 
              src="/rentless.png" 
              alt="Rentless" 
              width={240} 
              height={80} 
              className="mx-auto mb-8 cursor-pointer"
            />
          </Link>
          <h2 className="text-3xl font-bold text-foreground mb-4">Find Your Perfect Home</h2>
          <p className="text-muted-foreground mb-8">
            Join Rentless and discover the perfect property matching your needs. Start your journey today!
          </p>
        </div>
      </div>
      
      {/* Right side - Login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="md:hidden mb-6 " >
              <Link href="/">
                <Image 
                  src="/rentless.png" 
                  alt="Rentless" 
                  width={160} 
                  height={60} 
                  className="mx-auto cursor-pointer"
                />
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground mt-2">Sign in to your account to continue</p>
          </div>
          
          <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
            <LoginForm />
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/signup" className="text-primary font-medium hover:underline">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center text-xs text-muted-foreground">
            <p>By signing in, you agree to our</p>
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