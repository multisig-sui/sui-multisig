"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Trash2, Upload, Download, ArrowRight, ArrowLeft, Check, Shield, Users, Key } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CreateWalletFlowProps {
  onComplete: () => void
}

interface Signer {
  id: string
  name: string
  publicKey: string
  weight: number
}

export function CreateWalletFlow({ onComplete }: CreateWalletFlowProps) {
  const [step, setStep] = useState(1)
  const [threshold, setThreshold] = useState(2)
  const [signers, setSigners] = useState<Signer[]>([
    { id: "1", name: "", publicKey: "", weight: 1 },
    { id: "2", name: "", publicKey: "", weight: 1 },
  ])
  const [isCreating, setIsCreating] = useState(false)

  const addSigner = () => {
    const newSigner: Signer = {
      id: Date.now().toString(),
      name: "",
      publicKey: "",
      weight: 1,
    }
    setSigners([...signers, newSigner])
  }

  const removeSigner = (id: string) => {
    if (signers.length > 2) {
      setSigners(signers.filter((s) => s.id !== id))
    }
  }

  const updateSigner = (id: string, field: keyof Signer, value: string | number) => {
    setSigners(signers.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string)
          setSigners(config.signers || [])
          setThreshold(config.threshold || 2)
        } catch (error) {
          console.error("Invalid configuration file")
        }
      }
      reader.readAsText(file)
    }
  }

  const exportConfig = () => {
    const config = { signers, threshold }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "multisig-config.json"
    a.click()
  }

  const createWallet = async () => {
    setIsCreating(true)
    // Simulate wallet creation
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setIsCreating(false)
    setStep(4)
  }

  const totalWeight = signers.reduce((sum, signer) => sum + signer.weight, 0)
  const isValidConfig = signers.every((s) => s.name && s.publicKey) && threshold <= totalWeight

  const steps = [
    { number: 1, title: "Configure", description: "Set up signers and threshold" },
    { number: 2, title: "Review", description: "Verify configuration" },
    { number: 3, title: "Create", description: "Deploy wallet" },
    { number: 4, title: "Complete", description: "Wallet ready" },
  ]

  return (
    <div className="container-app py-8 space-section animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4 animate-slide-up">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl shadow-blue-500/25 mx-auto">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-headline">Create Multisig Wallet</h1>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Set up a new secure multisig wallet with customizable threshold policies
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <div className="relative">
          <Progress value={(step / 4) * 100} className="h-2 bg-gray-200 dark:bg-gray-800" />
          <div className="flex justify-between mt-4">
            {steps.map((stepItem, index) => (
              <div key={stepItem.number} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    step >= stepItem.number
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                  }`}
                >
                  {step > stepItem.number ? <Check className="h-4 w-4" /> : stepItem.number}
                </div>
                <div className="text-center mt-2">
                  <p className="text-sm font-semibold">{stepItem.title}</p>
                  <p className="text-xs text-muted-foreground">{stepItem.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-6xl mx-auto animate-slide-up" style={{ animationDelay: "0.2s" }}>
        {step === 1 && (
          <Card className="elevated-card">
            <CardHeader className="text-center pb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-title">Configure Signers & Threshold</CardTitle>
              </div>
              <CardDescription className="text-body">
                Add co-signers and set the signature threshold for your multisig wallet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-content">
              {/* Import/Export Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("file-import")?.click()}
                  className="apple-button-secondary"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Config
                </Button>
                <Button variant="outline" onClick={exportConfig} className="apple-button-secondary bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Export Config
                </Button>
                <input id="file-import" type="file" accept=".json" onChange={handleFileImport} className="hidden" />
              </div>

              {/* Threshold Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="glass-card p-6 rounded-2xl">
                  <Label htmlFor="threshold" className="text-sm font-semibold mb-3 block">
                    Signature Threshold
                  </Label>
                  <Select value={threshold.toString()} onValueChange={(value) => setThreshold(Number.parseInt(value))}>
                    <SelectTrigger className="h-12 rounded-xl border-gray-200 dark:border-gray-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: signers.length }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} of {signers.length} signatures required
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="glass-card p-6 rounded-2xl">
                  <Label className="text-sm font-semibold mb-3 block">Total Weight</Label>
                  <div className="h-12 px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl bg-muted flex items-center">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {totalWeight}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Signers Configuration */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Signers Configuration</Label>
                  <Button onClick={addSigner} className="apple-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Signer
                  </Button>
                </div>

                <div className="space-y-4">
                  {signers.map((signer, index) => (
                    <Card key={signer.id} className="modern-card">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor={`name-${signer.id}`} className="text-sm font-semibold mb-2 block">
                              Signer Name
                            </Label>
                            <Input
                              id={`name-${signer.id}`}
                              placeholder="Enter name"
                              value={signer.name}
                              onChange={(e) => updateSigner(signer.id, "name", e.target.value)}
                              className="h-12 rounded-xl border-gray-200 dark:border-gray-800 focus-ring"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor={`key-${signer.id}`} className="text-sm font-semibold mb-2 block">
                              Public Key
                            </Label>
                            <Input
                              id={`key-${signer.id}`}
                              placeholder="0x..."
                              value={signer.publicKey}
                              onChange={(e) => updateSigner(signer.id, "publicKey", e.target.value)}
                              className="h-12 rounded-xl border-gray-200 dark:border-gray-800 font-mono text-sm focus-ring"
                            />
                          </div>
                          <div className="flex items-end gap-3">
                            <div className="flex-1">
                              <Label htmlFor={`weight-${signer.id}`} className="text-sm font-semibold mb-2 block">
                                Weight
                              </Label>
                              <Select
                                value={signer.weight.toString()}
                                onValueChange={(value) => updateSigner(signer.id, "weight", Number.parseInt(value))}
                              >
                                <SelectTrigger className="h-12 rounded-xl border-gray-200 dark:border-gray-800">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[1, 2, 3, 4, 5].map((weight) => (
                                    <SelectItem key={weight} value={weight.toString()}>
                                      {weight}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {signers.length > 2 && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => removeSigner(signer.id)}
                                className="h-12 w-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {!isValidConfig && (
                <Alert className="status-warning rounded-xl">
                  <AlertDescription className="font-medium">
                    Please fill in all signer details and ensure the threshold doesn't exceed the total weight.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end pt-6">
                <Button onClick={() => setStep(2)} disabled={!isValidConfig} className="apple-button">
                  Next: Review Configuration
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="elevated-card">
            <CardHeader className="text-center pb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-title">Review Configuration</CardTitle>
              </div>
              <CardDescription className="text-body">
                Verify your multisig wallet configuration before creation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-content">
              {/* Configuration Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="glass-card p-6 rounded-2xl text-center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl w-fit mx-auto mb-4">
                    <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Threshold Policy</h3>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {threshold} of {signers.length}
                  </p>
                  <p className="text-caption">Signatures required to execute transactions</p>
                </div>
                <div className="glass-card p-6 rounded-2xl text-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl w-fit mx-auto mb-4">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Total Weight</h3>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{totalWeight}</p>
                  <p className="text-caption">Combined weight of all signers</p>
                </div>
              </div>

              {/* Signers List */}
              <div className="space-y-4 mb-8">
                <h3 className="font-semibold text-lg">Authorized Signers</h3>
                {signers.map((signer, index) => (
                  <div
                    key={signer.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-2xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-semibold">
                        {signer.name[0] || index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{signer.name}</p>
                        <p className="text-sm text-muted-foreground font-mono">{signer.publicKey.slice(0, 20)}...</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="px-3 py-1">
                      Weight: {signer.weight}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <Button variant="outline" onClick={() => setStep(1)} className="apple-button-secondary">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Configuration
                </Button>
                <Button onClick={() => setStep(3)} className="apple-button">
                  Create Wallet
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="elevated-card">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-title">Creating Your Wallet</CardTitle>
              <CardDescription className="text-body">
                Please wait while we deploy your multisig wallet to the Sui network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-content">
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative mb-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Key className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Deploying Smart Contract</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Your multisig wallet is being created on the Sui blockchain. This process may take a few moments.
                </p>
              </div>

              <Button onClick={createWallet} disabled={isCreating} className="w-full apple-button">
                {isCreating ? "Creating Wallet..." : "Deploy Wallet"}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card className="elevated-card">
            <CardHeader className="text-center pb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-3xl">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-title">Wallet Created Successfully!</CardTitle>
              </div>
              <CardDescription className="text-body">
                Your multisig wallet has been deployed to the Sui network and is ready to use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-content">
              {/* Success Info */}
              <div className="glass-card p-6 rounded-2xl mb-8">
                <h3 className="font-semibold text-lg mb-4 text-green-700 dark:text-green-300">Wallet Address</h3>
                <p className="font-mono text-sm bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                  0x1234567890abcdef1234567890abcdef12345678
                </p>
              </div>

              {/* Configuration Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="glass-card p-6 rounded-2xl text-center">
                  <h3 className="font-semibold mb-2">Threshold Policy</h3>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {threshold} of {signers.length}
                  </p>
                </div>
                <div className="glass-card p-6 rounded-2xl text-center">
                  <h3 className="font-semibold mb-2">Total Signers</h3>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{signers.length}</p>
                </div>
              </div>

              <Alert className="status-info rounded-xl mb-8">
                <AlertDescription className="font-medium">
                  Save your wallet configuration file and share the wallet address with your co-signers. They will need
                  to import this wallet to participate in transactions.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={exportConfig}
                  variant="outline"
                  className="flex-1 apple-button-secondary bg-transparent"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Configuration
                </Button>
                <Button onClick={onComplete} className="flex-1 apple-button">
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
