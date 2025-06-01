'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, User, Bell, ChevronDown, LogOut, Settings, UserCircle, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function Header() {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'
  
  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Properties', href: '/properties' },
    { name: 'Search', href: '/search' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ]

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut({ 
        redirect: false
      })
      // If we're on a protected route, manually redirect to home
      if (['/account', '/settings', '/notifications'].some(route => pathname.startsWith(route))) {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <header className="bg-background shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center">
            <span suppressHydrationWarning>
              <Image src="/rentless.png" alt="Rentless" width={110} height={40} />
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium relative group ${
                  pathname === item.href
                    ? 'text-primary'
                    : 'text-gray-500 hover:text-primary'
                }`}
              >
                {item.name}
                <span 
                  className={`absolute bottom-0 left-0 w-full h-0.5 transform origin-left transition-transform duration-300 ease-out
                    ${pathname === item.href 
                      ? 'bg-primary scale-x-100' 
                      : 'bg-primary scale-x-0 group-hover:scale-x-100'
                    }`}
                />
              </Link>
            ))}
          </nav>
          
          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link 
                  href="/notifications"
                  className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  <Bell className="h-5 w-5" />
                </Link>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <button 
                      className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none cursor-pointer"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {session.user?.profile_picture ? (
                          <Image
                            src={session.user.profile_picture}
                            alt="Profile"
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <User className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <span>{session.user?.first_name} {session.user?.last_name}</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 mt-2 p-2">
                    <div className="flex flex-col space-y-1">
                      <div className="px-3 py-2 border-b border-border mb-1">
                        <p className="text-sm font-medium text-foreground">{session.user?.email}</p>
                      </div>
                      <Link
                        href="/account"
                        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer"
                      >
                        <UserCircle className="mr-2 h-4 w-4" />
                        Account
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="flex items-center px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 w-full text-left disabled:opacity-50 cursor-pointer"
                      >
                        {isSigningOut ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing out...
                          </>
                        ) : (
                          <>
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                          </>
                        )}
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </>
            ) : (
              <Link
                href="/login"
                className="ml-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 cursor-pointer"
              >
                Sign In
              </Link>
            )}
          </div>
          
          {/* Mobile menu and user menu */}
          <div className="md:hidden flex items-center space-x-2">
            {isAuthenticated && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none cursor-pointer">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {session.user?.profile_picture ? (
                        <Image
                          src={session.user.profile_picture}
                          alt="Profile"
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <User className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2">
                  <div className="flex flex-col space-y-1">
                    <div className="px-1 py-2 border-b border-border mb-1">
                      <p className="text-sm font-medium text-gray-800">{session.user?.first_name} {session.user?.last_name}</p>
                      <p className="text-sm font-medium text-gray-500">{session.user?.email}</p>
                    </div>
                    <Link
                      href="/account"
                      className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer"
                    >
                      <UserCircle className="mr-2 h-4 w-4" />
                      Account
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="flex items-center px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 w-full text-left disabled:opacity-50 cursor-pointer"
                    >
                      {isSigningOut ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing out...
                        </>
                      ) : (
                        <>
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign out
                        </>
                      )}
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none cursor-pointer"
                >
                  <Menu className="block h-6 w-6" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-screen max-w-xs p-0 border-t bg-background" side="bottom" align="end">
                <div className="pt-2 pb-4 px-2  space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`block py-2 px-3 rounded-md text-base font-medium ${
                        pathname === item.href
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      } cursor-pointer`}
                    >
                      {item.name}
                    </Link>
                  ))}
                  
                  {!isAuthenticated && (
                    <div className="pt-4 pb-3 border-t border-gray-200">
                      <Link 
                        href="/login"
                        className="block px-3 py-2 rounded-md text-base font-medium text-white bg-primary hover:bg-primary/90 cursor-pointer text-center"
                      >
                        Sign In
                      </Link>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </header>
  )
} 