"use client"

import { useState } from "react"
import { Upload, FileJson, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { SuiMultisigConfig } from "@/lib/types/sui"

interface ImportWalletProps {
  onImport: (config: SuiMultisigConfig) => void
  isLoading?: boolean
}

export function ImportWallet({ onImport, isLoading }: ImportWalletProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateConfig = (config: any): SuiMultisigConfig => {
    if (!config.multisigAddress || typeof config.multisigAddress !== 'string') {
      throw new Error('Invalid multisig address')
    }
    
    if (!config.threshold || typeof config.threshold !== 'number' || config.threshold < 1) {
      throw new Error('Invalid threshold')
    }
    
    if (!Array.isArray(config.signers) || config.signers.length === 0) {
      throw new Error('No signers found')
    }
    
    // Validate each signer
    config.signers.forEach((signer: any, index: number) => {
      if (!signer.publicKey || typeof signer.publicKey !== 'string') {
        throw new Error(`Invalid public key for signer ${index + 1}`)
      }
      
      if (!signer.weight || typeof signer.weight !== 'number' || signer.weight < 1) {
        throw new Error(`Invalid weight for signer ${index + 1}`)
      }
      
      if (!signer.keyScheme || !['ed25519', 'secp256k1', 'secp256r1'].includes(signer.keyScheme)) {
        throw new Error(`Invalid key scheme for signer ${index + 1}: ${signer.keyScheme}`)
      }
    })
    
    return config as SuiMultisigConfig
  }

  const handleFile = async (file: File) => {
    setError(null)
    
    try {
      const text = await file.text()
      const config = JSON.parse(text)
      const validatedConfig = validateConfig(config)
      
      toast.success('Wallet configuration imported successfully!')
      onImport(validatedConfig)
    } catch (err: any) {
      setError(err.message || 'Failed to import wallet configuration')
      toast.error('Failed to import wallet configuration')
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/json') {
      handleFile(file)
    } else {
      setError('Please drop a JSON file')
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Existing Wallet</CardTitle>
        <CardDescription>
          Import a multisig wallet configuration from a JSON file
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-primary bg-primary/10' : 'border-border'
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <FileJson className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop your wallet JSON file here, or click to browse
          </p>
          
          <input
            type="file"
            accept=".json"
            onChange={handleFileInput}
            className="hidden"
            id="wallet-file-input"
            disabled={isLoading}
          />
          
          <label htmlFor="wallet-file-input">
            <Button variant="outline" disabled={isLoading} asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Select JSON File
              </span>
            </Button>
          </label>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Expected format:</strong>
          </p>
          <pre className="text-xs mt-2 overflow-auto">
{`{
  "multisigAddress": "0x...",
  "threshold": 2,
  "signers": [
    {
      "publicKey": "...",
      "weight": 1,
      "keyScheme": "ed25519"
    }
  ]
}`}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}