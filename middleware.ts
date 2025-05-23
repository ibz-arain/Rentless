import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the pathname is a protected route that requires authentication
  const isProtectedRoute = [
    '/profile',
    '/settings', 
    '/notifications',
    // Add any other protected routes here
  ].some(route => pathname.startsWith(route))
  
  try {
    // Get the token from the request (uses the NEXTAUTH_SECRET)
    const token = await getToken({ 
      req: request, 
      // Use a fallback secret in case the env variable isn't set
      secret: process.env.NEXTAUTH_SECRET || "fallback-secret-do-not-use-in-production" 
    })
    
    // Redirect to login if trying to access a protected route without being authenticated
    if (isProtectedRoute && !token) {
      const url = new URL('/login', request.url)
      // Add the original URL as a parameter to redirect after login
      url.searchParams.set('callbackUrl', encodeURI(request.url))
      return NextResponse.redirect(url)
    }
    
    // Redirect to home page if trying to access login/signup while authenticated
    if ((pathname === '/login' || pathname === '/signup') && token) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  } catch (error) {
    console.error('Middleware error:', error)
    // If there's an error verifying the token, let the request proceed
    // This prevents authentication errors from blocking the entire site
  }
  
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|rentless.png|.*\\.png|.*\\.svg|.*\\.jpg).*)',
  ],
} 