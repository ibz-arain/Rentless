'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { MapPin, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
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

export default function Home() {
  const [date, setDate] = useState<Date>()
  const [location, setLocation] = useState("")
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null)
  const [searchResults, setSearchResults] = useState<LocationResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearch = useRef<any>(null)
  const router = useRouter()
  
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
            backgroundImage: "url('/ambassador-bridge.jpg')",
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
            <Properties />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
