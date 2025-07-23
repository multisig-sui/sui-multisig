"use client"

import { useState } from "react"
import { Copy, ExternalLink, Plus, Clock, CheckCircle, XCircle, Users, Coins, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface VaultDashboardProps {
  onViewTransaction: (id: string) => void
  onNavigate: (view: string) => void
}

export function VaultDashboard({ onViewTransaction, onNavigate }: VaultDashboardProps) {
  const [copiedAddress, setCopiedAddress] = useState(false)

  const walletData = {
    address: "0x1234567890abcdef1234567890abcdef12345678",
    balance: "1,234.56",
    threshold: { required: 2, total: 3 },
    recentTransactions: [
      {
        id: "tx1",
        type: "Send SUI",
        amount: "100",
        status: "pending",
        signatures: 1,
        required: 2,
        timestamp: "2 hours ago",
        recipient: "Alice",
      },
      {
        id: "tx2",
        type: "Contract Call",
        amount: "0",
        status: "executed",
        signatures: 2,
        required: 2,
        timestamp: "1 day ago",
        recipient: "DeFi Protocol",
      },
      {
        id: "tx3",
        type: "Send SUI",
        amount: "50",
        status: "failed",
        signatures: 2,
        required: 2,
        timestamp: "3 days ago",
        recipient: "Bob",
      },
    ],
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(walletData.address)
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
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
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
            <div className="text-3xl font-bold text-mint mb-1">{walletData.balance} SUI</div>
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
              {walletData.threshold.required} of {walletData.threshold.total}
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
                {walletData.address.slice(0, 20)}...
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
            {walletData.recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onViewTransaction(tx.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-lg">{getStatusIcon(tx.status)}</div>
                  <div>
                    <div className="font-semibold">
                      {tx.amount !== "0" ? `${tx.amount} SUI to ${tx.recipient}` : `${tx.type} with ${tx.recipient}`}
                    </div>
                    <div className="text-sm text-muted-foreground">{tx.timestamp}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {tx.signatures}/{tx.required} signatures collected
                    </div>
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-gradient-to-r from-orchid to-mint transition-all duration-300 rounded-full"
                        style={{
                          width: `${(tx.signatures / tx.required) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  {getStatusBadge(tx.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
