"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Check, Clock, User, Loader2, Copy, ExternalLink, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useRealtimeProposal } from "@/hooks/use-realtime-proposal"
import { useWalletData } from "@/hooks/use-wallet-data"
import { useWalletPublicKey } from "@/hooks/use-wallet-public-key"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { submitSignature, updateProposalStatus } from "@/lib/supabase/proposals"
import { addSignature, updateProposalStatus as updateLocalProposalStatus } from "@/lib/local-storage"
import { useCurrentAccount, useSignTransaction, useSuiClient } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import { fromBase64 } from "@mysten/sui/utils"
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
  const [executionSuccessDigest, setExecutionSuccessDigest] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  const currentAccount = useCurrentAccount()
  const suiClient = useSuiClient()
  const { mutateAsync: signTransaction } = useSignTransaction()
  const { formattedPublicKey } = useWalletPublicKey()
  
  // Use walletData hook that supports both local and Supabase wallets
  const walletData = walletId ? useWalletData(walletId) : null
  const { wallet, proposals = [], isLoading: isWalletLoading, error: walletError } = walletData || {}
  
  // Find the specific proposal from wallet proposals
  const proposal = proposals.find((p: any) => p.id === transactionId) || null
  const isLoading = isWalletLoading
  const error = walletError

  // Calculate signature progress
  const calculateTotalWeight = () => {
    if (!proposal?.signatures || !wallet) return 0
    
    // Check if this is a local wallet or Supabase wallet
    const isLocalWallet = walletId?.startsWith('wallet_')
    
    if (isLocalWallet) {
      // For local wallets, find the owner by matching signature's signerPublicKey
      return proposal.signatures.reduce((sum: number, sig: any) => {
        const owner = wallet.owners.find((o: any) => o.public_key === sig.signerPublicKey)
        return sum + (owner?.weight || 0)
      }, 0)
    } else {
      // For Supabase mode, owner is already included in signature
      return proposal.signatures.reduce((sum: number, sig: any) => sum + (sig.owner?.weight || 0), 0)
    }
  }
  
  const totalWeight = calculateTotalWeight()
  const threshold = wallet?.threshold || 2
  const progress = (totalWeight / threshold) * 100
  const canExecute = totalWeight >= threshold

  
  // Check if current user has already signed
  const currentUserOwner = wallet?.owners?.find((o: any) => 
    o.public_key === formattedPublicKey ||
    o.address === currentAccount?.address ||
    o.public_key === currentAccount?.address
  )
    
  const hasCurrentUserSigned = proposal?.signatures.some((s: any) => s.owner_id === currentUserOwner?.id)

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
      const txBytes = fromBase64(proposal.tx_bytes)
      
      // Sign the transaction with the connected wallet
      const { signature } = await signTransaction({
        transaction: Transaction.from(txBytes),
        account: currentAccount,
        chain: currentAccount.chains.find(c => c.startsWith('sui:')) || currentAccount.chains[0]
      })
      
      // Check if this is a local wallet or Supabase wallet
      const isLocalWallet = walletId?.startsWith('wallet_')
      
      if (isLocalWallet) {
        // For local wallets, store signature in localStorage
        addSignature(proposal.id, formattedPublicKey!, signature)
        
        // Trigger a page refresh to show updated data
        window.location.reload()
      } else {
        // Submit to Supabase for cloud wallets
        await submitSignature({
          proposalId: proposal.id,
          ownerId: currentUserOwner.id,
          signature: signature
        })
      }
      
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
      const parsedPublicKeys = wallet.owners.map((owner: any) => ({
        publicKey: parseSuiPublicKey(owner.public_key, (owner.metadata as any)?.originalKeyScheme || owner.type),
        weight: owner.weight
      }))

      const multiSigPublicKey = MultiSigPublicKey.fromPublicKeys({
        threshold: wallet.threshold,
        publicKeys: parsedPublicKeys
      })

      // Collect all signatures
      const signatures = proposal.signatures.map((sig: any) => sig.signature)

      // Combine signatures
      const combinedSignature = multiSigPublicKey.combinePartialSignatures(signatures)

      // Execute transaction on-chain
      const { digest } = await suiClient.executeTransactionBlock({
        transactionBlock: proposal.tx_bytes,
        signature: combinedSignature,
        options: { showEffects: true, showObjectChanges: true }
      })

      // Update proposal status
      const isLocalWallet = walletId?.startsWith('wallet_')
      
      if (isLocalWallet) {
        // For local wallets, update status in localStorage
        updateLocalProposalStatus(proposal.id, 'executed', digest)
      } else {
        // For Supabase wallets, update in database
        await updateProposalStatus(proposal.id, 'executed', digest)
      }

      // Set success state instead of auto-navigating
      setExecutionSuccessDigest(digest)
      toast.success(`Transaction executed successfully!`)
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
            {wallet?.owners.map((owner: any) => {
              // Check if this is a local wallet or Supabase wallet
              const isLocalWallet = walletId?.startsWith('wallet_')
              
              const signature = isLocalWallet 
                ? proposal.signatures.find((s: any) => s.signerPublicKey === owner.public_key)
                : proposal.signatures.find((s: any) => s.owner_id === owner.id)
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
            {(proposal.status === 'pending' && !executionSuccessDigest) && (
              <>
                {!hasCurrentUserSigned && currentUserOwner && (
                  <Button 
                    onClick={handleSign} 
                    disabled={isSigning || !currentAccount || !!executionSuccessDigest} 
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
                    disabled={isExecuting || !!executionSuccessDigest}
                  >
                    {isExecuting ? "Executing..." : "Execute Transaction"}
                  </Button>
                )}
              </>
            )}
            {(proposal.status === 'executed' || executionSuccessDigest) && (
              <Button disabled className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                Transaction Executed
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Success State Display */}
      {executionSuccessDigest && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              <CardTitle className="text-green-800 dark:text-green-200">Transaction Executed Successfully!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-green-700 dark:text-green-300 mb-2">Transaction Digest:</div>
              <div className="bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 rounded-lg p-3 font-mono text-sm break-all text-gray-900 dark:text-gray-100">
                {executionSuccessDigest}
              </div>
            </div>
            
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(executionSuccessDigest)
                  setCopySuccess('Digest copied!')
                  setTimeout(() => setCopySuccess(null), 2000)
                }}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Digest
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-2"
              >
                <a 
                  href={`https://suiscan.xyz/testnet/tx/${executionSuccessDigest}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on Suiscan
                </a>
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={() => onNavigate("dashboard")}
              >
                Return to Dashboard
              </Button>
            </div>
            
            {copySuccess && (
              <div className="text-center">
                <div className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                  <Check className="h-4 w-4" />
                  {copySuccess}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
