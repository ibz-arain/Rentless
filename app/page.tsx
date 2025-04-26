'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { MapPin, Calendar as CalendarIcon } from 'lucide-react'
import Properties from '@/components/properties'
import { format } from 'date-fns'
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

export default function Home() {
  const [date, setDate] = useState<Date>()
  const [location, setLocation] = useState("")
  const router = useRouter()

  const handleSearch = () => {
    // Clear the cached state before navigation
    sessionStorage.removeItem('propertyFilters')
    
    // Build the query parameters
    const params = new URLSearchParams()
    
    // Add location if entered
    if (location) {
      params.append('location', location)
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
            backgroundImage: "url('/COT.jpg')",
            backgroundPosition: "center 50%"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40"></div>
          <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
              Find Your Next Home
            </h1>
            <p className="text-xl text-white mb-12 max-w-2xl animate-fade-in-delay">
              Tired of asking around for a place to rent? We've got you covered.
            </p>
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-4xl flex flex-wrap gap-4 animate-slide-up">
              <div className="flex-1 min-w-[250px] relative group">
                <Input 
                  placeholder="Location"
                  className="pl-10 h-12 group-hover:border-primary transition-colors"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              </div>
              <div className="flex-1 min-w-[250px] relative group">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-10 h-12 justify-start text-left font-normal hover:border-primary",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
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
        
        <div className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Featured Properties</h2>
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  Premium Listings
                </div>
                <div className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  New This Week
                </div>
              </div>
            </div>
            <Properties />
          </div>
        </div>
      </main>

      <footer className="bg-gray-100">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-600 hover:text-gray-900">Help Center</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-gray-900">Tenant Guide</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-gray-900">Lease Information</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Property Owners</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-600 hover:text-gray-900">List Your Property</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-gray-900">Landlord Resources</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-gray-900">Property Management</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-600 hover:text-gray-900">Rental Guides</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-gray-900">Market Reports</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-gray-900">Neighborhood Info</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-600 hover:text-gray-900">About Us</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-gray-900">Careers</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-gray-900">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between items-center flex-wrap gap-4">
            <p className="text-gray-600">&copy; 2024 Rentless. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-gray-600 hover:text-gray-900">Privacy</Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900">Terms</Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900">Sitemap</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
