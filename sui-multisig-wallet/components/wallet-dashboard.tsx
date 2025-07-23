"use client"

import { useState } from "react"
import {
  Copy,
  ExternalLink,
  Users,
  Shield,
  Coins,
  TrendingUp,
  Clock,
  CheckCircle,
  Send,
  ArrowUpRight,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface WalletDashboardProps {
  onViewTransaction: (id: string) => void
  onNavigate: (view: string) => void
}

export function WalletDashboard({ onViewTransaction, onNavigate }: WalletDashboardProps) {
  const [copiedAddress, setCopiedAddress] = useState(false)

  // Mock wallet data
  const walletData = {
    address: "0x1234567890abcdef1234567890abcdef12345678",
    balance: "1,234.56",
    threshold: { required: 2, total: 3 },
    signers: [
      { id: "1", name: "Alice", address: "0xabc123...", weight: 1, isConnected: true },
      { id: "2", name: "Bob", address: "0xdef456...", weight: 1, isConnected: false },
      { id: "3", name: "Charlie", address: "0x789xyz...", weight: 1, isConnected: true },
    ],
    recentTransactions: [
      {
        id: "tx1",
        type: "Send",
        amount: "100 SUI",
        status: "pending",
        signatures: 1,
        required: 2,
        timestamp: "2 hours ago",
      },
      {
        id: "tx2",
        type: "Contract Call",
        amount: "0 SUI",
        status: "executed",
        signatures: 2,
        required: 2,
        timestamp: "1 day ago",
      },
      {
        id: "tx3",
        type: "Send",
        amount: "50 SUI",
        status: "pending",
        signatures: 0,
        required: 2,
        timestamp: "3 days ago",
      },
    ],
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(walletData.address)
    setCopiedAddress(true)
    setTimeout(() => setCopiedAddress(false), 2000)
  }

  return (
    <TooltipProvider>
      <div className="container-app py-8 space-section animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 animate-slide-up">
          <div className="space-y-2">
            <h1 className="text-display">Dashboard</h1>
            <p className="text-body text-muted-foreground max-w-2xl">
              Manage your multisig wallet with enterprise-grade security and intuitive controls
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => onNavigate("propose")} className="apple-button group">
              <Send className="h-4 w-4 mr-2 group-hover:translate-x-0.5 transition-transform" />
              New Transaction
            </Button>
            <Button variant="outline" className="apple-button-secondary group bg-transparent">
              <ExternalLink className="h-4 w-4 mr-2 group-hover:translate-x-0.5 transition-transform" />
              View on Explorer
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          {/* Wallet Overview - Takes 2 columns on xl screens */}
          <div className="xl:col-span-2">
            <Card className="elevated-card">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-title">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Wallet Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-content">
                {/* Address Section */}
                <div className="glass-card p-6 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-caption">Wallet Address</p>
                      <p className="font-mono text-sm font-medium">{walletData.address.slice(0, 20)}...</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyAddress}
                      className="h-10 w-10 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="glass-card p-6 rounded-2xl group hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl group-hover:scale-110 transition-transform">
                        <Coins className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-caption">Total Balance</p>
                    </div>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{walletData.balance} SUI</p>
                    <p className="text-caption mt-1">≈ $2,469.12 USD</p>
                  </div>

                  <div className="glass-card p-6 rounded-2xl group hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl group-hover:scale-110 transition-transform">
                        <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-caption">Threshold Policy</p>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-xs">
                              ?
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Number of signatures required to execute transactions</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {walletData.threshold.required} of {walletData.threshold.total}
                    </p>
                    <p className="text-caption mt-1">Signatures required</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Signers Panel */}
          <div className="xl:col-span-1">
            <Card className="elevated-card h-fit">
              <CardHeader className="pb-6">
                <CardTitle className="text-title">Active Signers</CardTitle>
                <CardDescription>Authorized wallet participants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {walletData.signers.map((signer, index) => (
                    <div
                      key={signer.id}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-gray-800 shadow-md">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {signer.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{signer.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{signer.address}</p>
                      </div>
                      <Badge
                        variant={signer.isConnected ? "default" : "secondary"}
                        className={`text-xs ${signer.isConnected ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : ""}`}
                      >
                        {signer.isConnected ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Transactions */}
        <Card className="elevated-card animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle className="text-title">Recent Activity</CardTitle>
                  <CardDescription>Latest transactions and pending signatures</CardDescription>
                </div>
              </div>
              <Button variant="outline" onClick={() => onNavigate("history")} className="apple-button-secondary">
                View All
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {walletData.recentTransactions.map((tx, index) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 cursor-pointer interactive-subtle"
                  onClick={() => onViewTransaction(tx.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl ${
                          tx.status === "executed"
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-yellow-100 dark:bg-yellow-900/30"
                        }`}
                      >
                        {tx.status === "executed" ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{tx.type}</p>
                        <p className="text-caption">{tx.amount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {tx.signatures}/{tx.required} signatures
                      </p>
                      <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 rounded-full"
                          style={{
                            width: `${(tx.signatures / tx.required) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={tx.status === "executed" ? "default" : "secondary"}
                        className={tx.status === "executed" ? "status-success" : "status-warning"}
                      >
                        {tx.status}
                      </Badge>
                      <p className="text-caption">{tx.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
