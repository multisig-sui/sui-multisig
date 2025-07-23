"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Wallet, Plus, Send, Users, Settings, Moon, Sun, Shield, History, FileText, Activity, Lock } from "lucide-react"
import { useTheme } from "next-themes"
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
import { cn } from "@/lib/utils"

interface AppSidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  const { theme, setTheme } = useTheme()
  const { state, toggleSidebar } = useSidebar()
  const [pendingCount] = useState(3)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isCollapsed = state === "collapsed"

  const mainMenuItems = [
    {
      title: "Dashboard",
      icon: Wallet,
      id: "dashboard",
      description: "Wallet overview and recent activity",
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
      badge: pendingCount,
      description: "Transactions awaiting signatures",
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
      title: "Propose Transaction",
      icon: Send,
      id: "propose",
      description: "Create a new transaction proposal",
    },
    {
      title: "Manage Signers",
      icon: Users,
      id: "signers",
      description: "Add or remove wallet signers",
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
      <Sidebar
        collapsible="icon"
        className="glass border-r border-gray-200/60 dark:border-gray-800/60 transition-all duration-300 ease-in-out z-20"
      >
        <SidebarHeader className="p-6 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center justify-center">
            <div
              className={cn("flex items-center transition-all duration-300", isCollapsed ? "justify-center" : "gap-4")}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25">
                <Shield className="h-6 w-6 text-white" />
              </div>
              {!isCollapsed && (
                <div className="animate-slide-right">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Sui MultiSig
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium">Secure Wallet</p>
                </div>
              )}
            </div>
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
                        onClick={() => onViewChange(item.id)}
                        className={cn(
                          "w-full justify-start transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl px-3 py-2.5 font-medium",
                          isCollapsed && "justify-center px-2",
                          activeView === item.id &&
                            "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm",
                        )}
                        tooltip={isCollapsed ? item.title : undefined}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && (
                          <>
                            <span className="animate-slide-right">{item.title}</span>
                            {item.badge && (
                              <Badge
                                variant="secondary"
                                className="ml-auto bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 animate-pulse-subtle"
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

          <SidebarSeparator className="my-6 bg-gray-200/60 dark:bg-gray-800/60" />

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
                        onClick={() => onViewChange(item.id)}
                        className={cn(
                          "w-full justify-start transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl px-3 py-2.5 font-medium",
                          isCollapsed && "justify-center px-2",
                          activeView === item.id &&
                            "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm",
                        )}
                        tooltip={isCollapsed ? item.title : undefined}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span className="animate-slide-right">{item.title}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItemWithTooltip>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-gray-200/60 dark:border-gray-800/60">
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
                  "transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium",
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
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl h-10 w-10"
                >
                  {mounted && theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
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
