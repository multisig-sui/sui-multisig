'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Wallet, Key, Globe, Copy, Check, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useCurrentAccount, ConnectButton } from '@mysten/dapp-kit'
import { toast } from 'sonner'
import { SuiSigner } from '@/lib/types/sui'
import { useWalletPublicKey, validatePublicKey } from '@/hooks/use-wallet-public-key'
import { useEffect } from 'react'

interface AddSignerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddSigner: (signer: Partial<SuiSigner>) => void
}

export function AddSignerModal({ open, onOpenChange, onAddSigner }: AddSignerModalProps) {
  const currentAccount = useCurrentAccount()
  const { formattedPublicKey, keyScheme, address } = useWalletPublicKey()
  const [signerName, setSignerName] = useState('')
  const [manualPublicKey, setManualPublicKey] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [validation, setValidation] = useState<{ isValid: boolean; keyScheme?: string; address?: string; error?: string } | null>(null)

  // Validate manual public key in real-time
  useEffect(() => {
    if (manualPublicKey.trim()) {
      const result = validatePublicKey(manualPublicKey.trim())
      setValidation(result)
    } else {
      setValidation(null)
    }
  }, [manualPublicKey])

  const handleAddConnectedWallet = () => {
    if (!currentAccount) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!formattedPublicKey || !keyScheme) {
      toast.error('Unable to get public key from wallet')
      return
    }

    onAddSigner({
      publicKey: formattedPublicKey,
      weight: 1,
      keyScheme: keyScheme
    })

    setSignerName('')
    onOpenChange(false)
    toast.success('Connected wallet added as signer!')
  }

  const handleCopyFromWallet = async () => {
    if (!currentAccount) return

    // This would ideally get the formatted key directly
    // For now, show instructions
    toast.info('Click on your wallet in the top right and copy the "Formatted Public Key"')
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const handleAddManualKey = () => {
    if (!manualPublicKey.trim()) {
      toast.error('Please enter a public key')
      return
    }

    if (!validation?.isValid) {
      toast.error('Please enter a valid public key')
      return
    }

    onAddSigner({
      publicKey: manualPublicKey.trim(),
      weight: 1,
      keyScheme: validation.keyScheme as any || 'ed25519'
    })

    setManualPublicKey('')
    setSignerName('')
    onOpenChange(false)
    toast.success('Signer added successfully')
  }

  const handlePasskeySetup = async () => {
    setIsConnecting(true)
    // Passkey implementation would go here
    toast.info('Passkey support coming soon! Currently in beta on testnet.')
    setIsConnecting(false)
  }

  const handleZkLoginSetup = async () => {
    setIsConnecting(true)
    // zkLogin implementation would go here
    toast.info('zkLogin support coming soon! OAuth-based authentication.')
    setIsConnecting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Signer to Multisig</DialogTitle>
          <DialogDescription>
            Choose how you want to add a signer to your multisig wallet
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="wallet" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="passkey">Passkey</TabsTrigger>
            <TabsTrigger value="zklogin">zkLogin</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Connect Wallet
                </CardTitle>
                <CardDescription>
                  Connect a Sui wallet to automatically capture its public key
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentAccount ? (
                  <>
                    <div className="p-4 bg-muted rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Connected Wallet</p>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <code className="text-xs block truncate">{currentAccount.address}</code>
                      
                      {formattedPublicKey && (
                        <>
                          <div className="pt-2 border-t space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Key Scheme:</span>
                              <Badge variant="secondary" className="text-xs">{keyScheme?.toUpperCase()}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Public Key:</span>
                              <code className="text-xs truncate flex-1">{formattedPublicKey.slice(0, 20)}...</code>
                            </div>
                          </div>
                          
                          <Button 
                            onClick={handleAddConnectedWallet}
                            className="w-full"
                            size="lg"
                          >
                            <Wallet className="h-5 w-5 mr-2" />
                            Use This Wallet
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {!formattedPublicKey && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          Unable to retrieve public key from this wallet. Please try the manual method.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Connect your wallet to use it as a signer
                    </p>
                    <ConnectButton className="w-full" />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="passkey" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Passkey Authentication
                </CardTitle>
                <CardDescription>
                  Use biometric authentication (Face ID, Touch ID, Windows Hello)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <strong>Coming Soon!</strong> Passkey support is currently in beta on Sui testnet. 
                    This will allow secure biometric authentication for your multisig.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="passkey-name">Signer Name (optional)</Label>
                  <Input
                    id="passkey-name"
                    placeholder="e.g., Alice's Face ID"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handlePasskeySetup}
                  className="w-full"
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Setup Passkey
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="zklogin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  zkLogin (OAuth)
                </CardTitle>
                <CardDescription>
                  Use your Google, Apple, or social media account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <strong>Coming Soon!</strong> zkLogin allows passwordless authentication using your 
                    existing OAuth accounts (Google, Apple, etc.) with zero-knowledge proofs.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" disabled>
                    <img src="/google.svg" className="h-4 w-4 mr-2" alt="Google" />
                    Google
                  </Button>
                  <Button variant="outline" disabled>
                    <img src="/apple.svg" className="h-4 w-4 mr-2" alt="Apple" />
                    Apple
                  </Button>
                  <Button variant="outline" disabled>
                    <img src="/facebook.svg" className="h-4 w-4 mr-2" alt="Facebook" />
                    Facebook
                  </Button>
                  <Button variant="outline" disabled>
                    <img src="/twitch.svg" className="h-4 w-4 mr-2" alt="Twitch" />
                    Twitch
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Manual Entry</CardTitle>
                <CardDescription>
                  Paste a public key directly (with flag byte)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-key">Public Key (Base64 with flag)</Label>
                  <div className="relative">
                    <Input
                      id="manual-key"
                      placeholder="e.g., AHFomETPbntb3tWjHH/e/eEG..."
                      value={manualPublicKey}
                      onChange={(e) => setManualPublicKey(e.target.value)}
                      className={`font-mono text-sm pr-10 ${
                        validation ? (validation.isValid ? 'border-green-500' : 'border-red-500') : ''
                      }`}
                    />
                    {validation && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {validation.isValid ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get this from `sui keytool list` or your wallet dropdown
                  </p>
                  
                  {validation && (
                    <div className={`p-3 rounded-lg text-sm ${
                      validation.isValid ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                    }`}>
                      {validation.isValid ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Key Scheme:</span>
                            <Badge variant="secondary" className="text-xs">{validation.keyScheme?.toUpperCase()}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Derived Address:</span>
                            <code className="text-xs">{validation.address?.slice(0, 20)}...</code>
                          </div>
                        </div>
                      ) : (
                        <p className="text-red-600 dark:text-red-400">{validation.error}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-name">Signer Name (optional)</Label>
                  <Input
                    id="manual-name"
                    placeholder="e.g., Bob's Hardware Wallet"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleAddManualKey}
                  className="w-full"
                  disabled={!manualPublicKey.trim() || (validation !== null && !validation.isValid)}
                >
                  Add Signer
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}