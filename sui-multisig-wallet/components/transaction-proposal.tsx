"use client"

import { useState } from "react"
import { AlertTriangle, Eye, EyeOff, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createProposal } from "@/lib/supabase/proposals"
import { toast } from "sonner"
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import { toB64, MIST_PER_SUI } from "@mysten/sui/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { useWalletData } from "@/hooks/use-wallet-data"
import { saveProposal } from "@/lib/local-storage"
import { useWalletPublicKey } from "@/hooks/use-wallet-public-key"

interface TransactionProposalProps {
  walletId?: string
  multisigAddress?: string
  onComplete: () => void
}

// Predefined recipients
const PREDEFINED_RECIPIENTS = [
  {
    id: "alice",
    name: "Alice Johnson",
    address: "0x813b153e52760b0381ba58dc82ae0c3be246f8eb053d03b9578cdd85ee150cc6",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b9c7c9d2?w=100",
    initials: "AJ",
    role: "Team Lead"
  },
  {
    id: "bob",
    name: "Bob Smith", 
    address: "0xa1b2c3d4e5f6789012345678901234567890abcdef123456789012345678901234",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    initials: "BS",
    role: "Developer"
  },
  {
    id: "charlie",
    name: "Charlie Wilson",
    address: "0xdefabc1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100", 
    initials: "CW",
    role: "Designer"
  },
  {
    id: "diana",
    name: "Diana Lee",
    address: "0x9876543210fedcba0987654321fedcba0987654321fedcba0987654321fedcba",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
    initials: "DL", 
    role: "Product Manager"
  }
]

export function TransactionProposal({ walletId, multisigAddress, onComplete }: TransactionProposalProps) {
  const currentAccount = useCurrentAccount()
  const suiClient = useSuiClient()
  const { formattedPublicKey } = useWalletPublicKey()
  const [transactionType, setTransactionType] = useState("send")
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedRecipient, setSelectedRecipient] = useState<typeof PREDEFINED_RECIPIENTS[0] | null>(null)
  
  // Get wallet data for threshold information
  const walletData = walletId ? useWalletData(walletId) : null
  const { wallet, isLoading: isWalletLoading } = walletData || {}
  const [contractAddress, setContractAddress] = useState("")
  const [functionName, setFunctionName] = useState("")
  const [txArguments, setTxArguments] = useState("")
  const [showRawData, setShowRawData] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [rawTransactionData, setRawTransactionData] = useState<string>("")

  const handleCreateProposal = async () => {
    if (!walletId || !multisigAddress) {
      // If no wallet ID or multisig address, just simulate for demo
      setIsCreating(true)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setIsCreating(false)
      onComplete()
      return
    }

    if (!currentAccount) {
      toast.error("Please connect your wallet first")
      return
    }

    // Check if current user is a wallet owner
    // Need to compare with formatted public key (base64 with flag byte)
    const currentUserOwner = wallet?.owners?.find((o: any) => 
      o.public_key === formattedPublicKey ||
      o.address === currentAccount.address ||
      o.public_key === currentAccount.address
    )
    
    if (!currentUserOwner && wallet?.owners && wallet.owners.length > 0) {
      console.log('Current account address:', currentAccount.address)
      console.log('Current formatted public key:', formattedPublicKey)
      console.log('Wallet owners:', wallet.owners.map((o: any) => ({ name: o.name, public_key: o.public_key, address: o.address, type: o.type })))
      toast.error("You are not authorized to create proposals for this wallet. Please connect with a signer wallet.")
      return
    }

    setIsCreating(true)
    
    try {
      // Generate title based on transaction type
      let title = ""
      let description = ""
      let txBytesBase64 = ""
      
      if (transactionType === "send") {
        // Validate inputs
        if (!recipient || !amount) {
          toast.error("Recipient and amount are required")
          setIsCreating(false)
          return
        }

        const parsedAmount = parseFloat(amount)
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          toast.error("Invalid amount")
          setIsCreating(false)
          return
        }

        // Build the transaction
        const tx = new Transaction()
        tx.setSender(multisigAddress)
        tx.setGasBudget(10000000) // 0.01 SUI
        
        // Convert SUI to MIST using SDK constant
        const amountMist = BigInt(Math.floor(parsedAmount * Number(MIST_PER_SUI)))
        
        // Split coins and transfer
        const [coin] = tx.splitCoins(tx.gas, [amountMist])
        tx.transferObjects([coin], recipient)
        
        // Build transaction bytes
        const txBytes = await tx.build({ client: suiClient })
        txBytesBase64 = toB64(txBytes)
        
        // Set raw data for preview
        setRawTransactionData(JSON.stringify({
          sender: multisigAddress,
          recipient: recipient,
          amount: amount + " SUI",
          gasBudget: "0.01 SUI"
        }, null, 2))
        
        title = `Send ${amount} SUI`
        description = `Transfer ${amount} SUI to ${recipient}`
        
      } else if (transactionType === "contract") {
        // TODO: Implement contract call transaction building
        toast.error("Contract calls not yet implemented")
        setIsCreating(false)
        return
      } else {
        // TODO: Implement custom transaction support
        toast.error("Custom transactions not yet implemented")
        setIsCreating(false)
        return
      }
      
      // Check if this is a local wallet or Supabase wallet
      const isLocalWallet = walletId?.startsWith('wallet_')
      
      if (isLocalWallet) {
        // For local wallets, store proposals in localStorage
        const savedProposal = saveProposal({
          walletId: walletId,
          title,
          description,
          txBytes: txBytesBase64,
          createdBy: currentAccount.address,
          status: 'pending'
        })
        
        console.log('Saved local proposal:', savedProposal)
        toast.success("Transaction proposal created locally! Navigate to signatures to sign it.")
      } else {
        // Create proposal in Supabase for cloud wallets
        const proposalData = {
          wallet_id: walletId,
          title,
          description,
          tx_bytes: txBytesBase64,
          created_by: currentAccount.address,
          status: 'pending' as const
        }
        
        console.log('Creating proposal with data:', proposalData)
        
        await createProposal(proposalData)
        
        toast.success("Transaction proposal created! Other signers can now review and sign.")
      }
      
      onComplete()
    } catch (error) {
      console.error('Error creating proposal:', error)
      
      // Better error handling
      if (error instanceof Error) {
        toast.error(`Failed to create proposal: ${error.message}`)
      } else if (typeof error === 'object' && error !== null) {
        // Handle Supabase errors
        const errorObj = error as any
        if (errorObj.message) {
          toast.error(`Database error: ${errorObj.message}`)
        } else if (errorObj.code) {
          toast.error(`Error code ${errorObj.code}: Please check your wallet connection`)
        } else {
          toast.error("Failed to create proposal: Unknown database error")
        }
      } else {
        toast.error("Failed to create proposal: Please try again")
      }
    } finally {
      setIsCreating(false)
    }
  }

  const isValidProposal = () => {
    if (transactionType === "send") {
      return recipient && amount && Number.parseFloat(amount) > 0
    }
    if (transactionType === "contract") {
      return contractAddress && functionName
    }
    return false
  }

  return (
    <div className="responsive-container sidebar-responsive-content">
      <div className="max-w-adaptive max-w-6xl mx-auto">
        <div className="margin-responsive-y">
          <h1 className="text-responsive-xl font-bold mb-2">Propose Transaction</h1>
          <p className="text-muted-foreground">Create a new transaction proposal for multisig approval</p>
        </div>

        <div className="responsive-grid responsive-grid-2 gap-6">
          <Card className="responsive-card">
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
              <CardDescription>Configure the transaction parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="type">Transaction Type</Label>
                <Select value={transactionType} onValueChange={setTransactionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="send">Send SUI</SelectItem>
                    <SelectItem value="contract">Contract Call</SelectItem>
                    <SelectItem value="custom">Custom Transaction</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {transactionType === "send" && (
                <>
                  <div>
                    <Label htmlFor="recipient">Recipient</Label>
                    <div className="space-y-3">
                      {/* Predefined Recipients */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Quick Select:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {PREDEFINED_RECIPIENTS.map((person) => (
                            <HoverCard key={person.id}>
                              <HoverCardTrigger asChild>
                                <Button
                                  variant={selectedRecipient?.id === person.id ? "default" : "outline"}
                                  className="justify-start p-3 h-auto"
                                  onClick={() => {
                                    setSelectedRecipient(person)
                                    setRecipient(person.address)
                                  }}
                                >
                                  <Avatar className="h-6 w-6 mr-2">
                                    <AvatarImage src={person.avatar} alt={person.name} />
                                    <AvatarFallback className="text-xs">{person.initials}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{person.name}</span>
                                </Button>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-80">
                                <div className="flex justify-between gap-4">
                                  <Avatar>
                                    <AvatarImage src={person.avatar} alt={person.name} />
                                    <AvatarFallback>{person.initials}</AvatarFallback>
                                  </Avatar>
                                  <div className="space-y-1 flex-1">
                                    <h4 className="text-sm font-semibold">{person.name}</h4>
                                    <p className="text-sm text-muted-foreground">{person.role}</p>
                                    <div className="text-xs text-muted-foreground font-mono">
                                      {person.address.slice(0, 20)}...
                                    </div>
                                  </div>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          ))}
                        </div>
                      </div>
                      
                      {/* Custom Address Input */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Or enter custom address:</p>
                        <Input
                          id="recipient"
                          placeholder="0x..."
                          value={recipient}
                          onChange={(e) => {
                            setRecipient(e.target.value)
                            setSelectedRecipient(null)
                          }}
                          className="font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount (SUI)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </>
              )}

              {transactionType === "contract" && (
                <>
                  <div>
                    <Label htmlFor="contract">Contract Address</Label>
                    <Input
                      id="contract"
                      placeholder="0x..."
                      value={contractAddress}
                      onChange={(e) => setContractAddress(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="function">Function Name</Label>
                    <Input
                      id="function"
                      placeholder="function_name"
                      value={functionName}
                      onChange={(e) => setFunctionName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="args">Arguments (JSON)</Label>
                    <Textarea
                      id="args"
                      placeholder='["arg1", "arg2"]'
                      value={txArguments}
                      onChange={(e) => setTxArguments(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </>
              )}

              {transactionType === "custom" && (
                <div>
                  <Label htmlFor="custom">Raw Transaction Data</Label>
                  <Textarea
                    id="custom"
                    placeholder="Enter raw transaction bytes or JSON..."
                    className="font-mono min-h-[200px]"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="responsive-card">
            <CardHeader>
              <CardTitle>Transaction Preview</CardTitle>
              <CardDescription>Review the transaction before proposing</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="raw">Raw Data</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Type:</span>
                      <Badge variant="secondary">
                        {transactionType === "send"
                          ? "Send SUI"
                          : transactionType === "contract"
                            ? "Contract Call"
                            : "Custom"}
                      </Badge>
                    </div>

                    {transactionType === "send" && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Recipient:</span>
                          <div className="flex items-center gap-2">
                            {selectedRecipient ? (
                              <>
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={selectedRecipient.avatar} alt={selectedRecipient.name} />
                                  <AvatarFallback className="text-xs">{selectedRecipient.initials}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{selectedRecipient.name}</span>
                              </>
                            ) : (
                              <span className="text-sm font-mono">
                                {recipient ? `${recipient.slice(0, 10)}...` : "Not set"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Amount:</span>
                          <span className="text-sm font-bold">{amount || "0"} SUI</span>
                        </div>
                      </>
                    )}

                    {transactionType === "contract" && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Contract:</span>
                          <span className="text-sm font-mono">
                            {contractAddress ? `${contractAddress.slice(0, 10)}...` : "Not set"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Function:</span>
                          <span className="text-sm">{functionName || "Not set"}</span>
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Gas Fee:</span>
                      <span className="text-sm">~0.001 SUI</span>
                    </div>
                  </div>

                  {isValidProposal() && wallet && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This transaction will require {wallet.threshold} of {wallet.owners?.length || 0} signatures to execute.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {isValidProposal() && isWalletLoading && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>Loading wallet configuration...</AlertDescription>
                    </Alert>
                  )}
                  
                  {isValidProposal() && !wallet && !isWalletLoading && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>This transaction will require multisig approval to execute.</AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="raw" className="space-y-4">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRawData(!showRawData)}
                      className="absolute top-2 right-2 z-10"
                    >
                      {showRawData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <pre
                      className={`p-4 bg-muted rounded-lg text-xs font-mono overflow-auto max-h-[300px] ${
                        showRawData ? "" : "filter blur-sm"
                      }`}
                    >
                      {rawTransactionData}
                    </pre>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Raw transaction data for verification. Click the eye icon to reveal.
                  </p>
                </TabsContent>
              </Tabs>

              <div className="mt-6 space-y-4">
                <Button onClick={handleCreateProposal} disabled={!isValidProposal() || isCreating} className="w-full">
                  {isCreating ? (
                    "Creating Proposal..."
                  ) : (
                    <>
                      Create Proposal
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Once created, this proposal will be sent to all signers for approval
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
