'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import debounce from 'lodash/debounce'

// Mapbox access token from your environment variables
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

interface LocationResult {
  id: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (location: { address: string; coordinates: { lat: number; lng: number } }) => void;
  placeholder?: string;
  className?: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Search location",
  className
}: LocationAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<LocationResult[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedSearch = useRef<any>(null)

  // Create debounced search function
  useEffect(() => {
    debouncedSearch.current = debounce(async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([])
        return
      }

      try {
        setLoading(true)
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
          setResults(locations)
        }
      } catch (error) {
        console.error('Error fetching location suggestions:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debouncedSearch.current) {
        debouncedSearch.current.cancel()
      }
    }
  }, [])

  // Trigger search when value changes
  useEffect(() => {
    if (debouncedSearch.current) {
      debouncedSearch.current(value)
    }
  }, [value])

  const handleSelect = (location: LocationResult) => {
    onChange(location.place_name)
    onLocationSelect({
      address: location.place_name,
      coordinates: {
        // Mapbox returns coordinates as [longitude, latitude]
        lng: location.center[0],
        lat: location.center[1]
      }
    })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("w-full relative", className)}>
          <MapPin className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="pl-9 h-12 hover:border-primary transition-colors"
            onClick={() => setOpen(true)}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>
              {loading ? 'Searching...' : 'No locations found'}
            </CommandEmpty>
            <CommandGroup>
              {results.map((location) => (
                <CommandItem
                  key={location.id}
                  value={location.place_name}
                  onSelect={() => handleSelect(location)}
                  className="flex items-center gap-2 py-2"
                >
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{location.place_name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 