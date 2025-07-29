'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Copy, Info, Key } from 'lucide-react'
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519'
import { Secp256k1PublicKey } from '@mysten/sui/keypairs/secp256k1'
import { Secp256r1PublicKey } from '@mysten/sui/keypairs/secp256r1'
import { fromHEX, toBase64 } from '@mysten/sui/utils'
import { toast } from 'sonner'

// Example test keys for demonstration
const EXAMPLE_KEYS = [
  {
    scheme: 'ED25519',
    publicKey: 'AHFomETPbntb3tWjHH/e/eEG65k4r2g+PQ8viNXF8+gg',
    address: '0x7d8c4b6a74f6dbb6bded5a31c7fde7de1046b9938af683e3d0f2f88d5c5f3e82',
    label: 'Test Ed25519 Key'
  },
  {
    scheme: 'Secp256k1',
    publicKey: 'AQLqobE3hupXBd6SFeHMGL6M1tE+Fd33mPuBgJaBFNd5Cg==',
    address: '0x2a5f3c9d8e17b4a6f8c3d9e2b1a7f5e4d3c2b1a0987654321fedcba9876543',
    label: 'Test Secp256k1 Key'
  },
  {
    scheme: 'Secp256r1',
    publicKey: 'AgLDQW8n6YcXtP3BdXOSnqQOdCCYvp7Jh/NidWCiY+vhpA==',
    address: '0x9b7e2f4a6c3d5e8f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4',
    label: 'Test Secp256r1 Key'
  }
]

export function AddressConverter() {
  const [address, setAddress] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [keyScheme, setKeyScheme] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const convertAddress = () => {
    setError(null)
    setPublicKey('')
    setKeyScheme('')

    if (!address) {
      setError('Please enter an address')
      return
    }

    try {
      // Remove 0x prefix if present
      const cleanAddress = address.startsWith('0x') ? address.slice(2) : address

      // Sui addresses are 32 bytes (64 hex chars)
      if (cleanAddress.length !== 64) {
        setError('Invalid address length. Sui addresses should be 32 bytes (64 hex characters)')
        return
      }

      // Try different key schemes
      const addressBytes = fromHEX(cleanAddress)
      
      // Try Ed25519 (most common)
      try {
        const ed25519Key = new Ed25519PublicKey(addressBytes)
        if (ed25519Key.toSuiAddress() === `0x${cleanAddress}`) {
          setPublicKey(ed25519Key.toBase64())
          setKeyScheme('ED25519')
          return
        }
      } catch (e) {
        // Not Ed25519, try next
      }

      // Try Secp256k1
      try {
        const secp256k1Key = new Secp256k1PublicKey(addressBytes)
        if (secp256k1Key.toSuiAddress() === `0x${cleanAddress}`) {
          setPublicKey(secp256k1Key.toBase64())
          setKeyScheme('Secp256k1')
          return
        }
      } catch (e) {
        // Not Secp256k1, try next
      }

      // Try Secp256r1
      try {
        const secp256r1Key = new Secp256r1PublicKey(addressBytes)
        if (secp256r1Key.toSuiAddress() === `0x${cleanAddress}`) {
          setPublicKey(secp256r1Key.toBase64())
          setKeyScheme('Secp256r1')
          return
        }
      } catch (e) {
        // Not Secp256r1
      }

      // If we get here, we couldn't determine the key scheme from the address alone
      // This is actually the expected case - addresses are hashes and don't contain the original public key
      setError('Cannot derive public key from address alone. Sui addresses are derived from public keys but do not contain the original public key data. Please use "sui keytool list" to get your public key.')

    } catch (err) {
      setError('Failed to process address: ' + (err as Error).message)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const convertPublicKeyToBase64WithFlag = (publicKeyHex: string, scheme: 'ED25519' | 'Secp256k1' | 'Secp256r1') => {
    setError(null)
    
    try {
      // Remove 0x prefix if present
      const cleanHex = publicKeyHex.startsWith('0x') ? publicKeyHex.slice(2) : publicKeyHex
      
      // Convert hex to bytes
      const publicKeyBytes = fromHEX(cleanHex)
      
      // Get the flag byte for the scheme
      let flag: number
      switch (scheme) {
        case 'ED25519':
          flag = 0x00
          break
        case 'Secp256k1':
          flag = 0x01
          break
        case 'Secp256r1':
          flag = 0x02
          break
      }
      
      // Combine flag + public key bytes
      const fullBytes = new Uint8Array(publicKeyBytes.length + 1)
      fullBytes[0] = flag
      fullBytes.set(publicKeyBytes, 1)
      
      // Convert to base64
      const base64WithFlag = toBase64(fullBytes)
      
      return base64WithFlag
    } catch (err) {
      setError('Failed to convert public key: ' + (err as Error).message)
      return null
    }
  }

  const showExampleConversion = () => {
    // Example Ed25519 public key (32 bytes)
    const examplePublicKey = '0x7168984c4f6dbb6bded5a31c7fde7de1046b9938af683e3d0f2f88d5c5f3e8207d'
    const base64Result = convertPublicKeyToBase64WithFlag(examplePublicKey, 'ED25519')
    
    if (base64Result) {
      setPublicKey(base64Result)
      setKeyScheme('ED25519')
      setError(null)
      toast.info('Example: This is how to convert a raw public key to Base64 format with flag byte')
    }
  }

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <CardTitle>Address Converter Tool</CardTitle>
        <CardDescription>
          Convert Sui addresses to public keys for multisig setup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <p><strong>Note:</strong> You cannot derive a public key from just an address.</p>
            <p className="text-sm">
              To get your public key for multisig setup:
            </p>
            <ol className="text-sm list-decimal list-inside ml-2">
              <li>Connect your wallet and check the dropdown menu for "Formatted Public Key"</li>
              <li>Run <code className="bg-muted px-1 rounded">sui keytool list</code> in your terminal</li>
              <li>Use the example keys below for testing</li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="address">Sui Address</Label>
          <div className="flex gap-2">
            <Input
              id="address"
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="font-mono text-sm"
            />
            <Button onClick={convertAddress} size="sm">
              Convert
            </Button>
          </div>
          <Button
            variant="link"
            size="sm"
            className="text-xs"
            onClick={showExampleConversion}
          >
            Show example public key conversion
          </Button>
        </div>

        {publicKey && (
          <div className="space-y-2 pt-4 border-t">
            <div>
              <Label>Key Scheme</Label>
              <p className="text-sm font-mono mt-1">{keyScheme}</p>
            </div>
            
            <div>
              <Label>Public Key (Base64)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={publicKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(publicKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <Alert variant={error.includes('Note:') ? 'default' : 'destructive'}>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold mb-2">Example output from `sui keytool list`:</h4>
          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`╭─────────────┬──────────────────────────────────────────┬────────────────╮
│ Alias       │ PublicKey (Base64)                       │ Scheme         │
├─────────────┼──────────────────────────────────────────┼────────────────┤  
│ my-wallet   │ AHFomETPbntr3tWjHH/e/eEG...              │ ed25519        │
╰─────────────┴──────────────────────────────────────────┴────────────────╯`}
          </pre>
          <p className="text-xs text-muted-foreground mt-2">
            Copy the PublicKey value and use it directly in the multisig setup.
          </p>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold">Example Test Keys</h4>
            <Badge variant="secondary" className="text-xs">
              <Key className="h-3 w-3 mr-1" />
              For Testing Only
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Use these example keys to test the multisig creation flow. These are not real wallets.
          </p>
          <div className="space-y-3">
            {EXAMPLE_KEYS.map((example, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{example.label}</span>
                  <Badge variant="outline" className="text-xs">{example.scheme}</Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">Public Key:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                      {example.publicKey}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(example.publicKey)
                        toast.success('Copied test public key!')
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">Address:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                      {example.address.slice(0, 20)}...
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}