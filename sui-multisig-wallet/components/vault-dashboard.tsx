"use client"

import { useState } from "react"
import { Copy, ExternalLink, Plus, Clock, CheckCircle, XCircle, Users, Coins, Shield, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRealtimeWallet } from "@/hooks/use-realtime-wallet"
import { formatDistanceToNow } from "date-fns"

interface VaultDashboardProps {
  walletId?: string
  onViewTransaction: (id: string) => void
  onNavigate: (view: string) => void
}

export function VaultDashboard({ walletId, onViewTransaction, onNavigate }: VaultDashboardProps) {
  const [copiedAddress, setCopiedAddress] = useState(false)
  
  // Use real data if walletId is provided, otherwise use mock data
  const { wallet, proposals, isLoading, error } = walletId 
    ? useRealtimeWallet(walletId)
    : { wallet: null, proposals: [], isLoading: false, error: null }

  // Mock data for when no walletId is provided
  const mockWalletData = {
    address: "0x1234567890abcdef1234567890abcdef12345678",
    balance: "1,234.56",
    threshold: 2,
    owners: [
      { id: "1", name: "Alice", weight: 1 },
      { id: "2", name: "Bob", weight: 1 },
      { id: "3", name: "Charlie", weight: 1 },
    ],
  }

  // Use real data if available, otherwise fall back to mock
  const displayWallet = wallet || mockWalletData
  const walletAddress = wallet?.address || mockWalletData.address
  const threshold = wallet?.threshold || mockWalletData.threshold
  const totalOwners = wallet?.owners?.length || mockWalletData.owners.length

  // Get recent proposals (max 3)
  const recentProposals = proposals.slice(0, 3)

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
    setCopiedAddress(true)
    setTimeout(() => setCopiedAddress(false), 2000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "executed":
        return <CheckCircle className="h-4 w-4 text-mint" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "executed":
        return <Badge className="bg-mint/10 text-mint border-mint/20">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Needs Signatures</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-600">Failed to load wallet data. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-orchid mb-2">Welcome back! 👋</h1>
          <p className="text-muted-foreground">Let's check on your shared wallet and see what needs your attention.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="bg-orchid hover:bg-orchid/90 text-white" onClick={() => onNavigate("propose")}>
            <Plus className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
          <Button variant="outline" onClick={() => window.open("https://suiexplorer.com", "_blank")}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Explorer
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-mint/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-mint/10 rounded-lg">
                <Coins className="h-5 w-5 text-mint" />
              </div>
              <CardTitle>Your Balance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-mint mb-1">{mockWalletData.balance} SUI</div>
            <p className="text-sm text-muted-foreground">≈ $2,469.12 USD</p>
          </CardContent>
        </Card>

        <Card className="border-orchid/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orchid/10 rounded-lg">
                <Shield className="h-5 w-5 text-orchid" />
              </div>
              <CardTitle>Security Level</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orchid mb-1">
              {threshold} of {totalOwners}
            </div>
            <p className="text-sm text-muted-foreground">Signatures required to move funds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle>Your Address</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-muted px-3 py-2 rounded-lg flex-1 truncate font-mono">
                {walletAddress.slice(0, 20)}...
              </code>
              <Button variant="ghost" size="sm" onClick={copyAddress}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {copiedAddress && <p className="text-xs text-mint mt-2">Copied to clipboard! ✨</p>}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Here's what's been happening with your shared wallet</CardDescription>
            </div>
            <Button variant="outline" onClick={() => onNavigate("history")}>
              View All Activity
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentProposals.length > 0 ? (
              recentProposals.map((proposal) => {
                const totalWeight = proposal.signatures.reduce((sum, sig) => sum + (sig.owner?.weight || 0), 0)
                const progress = (totalWeight / threshold) * 100
                
                return (
                  <div
                    key={proposal.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onViewTransaction(proposal.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-lg">{getStatusIcon(proposal.status)}</div>
                      <div>
                        <div className="font-semibold">{proposal.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {totalWeight}/{threshold} weight collected
                        </div>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-gradient-to-r from-orchid to-mint transition-all duration-300 rounded-full"
                            style={{
                              width: `${Math.min(progress, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      {getStatusBadge(proposal.status)}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No transactions yet. Create your first proposal!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
