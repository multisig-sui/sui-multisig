"use client"

import { useState } from "react"
import { ArrowLeft, Check, Clock, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface SimpleSignatureFlowProps {
  transactionId: string | null
  onNavigate: (view: string) => void
}

export function SimpleSignatureFlow({ transactionId, onNavigate }: SimpleSignatureFlowProps) {
  const [isSigning, setIsSigning] = useState(false)

  // Mock transaction data
  const transaction = {
    id: "tx_123",
    type: "Send SUI",
    amount: "100 SUI",
    recipient: "0xabcd1234...",
    threshold: { required: 2, total: 3 },
    signers: [
      { id: "1", name: "Alice", signed: true, timestamp: "2 hours ago" },
      { id: "2", name: "Bob", signed: false, timestamp: null },
      { id: "3", name: "Charlie", signed: false, timestamp: null },
    ],
  }

  const signedCount = transaction.signers.filter((s) => s.signed).length
  const progress = (signedCount / transaction.threshold.required) * 100
  const canExecute = signedCount >= transaction.threshold.required

  const handleSign = async () => {
    setIsSigning(true)
    // Simulate signing
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsSigning(false)
  }

  if (!transactionId) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">No Transaction Selected</h2>
        <p className="text-muted-foreground mb-6">Select a pending transaction to review and sign</p>
        <Button onClick={() => onNavigate("dashboard")}>Return to Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 fade-in">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => onNavigate("dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Transaction Review</h1>
          <p className="text-muted-foreground">Review and sign the transaction</p>
        </div>
      </div>

      {/* Transaction Details */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Type</div>
              <div className="font-medium">{transaction.type}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Amount</div>
              <div className="font-medium">{transaction.amount}</div>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-muted-foreground">Recipient</div>
              <div className="font-mono text-sm">{transaction.recipient}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Signature Collection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>
                {signedCount} of {transaction.threshold.required} required
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-3">
            {transaction.signers.map((signer) => (
              <div key={signer.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{signer.name}</div>
                    {signer.timestamp && <div className="text-xs text-muted-foreground">{signer.timestamp}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {signer.signed ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Signed
                      </Badge>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <Badge variant="secondary">Pending</Badge>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSign} disabled={isSigning} className="flex-1">
              {isSigning ? "Signing..." : "Sign Transaction"}
            </Button>
            {canExecute && (
              <Button variant="default" className="flex-1">
                Execute Transaction
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
