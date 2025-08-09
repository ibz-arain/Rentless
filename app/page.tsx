'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { 
  MapPin, 
  Calendar as CalendarIcon, 
  Loader2, 
  Handshake, 
  Search as SearchIcon, 
  Bed as BedIcon, 
  ShieldCheck, 
  Star, 
  CreditCard, 
  Building, 
  Users, 
  CheckCircle2,
  ArrowRight, 
  Globe, 
  Clock, 
  Wallet, 
  MessageSquare, 
  HeartHandshake,
  Lock,
  FileText,
  BadgeCheck,
  CreditCard as CreditCardIcon,
  DollarSign,
  Gift,
  ThumbsUp,
  Quote,
  LandmarkIcon
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Properties from '@/components/properties'
import { format } from 'date-fns'
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Footer } from '@/components/footer'
import debounce from 'lodash/debounce'
import { LocationAutocomplete } from '@/components/LocationAutocomplete'

// Mapbox access token from environment variables
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

// Location search result interface
interface LocationResult {
  id: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
}

// Animation helper function
const fadeInAnimationVariants = {
  initial: {
    opacity: 0,
    y: 30,
  },
  animate: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.05 * index,
      duration: 0.5,
    },
  }),
}

export default function Home() {
  const [date, setDate] = useState<Date>()
  const [location, setLocation] = useState("")
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null)
  const router = useRouter()
  
  // Feature sections data
  const features: { icon: LucideIcon; title: string; desc: string }[] = [
    {
      icon: Handshake,
      title: 'Direct Landlord Connections',
      desc: 'Skip the middlemen and connect directly with property owners. No agents, no brokers, no unnecessary fees—just straightforward conversations with the people who actually own the place you might call home.'
    },
    {
      icon: SearchIcon,
      title: 'Discover Hidden Gems',
      desc: 'Find unique properties that never make it to traditional real estate sites. From cozy basement apartments to luxury penthouses, we have listings you won\'t find anywhere else—perfect for those looking beyond the ordinary.'
    },
    {
      icon: BedIcon,
      title: 'Flexible Living Options',
      desc: 'Whether you need a single room as a student, a short-term rental while job hunting, or a full house for your growing family—we\'ve got options. Our platform supports all living arrangements, not just traditional leases.'
    },
    {
      icon: ShieldCheck,
      title: 'Secure Digital Leases',
      desc: 'Our legally-binding digital contracts protect both tenants and landlords. We handle all the paperwork in the background, ensuring compliance with local regulations while giving everyone the security they deserve.'
    },
    {
      icon: Star,
      title: 'Transparent Ratings & Reviews',
      desc: 'Make informed decisions with our verified review system. See what previous tenants thought about both properties and landlords before signing anything. No more surprises after move-in day.'
    },
    {
      icon: CreditCard,
      title: 'Rewarding Payment Options',
      desc: 'Pay rent your way and earn rewards doing it. Use your credit card to accumulate points or cashback, set up automatic bank transfers, or choose another secure payment method—all protected by our advanced security system.'
    }
  ]



  const handleLocationSelect = useCallback((result: LocationResult) => {
    setLocation(result.place_name)
    setCoordinates({
      lat: result.center[1], // Mapbox returns as [lng, lat]
      lng: result.center[0]
    })
  }, [])

  const handleSearch = () => {
    // Clear the cached state before navigation
    sessionStorage.removeItem('propertyFilters')
    
    // Build the query parameters
    const params = new URLSearchParams()
    
    // Add location if entered
    if (location) {
      params.append('location', location)
    }
    
    // Add coordinates if available
    if (coordinates) {
      params.append('lat', coordinates.lat.toString())
      params.append('lng', coordinates.lng.toString())
    }
    
    // Add date if selected
    if (date) {
      params.append('moveInDate', date.toISOString())
    }
    
    // Navigate to properties page with search parameters
    router.push(`/properties?${params.toString()}`)
  }

  return (
    <div className="min-h-screen flex flex-col">
        <Header />

      <main className="flex-grow">
        <div 
          className="relative bg-cover bg-center h-[600px] transition-all duration-700 ease-in-out" 
          style={{
            backgroundImage: "url('/images/neighbourhood.png')",
            backgroundPosition: "center 50%"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40"></div>
          <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-background mb-6 animate-fade-in">
              Find Your Next Home
            </h1>
            <p className="text-xl text-background mb-12 max-w-2xl animate-fade-in-delay">
              Tired of asking around for a place to rent? We've got you covered.
            </p>
            <div className="bg-background p-6 rounded-xl shadow-xl w-full max-w-4xl flex flex-wrap gap-4 animate-slide-up">
              <div className="flex-1 min-w-[250px] relative group">
                <LocationAutocomplete
                  value={location}
                  onChange={setLocation}
                  onLocationSelect={handleLocationSelect}
                  placeholder="Location"
                  height="h-12"
                />
              </div>
              <div className="flex-1 min-w-[250px] relative group">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-10 h-12 justify-start text-left font-normal hover:border-primary hover:bg-background transition-colors",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Move-in Date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="flex justify-center p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button 
                className="w-full sm:w-auto h-12 px-8 text-lg font-medium hover:scale-105 transition-transform"
                onClick={handleSearch}
              >
                Find Properties
              </Button>
            </div>
          </div>
        </div>
        
        <div className="py-16 bg-background" suppressHydrationWarning={true}>
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-foreground">Featured Properties</h2>
            </div>
            <Properties featured rowOnly />
          </div>
        </div>

        {/* How It Works Section removed as per new layout */}
        {/*
        <section className="py-24 bg-gradient-to-b from-background to-muted">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">How Rentless Works</h2>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                Finding your perfect rental shouldn't be complicated. We've simplified the process.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                {
                  step: '01',
                  title: 'Search & Discover',
                  desc: 'Browse our extensive listings filtered by your exact needs and preferences.',
                  icon: SearchIcon
                },
                {
                  step: '02',
                  title: 'Connect Directly',
                  desc: 'Message landlords instantly and schedule viewings on your terms.',
                  icon: MessageSquare
                },
                {
                  step: '03',
                  title: 'Secure Your Home',
                  desc: 'Sign digital leases and set up payments—all through our secure platform.',
                  icon: ShieldCheck
                }
              ].map(({ step, title, desc, icon: Icon }) => (
                <div key={step} className="bg-background p-8 rounded-xl shadow-sm border border-muted relative">
                  <div className="absolute -top-5 -left-5 bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold">
                    {step}
                  </div>
                  <div className="mb-4 h-12 flex items-center">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{title}</h3>
                  <p className="text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <Button className="px-8 py-6 text-lg group" size="lg">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </section>
        */}
        
        {/* Secure Payments Section */}
        <section className="py-24 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <CreditCardIcon className="h-16 w-16 mx-auto mb-6 text-primary" />
              <h2 className="text-4xl font-bold text-foreground mb-4">Pay Rent with Your Card</h2>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                Skip the hassle of cash or bank transfers - use your credit or debit card and earn back rewards
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              {/* Credit Card Display */}
              <div className="order-1">
                <div className="relative max-w-md mx-auto lg:ml-0 w-102">
                  {/* Credit card mockup */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/60 to-primary rounded-2xl transform rotate-6 scale-95 opacity-70 blur-sm"></div>
                    <div className="bg-gradient-to-r h-60 w-100 from-primary to-primary/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                      {/* Decorative circles */}
                      <div className="absolute -right-16 -top-16 w-40 h-40 bg-white/10 rounded-full"></div>
                      <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-black/10 rounded-full"></div>
                      
                      {/* Chip */}
                      <div className="w-12 h-9 bg-yellow-300/90 rounded-md mb-12 flex items-center justify-center">
                        <div className="w-10 h-7 border-2 border-yellow-600/30 rounded-sm"></div>
                      </div>
                      
                      {/* Card number */}
                      <div className="mb-8">
                        <div className="flex gap-4">
                          <p className="text-white/90 font-mono text-lg">••••</p>
                          <p className="text-white/90 font-mono text-lg">••••</p>
                          <p className="text-white/90 font-mono text-lg">••••</p>
                          <p className="text-white/90 font-mono text-lg">9845</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-primary-foreground/80 text-xs mb-1">CARD HOLDER</p>
                          <p className="text-white font-medium">IBRAHIM ARAIN</p>
                        </div>
                        <div>
                          <p className="text-primary-foreground/80 text-xs mb-1">VALID THRU</p>
                          <p className="text-white font-medium">09/26</p>
                        </div>
                      </div>
                      
                      {/* Card network logos */}
                      <div className="absolute top-6 right-6 flex">
                        <div className="w-8 h-8 bg-red-500 rounded-full opacity-80"></div>
                        <div className="w-8 h-8 bg-yellow-400 rounded-full opacity-80 -ml-4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Features List */}
              <div className="order-2">
                <div className="bg-background p-8 rounded-3xl shadow-lg">
                  
                  <div className="space-y-6">
                    {[
                      {
                        icon: CreditCardIcon,
                        title: "Use Your Favorite Card",
                        desc: "Earn rewards and cashback on your rent payments"
                      },
                      {
                        icon: Clock,
                        title: "Set & Forget",
                        desc: "Schedule automatic payments to always pay on time"
                      },
                      {
                        icon: FileText,
                        title: "Paper Trail",
                        desc: "Rent payments are recorded and can be accessed anytime"
                      }
                    ].map(({ icon: Icon, title, desc }) => (
                      <div 
                        key={title} 
                        className="flex items-start gap-4 bg-muted/50 p-4 rounded-xl"
                      >
                        <div className="bg-primary/10 p-2.5 rounded-xl">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{title}</h4>
                          <p className="text-muted-foreground text-sm mt-1">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For Tenants Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Users className="h-16 w-16 mx-auto mb-6 text-primary" />
              <h2 className="text-4xl font-bold text-foreground mb-4">For Tenants</h2>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                Find your perfect home directly from property owners
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div className="order-2 lg:order-1">
                <div className="space-y-8">
                  {[
                    {
                      icon: Globe,
                      title: 'Discover Hidden Gems',
                      desc: 'Access properties that never make it to traditional listing sites'
                    },
                    {
                      icon: Star,
                      title: 'Rated and Reviewed',
                      desc: 'Hear what others have to say about properties and landlords'
                    },
                    {
                      icon: Clock,
                      title: 'Save Time & Effort',
                      desc: 'No more endless phone calls or waiting for agent responses'
                    },
                    {
                      icon: MessageSquare,
                      title: 'Direct Communication',
                      desc: 'Skip the middleman and chat directly with property owners'
                    }
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-5 group">
                      <div className="bg-primary/10 p-3 rounded-xl transition-colors">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-xl mb-2">{title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-10">
                    <Button size="lg" className="px-8 group">
                      Find Your New Home
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="order-1 lg:order-2">
                <div className="relative">
                  <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary/10 rounded-full z-0"></div>
                  <img 
                    src="/images/tenant.png" 
                    alt="For Tenants" 
                    className="rounded-2xl shadow-xl object-cover w-full aspect-[4/3] relative z-10"
                  />
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/20 rounded-full z-0"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* For Landlords Section */}
        <section className="py-24 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Building className="h-16 w-16 mx-auto mb-6 text-primary" />
              <h2 className="text-4xl font-bold text-foreground mb-4">For Landlords</h2>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                List your property, connect with quality tenants, and manage your payments all in one place
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div className="order-1">
                <div className="relative">
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/10 rounded-full z-0"></div>
                  <img 
                    src="/images/landlord.png" 
                    alt="For Landlords" 
                    className="rounded-2xl shadow-xl object-cover w-full aspect-[4/3] relative z-10"
                  />
                  <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/20 rounded-full z-0"></div>
                </div>
              </div>
              
              <div className="order-2">
                <div className="space-y-8">
                  {[
                    {
                      icon: Users,
                      title: 'Rated and Reviewed',
                      desc: 'See what others have to say about tenants before you rent to them'
                    },
                    {
                      icon: BadgeCheck,
                      title: 'Full Control',
                      desc: 'Set your own terms, prices, and rules without agent interference'
                    },
                    {
                      icon: DollarSign,
                      title: 'Keep 100% of Rent',
                      desc: 'No hidden fees - what you charge is what you keep '
                    },
                    {
                      icon: FileText,
                      title: 'Simple Management',
                      desc: 'Digital leases, payments, messages, and more all in one place'
                    }
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-5 group">
                      <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-xl mb-2">{title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-10">
                    <Button size="lg" className="px-8 group">
                      List Your Property
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sign Up Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <HeartHandshake className="h-16 w-16 mx-auto mb-6 text-primary" />
              <h2 className="text-4xl font-bold text-foreground mb-4">What Are You Waiting For?</h2>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto mb-8">
                Join hundreds of tenants and landlords who've already found their perfect match. 
                No credit card required, no hidden fees—just start connecting today.
              </p>
            </div>
            
            
            
            <div className="text-center">
              <Button size="lg" className="px-8 py-6 text-lg group" onClick={() => router.push('/signup')}>
                Sign Up Now - It's Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="text-muted-foreground text-sm mt-4">
                Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
