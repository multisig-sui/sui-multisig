"use client"

import { Shield } from "lucide-react"

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center space-y-8 animate-fade-in">
        {/* Logo with enhanced animation */}
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl shadow-blue-500/25 mx-auto animate-pulse-subtle">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-blue-500/10 to-purple-600/10 animate-ping" />
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 animate-pulse" />
        </div>

        {/* Enhanced typography */}
        <div className="space-content">
          <h1 className="text-headline bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-slide-up">
            Sui MultiSig Wallet
          </h1>
          <p
            className="text-body text-muted-foreground max-w-md mx-auto animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            Initializing your secure multisig wallet experience
          </p>
        </div>

        {/* Modern loading indicator */}
        <div className="flex items-center justify-center gap-3 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
          <span className="text-caption">Loading...</span>
        </div>
      </div>
    </div>
  )
}
