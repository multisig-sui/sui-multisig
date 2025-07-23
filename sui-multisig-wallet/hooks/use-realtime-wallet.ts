'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { 
  Proposal, 
  Signature, 
  Owner, 
  ProposalWithSignatures,
  WalletWithOwners,
  WalletProposal
} from '@/lib/supabase/types'

interface UseRealtimeWalletReturn {
  wallet: WalletWithOwners | null
  proposals: ProposalWithSignatures[]
  pendingProposals: ProposalWithSignatures[]
  executedProposals: ProposalWithSignatures[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useRealtimeWallet(walletId: string): UseRealtimeWalletReturn {
  const [wallet, setWallet] = useState<WalletWithOwners | null>(null)
  const [proposals, setProposals] = useState<ProposalWithSignatures[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const supabase = createClient()

  const fetchWalletData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch wallet with owners
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select(`
          *,
          owners(*)
        `)
        .eq('id', walletId)
        .single()

      if (walletError) throw walletError

      setWallet(walletData as WalletWithOwners)

      // Fetch proposals with signatures
      const { data: proposalsData, error: proposalsError } = await supabase
        .from('proposals')
        .select(`
          *,
          signatures(
            *,
            owner:owners(*)
          )
        `)
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false })

      if (proposalsError) throw proposalsError

      setProposals(proposalsData as ProposalWithSignatures[])
    } catch (err) {
      console.error('Error fetching wallet data:', err)
      setError(err as Error)
      toast.error('Failed to load wallet data')
    } finally {
      setIsLoading(false)
    }
  }, [walletId, supabase])

  // Set up realtime subscriptions
  useEffect(() => {
    fetchWalletData()

    // Subscribe to proposals channel
    const proposalsChannel = supabase
      .channel(`wallet-${walletId}-proposals`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'proposals',
          filter: `wallet_id=eq.${walletId}`
        },
        async (payload) => {
          const newProposal = payload.new as Proposal
          
          // Fetch the full proposal with relations
          const { data } = await supabase
            .from('proposals')
            .select(`
              *,
              signatures(
                *,
                owner:owners(*)
              )
            `)
            .eq('id', newProposal.id)
            .single()

          if (data) {
            setProposals(prev => [data as ProposalWithSignatures, ...prev])
            toast.success('New transaction proposal created!')
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'proposals',
          filter: `wallet_id=eq.${walletId}`
        },
        async (payload) => {
          const updatedProposal = payload.new as Proposal
          
          // Fetch the full updated proposal
          const { data } = await supabase
            .from('proposals')
            .select(`
              *,
              signatures(
                *,
                owner:owners(*)
              )
            `)
            .eq('id', updatedProposal.id)
            .single()

          if (data) {
            setProposals(prev =>
              prev.map(p => p.id === updatedProposal.id ? (data as ProposalWithSignatures) : p)
            )
            
            if (updatedProposal.status === 'executed') {
              toast.success('Transaction executed successfully! 🎉')
            } else if (updatedProposal.status === 'cancelled') {
              toast.info('Transaction cancelled')
            }
          }
        }
      )

    // Subscribe to signatures channel
    const signaturesChannel = supabase
      .channel(`wallet-${walletId}-signatures`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'signatures'
        },
        async (payload) => {
          const newSignature = payload.new as Signature
          
          // Check if this signature is for one of our proposals
          const proposalIndex = proposals.findIndex(p => p.id === newSignature.proposal_id)
          if (proposalIndex === -1) return
          
          // Fetch the owner info for the signature
          const { data: ownerData } = await supabase
            .from('owners')
            .select('*')
            .eq('id', newSignature.owner_id)
            .single()
          
          if (ownerData) {
            // Update the proposal with the new signature
            setProposals(prev => {
              const updated = [...prev]
              const proposal = updated[proposalIndex]
              const signatureWithOwner = {
                ...newSignature,
                owner: ownerData
              }
              
              // Add signature if not already present
              if (!proposal.signatures.find(s => s.id === newSignature.id)) {
                proposal.signatures.push(signatureWithOwner)
                
                // Show notification
                toast.success(`${ownerData.name} signed the transaction!`)
                
                // Check if threshold is met
                const totalWeight = proposal.signatures.reduce(
                  (sum, sig) => sum + (sig.owner?.weight || 0), 
                  0
                )
                
                if (wallet && totalWeight >= wallet.threshold) {
                  toast.info('Threshold reached! Ready to execute 🚀', {
                    action: {
                      label: 'View',
                      onClick: () => {
                        // This would navigate to the proposal
                        console.log('Navigate to proposal:', proposal.id)
                      }
                    }
                  })
                }
              }
              
              return updated
            })
          }
        }
      )

    // Subscribe to both channels
    proposalsChannel.subscribe()
    signaturesChannel.subscribe()

    // Cleanup
    return () => {
      supabase.removeChannel(proposalsChannel)
      supabase.removeChannel(signaturesChannel)
    }
  }, [walletId, supabase, wallet, proposals])

  // Computed values
  const pendingProposals = proposals.filter(p => p.status === 'pending')
  const executedProposals = proposals.filter(p => p.status === 'executed')

  return {
    wallet,
    proposals,
    pendingProposals,
    executedProposals,
    isLoading,
    error,
    refetch: fetchWalletData
  }
}