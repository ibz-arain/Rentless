'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, User, Bell, ChevronDown, LogOut, Settings, UserCircle, Loader2, MessageCircle, Home, Building, Info } from 'lucide-react'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

export function Header() {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'
  
  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Properties', href: '/properties', icon: Building },
    { name: 'About', href: '/about', icon: Info },
  ]

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut({ 
        redirect: false
      })
      // Force page refresh to refetch all data as non-authenticated user
      // If on protected route, redirect to home; otherwise reload current page
      const protectedRoutes = ['/account', '/settings', '/notifications', '/chat']
      if (protectedRoutes.some(route => pathname.startsWith(route))) {
        window.location.href = '/'
      } else {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error signing out:', error)
      setIsSigningOut(false)
    }
  }

  return (
    <header className="bg-background shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-background/95">
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
                  className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 transition-colors cursor-pointer"
                >
                  <Bell className="h-5 w-5" />
                </Link>
                
                <Link
                  href="/chat"
                  className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 transition-colors cursor-pointer"
                >
                  <MessageCircle className="h-5 w-5" />
                </Link>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <button 
                      className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none cursor-pointer group p-1 rounded-full hover:bg-gray-100/80 transition-colors"
                    >
                      <Avatar className="h-8 w-8 border border-border/40 group-hover:border-primary/20 transition-colors">
                        <AvatarImage 
                          src={session.user?.profile_picture || ''} 
                          alt={`${session.user?.first_name || ''} ${session.user?.last_name || ''}`} 
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {session.user?.first_name?.[0] || session.user?.email?.[0] || <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <span className="max-w-[100px] truncate">{session.user?.first_name || session.user?.email?.split('@')[0]}</span>
                      <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-primary transition-colors" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0 mt-2 overflow-hidden rounded-xl shadow-lg border-border">
                    <div className="bg-muted/30 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-background">
                          <AvatarImage 
                            src={session.user?.profile_picture || ''} 
                            alt={`${session.user?.first_name || ''} ${session.user?.last_name || ''}`} 
                          />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {session.user?.first_name?.[0] || session.user?.email?.[0] || <User className="h-5 w-5" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-foreground">
                            {session.user?.first_name} {session.user?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {session.user?.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <Link
                        href="/chat"
                        className="flex items-center px-3 py-2 text-sm text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer"
                      >
                        <MessageCircle className="mr-2 h-4 w-4 text-primary" />
                        Messages
                      </Link>
                      <Link
                        href="/account"
                        className="flex items-center px-3 py-2 text-sm text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer"
                      >
                        <UserCircle className="mr-2 h-4 w-4 text-primary" />
                        Account
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center px-3 py-2 text-sm text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer"
                      >
                        <Settings className="mr-2 h-4 w-4 text-primary" />
                        Settings
                      </Link>
                    </div>
                    
                    <Separator />
                    
                    <div className="p-2">
                      <button
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="flex w-full items-center px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
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
                className="ml-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Sign In
              </Link>
            )}
          </div>
          
          {/* Mobile menu and user menu */}
          <div className="md:hidden flex items-center space-x-2">
            {isAuthenticated && (
              <>
                <Link 
                  href="/notifications"
                  className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 transition-colors"
                >
                  <Bell className="h-5 w-5" />
                </Link>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="p-1 rounded-full hover:bg-gray-100/80 transition-colors focus:outline-none cursor-pointer">
                      <Avatar className="h-8 w-8 border border-border/40">
                        <AvatarImage 
                          src={session.user?.profile_picture || ''} 
                          alt={`${session.user?.first_name || ''} ${session.user?.last_name || ''}`} 
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {session.user?.first_name?.[0] || session.user?.email?.[0] || <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0 mt-2 overflow-hidden rounded-xl shadow-lg border-border" side="bottom" align="end">
                    <div className="bg-muted/30 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-background">
                          <AvatarImage 
                            src={session.user?.profile_picture || ''} 
                            alt={`${session.user?.first_name || ''} ${session.user?.last_name || ''}`} 
                          />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {session.user?.first_name?.[0] || session.user?.email?.[0] || <User className="h-5 w-5" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-foreground">
                            {session.user?.first_name} {session.user?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {session.user?.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <Link
                        href="/chat"
                        className="flex items-center px-3 py-2 text-sm text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer"
                      >
                        <MessageCircle className="mr-2 h-4 w-4 text-primary" />
                        Messages
                      </Link>
                      <Link
                        href="/account"
                        className="flex items-center px-3 py-2 text-sm text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer"
                      >
                        <UserCircle className="mr-2 h-4 w-4 text-primary" />
                        Account
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center px-3 py-2 text-sm text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer"
                      >
                        <Settings className="mr-2 h-4 w-4 text-primary" />
                        Settings
                      </Link>
                    </div>
                    
                    <Separator />
                    
                    <div className="p-2">
                      <button
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="flex w-full items-center px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
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
            )}
            
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 transition-colors focus:outline-none cursor-pointer"
                >
                  <Menu className="block h-6 w-6" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-screen max-w-xs p-0 border-t bg-background rounded-xl shadow-lg overflow-hidden" side="bottom" align="end">
                <div className="py-2">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center py-2 px-4 text-base font-medium ${
                          pathname === item.href
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-muted transition-colors'
                        } cursor-pointer`}
                      >
                        <Icon className={`mr-3 h-5 w-5 ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`} />
                        {item.name}
                      </Link>
                    );
                  })}
                  
                  {!isAuthenticated && (
                    <>
                      <Separator className="my-2" />
                      <div className="px-4 py-2">
                        <Link 
                          href="/login"
                          className="flex items-center justify-center px-3 py-2 rounded-md text-base font-medium text-white bg-primary hover:bg-primary/90 transition-colors cursor-pointer text-center"
                        >
                          Sign In
                        </Link>
                      </div>
                    </>
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