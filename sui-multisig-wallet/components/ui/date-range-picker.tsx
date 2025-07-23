"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerWithRangeProps {
  date?: { from?: Date; to?: Date }
  onDateChange?: (date: { from?: Date; to?: Date }) => void
  className?: string
}

export function DatePickerWithRange({ date, onDateChange, className }: DatePickerWithRangeProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: date?.from,
    to: date?.to,
  })

  React.useEffect(() => {
    setDateRange({ from: date?.from, to: date?.to })
  }, [date])

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range)
    onDateChange?.({ from: range?.from, to: range?.to })
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn("w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                </>
              ) : (
                dateRange.from.toLocaleDateString()
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
