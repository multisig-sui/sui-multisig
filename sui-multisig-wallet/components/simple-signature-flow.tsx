"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Check, Clock, User, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useRealtimeProposal } from "@/hooks/use-realtime-proposal"
import { useRealtimeWallet } from "@/hooks/use-realtime-wallet"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { submitSignature, updateProposalStatus } from "@/lib/supabase/proposals"
import { useCurrentAccount, useSignTransaction, useSuiClient } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import { fromB64 } from "@mysten/sui/utils"
import { MultiSigPublicKey } from "@mysten/sui/multisig"
import { parseSuiPublicKey } from "@/lib/sui-utils"

interface SimpleSignatureFlowProps {
  transactionId: string | null
  walletId?: string
  onNavigate: (view: string) => void
}

export function SimpleSignatureFlow({ transactionId, walletId, onNavigate }: SimpleSignatureFlowProps) {
  const [isSigning, setIsSigning] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const currentAccount = useCurrentAccount()
  const suiClient = useSuiClient()
  const { mutateAsync: signTransaction } = useSignTransaction()
  
  const proposalData = useRealtimeProposal(transactionId)
  const walletData = walletId 
    ? useRealtimeWallet(walletId)
    : { wallet: null }
  
  const { proposal, isLoading, error } = proposalData
  const { wallet } = walletData

  // Calculate signature progress
  const calculateTotalWeight = () => {
    if (!proposal?.signatures || !wallet) return 0
    
    // For Supabase mode
    return proposal.signatures.reduce((sum, sig) => sum + (sig.owner?.weight || 0), 0)
  }
  
  const totalWeight = calculateTotalWeight()
  const threshold = wallet?.threshold || 2
  const progress = (totalWeight / threshold) * 100
  const canExecute = totalWeight >= threshold
  
  // Check if current user has already signed
  const currentUserOwner = wallet?.owners?.find(o => o.public_key === currentAccount?.address)
    
  const hasCurrentUserSigned = proposal?.signatures.some(s => s.owner_id === currentUserOwner?.id)

  const handleSign = async () => {
    if (!walletId || !currentAccount || !currentUserOwner || !proposal) {
      toast.error("Unable to sign. Please ensure you're connected with a valid signer.")
      return
    }

    if (hasCurrentUserSigned) {
      toast.info("You have already signed this transaction")
      return
    }

    setIsSigning(true)
    
    try {
      // Parse the transaction bytes from base64
      const txBytes = fromB64(proposal.tx_bytes)
      
      // Sign the transaction with the connected wallet
      const { signature } = await signTransaction({
        transaction: Transaction.from(txBytes),
        account: currentAccount,
        chain: currentAccount.chains.find(c => c.startsWith('sui:')) || currentAccount.chains[0]
      })
      
      // Submit the real signature
      await submitSignature({
        proposalId: proposal.id,
        ownerId: currentUserOwner.id,
        signature: signature
      })
      
      toast.success("Successfully signed the transaction!")
    } catch (error) {
      console.error('Error signing transaction:', error)
      toast.error("Failed to sign transaction")
    } finally {
      setIsSigning(false)
    }
  }

  const handleExecute = async () => {
    if (!proposal || !wallet) {
      toast.error("Unable to execute. Missing transaction or wallet data.")
      return
    }

    setIsExecuting(true)

    try {
      // Build the MultiSigPublicKey from wallet owners
      const parsedPublicKeys = wallet.owners.map(owner => ({
        publicKey: parseSuiPublicKey(owner.public_key, (owner.metadata as any)?.originalKeyScheme || owner.type),
        weight: owner.weight
      }))

      const multiSigPublicKey = MultiSigPublicKey.fromPublicKeys({
        threshold: wallet.threshold,
        publicKeys: parsedPublicKeys
      })

      // Collect all signatures
      const signatures = proposal.signatures.map(sig => sig.signature)

      // Combine signatures
      const combinedSignature = multiSigPublicKey.combinePartialSignatures(signatures)

      // Execute transaction on-chain
      const { digest } = await suiClient.executeTransactionBlock({
        transactionBlock: proposal.tx_bytes,
        signature: combinedSignature,
        options: { showEffects: true, showObjectChanges: true }
      })

      // Update proposal status
      await updateProposalStatus(proposal.id, 'executed', digest)

      toast.success(`Transaction executed successfully! Digest: ${digest.slice(0, 10)}...`)
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        onNavigate("dashboard")
      }, 2000)
    } catch (error) {
      console.error('Error executing transaction:', error)
      toast.error("Failed to execute transaction")
    } finally {
      setIsExecuting(false)
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !proposal) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Transaction Not Found</h2>
        <p className="text-muted-foreground mb-6">Unable to load the transaction details</p>
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
              <div className="text-sm text-muted-foreground">Title</div>
              <div className="font-medium">{proposal.title}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge variant={proposal.status === 'executed' ? 'default' : 'secondary'}>
                {proposal.status}
              </Badge>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-muted-foreground">Description</div>
              <div className="text-sm">{proposal.description || 'No description'}</div>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="text-sm">
                {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true })}
              </div>
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
                {totalWeight} of {threshold} weight required
              </span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-2" />
          </div>

          <div className="space-y-3">
            {wallet?.owners.map((owner) => {
              const signature = proposal.signatures.find(s => s.owner_id === owner.id)
              const isSigned = !!signature
              
              return (
                <div key={owner.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{owner.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Weight: {owner.weight} | Type: {owner.type}
                      </div>
                      {isSigned && signature && (
                        <div className="text-xs text-muted-foreground">
                          Signed {formatDistanceToNow(new Date(signature.signed_at), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSigned ? (
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
              )
            })}
          </div>

          <div className="flex gap-3">
            {proposal.status === 'pending' && (
              <>
                {!hasCurrentUserSigned && currentUserOwner && (
                  <Button 
                    onClick={handleSign} 
                    disabled={isSigning || !currentAccount} 
                    className="flex-1"
                  >
                    {isSigning ? "Signing..." : "Sign Transaction"}
                  </Button>
                )}
                {hasCurrentUserSigned && (
                  <Button disabled className="flex-1">
                    <Check className="h-4 w-4 mr-2" />
                    You've Signed
                  </Button>
                )}
                {canExecute && (
                  <Button 
                    variant="default" 
                    className="flex-1"
                    onClick={handleExecute}
                    disabled={isExecuting}
                  >
                    {isExecuting ? "Executing..." : "Execute Transaction"}
                  </Button>
                )}
              </>
            )}
            {proposal.status === 'executed' && (
              <Button disabled className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Transaction Executed
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
