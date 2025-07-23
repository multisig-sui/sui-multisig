"use client"

import { useState } from "react"
import { Copy, ExternalLink, Plus, Clock, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface SimpleDashboardProps {
  onViewTransaction: (id: string) => void
  onNavigate: (view: string) => void
}

export function SimpleDashboard({ onViewTransaction, onNavigate }: SimpleDashboardProps) {
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
      },
      {
        id: "tx2",
        type: "Contract Call",
        amount: "0",
        status: "executed",
        signatures: 2,
        required: 2,
        timestamp: "1 day ago",
      },
      {
        id: "tx3",
        type: "Send SUI",
        amount: "50",
        status: "failed",
        signatures: 2,
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "executed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Wallet Dashboard</h1>
          <p className="text-muted-foreground">Manage your multisig wallet</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => onNavigate("propose")}>
            <Plus className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Explorer
          </Button>
        </div>
      </div>

      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{walletData.balance} SUI</div>
            <p className="text-sm text-muted-foreground">≈ $2,469.12 USD</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Threshold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {walletData.threshold.required} of {walletData.threshold.total}
            </div>
            <p className="text-sm text-muted-foreground">Signatures required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-muted px-2 py-1 rounded flex-1 truncate">
                {walletData.address.slice(0, 20)}...
              </code>
              <Button variant="ghost" size="sm" onClick={copyAddress}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {copiedAddress && <p className="text-xs text-green-600 mt-1">Copied!</p>}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest wallet activity</CardDescription>
            </div>
            <Button variant="outline" onClick={() => onNavigate("history")}>
              View All
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
                <div className="flex items-center gap-3">
                  {getStatusIcon(tx.status)}
                  <div>
                    <div className="font-medium">{tx.type}</div>
                    <div className="text-sm text-muted-foreground">{tx.timestamp}</div>
                  </div>
                </div>
                <div className="text-right">
                  {tx.amount !== "0" && <div className="font-medium">{tx.amount} SUI</div>}
                  <div className="text-sm text-muted-foreground">
                    {tx.signatures}/{tx.required} signatures
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
