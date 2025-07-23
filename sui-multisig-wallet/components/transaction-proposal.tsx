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

interface TransactionProposalProps {
  onComplete: () => void
}

export function TransactionProposal({ onComplete }: TransactionProposalProps) {
  const [transactionType, setTransactionType] = useState("send")
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [contractAddress, setContractAddress] = useState("")
  const [functionName, setFunctionName] = useState("")
  const [txArguments, setTxArguments] = useState("")
  const [showRawData, setShowRawData] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Mock raw transaction data
  const rawTransactionData = `{
  "kind": "ProgrammableTransaction",
  "inputs": [
    {
      "type": "pure",
      "valueType": "address",
      "value": "${recipient}"
    },
    {
      "type": "pure", 
      "valueType": "u64",
      "value": "${amount}000000000"
    }
  ],
  "transactions": [
    {
      "SplitCoins": [
        "GasCoin",
        [
          {
            "Input": 1
          }
        ]
      ]
    },
    {
      "TransferObjects": [
        [
          {
            "Result": 0
          }
        ],
        {
          "Input": 0
        }
      ]
    }
  ]
}`

  const createProposal = async () => {
    setIsCreating(true)
    // Simulate proposal creation
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsCreating(false)
    onComplete()
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
                    <Label htmlFor="recipient">Recipient Address</Label>
                    <Input
                      id="recipient"
                      placeholder="0x..."
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="font-mono"
                    />
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
                          <span className="text-sm font-mono">
                            {recipient ? `${recipient.slice(0, 10)}...` : "Not set"}
                          </span>
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

                  {isValidProposal() && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>This transaction will require 2 of 3 signatures to execute.</AlertDescription>
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
                <Button onClick={createProposal} disabled={!isValidProposal() || isCreating} className="w-full">
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
