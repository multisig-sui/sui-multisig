"use client"

import { useState } from "react"
import { Plus, Trash2, ArrowRight, ArrowLeft, Check, Download, Info, Key, Copy, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { MultiSigPublicKey } from '@mysten/sui/multisig'
import { PublicKey } from '@mysten/sui/cryptography'
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519'
import { Secp256k1PublicKey } from '@mysten/sui/keypairs/secp256k1'
import { Secp256r1PublicKey } from '@mysten/sui/keypairs/secp256r1'
import { SuiSigner, SuiMultisigConfig, SuiKeyScheme } from '@/lib/types/sui'
import { b64ToUint8Array, parseSuiPublicKey } from '@/lib/sui-utils'
import { toast } from 'sonner'
import { AddSignerModal } from './add-signer-modal'

interface CreateMultisigWalletProps {
  onComplete: (config: SuiMultisigConfig) => void
  isLoading?: boolean
}

export function CreateMultisigWallet({ onComplete, isLoading = false }: CreateMultisigWalletProps) {
  const [step, setStep] = useState(1)
  const [threshold, setThreshold] = useState(2)
  const [signers, setSigners] = useState<SuiSigner[]>([
    { id: "1", publicKey: "", weight: 1, keyScheme: 'ed25519' },
    { id: "2", publicKey: "", weight: 1, keyScheme: 'ed25519' },
  ])
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedConfig, setGeneratedConfig] = useState<SuiMultisigConfig | null>(null)
  const [isUsingExampleKeys, setIsUsingExampleKeys] = useState(false)
  const [showAddSignerModal, setShowAddSignerModal] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [copiedConfig, setCopiedConfig] = useState(false)

  const addSigner = () => {
    if (signers.length >= 10) {
      setError("A maximum of 10 signers are allowed for Sui Multisig.")
      return
    }
    setShowAddSignerModal(true)
  }

  const handleAddSignerFromModal = (signerData: Partial<SuiSigner>) => {
    const newSigner: SuiSigner = {
      id: Date.now().toString(),
      publicKey: signerData.publicKey || "",
      weight: signerData.weight || 1,
      keyScheme: signerData.keyScheme || 'ed25519'
    }
    setSigners([...signers, newSigner])
    setError(null)
  }

  const removeSigner = (id: string) => {
    if (signers.length > 2) {
      setSigners(signers.filter((s) => s.id !== id))
    }
  }

  const updateSigner = <K extends keyof Omit<SuiSigner, 'id'>>(
    id: string,
    field: K,
    value: SuiSigner[K]
  ) => {
    setSigners(
      signers.map((signer) =>
        signer.id === id ? { ...signer, [field]: value } : signer
      )
    )
  }

  const calculateTotalWeight = () => {
    return signers.reduce((total, signer) => total + (signer.weight || 0), 0)
  }

  const useExampleConfiguration = () => {
    // Set up example configuration with 3 signers
    const exampleSigners: SuiSigner[] = [
      {
        id: "example-1",
        publicKey: "AHFomETPbntb3tWjHH/e/eEG65k4r2g+PQ8viNXF8+gg",
        weight: 1,
        keyScheme: 'ed25519'
      },
      {
        id: "example-2", 
        publicKey: "AQLqobE3hupXBd6SFeHMGL6M1tE+Fd33mPuBgJaBFNd5Cg==",
        weight: 1,
        keyScheme: 'secp256k1'
      },
      {
        id: "example-3",
        publicKey: "AgLDQW8n6YcXtP3BdXOSnqQOdCCYvp7Jh/NidWCiY+vhpA==",
        weight: 1,
        keyScheme: 'secp256r1'
      }
    ]
    
    setSigners(exampleSigners)
    setThreshold(2) // 2-of-3 multisig
    setError(null)
    setIsUsingExampleKeys(true)
    toast.info('Example configuration loaded. These are test keys only!')
  }

  const validateConfiguration = () => {
    const totalWeight = calculateTotalWeight()
    
    if (threshold > totalWeight) {
      setError(`Threshold (${threshold}) cannot be greater than total weight (${totalWeight}).`)
      return false
    }
    
    if (signers.some(s => !s.publicKey.trim())) {
      setError('All public keys must be filled.')
      return false
    }
    
    if (signers.length === 0) {
      setError('At least one signer is required.')
      return false
    }
    
    if (threshold <= 0 || threshold > 65535) {
      setError('Threshold must be between 1 and 65535.')
      return false
    }

    for (const signer of signers) {
      if (signer.weight <= 0 || signer.weight > 255) {
        setError(`Invalid weight for a signer: ${signer.weight}. Must be between 1 and 255.`)
        return false
      }
    }

    return true
  }

  const createMultisigAddress = async () => {
    setError(null)
    setIsCreating(true)

    if (!validateConfiguration()) {
      setIsCreating(false)
      return
    }

    try {
      const parsedSuiPublicKeys: Array<{ publicKey: PublicKey; weight: number }> = []

      for (const signer of signers) {
        try {
          // Use the parseSuiPublicKey utility which properly handles the flag byte
          const suiPublicKey = parseSuiPublicKey(signer.publicKey, signer.keyScheme)
          
          parsedSuiPublicKeys.push({ publicKey: suiPublicKey, weight: signer.weight })
        } catch (e: any) {
          setError(`Error parsing public key for scheme ${signer.keyScheme} (${signer.publicKey.substring(0,10)}...): ${e.message}`)
          setIsCreating(false)
          return
        }
      }

      const multiSigPublicKeyInstance = MultiSigPublicKey.fromPublicKeys({
        threshold: threshold,
        publicKeys: parsedSuiPublicKeys,
      })
      
      const address = multiSigPublicKeyInstance.toSuiAddress()
      
      const configToSave: SuiMultisigConfig = {
        multisigAddress: address,
        threshold: threshold,
        signers: signers.map(s => ({ publicKey: s.publicKey, weight: s.weight, keyScheme: s.keyScheme }))
      }
      
      setGeneratedConfig(configToSave)
      setStep(3)
    } catch (err) {
      console.error("Error creating Sui multisig address:", err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred during Sui multisig address generation')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSaveConfig = () => {
    if (!generatedConfig) return

    const jsonString = JSON.stringify(generatedConfig, null, 4)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const shortAddress = generatedConfig.multisigAddress.slice(0, 8)
    link.download = `sui_multisig_config_${shortAddress}_${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    onComplete(generatedConfig)
  }

  const handleCopyConfig = () => {
    if (!generatedConfig) return
    
    const jsonString = JSON.stringify(generatedConfig, null, 2)
    navigator.clipboard.writeText(jsonString)
    setCopiedConfig(true)
    toast.success('Configuration copied to clipboard!')
    
    setTimeout(() => {
      setCopiedConfig(false)
    }, 2000)
  }

  const isValidConfig = signers.every((s) => s.publicKey) && threshold <= calculateTotalWeight()

  const progress = (step / 3) * 100

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Create Multisig Wallet</h1>
        <p className="text-muted-foreground">Set up a new secure Sui multisig wallet</p>
      </div>

      <div className="max-w-md mx-auto">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>Configure</span>
          <span>Review</span>
          <span>Complete</span>
        </div>
      </div>

      {step === 1 && (
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Configure Signers</CardTitle>
                <CardDescription>
                  Add the public keys of all signers and set their weights. Maximum 10 signers allowed.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={useExampleConfiguration}
                className="gap-2"
              >
                <Key className="h-4 w-4" />
                Use Example Configuration
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isUsingExampleKeys && (
              <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                <Info className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  <strong>Test Mode:</strong> You're using example keys for testing. These are not real wallets and cannot sign transactions.
                </AlertDescription>
              </Alert>
            )}
            
            <div>
              <Label htmlFor="threshold">Signature Threshold</Label>
              <div className="flex items-center gap-4 mt-2">
                <Input
                  id="threshold"
                  type="number"
                  min={1}
                  max={65535}
                  value={threshold}
                  onChange={(e) => setThreshold(Number.parseInt(e.target.value) || 1)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">
                  Total Weight: {calculateTotalWeight()}
                </span>
              </div>
              {threshold > calculateTotalWeight() && (
                <p className="text-sm text-destructive mt-1">
                  Threshold cannot exceed total weight!
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Signers ({signers.length}/10)</Label>
                <Button 
                  onClick={addSigner} 
                  variant="outline" 
                  size="sm"
                  disabled={signers.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Signer
                </Button>
              </div>

              {signers.map((signer, index) => (
                <Card key={signer.id} className={signer.publicKey ? "border-green-200 dark:border-green-800" : ""}>
                  <CardContent className="p-4">
                    {signer.publicKey ? (
                      // Simplified view when key is already added
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{signer.keyScheme.toUpperCase()}</Badge>
                              <span className="text-sm font-medium">Weight: {signer.weight}</span>
                            </div>
                            <div className="text-sm text-muted-foreground font-mono mt-1">
                              {signer.publicKey.slice(0, 20)}...
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select 
                            value={signer.weight.toString()} 
                            onValueChange={(value) => updateSigner(signer.id, "weight", parseInt(value))}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((w) => (
                                <SelectItem key={w} value={w.toString()}>
                                  {w}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {signers.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSigner(signer.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Full form view when no key is added yet
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Signer {index + 1}</span>
                          {signers.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSigner(signer.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <Label htmlFor={`pk-${signer.id}`}>Public Key (Base64 with flag)</Label>
                            <Textarea
                              id={`pk-${signer.id}`}
                              placeholder="Enter base64 public key..."
                              value={signer.publicKey}
                              onChange={(e) => updateSigner(signer.id, "publicKey", e.target.value)}
                              className="font-mono text-sm min-h-[60px]"
                            />
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor={`scheme-${signer.id}`}>Key Scheme</Label>
                              <Select 
                                value={signer.keyScheme} 
                                onValueChange={(value: SuiKeyScheme) => updateSigner(signer.id, "keyScheme", value)}
                            >
                              <SelectTrigger id={`scheme-${signer.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ed25519">ED25519</SelectItem>
                                <SelectItem value="secp256k1">Secp256k1</SelectItem>
                                <SelectItem value="secp256r1">Secp256r1</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor={`weight-${signer.id}`}>Weight</Label>
                            <Input
                              id={`weight-${signer.id}`}
                              type="number"
                              min={1}
                              max={255}
                              value={signer.weight}
                              onChange={(e) => updateSigner(signer.id, "weight", Number.parseInt(e.target.value) || 1)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={() => setStep(2)} 
              disabled={!isValidConfig} 
              className="w-full"
            >
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
            <CardDescription>
              Verify your multisig configuration before creating the wallet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{threshold}</div>
                <div className="text-sm text-muted-foreground">Required Weight</div>
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
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{signer.keyScheme.toUpperCase()}</Badge>
                      <span className="text-sm">Weight: {signer.weight}</span>
                    </div>
                    <div className="text-sm text-muted-foreground font-mono mt-1">
                      {signer.publicKey.slice(0, 20)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={createMultisigAddress} 
                className="flex-1"
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Wallet'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && generatedConfig && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Wallet Created Successfully!</h2>
            <p className="text-muted-foreground mb-6">Your Sui multisig wallet is ready to use</p>
            
            <div className="bg-muted p-4 rounded-lg mb-6">
              <div className="text-sm text-muted-foreground mb-1">Multisig Address</div>
              <div className="font-mono text-sm break-all">{generatedConfig.multisigAddress}</div>
            </div>

            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Save your configuration file! You'll need it to load this wallet in the future.
              </AlertDescription>
            </Alert>

            {/* Configuration Display */}
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => setShowConfig(!showConfig)}
                className="w-full justify-between text-sm"
              >
                <span>View Configuration</span>
                {showConfig ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              
              {showConfig && (
                <div className="mt-4 relative">
                  <div className="absolute right-2 top-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyConfig}
                      className="h-8 px-2"
                    >
                      {copiedConfig ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs text-left">
                    <code>{JSON.stringify(generatedConfig, null, 2)}</code>
                  </pre>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSaveConfig} variant="outline" className="flex-1" disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                Download Config
              </Button>
              <Button onClick={() => onComplete(generatedConfig)} className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Wallet...
                  </>
                ) : (
                  'Go to Dashboard'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <AddSignerModal
        open={showAddSignerModal}
        onOpenChange={setShowAddSignerModal}
        onAddSigner={handleAddSignerFromModal}
      />
    </div>
  )
}