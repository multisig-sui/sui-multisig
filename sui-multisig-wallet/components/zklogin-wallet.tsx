"use client"

import { useState, useEffect } from 'react'
import { useSuiClient } from '@mysten/dapp-kit'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ZkLoginManager, OAUTH_PROVIDERS } from '@/lib/zklogin-utils'
import {
  Lock,
  Globe,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  RefreshCw,
  Wallet,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'

interface ZkLoginWalletProps {
  onZkLoginConnected: (address: string, session: any) => void
  onDisconnect: () => void
  isConnected?: boolean
  zkLoginAddress?: string
}

export function ZkLoginWallet({
  onZkLoginConnected,
  onDisconnect,
  isConnected = false,
  zkLoginAddress
}: ZkLoginWalletProps) {
  const suiClient = useSuiClient()
  const [zkLoginManager] = useState(() => new ZkLoginManager())
  const [isOpen, setIsOpen] = useState(false)

  // zkLogin flow state
  const [isInitializing, setIsInitializing] = useState(false)
  const [userSalt, setUserSalt] = useState<string>('')
  const [jwt, setJwt] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [useTestMode, setUseTestMode] = useState<boolean>(false)

  // OAuth callback handling
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const idToken = urlParams.get('id_token')
    const authCode = urlParams.get('code')

    if ((idToken || authCode) && isOpen) {
      handleOAuthCallback(idToken || authCode || '')
    }
  }, [isOpen])

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  const initializeSession = async () => {
    setIsInitializing(true)
    clearMessages()

    try {
      await zkLoginManager.initializeSession(suiClient)
      setSuccess('zkLogin session initialized successfully')
    } catch (err: any) {
      console.error('Session initialization error:', err)
      setError(`Failed to initialize session: ${err.message}`)
    } finally {
      setIsInitializing(false)
    }
  }

    const handleOAuthLogin = () => {
    if (!zkLoginManager.getSession()) {
      setError('Please initialize zkLogin session first')
      return
    }

    if (useTestMode) {
      // Simulate OAuth flow for testing
      simulateOAuthFlow()
      return
    }

    // Get client ID from environment
    const clientId = getOAuthClientId('google')

    if (!clientId) {
      setError('Google OAuth client ID not found. Please set NEXT_PUBLIC_OAUTH_GOOGLE_CLIENT_ID in .env.local')
      return
    }

    try {
      const redirectUrl = `${window.location.origin}${window.location.pathname}`
      const oauthUrl = zkLoginManager.getOAuthUrl('google', clientId, redirectUrl)
      window.location.href = oauthUrl
    } catch (err: any) {
      setError(`Failed to start OAuth flow: ${err.message}`)
    }
  }

    const simulateOAuthFlow = () => {
    setIsProcessing(true)
    setError(null)

    // Simulate OAuth callback with a test JWT
    setTimeout(() => {
      const testJwt = createTestJwt()
      setJwt(testJwt)
      setSuccess('Test OAuth authentication successful with Google')
      setIsProcessing(false)
    }, 1000)
  }

  const createTestJwt = (): string => {
    // Create a mock JWT for testing
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(JSON.stringify({
      iss: 'accounts.google.com',
      sub: `test-user-${Date.now()}`,
      aud: 'test-audience',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000)
    }))
    const signature = btoa('test-signature')

    return `${header}.${payload}.${signature}`
  }

  const handleOAuthCallback = async (token: string) => {
    setIsProcessing(true)
    setError(null)

    try {
      if (useTestMode) {
        // In test mode, the token is already the JWT
        setJwt(token)
        setSuccess('Test OAuth authentication successful')
      } else {
        const clientId = getOAuthClientId('google')
        const jwt = await zkLoginManager.processOAuthCallback('google', token, clientId)
        setJwt(jwt)
        setSuccess('OAuth authentication successful')
      }
    } catch (err: any) {
      setError(`OAuth callback failed: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const generateZkLoginAddress = async () => {
    if (!jwt.trim()) {
      setError('Please complete OAuth authentication first')
      return
    }

    if (!userSalt.trim()) {
      setError('Please enter a user salt')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      console.log('Generating zkLogin address with JWT:', jwt.substring(0, 50) + '...')
      console.log('User salt:', userSalt)

      const address = await zkLoginManager.generateZkLoginAddress(jwt, userSalt)
      setSuccess('zkLogin address generated successfully')

      // Get ZK proof for future transactions
      await zkLoginManager.getZkProof(jwt, userSalt)

      const session = zkLoginManager.getSession()
      onZkLoginConnected(address, session)
      setSuccess('zkLogin wallet connected successfully!')
      setIsOpen(false)
      toast.success('zkLogin wallet connected!')
    } catch (err: any) {
      console.error('Error generating zkLogin address:', err)
      setError(`Failed to generate zkLogin address: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const generateRandomSalt = () => {
    const salt = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString()
    setUserSalt(salt)
  }

  const getOAuthClientId = (provider: string): string => {
    // Get from environment variables (Next.js uses process.env)
    const envKey = `NEXT_PUBLIC_OAUTH_${provider.toUpperCase()}_CLIENT_ID`
    return process.env[envKey] || ''
  }

  const resetState = () => {
    setUserSalt('')
    setJwt('')
    setError(null)
    setSuccess(null)
    zkLoginManager.clearSession()
  }

  // If already connected, show disconnect button
  if (isConnected && zkLoginAddress) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={onDisconnect}
      >
        <Shield className="h-4 w-4" />
        <span className="hidden sm:inline-block">
          zkLogin: {zkLoginAddress.slice(0, 6)}...{zkLoginAddress.slice(-4)}
        </span>
        <span className="sm:hidden">
          zkLogin: {zkLoginAddress.slice(0, 4)}...
        </span>
      </Button>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Lock className="h-4 w-4" />
          <span className="hidden sm:inline-block">ZK Login</span>
          <span className="sm:hidden">ZK</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            zkLogin Wallet
          </DialogTitle>
          <DialogDescription>
            Connect using your Google, Apple, or other OAuth accounts
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="oauth" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="oauth">OAuth Login</TabsTrigger>
            <TabsTrigger value="address">Generate Address</TabsTrigger>
          </TabsList>

          <TabsContent value="oauth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 1: Initialize Session</CardTitle>
                <CardDescription>
                  Set up the zkLogin session and choose your OAuth provider
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="testMode"
                    checked={useTestMode}
                    onChange={(e) => setUseTestMode(e.target.checked)}
                  />
                  <Label htmlFor="testMode" className="text-sm">Use Test Mode (for development)</Label>
                </div>

                {!useTestMode && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Google OAuth client ID will be loaded from environment variable NEXT_PUBLIC_OAUTH_GOOGLE_CLIENT_ID
                    </div>
                  </div>
                )}

                <Button
                  onClick={initializeSession}
                  disabled={isInitializing}
                  className="w-full"
                >
                  {isInitializing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Initialize Session
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

                        <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 2: Google OAuth</CardTitle>
                <CardDescription>
                  Authenticate with your Google account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleOAuthLogin}
                  disabled={!zkLoginManager.getSession() || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4 mr-2" />
                      Login with Google
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="address" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 3: Generate Address</CardTitle>
                <CardDescription>
                  Create your zkLogin address with a user salt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userSalt">User Salt</Label>
                  <div className="flex gap-2">
                    <Input
                      id="userSalt"
                      placeholder="Enter user salt (16-byte value or integer < 2^128)"
                      value={userSalt}
                      onChange={(e) => setUserSalt(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={generateRandomSalt}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={generateZkLoginAddress}
                  disabled={!jwt.trim() || !userSalt.trim() || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Address...
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4 mr-2" />
                      Generate zkLogin Address
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between">
          <Button variant="outline" onClick={resetState}>
            Reset
          </Button>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}