"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Wallet, Plus, Send, Users, Settings, Moon, Sun, History, FileText, Activity, Lock } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { VaultLogo } from "@/components/vault-logo"
import { cn } from "@/lib/utils"

interface VaultSidebarProps {
  activeView: string
  onViewChange: (view: string) => void
  walletData?: any // Optional wallet data to calculate pending count
}

export function VaultSidebar({ activeView, onViewChange, walletData }: VaultSidebarProps) {
  const { theme, setTheme } = useTheme()
  const { state } = useSidebar()
  const [mounted, setMounted] = useState(false)

  // Calculate pending count dynamically from wallet data
  const calculatePendingCount = () => {
    if (!walletData?.proposals || !walletData?.wallet) return 0
    
    // Count proposals that are pending and need signatures
    return walletData.proposals.filter((proposal: any) => {
      if (proposal.status !== 'pending') return false
      
      // Calculate current signature weight
      const totalWeight = proposal.signatures.reduce((sum: number, sig: any) => {
        // For local wallets, find owner by matching signerPublicKey
        const isLocalWallet = walletData.wallet.id?.startsWith('wallet_')
        if (isLocalWallet) {
          const owner = walletData.wallet.owners.find((o: any) => o.public_key === sig.signerPublicKey)
          return sum + (owner?.weight || 0)
        } else {
          // For Supabase wallets, owner is included in signature
          return sum + (sig.owner?.weight || 0)
        }
      }, 0)
      
      // Return true if transaction needs more signatures
      return totalWeight < walletData.wallet.threshold
    }).length
  }

  const pendingCount = calculatePendingCount()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const isCollapsed = state === "collapsed"

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const mainMenuItems = [
    {
      title: "Dashboard",
      icon: Wallet,
      id: "dashboard",
      description: "Your wallet overview and recent activity",
    },
    {
      title: "Transaction History",
      icon: History,
      id: "history",
      description: "View all past transactions",
    },
    {
      title: "Pending Signatures",
      icon: FileText,
      id: "signatures",
      badge: pendingCount > 0 ? pendingCount : undefined, // Only show badge if there are pending signatures
      description: "Transactions awaiting your signature",
    },
  ]

  const actionItems = [
    {
      title: "Create Wallet",
      icon: Plus,
      id: "create",
      description: "Set up a new multisig wallet",
    },
    {
      title: "Send Transaction",
      icon: Send,
      id: "propose",
      description: "Create a new transaction proposal",
    },
    {
      title: "Manage Co-signers",
      icon: Users,
      id: "signers",
      description: "Invite or remove wallet co-signers",
    },
  ]

  const SidebarMenuItemWithTooltip = ({ item, children }: { item: any; children: React.ReactNode }) => {
    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            <span>{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="text-xs">
                {item.badge}
              </Badge>
            )}
          </TooltipContent>
        </Tooltip>
      )
    }
    return children
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar collapsible="icon" className="border-r border-border">
        <SidebarHeader className="p-6 border-b border-border">
          <div 
            className="flex items-center justify-center cursor-pointer"
            onClick={() => router.push('/')}
          >
            <VaultLogo size={isCollapsed ? "sm" : "md"} showText={!isCollapsed} />
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 py-4">
          <SidebarGroup>
            <SidebarGroupLabel
              className={cn(
                "transition-all duration-300 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
                isCollapsed && "sr-only",
              )}
            >
              <Activity className="h-4 w-4" />
              {!isCollapsed && "Wallet"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {mainMenuItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuItemWithTooltip item={item}>
                      <SidebarMenuButton
                        isActive={activeView === item.id}
                        onClick={() => {
                          if (window.location.pathname === '/' || window.location.pathname.startsWith('/wallet/')) {
                            onViewChange(item.id)
                          } else {
                            router.push('/')
                            setTimeout(() => onViewChange(item.id), 100)
                          }
                        }}
                        className={cn(
                          "w-full justify-start transition-all duration-200 hover:bg-muted rounded-xl px-3 py-2.5",
                          isCollapsed && "justify-center px-2",
                          activeView === item.id && "bg-orchid/10 text-orchid border border-orchid/20 shadow-sm",
                        )}
                        tooltip={isCollapsed ? item.title : undefined}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && (
                          <>
                            <span>{item.title}</span>
                            {item.badge && (
                              <Badge
                                variant="secondary"
                                className="ml-auto bg-yellow-100 text-yellow-800 border-yellow-200"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItemWithTooltip>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="my-6 bg-border" />

          <SidebarGroup>
            <SidebarGroupLabel
              className={cn(
                "transition-all duration-300 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
                isCollapsed && "sr-only",
              )}
            >
              <Lock className="h-4 w-4" />
              {!isCollapsed && "Actions"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {actionItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuItemWithTooltip item={item}>
                      <SidebarMenuButton
                        isActive={activeView === item.id}
                        onClick={() => {
                          if (item.id === 'create' && window.location.pathname !== '/create') {
                            router.push('/create')
                          } else {
                            onViewChange(item.id)
                          }
                        }}
                        className={cn(
                          "w-full justify-start transition-all duration-200 hover:bg-muted rounded-xl px-3 py-2.5",
                          isCollapsed && "justify-center px-2",
                          activeView === item.id && "bg-orchid/10 text-orchid border border-orchid/20 shadow-sm",
                        )}
                        tooltip={isCollapsed ? item.title : undefined}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItemWithTooltip>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-border">
          <div
            className={cn(
              "flex items-center transition-all duration-300",
              isCollapsed ? "flex-col gap-3" : "justify-between",
            )}
          >
            <SidebarMenuItemWithTooltip item={{ title: "Settings", description: "Wallet settings and preferences" }}>
              <SidebarMenuButton
                onClick={() => onViewChange("settings")}
                className={cn(
                  "transition-all duration-200 hover:bg-muted rounded-xl",
                  isCollapsed ? "w-10 h-10 p-0 justify-center" : "flex-1 px-3 py-2.5",
                )}
              >
                <Settings className="h-5 w-5" />
                {!isCollapsed && <span>Settings</span>}
              </SidebarMenuButton>
            </SidebarMenuItemWithTooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="transition-all duration-200 hover:bg-muted rounded-xl h-10 w-10"
                >
                  {mounted ? (
                    theme === "dark" ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    )
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isCollapsed ? "right" : "top"}>
                Toggle {theme === "dark" ? "light" : "dark"} mode
              </TooltipContent>
            </Tooltip>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </TooltipProvider>
  )
}
