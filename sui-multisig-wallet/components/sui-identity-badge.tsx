"use client"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type WalletType = "zkLogin" | "Ledger" | "Suiet" | "Ethos" | "Martian" | "Unknown"

interface SuiIdentityBadgeProps {
  walletType: WalletType
  className?: string
  showLabel?: boolean
}

export function SuiIdentityBadge({ walletType, className, showLabel = false }: SuiIdentityBadgeProps) {
  const getWalletIcon = (type: WalletType) => {
    switch (type) {
      case "zkLogin":
        return "🔐"
      case "Ledger":
        return "🔒"
      case "Suiet":
        return "🦊"
      case "Ethos":
        return "🌊"
      case "Martian":
        return "👽"
      default:
        return "👛"
    }
  }

  const getWalletColor = (type: WalletType) => {
    switch (type) {
      case "zkLogin":
        return "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
      case "Ledger":
        return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
      case "Suiet":
        return "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
      case "Ethos":
        return "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
      case "Martian":
        return "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
      default:
        return "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
    }
  }

  const getWalletDescription = (type: WalletType) => {
    switch (type) {
      case "zkLogin":
        return "Authenticated with zkLogin (Google, Facebook, etc.)"
      case "Ledger":
        return "Hardware wallet - highest security"
      case "Suiet":
        return "Suiet wallet extension"
      case "Ethos":
        return "Ethos wallet"
      case "Martian":
        return "Martian wallet"
      default:
        return "Unknown wallet type"
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={cn("px-2 py-0.5 gap-1", getWalletColor(walletType), className)}>
            <span>{getWalletIcon(walletType)}</span>
            {showLabel && <span className="text-xs">{walletType}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getWalletDescription(walletType)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
