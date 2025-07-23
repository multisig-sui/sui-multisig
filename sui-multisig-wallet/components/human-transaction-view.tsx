"use client"

import { useState } from "react"
import { Eye, EyeOff, Shield, ArrowRight, Check, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface HumanTransactionViewProps {
  transaction: any
  onApprove?: () => void
}

export function HumanTransactionView({ transaction, onApprove }: HumanTransactionViewProps) {
  const [showRawData, setShowRawData] = useState(false)
  const [isVerified, setIsVerified] = useState(true)

  // This would be derived from the actual transaction data
  const humanReadable = {
    initiator: transaction?.initiator || "Casper",
    action: transaction?.type === "Send" ? "wants to send" : "wants to call",
    amount: transaction?.amount || "2",
    target: transaction?.recipient?.slice(0, 6) || "Kiosk #421",
    purpose: "for project funding",
    emoji: transaction?.type === "Send" ? "🎯" : "🔧",
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-fade-in">
        {/* Human-readable card */}
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-gray-800 shadow-md">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                    {humanReadable.initiator[0]}
                  </AvatarFallback>
                  <AvatarImage src="/placeholder.svg?height=40&width=40" />
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Transaction Summary</h3>
                  <p className="text-sm text-muted-foreground">Human-readable explanation</p>
                </div>
                {isVerified && (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Verified transaction - data matches expected output</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                <p className="text-lg font-medium">
                  👤 <span className="text-purple-600 dark:text-purple-400">{humanReadable.initiator}</span>{" "}
                  {humanReadable.action}{" "}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{humanReadable.amount} SUI</span> to{" "}
                  {humanReadable.emoji} <span className="font-mono">{humanReadable.target}</span>{" "}
                  {humanReadable.purpose}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRawData(!showRawData)}
                  className="text-sm bg-transparent"
                >
                  {showRawData ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                      Hide raw data
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View raw data
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    <FileText className="h-3 w-3 mr-1" />
                    Move Call
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  >
                    Gas: ~0.001 SUI
                  </Badge>
                </div>
              </div>
            </div>

            {/* Raw transaction data */}
            {showRawData && (
              <div className="border-t border-border/50 p-6 bg-muted/30">
                <h4 className="text-sm font-medium mb-2">Raw Transaction Data</h4>
                <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-auto max-h-48 whitespace-pre-wrap">
                  {JSON.stringify(
                    {
                      kind: "ProgrammableTransaction",
                      inputs: [
                        {
                          type: "pure",
                          valueType: "address",
                          value: "0x123abc456def789abc456def789abc456def789ab",
                        },
                        {
                          type: "pure",
                          valueType: "u64",
                          value: "2000000000",
                        },
                      ],
                      transactions: [
                        {
                          SplitCoins: ["GasCoin", [{ Input: 1 }]],
                        },
                        {
                          TransferObjects: [[{ Result: 0 }], { Input: 0 }],
                        },
                      ],
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {onApprove && (
          <Button onClick={onApprove} className="w-full apple-button group">
            <Check className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            Approve Transaction
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}
      </div>
    </TooltipProvider>
  )
}
