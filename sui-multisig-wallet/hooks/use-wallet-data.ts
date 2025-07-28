import { useEffect, useState } from 'react'
import { useRealtimeWallet } from './use-realtime-wallet'
import { getStoredWallet, getStoredProposals } from '@/lib/local-storage'

export function useWalletData(walletId: string) {
  const [localWallet, setLocalWallet] = useState<any>(null)
  const [isLocalWallet, setIsLocalWallet] = useState(false)
  const realtimeData = useRealtimeWallet(walletId)

  useEffect(() => {
    // Check if wallet exists in local storage
    const wallet = getStoredWallet(walletId)
    if (wallet) {
      const proposals = getStoredProposals(walletId)
      setLocalWallet({
        wallet: {
          id: wallet.id,
          name: wallet.name,
          address: wallet.address,
          threshold: wallet.threshold,
          owners: wallet.signers.map((signer, index) => ({
            id: `${wallet.id}-${index}`,
            wallet_id: wallet.id,
            name: signer.name || `Signer ${index + 1}`,
            public_key: signer.publicKey,
            weight: signer.weight,
            type: signer.keyScheme,
            metadata: { originalKeyScheme: signer.keyScheme }
          }))
        },
        proposals: proposals.map(p => ({
          id: p.id,
          wallet_id: p.walletId,
          title: p.title,
          description: p.description,
          tx_bytes: p.txBytes,
          created_by: p.createdBy,
          status: p.status,
          created_at: p.createdAt,
          executed_digest: p.executedDigest,
          signatures: p.signatures.map(s => {
            // Find the owner by matching public key
            const owner = wallet.signers.find(signer => signer.publicKey === s.signerPublicKey)
            const ownerIndex = wallet.signers.findIndex(signer => signer.publicKey === s.signerPublicKey)
            return {
              id: s.id,
              proposal_id: p.id,
              owner_id: owner ? `${wallet.id}-${ownerIndex}` : null,
              signature: s.signature,
              signed_at: s.createdAt,
              signerPublicKey: s.signerPublicKey, // Preserve for local wallet matching
              owner: owner ? {
                id: `${wallet.id}-${ownerIndex}`,
                name: owner.name || `Signer ${ownerIndex + 1}`,
                weight: owner.weight,
                public_key: owner.publicKey,
                type: owner.keyScheme
              } : null
            }
          })
        })),
        isLoading: false,
        error: null
      })
      setIsLocalWallet(true)
    }
  }, [walletId])

  // Return local wallet if it exists, otherwise return realtime data
  return isLocalWallet ? localWallet : realtimeData
}