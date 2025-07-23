"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HumanTransactionView } from "@/components/human-transaction-view"
import { CollaborativeSignatureFlow } from "@/components/collaborative-signature-flow"
import { QrSignatureFlow } from "@/components/qr-signature-flow"
import { TransactionSuccess } from "@/components/transaction-success"

interface SignatureCollectionProps {
  transactionId: string | null
  onNavigate: (view: string) => void
}

export function SignatureCollection({ transactionId, onNavigate }: SignatureCollectionProps) {
  const [step, setStep] = useState<"review" | "collect" | "success">("review")
  const [offlineSignature, setOfflineSignature] = useState("")

  // Mock transaction data
  const transaction = {
    id: "tx_123",
    type: "Send SUI",
    amount: "100 SUI",
    recipient: "0xabcd1234...",
    status: "pending",
    created: "2 hours ago",
    initiator: "Casper",
    hash: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
    threshold: { required: 2, total: 3 },
    signatures: [
      {
        id: "1",
        signer: "Alice",
        address: "0xabc123...",
        hasSigned: true,
        signedAt: new Date(Date.now() - 3600000),
        walletType: "zkLogin" as const,
      },
      {
        id: "2",
        signer: "Bob",
        address: "0xdef456...",
        hasSigned: false,
        walletType: "Ledger" as const,
      },
      {
        id: "3",
        signer: "Charlie",
        address: "0x789xyz...",
        hasSigned: false,
        walletType: "Suiet" as const,
      },
    ],
  }

  const handleApproveTransaction = () => {
    setStep("collect")
  }

  const handleSignatureReceived = (signature: string) => {
    setOfflineSignature(signature)
    // In a real app, we would verify and process the signature here
    setTimeout(() => {
      setStep("success")
    }, 1000)
  }

  if (!transactionId) {
    return (
      <div className="container-app py-8">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">No Transaction Selected</h2>
          <p className="text-muted-foreground mb-6">Select a pending transaction to view signature collection</p>
          <Button onClick={() => onNavigate("dashboard")}>Return to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-app py-8 space-section animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => onNavigate("dashboard")} className="apple-button-secondary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-headline">Transaction Approval</h1>
            <p className="text-body text-muted-foreground">Review and sign the transaction</p>
          </div>
        </div>

        {step === "review" && (
          <div className="space-y-8">
            <HumanTransactionView transaction={transaction} onApprove={handleApproveTransaction} />
          </div>
        )}

        {step === "collect" && (
          <div className="space-y-8">
            <CollaborativeSignatureFlow
              signers={transaction.signatures}
              requiredSignatures={transaction.threshold.required}
            />

            <QrSignatureFlow
              transactionId={transaction.id}
              transactionData={transaction.hash}
              onSignatureReceived={handleSignatureReceived}
            />
          </div>
        )}

        {step === "success" && (
          <TransactionSuccess
            transactionHash={transaction.hash}
            amount="100"
            recipient="0xabcd1234..."
            onContinue={() => onNavigate("dashboard")}
          />
        )}
      </div>
    </div>
  )
}
