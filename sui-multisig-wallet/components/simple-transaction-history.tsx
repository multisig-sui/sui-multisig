"use client"

import { useState } from "react"
import { Search, CheckCircle, Clock, XCircle, ExternalLink, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRealtimeWallet } from "@/hooks/use-realtime-wallet"
import { formatDistanceToNow } from "date-fns"

interface SimpleTransactionHistoryProps {
  walletId?: string
  onViewTransaction: (id: string) => void
}

export function SimpleTransactionHistory({ walletId, onViewTransaction }: SimpleTransactionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  // Use real data if walletId is provided
  const { proposals, wallet, isLoading } = walletId 
    ? useRealtimeWallet(walletId)
    : { proposals: [], wallet: null, isLoading: false }

  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || proposal.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "executed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "failed":
      case "cancelled":
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
      cancelled: "destructive",
      executing: "secondary",
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
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transactions ({filteredProposals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProposals.map((proposal) => {
                const totalWeight = proposal.signatures.reduce((sum, sig) => sum + (sig.owner?.weight || 0), 0)
                const threshold = wallet?.threshold || 2
                
                return (
                  <div
                    key={proposal.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onViewTransaction(proposal.id)}
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(proposal.status)}
                      <div>
                        <div className="font-medium">{proposal.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {proposal.description && (
                          <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {proposal.description}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {totalWeight}/{threshold} weight collected
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(proposal.status)}
                        {proposal.executed_digest && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(`https://suiexplorer.com/txblock/${proposal.executed_digest}`, "_blank")
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {filteredProposals.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No transactions found</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
