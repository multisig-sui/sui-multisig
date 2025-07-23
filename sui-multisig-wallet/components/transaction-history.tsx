"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Filter,
  ExternalLink,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"

interface TransactionHistoryProps {
  onViewTransaction: (id: string) => void
}

// Hardcoded transaction data for demonstration
const mockTransactions = [
  {
    id: "tx_001",
    hash: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
    type: "SUI Transfer",
    status: "executed",
    amount: "150.5",
    recipient: "0xabcd1234567890abcdef1234567890abcdef1234",
    timestamp: new Date("2024-01-15T10:30:00Z"),
    signatures: { collected: 2, required: 2 },
    gasUsed: "0.001234",
    blockHeight: 12345678,
  },
  {
    id: "tx_002",
    hash: "0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    type: "Contract Call",
    status: "pending",
    amount: "0",
    recipient: "0xdef456789abcdef123456789abcdef123456789ab",
    timestamp: new Date("2024-01-15T09:15:00Z"),
    signatures: { collected: 1, required: 2 },
    gasUsed: "0.002156",
    contractMethod: "swap_tokens",
    blockHeight: null,
  },
  {
    id: "tx_003",
    hash: "0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
    type: "SUI Transfer",
    status: "failed",
    amount: "75.25",
    recipient: "0x789xyz123456789abcdef123456789abcdef123456",
    timestamp: new Date("2024-01-14T16:45:00Z"),
    signatures: { collected: 2, required: 2 },
    gasUsed: "0.000987",
    blockHeight: 12345650,
    failureReason: "Insufficient balance",
  },
  {
    id: "tx_004",
    hash: "0x4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    type: "Contract Call",
    status: "executed",
    amount: "25.0",
    recipient: "0x456def789abcdef123456789abcdef123456789de",
    timestamp: new Date("2024-01-14T14:20:00Z"),
    signatures: { collected: 3, required: 3 },
    gasUsed: "0.003421",
    contractMethod: "stake_tokens",
    blockHeight: 12345620,
  },
  {
    id: "tx_005",
    hash: "0x5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
    type: "SUI Transfer",
    status: "pending",
    amount: "200.0",
    recipient: "0x123abc456def789abc456def789abc456def789ab",
    timestamp: new Date("2024-01-14T11:30:00Z"),
    signatures: { collected: 0, required: 2 },
    gasUsed: "0.001567",
    blockHeight: null,
  },
  {
    id: "tx_006",
    hash: "0x6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234",
    type: "Contract Call",
    status: "executed",
    amount: "0",
    recipient: "0xabc123def456789abc123def456789abc123def45",
    timestamp: new Date("2024-01-13T18:10:00Z"),
    signatures: { collected: 2, required: 2 },
    gasUsed: "0.004123",
    contractMethod: "create_pool",
    blockHeight: 12345580,
  },
]

export function TransactionHistory({ onViewTransaction }: TransactionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sortBy, setSortBy] = useState("timestamp")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})

  const filteredAndSortedTransactions = useMemo(() => {
    const filtered = mockTransactions.filter((tx) => {
      const matchesSearch =
        tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.recipient.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || tx.status === statusFilter
      const matchesType = typeFilter === "all" || tx.type === typeFilter

      const matchesDateRange =
        (!dateRange.from || tx.timestamp >= dateRange.from) && (!dateRange.to || tx.timestamp <= dateRange.to)

      return matchesSearch && matchesStatus && matchesType && matchesDateRange
    })

    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a]
      let bValue: any = b[sortBy as keyof typeof b]

      if (sortBy === "timestamp") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [searchTerm, statusFilter, typeFilter, sortBy, sortOrder, dateRange])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "executed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const exportTransactions = () => {
    const dataStr = JSON.stringify(filteredAndSortedTransactions, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "transaction-history.json"
    link.click()
  }

  return (
    <TooltipProvider>
      <div className="container-app py-8 space-section animate-fade-in">
        <div className="max-w-adaptive max-w-7xl mx-auto">
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 animate-slide-up">
              <div className="space-y-2">
                <h1 className="text-headline">Transaction History</h1>
                <p className="text-body text-muted-foreground max-w-2xl">
                  Complete history of all wallet transactions with advanced filtering
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={exportTransactions}
                  className="apple-button-secondary bg-transparent"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export History
                </Button>
                <Button variant="outline" className="apple-button-secondary bg-transparent">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Filters and Search */}
            <Card className="elevated-card">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-title">Filters & Search</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-gray-200 dark:border-gray-800 focus-ring"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-12 rounded-xl border-gray-200 dark:border-gray-800">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="executed">Executed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-12 rounded-xl border-gray-200 dark:border-gray-800">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="SUI Transfer">SUI Transfer</SelectItem>
                      <SelectItem value="Contract Call">Contract Call</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={`${sortBy}-${sortOrder}`}
                    onValueChange={(value) => {
                      const [field, order] = value.split("-")
                      setSortBy(field)
                      setSortOrder(order as "asc" | "desc")
                    }}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-gray-200 dark:border-gray-800">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="timestamp-desc">Newest First</SelectItem>
                      <SelectItem value="timestamp-asc">Oldest First</SelectItem>
                      <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                      <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
                  <Badge variant="outline" className="px-3 py-1">
                    {filteredAndSortedTransactions.length} transactions
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Transaction List */}
            <Card className="elevated-card">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-title">Transaction List</CardTitle>
                    <CardDescription>
                      {filteredAndSortedTransactions.length} of {mockTransactions.length} transactions
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredAndSortedTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 border border-gray-200/60 dark:border-gray-800/60 rounded-2xl hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 cursor-pointer interactive-subtle"
                      onClick={() => onViewTransaction(tx.id)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-xl ${
                              tx.status === "executed"
                                ? "bg-green-100 dark:bg-green-900/30"
                                : tx.status === "failed"
                                  ? "bg-red-100 dark:bg-red-900/30"
                                  : "bg-yellow-100 dark:bg-yellow-900/30"
                            }`}
                          >
                            {getStatusIcon(tx.status)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm">{tx.type}</p>
                              {getStatusBadge(tx.status)}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="font-mono truncate">
                                {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                              </span>
                              <span className="whitespace-nowrap">{tx.timestamp.toLocaleDateString()}</span>
                              <span className="whitespace-nowrap hidden sm:inline">
                                {tx.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          {tx.amount !== "0" && <p className="font-semibold text-sm">{tx.amount} SUI</p>}
                          <p className="text-xs text-muted-foreground">Gas: {tx.gasUsed} SUI</p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-semibold mb-1">
                            {tx.signatures.collected}/{tx.signatures.required} sigs
                          </p>
                          <div className="w-12 sm:w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 rounded-full"
                              style={{
                                width: `${(tx.signatures.collected / tx.signatures.required) * 100}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyToClipboard(tx.hash)
                                }}
                                className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy hash</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(`https://suiexplorer.com/txblock/${tx.hash}`, "_blank")
                                }}
                                className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View on explorer</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredAndSortedTransactions.length === 0 && (
                    <div className="text-center py-16">
                      <div className="text-muted-foreground">
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
                        <p className="text-body">Try adjusting your search criteria or filters</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
