"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, isAfter } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CalendarProps {
  mode?: "single" | "range"
  selected?: Date | null | undefined
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
  classNames?: Record<string, string>
  showOutsideDays?: boolean
  [key: string]: any
}

function Calendar({
  mode = "single",
  selected,
  onSelect,
  disabled,
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(selected || new Date())

  const days = React.useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  // Function to check if a date is disabled
  const isDateDisabled = React.useCallback((date: Date) => {
    if (disabled) {
      return disabled(date)
    }
    return false
  }, [disabled])

  // Get day names for the header
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  // Get start day of the month (0-6)
  const startDay = startOfMonth(currentMonth).getDay()
  
  // Create an array for blank spaces before the first day
  const blanks = Array(startDay).fill(null)
  
  return (
    <div className={cn("p-3", className)}>
      <div className="flex justify-center pt-1 relative items-center w-full">
        <Button 
          variant="outline" 
          className="absolute left-1 size-7 p-0 bg-transparent" 
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="text-sm font-medium">
          {format(currentMonth, "MMMM yyyy")}
        </div>
        <Button 
          variant="outline" 
          className="absolute right-1 size-7 p-0 bg-transparent" 
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
      
      <div className="mt-4">
        {/* Day headers */}
        <div className="flex">
          {dayNames.map((day, i) => (
            <div key={i} className="text-muted-foreground w-8 text-center text-[0.8rem]">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 mt-2">
          {/* Blank spaces before the first day */}
          {blanks.map((_, i) => (
            <div key={`blank-${i}`} className="h-8" />
          ))}
          
          {/* Days of the month */}
          {days.map((day) => {
            const isSelected = selected ? isSameDay(day, selected) : false
            const isDisabledDate = isDateDisabled(day)
            
            return (
              <Button
                key={day.toString()}
                variant="ghost"
                size="icon"
                disabled={isDisabledDate}
                className={cn(
                  "size-8 p-0 font-normal",
                  isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  isToday(day) && !isSelected && "bg-accent text-accent-foreground",
                  isDisabledDate && "text-muted-foreground opacity-50"
                )}
                onClick={() => onSelect?.(day)}
              >
                {format(day, "d")}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export { Calendar }
