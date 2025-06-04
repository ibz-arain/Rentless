'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, Home, User, Settings, Bell, CreditCard, Heart, Shield, Bookmark, Calendar, Mail } from 'lucide-react';
import Image from 'next/image';

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-8"></div>
            <div className="h-64 bg-muted rounded-lg mb-8"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null; // This will redirect via the useEffect
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Hero section */}
      <div className="bg-gradient-to-b from-primary/15 to-background/50 border-b relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto py-12 px-4 relative">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center relative overflow-hidden ring-2 ring-primary/20 shadow-md border-2 border-white/80">
                {session.user.profile_picture ? (
                  <Image
                    src={session.user.profile_picture}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-primary" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2 text-foreground">
                  Welcome, {session.user.first_name}
                </h1>
                <p className="text-muted-foreground">{session.user.email}</p>
                
                <div className="flex items-center gap-3 mt-4">
                  <Link href="/account/properties" className="inline-flex items-center text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors cursor-pointer">
                    <Home className="h-3.5 w-3.5 mr-1" /> My Properties
                  </Link>
                  <Link href="/account/profile" className="inline-flex items-center text-xs bg-blue-500/10 text-blue-500 px-3 py-1.5 rounded-full hover:bg-blue-500/20 transition-colors cursor-pointer">
                    <User className="h-3.5 w-3.5 mr-1" /> Edit Profile
                  </Link>
                  <Link href="/account/settings" className="inline-flex items-center text-xs bg-red-500/10 text-red-500 px-3 py-1.5 rounded-full hover:bg-red-500/20 transition-colors cursor-pointer">
                    <Settings className="h-3.5 w-3.5 mr-1" /> Settings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="container mx-auto py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Home className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Active Properties</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10 text-green-500">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Upcoming Bookings</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-amber-500/10 text-amber-500">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Saved Properties</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-500/10 text-purple-500">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Notifications</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Account Dashboard</h2>
            <Link href="/account/settings" className="text-sm text-primary hover:underline cursor-pointer">
              View all settings
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Property Management Card */}
            <Link href="/account/properties" className="block group">
              <Card className="h-full transition-all duration-200 hover:shadow-md border hover:border-primary/20 cursor-pointer overflow-hidden">
                <div className="h-1.5 bg-primary w-full"></div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-md bg-primary/10 text-primary">
                      <Home className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">My Properties</CardTitle>
                  </div>
                  <CardDescription>
                    Manage your property listings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Add, edit, or remove your property listings and track their performance.</p>
                  <div className="flex items-center justify-between mt-2 bg-muted/30 p-2 rounded">
                    <span className="text-sm text-primary font-medium">Manage Properties</span>
                    <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Profile Card */}
            <Link href="/account/profile" className="block group">
              <Card className="h-full transition-all duration-200 hover:shadow-md border hover:border-blue-500/20 cursor-pointer overflow-hidden">
                <div className="h-1.5 bg-blue-500 w-full"></div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-md bg-blue-500/10 text-blue-500">
                      <User className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">Profile Information</CardTitle>
                  </div>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Edit your profile details, contact information, and profile picture.</p>
                  <div className="flex items-center justify-between mt-2 bg-blue-50 p-2 rounded">
                    <span className="text-sm text-blue-500 font-medium">Edit Profile</span>
                    <ArrowRight className="h-4 w-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Notifications Card */}
            <Link href="/account/notifications" className="block group">
              <Card className="h-full transition-all duration-200 hover:shadow-md border hover:border-purple-500/20 cursor-pointer overflow-hidden">
                <div className="h-1.5 bg-purple-500 w-full"></div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-md bg-purple-500/10 text-purple-500">
                      <Bell className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">Notifications</CardTitle>
                  </div>
                  <CardDescription>
                    Manage your alert preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Control what notifications you receive and how they're delivered.</p>
                  <div className="flex items-center justify-between mt-2 bg-purple-50 p-2 rounded">
                    <span className="text-sm text-purple-500 font-medium">Notification Settings</span>
                    <ArrowRight className="h-4 w-4 text-purple-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
            </Card>
          </Link>

          {/* Messages Card */}
          <Link href="/account/messages" className="block group">
            <Card className="h-full transition-all duration-200 hover:shadow-md border hover:border-indigo-500/20 cursor-pointer overflow-hidden">
              <div className="h-1.5 bg-indigo-500 w-full"></div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-md bg-indigo-500/10 text-indigo-500">
                    <Mail className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">Messages</CardTitle>
                </div>
                <CardDescription>
                  View and send messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Chat with other users about listings.</p>
                <div className="flex items-center justify-between mt-2 bg-indigo-50 p-2 rounded">
                  <span className="text-sm text-indigo-500 font-medium">Open Inbox</span>
                  <ArrowRight className="h-4 w-4 text-indigo-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Payment Methods Card */}
            <Link href="/account/payments" className="block group">
              <Card className="h-full transition-all duration-200 hover:shadow-md border hover:border-green-500/20 cursor-pointer overflow-hidden">
                <div className="h-1.5 bg-green-500 w-full"></div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-md bg-green-500/10 text-green-500">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">Payment Methods</CardTitle>
                  </div>
                  <CardDescription>
                    Manage your payment options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Add, update, or remove payment methods for your transactions.</p>
                  <div className="flex items-center justify-between mt-2 bg-green-50 p-2 rounded">
                    <span className="text-sm text-green-500 font-medium">Manage Payments</span>
                    <ArrowRight className="h-4 w-4 text-green-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Saved Properties Card */}
            <Link href="/account/favorites" className="block group">
              <Card className="h-full transition-all duration-200 hover:shadow-md border hover:border-amber-500/20 cursor-pointer overflow-hidden">
                <div className="h-1.5 bg-amber-500 w-full"></div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-md bg-amber-500/10 text-amber-500">
                      <Heart className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">Saved Properties</CardTitle>
                  </div>
                  <CardDescription>
                    View your favorite listings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Browse properties you've saved to revisit and compare later.</p>
                  <div className="flex items-center justify-between mt-2 bg-amber-50 p-2 rounded">
                    <span className="text-sm text-amber-500 font-medium">View Saved Properties</span>
                    <ArrowRight className="h-4 w-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Account Settings Card */}
            <Link href="/account/settings" className="block group">
              <Card className="h-full transition-all duration-200 hover:shadow-md border hover:border-red-500/20 cursor-pointer overflow-hidden">
                <div className="h-1.5 bg-red-500 w-full"></div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-md bg-red-500/10 text-red-500">
                      <Settings className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">Account Settings</CardTitle>
                  </div>
                  <CardDescription>
                    Manage your account preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Update your password, security settings, and account preferences.</p>
                  <div className="flex items-center justify-between mt-2 bg-red-50 p-2 rounded">
                    <span className="text-sm text-red-500 font-medium">Account Settings</span>
                    <ArrowRight className="h-4 w-4 text-red-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 