"use client"

import { useState } from "react"
import { Search, CheckCircle, Clock, XCircle, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface SimpleTransactionHistoryProps {
  onViewTransaction: (id: string) => void
}

const mockTransactions = [
  {
    id: "tx_001",
    hash: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
    type: "Send SUI",
    status: "executed",
    amount: "150.5",
    timestamp: new Date("2024-01-15T10:30:00Z"),
    signatures: { collected: 2, required: 2 },
  },
  {
    id: "tx_002",
    hash: "0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    type: "Contract Call",
    status: "pending",
    amount: "0",
    timestamp: new Date("2024-01-15T09:15:00Z"),
    signatures: { collected: 1, required: 2 },
  },
  {
    id: "tx_003",
    hash: "0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
    type: "Send SUI",
    status: "failed",
    amount: "75.25",
    timestamp: new Date("2024-01-14T16:45:00Z"),
    signatures: { collected: 2, required: 2 },
  },
]

export function SimpleTransactionHistory({ onViewTransaction }: SimpleTransactionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredTransactions = mockTransactions.filter((tx) => {
    const matchesSearch =
      tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter
    return matchesSearch && matchesStatus
  })

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

  const getStatusBadge = (status: string) => {
    const variants = {
      executed: "default",
      pending: "secondary",
      failed: "destructive",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <p className="text-muted-foreground">Complete history of wallet transactions</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="executed">Executed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transactions ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onViewTransaction(tx.id)}
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(tx.status)}
                  <div>
                    <div className="font-medium">{tx.type}</div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {tx.amount !== "0" && <div className="font-medium">{tx.amount} SUI</div>}
                    <div className="text-sm text-muted-foreground">
                      {tx.signatures.collected}/{tx.signatures.required} signatures
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(tx.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(`https://suiexplorer.com/txblock/${tx.hash}`, "_blank")
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredTransactions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
