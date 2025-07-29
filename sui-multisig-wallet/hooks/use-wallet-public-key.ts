'use client'

import { useEffect, useState } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { toBase64 } from '@mysten/sui/utils'
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519'
import { Secp256k1PublicKey } from '@mysten/sui/keypairs/secp256k1'
import { Secp256r1PublicKey } from '@mysten/sui/keypairs/secp256r1'
import { PublicKey } from '@mysten/sui/cryptography'
import { SuiKeyScheme } from '@/lib/types/sui'

interface WalletPublicKeyResult {
  formattedPublicKey: string | null
  keyScheme: SuiKeyScheme | null
  address: string | null
  isLoading: boolean
  error: string | null
}

function getFlagForKeyScheme(scheme: 'ED25519' | 'Secp256k1' | 'Secp256r1'): number {
  switch (scheme) {
    case 'ED25519':
      return 0x00
    case 'Secp256k1':
      return 0x01
    case 'Secp256r1':
      return 0x02
    default:
      throw new Error(`Unknown key scheme: ${scheme}`)
  }
}

export function useWalletPublicKey(): WalletPublicKeyResult {
  const currentAccount = useCurrentAccount()
  const [formattedPublicKey, setFormattedPublicKey] = useState<string | null>(null)
  const [keyScheme, setKeyScheme] = useState<SuiKeyScheme | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (currentAccount && currentAccount.publicKey) {
      setIsLoading(true)
      setError(null)
      
      try {
        let schemeString: string | undefined = undefined
        const rawPublicKeyBytes = currentAccount.publicKey

        // Attempt to infer from public key length
        if (rawPublicKeyBytes.length === 32) {
          schemeString = 'ED25519'
        } else if (rawPublicKeyBytes.length === 33) {
          schemeString = 'SECP256K1'
        }

        // Fallback: check chains array
        if (!schemeString && currentAccount.chains) {
          for (const chain of currentAccount.chains) {
            if (chain.startsWith('sui:')) {
              const potentialScheme = chain.substring(4).toUpperCase()
              if (potentialScheme === 'ED25519' || potentialScheme === 'SECP256K1' || potentialScheme === 'SECP256R1') {
                schemeString = potentialScheme
                break
              }
            }
          }
        }

        if (!schemeString) {
          throw new Error('Could not determine key scheme')
        }
        
        let keySchemeForFlag: 'ED25519' | 'Secp256k1' | 'Secp256r1'
        let suiKeyScheme: SuiKeyScheme
        
        if (schemeString === 'ED25519') {
          keySchemeForFlag = 'ED25519'
          suiKeyScheme = 'ed25519'
        } else if (schemeString === 'SECP256K1') {
          keySchemeForFlag = 'Secp256k1'
          suiKeyScheme = 'secp256k1'
        } else if (schemeString === 'SECP256R1') {
          keySchemeForFlag = 'Secp256r1'
          suiKeyScheme = 'secp256r1'
        } else {
          throw new Error(`Unsupported key scheme: ${schemeString}`)
        }

        // Create the formatted public key with flag byte
        const flag = getFlagForKeyScheme(keySchemeForFlag)
        const pkWithFlag = new Uint8Array(1 + rawPublicKeyBytes.length)
        pkWithFlag[0] = flag
        pkWithFlag.set(rawPublicKeyBytes, 1)
        
        // Create PublicKey instance to derive address
        let publicKeyInstance: PublicKey
        if (suiKeyScheme === 'ed25519') {
          publicKeyInstance = new Ed25519PublicKey(rawPublicKeyBytes)
        } else if (suiKeyScheme === 'secp256k1') {
          publicKeyInstance = new Secp256k1PublicKey(rawPublicKeyBytes)
        } else {
          publicKeyInstance = new Secp256r1PublicKey(rawPublicKeyBytes)
        }
        
        const derivedAddress = publicKeyInstance.toSuiAddress()
        
        setFormattedPublicKey(toBase64(pkWithFlag))
        setKeyScheme(suiKeyScheme)
        setAddress(derivedAddress)
        setIsLoading(false)
      } catch (err: any) {
        console.error('Error formatting public key:', err)
        setError(err.message || 'Failed to format public key')
        setFormattedPublicKey(null)
        setKeyScheme(null)
        setAddress(null)
        setIsLoading(false)
      }
    } else {
      setFormattedPublicKey(null)
      setKeyScheme(null)
      setAddress(null)
      setIsLoading(false)
      setError(null)
    }
  }, [currentAccount])

  return {
    formattedPublicKey,
    keyScheme,
    address,
    isLoading,
    error
  }
}

// Helper function to validate a base64 public key
export function validatePublicKey(base64Key: string): {
  isValid: boolean
  keyScheme?: SuiKeyScheme
  address?: string
  error?: string
} {
  try {
    // Decode base64
    const bytes = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0))
    
    if (bytes.length < 2) {
      return { isValid: false, error: 'Key too short' }
    }
    
    const flag = bytes[0]
    const publicKeyBytes = bytes.slice(1)
    
    let keyScheme: SuiKeyScheme
    let publicKey: PublicKey
    
    switch (flag) {
      case 0x00:
        if (publicKeyBytes.length !== 32) {
          return { isValid: false, error: 'Ed25519 key must be 32 bytes' }
        }
        keyScheme = 'ed25519'
        publicKey = new Ed25519PublicKey(publicKeyBytes)
        break
        
      case 0x01:
        if (publicKeyBytes.length !== 33) {
          return { isValid: false, error: 'Secp256k1 key must be 33 bytes' }
        }
        keyScheme = 'secp256k1'
        publicKey = new Secp256k1PublicKey(publicKeyBytes)
        break
        
      case 0x02:
        keyScheme = 'secp256r1'
        publicKey = new Secp256r1PublicKey(publicKeyBytes)
        break
        
      default:
        return { isValid: false, error: `Unknown key scheme flag: 0x${flag.toString(16)}` }
    }
    
    const address = publicKey.toSuiAddress()
    
    return {
      isValid: true,
      keyScheme,
      address
    }
  } catch (err: any) {
    return {
      isValid: false,
      error: err.message || 'Invalid public key format'
    }
  }
}