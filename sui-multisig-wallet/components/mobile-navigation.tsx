"use client"

import { useState, useEffect } from "react"
import { Wallet, History, FileText, Plus, Settings } from "lucide-react"
import { motion } from "framer-motion"
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface MobileNavigationProps {
  activeView: string
  onViewChange: (view: string) => void
  pendingCount?: number
}

export function MobileNavigation({ activeView, onViewChange, pendingCount = 0 }: MobileNavigationProps) {
  const isMobile = useIsMobile()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(isMobile)
  }, [isMobile])

  if (!isVisible) return null

  const navItems = [
    { id: "dashboard", icon: Wallet, label: "Wallet" },
    { id: "history", icon: History, label: "History" },
    { id: "signatures", icon: FileText, label: "Pending", badge: pendingCount },
    { id: "propose", icon: Plus, label: "New" },
    { id: "settings", icon: Settings, label: "Settings" },
  ]

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full text-xs transition-colors",
              activeView === item.id ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <div className="relative">
              <item.icon className="h-5 w-5 mb-1" />
              {item.badge && item.badge > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white text-[10px]"
                  variant="destructive"
                >
                  {item.badge}
                </Badge>
              )}
            </div>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  )
}
