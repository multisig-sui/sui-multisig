"use client"

import { cn } from "@/lib/utils"

interface VaultLogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
  showText?: boolean
}

export function VaultLogo({ size = "md", className, showText = true }: VaultLogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Outer circle segments */}
          <path
            d="M24 4C35.0457 4 44 12.9543 44 24C44 35.0457 35.0457 44 24 44C12.9543 44 4 35.0457 4 24C4 12.9543 12.9543 4 24 4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="8 4"
            className="text-orchid"
          />
          {/* Lock body */}
          <rect x="16" y="22" width="16" height="12" rx="2" fill="currentColor" className="text-orchid" />
          {/* Lock shackle */}
          <path
            d="M20 22V18C20 15.7909 21.7909 14 24 14C26.2091 14 28 15.7909 28 18V22"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-orchid"
          />
          {/* Keyhole */}
          <circle cx="24" cy="26" r="2" fill="white" />
          <rect x="23" y="28" width="2" height="3" fill="white" />
          {/* Segment indicators */}
          <circle cx="24" cy="8" r="1.5" fill="currentColor" className="text-mint" />
          <circle cx="35.5" cy="16" r="1.5" fill="currentColor" className="text-mint" />
          <circle cx="35.5" cy="32" r="1.5" fill="currentColor" className="text-mint" />
          <circle cx="24" cy="40" r="1.5" fill="currentColor" className="text-mint" />
          <circle cx="12.5" cy="32" r="1.5" fill="currentColor" className="text-orchid" />
          <circle cx="12.5" cy="16" r="1.5" fill="currentColor" className="text-orchid" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={cn("font-bold text-orchid", textSizeClasses[size])}>VaultLink</span>
          {size !== "sm" && <span className="text-xs text-muted-foreground">Move together. Sign with confidence.</span>}
        </div>
      )}
    </div>
  )
}
