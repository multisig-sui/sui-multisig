"use client"

import * as React from "react"
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  className?: string
  onChange?: (dateRange: DateRange | undefined) => void
  value?: DateRange
  placeholder?: string
}

const presets = [
  {
    label: "Today",
    value: "today",
    dateRange: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 7 days",
    value: "last7days",
    dateRange: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 30 days",
    value: "last30days",
    dateRange: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "This month",
    value: "thismonth",
    dateRange: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "Last 3 months",
    value: "last3months",
    dateRange: () => ({
      from: startOfMonth(subMonths(new Date(), 2)),
      to: endOfMonth(new Date()),
    }),
  },
]

export function DateRangePicker({ 
  className, 
  onChange, 
  value, 
  placeholder = "Select date range" 
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(value)
  const [selectedPreset, setSelectedPreset] = React.useState<string>("")

  React.useEffect(() => {
    setDate(value)
  }, [value])

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate)
    setSelectedPreset("") // Clear preset when manually selecting dates
    onChange?.(newDate)
  }

  const handlePresetChange = (presetValue: string) => {
    if (presetValue === "clear") {
      setDate(undefined)
      setSelectedPreset("")
      onChange?.(undefined)
      return
    }

    const preset = presets.find(p => p.value === presetValue)
    if (preset) {
      const newDateRange = preset.dateRange()
      setDate(newDateRange)
      setSelectedPreset(presetValue)
      onChange?.(newDateRange)
    }
  }

  const formatDateRange = (dateRange: DateRange | undefined) => {
    if (!dateRange?.from) {
      return placeholder
    }

    if (dateRange.from && !dateRange.to) {
      return format(dateRange.from, "MMM dd, yyyy")
    }

    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`
    }

    return placeholder
  }

  const clearDateRange = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDate(undefined)
    setSelectedPreset("")
    onChange?.(undefined)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(date)}
            {date && (
              <X 
                className="ml-auto h-4 w-4 hover:text-destructive" 
                onClick={clearDateRange}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Presets sidebar */}
            <div className="flex flex-col gap-1 p-3 border-r">
              <div className="text-sm font-medium text-muted-foreground mb-2">Presets</div>
              {presets.map((preset) => (
                <Button
                  key={preset.value}
                  variant={selectedPreset === preset.value ? "default" : "ghost"}
                  className="justify-start text-sm h-8"
                  onClick={() => handlePresetChange(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
              <Button
                variant="ghost"
                className="justify-start text-sm h-8 text-muted-foreground"
                onClick={() => handlePresetChange("clear")}
              >
                Clear filter
              </Button>
            </div>
            
            {/* Calendar */}
            <div className="p-3">
              <Calendar
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={handleDateChange}
                numberOfMonths={2}
                className="rounded-md border-0"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Backward compatibility alias
export function DatePickerWithRange({ date, onDateChange, className }: {
  date?: { from?: Date; to?: Date }
  onDateChange?: (date: { from?: Date; to?: Date }) => void
  className?: string
}) {
  const dateRange = React.useMemo(() => ({
    from: date?.from,
    to: date?.to,
  }), [date?.from, date?.to])

  const handleChange = React.useCallback((range: DateRange | undefined) => {
    onDateChange?.({ from: range?.from, to: range?.to })
  }, [onDateChange])

  return (
    <DateRangePicker
      className={className}
      value={dateRange}
      onChange={handleChange}
    />
  )
}
