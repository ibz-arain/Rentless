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
  Quote
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
  const [searchResults, setSearchResults] = useState<LocationResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearch = useRef<any>(null)
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

  // Initialize debounced search function
  useEffect(() => {
    debouncedSearch.current = debounce(async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setSearchResults([])
        return
      }

      try {
        setIsSearching(true)
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=place,address,neighborhood,locality,district&limit=5&language=en&country=ca,us`

        const response = await fetch(endpoint)
        const data = await response.json()
        
        if (data.features) {
          const locations = data.features.map((feature: any) => ({
            id: feature.id,
            place_name: feature.place_name,
            center: feature.center
          }))
          setSearchResults(locations)
        }
      } catch (error) {
        console.error('Error fetching location suggestions:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (debouncedSearch.current) {
        debouncedSearch.current.cancel()
      }
    }
  }, [])

  // Trigger search when location value changes
  useEffect(() => {
    if (debouncedSearch.current) {
      debouncedSearch.current(location)
    }
  }, [location])

  const handleLocationSelect = useCallback((result: LocationResult) => {
    setLocation(result.place_name)
    setCoordinates({
      lat: result.center[1], // Mapbox returns as [lng, lat]
      lng: result.center[0]
    })
    setShowResults(false)
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
            backgroundImage: "url('/images/ambassador-bridge.jpg')",
            backgroundPosition: "center 5%"
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
                <div className="relative">
                  <Input 
                    placeholder="Location"
                    className="pl-10 h-12 group-hover:border-primary transition-colors"
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value)
                      setShowResults(true)
                    }}
                    onFocus={() => setShowResults(true)}
                    onBlur={() => {
                      // Delay hiding to allow for click on the suggestions
                      setTimeout(() => setShowResults(false), 200)
                    }}
                  />
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 animate-spin" />
                  )}

                  {/* Location suggestions popup */}
                  {showResults && searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-background border rounded-md shadow-lg z-50 max-h-[200px] overflow-y-auto">
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer"
                          onMouseDown={() => handleLocationSelect(result)}
                        >
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{result.place_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
        
        {/* Secure Payments Section - moved to appear first */}
        {/* START Secure Payments */}
        <section className="py-24 bg-muted overflow-hidden">
          <div className="container mx-auto px-4 relative">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full translate-y-1/3 -translate-x-1/4"></div>
            
            <div className="text-center mb-16 relative">
              <CreditCardIcon className="h-16 w-16 mx-auto mb-6 text-primary" />
              <h2 className="text-4xl font-bold text-foreground mb-4">Secure & Rewarding Payments</h2>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                Pay rent with your card, earn rewards, and stay protected.
              </p>
            </div>
            
            <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
              <div className="flex-1 order-2 lg:order-1">
                <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-10 rounded-3xl shadow-lg relative">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-background rounded-full border-8 border-background flex items-center justify-center">
                    <CreditCardIcon className="h-10 w-10 text-primary" />
                  </div>
                  
                  <h3 className="text-2xl font-semibold mb-6">Why you'll love it</h3>
                  
                  <div className="space-y-5">
                    {[
                      {
                        icon: CreditCardIcon,
                        title: "Earn Rewards",
                        desc: "Rack up points or cash-back every time you pay."
                      },
                      {
                        icon: Lock,
                        title: "Secure by default",
                        desc: "End-to-end encryption and zero stored card data."
                      },
                      {
                        icon: FileText,
                        title: "Instant receipts",
                        desc: "We email you a PDF the moment your rent clears."
                      }
                    ].map(({ icon: Icon, title, desc }) => (
                      <div 
                        key={title} 
                        className="flex items-start gap-4"
                      >
                        <div className="bg-primary/10 p-2 rounded-full shadow-sm">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{title}</h4>
                          <p className="text-muted-foreground text-sm">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 order-1 lg:order-2">
                <div className="relative">
                  {/* Credit card mockup */}
                  <div className="w-102 max-w-md h-full mx-auto relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/60 to-primary rounded-2xl transform rotate-6 scale-95 opacity-70 blur-sm"></div>
                    <div className="bg-gradient-to-r h-60 w-100 from-primary to-primary/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                      {/* Decorative circles */}
                      <div className="absolute -right-16 -top-16 w-40 h-40 bg-white/10 rounded-full"></div>
                      <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-black/10 rounded-full"></div>
                      
                      {/* Chip */}
                      <div className="w-12 h-9 bg-yellow-300/90 rounded-md mb-15 flex items-center justify-center">
                        <div className="w-10 h-7 border-2 border-yellow-600/30 rounded-sm"></div>
                      </div>
                      
                      {/* Card number */}
                      <div className="my-6">
                        <div className="flex gap-3 mb-1">
                          <p className="text-white/80 font-mono">5412</p>
                          <p className="text-white/80 font-mono">7512</p>
                          <p className="text-white/80 font-mono">3412</p>
                          <p className="text-white/80 font-mono">9845</p>
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
                      
                      {/* Mastercard logo */}
                      <div className="absolute top-6 right-6 flex">
                        <div>
                          <div className="w-8 h-8 bg-red-500 rounded-full opacity-80"></div>
                        </div>
                        <div>
                          <div className="w-8 h-8 bg-yellow-400 rounded-full opacity-80 -ml-4"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* END Secure Payments */}

        {/* For Tenants Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1">
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
              
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-6">For Tenants</h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Find your next place—no agents, no stress.
                </p>
                
                <div className="space-y-6">
                  {[
                    {
                      icon: Globe,
                      title: 'Wider Selection',
                      desc: 'Access properties that never make it to traditional listing sites.'
                    },
                    {
                      icon: Clock,
                      title: 'Save Time',
                      desc: 'No more endless phone calls or waiting for agent responses.'
                    },
                    {
                      icon: Wallet,
                      title: 'Save Money',
                      desc: 'No broker fees and earn rewards on your rent payments.'
                    }
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{title}</h3>
                        <p className="text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button className="mt-8" variant="outline">
                  Find Your New Home
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* For Landlords Section */}
        <section className="py-24 bg-muted">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
              <div className="flex-1">
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
              
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-6">For Landlords</h2>
                <p className="text-muted-foreground text-lg mb-8">
                  List faster, pick better tenants, keep every dollar.
                </p>
                
                <div className="space-y-6">
                  {[
                    {
                      icon: Users,
                      title: 'Quality Tenants',
                      desc: 'Connect with pre-screened, verified tenants looking for properties like yours.'
                    },
                    {
                      icon: Building,
                      title: 'Full Control',
                      desc: 'Set your own terms, prices, and requirements without agent interference.'
                    },
                    {
                      icon: CheckCircle2,
                      title: 'Less Hassle',
                      desc: 'Digital leases, secure payments, and simplified communication all in one place.'
                    }
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{title}</h3>
                        <p className="text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button className="mt-8" variant="outline">
                  List Your Property
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Ratings & Reviews System Section moved after Landlords */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Star className="h-16 w-16 mx-auto mb-6 text-primary" />
              <h2 className="text-4xl font-bold text-foreground mb-4">Ratings & Reviews You Can Trust</h2>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                Every landlord, tenant, and property builds a trustworthy profile so you always know who you're dealing with.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Star,
                  title: 'Property Feedback',
                  desc: 'Read honest reviews from previous tenants on cleanliness, accuracy, and neighborhood vibes.'
                },
                {
                  icon: ThumbsUp,
                  title: 'Landlord Ratings',
                  desc: 'See how responsive and fair landlords are before you send a message.'
                },
                {
                  icon: ShieldCheck,
                  title: 'Verified Profiles',
                  desc: 'Both tenants and landlords verify identity to keep the community safe and respectful.'
                }
              ].map(({ icon: Icon, title, desc }, idx) => (
                <div key={title} className="bg-muted rounded-xl p-8 shadow-sm border border-muted/50 flex flex-col items-start gap-4 transition-transform duration-300 hover:-translate-y-1">
                  <Icon className="h-10 w-10 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
