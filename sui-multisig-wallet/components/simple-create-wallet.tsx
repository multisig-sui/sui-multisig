"use client"

import { useState } from "react"
import { Plus, Trash2, ArrowRight, ArrowLeft, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

interface SimpleCreateWalletProps {
  onComplete: () => void
}

interface Signer {
  id: string
  name: string
  address: string
}

export function SimpleCreateWallet({ onComplete }: SimpleCreateWalletProps) {
  const [step, setStep] = useState(1)
  const [threshold, setThreshold] = useState(2)
  const [signers, setSigners] = useState<Signer[]>([
    { id: "1", name: "", address: "" },
    { id: "2", name: "", address: "" },
  ])
  const [isCreating, setIsCreating] = useState(false)

  const addSigner = () => {
    const newSigner: Signer = {
      id: Date.now().toString(),
      name: "",
      address: "",
    }
    setSigners([...signers, newSigner])
  }

  const removeSigner = (id: string) => {
    if (signers.length > 2) {
      setSigners(signers.filter((s) => s.id !== id))
    }
  }

  const updateSigner = (id: string, field: keyof Signer, value: string) => {
    setSigners(signers.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const createWallet = async () => {
    setIsCreating(true)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setIsCreating(false)
    setStep(3)
  }

  const isValidConfig = signers.every((s) => s.name && s.address) && threshold <= signers.length

  const progress = (step / 3) * 100

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Create Multisig Wallet</h1>
        <p className="text-muted-foreground">Set up a new secure multisig wallet</p>
      </div>

      <div className="max-w-md mx-auto">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>Configure</span>
          <span>Create</span>
          <span>Complete</span>
        </div>
      </div>

      {step === 1 && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Configure Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="threshold">Signature Threshold</Label>
              <Select value={threshold.toString()} onValueChange={(value) => setThreshold(Number.parseInt(value))}>
                <SelectTrigger>
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Signers</Label>
                <Button onClick={addSigner} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Signer
                </Button>
              </div>

              {signers.map((signer, index) => (
                <Card key={signer.id}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`name-${signer.id}`}>Name</Label>
                        <Input
                          id={`name-${signer.id}`}
                          placeholder="Signer name"
                          value={signer.name}
                          onChange={(e) => updateSigner(signer.id, "name", e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label htmlFor={`address-${signer.id}`}>Address</Label>
                          <Input
                            id={`address-${signer.id}`}
                            placeholder="0x..."
                            value={signer.address}
                            onChange={(e) => updateSigner(signer.id, "address", e.target.value)}
                            className="font-mono text-sm"
                          />
                        </div>
                        {signers.length > 2 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeSigner(signer.id)}
                            className="mt-6"
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

            <Button onClick={() => setStep(2)} disabled={!isValidConfig} className="w-full">
              Next: Review Configuration
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Review Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{threshold}</div>
                <div className="text-sm text-muted-foreground">Required Signatures</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{signers.length}</div>
                <div className="text-sm text-muted-foreground">Total Signers</div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Signers</Label>
              {signers.map((signer, index) => (
                <div key={signer.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{signer.name}</div>
                    <div className="text-sm text-muted-foreground font-mono">{signer.address.slice(0, 20)}...</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={createWallet} className="flex-1">
                Create Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Wallet Created Successfully!</h2>
            <p className="text-muted-foreground mb-6">Your multisig wallet is ready to use</p>
            <div className="bg-muted p-4 rounded-lg mb-6">
              <div className="text-sm text-muted-foreground mb-1">Wallet Address</div>
              <div className="font-mono text-sm">0x1234567890abcdef1234567890abcdef12345678</div>
            </div>
            <Button onClick={onComplete} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
