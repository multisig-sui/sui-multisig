'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { ProposalWithSignatures, Owner } from '@/lib/supabase/types'

interface UseRealtimeProposalReturn {
  proposal: ProposalWithSignatures | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useRealtimeProposal(proposalId: string | null): UseRealtimeProposalReturn {
  const [proposal, setProposal] = useState<ProposalWithSignatures | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const supabase = createClient()

  const fetchProposal = useCallback(async () => {
    if (!proposalId) {
      setProposal(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('proposals')
        .select(`
          *,
          signatures(
            *,
            owner:owners(*)
          )
        `)
        .eq('id', proposalId)
        .single()

      if (fetchError) throw fetchError

      setProposal(data as ProposalWithSignatures)
    } catch (err) {
      console.error('Error fetching proposal:', err)
      setError(err as Error)
      toast.error('Failed to load proposal')
    } finally {
      setIsLoading(false)
    }
  }, [proposalId, supabase])

  useEffect(() => {
    if (!proposalId) return

    fetchProposal()

    // Subscribe to proposal updates
    const proposalChannel = supabase
      .channel(`proposal-${proposalId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'proposals',
          filter: `id=eq.${proposalId}`
        },
        async (payload) => {
          // Refetch the full proposal with relations
          await fetchProposal()
          
          const updated = payload.new as any
          if (updated.status === 'executed') {
            toast.success('Transaction executed successfully! 🎉')
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'signatures',
          filter: `proposal_id=eq.${proposalId}`
        },
        async (payload) => {
          const newSignature = payload.new as any
          
          // Fetch owner info
          const { data: ownerData } = await supabase
            .from('owners')
            .select('*')
            .eq('id', newSignature.owner_id)
            .single()
          
          if (ownerData) {
            setProposal(prev => {
              if (!prev) return null
              
              const signatureWithOwner = {
                ...newSignature,
                owner: ownerData
              }
              
              // Check if signature already exists
              const exists = prev.signatures.some(s => s.id === newSignature.id)
              if (!exists) {
                toast.success(`${ownerData.name} signed the transaction!`)
                return {
                  ...prev,
                  signatures: [...prev.signatures, signatureWithOwner]
                }
              }
              
              return prev
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(proposalChannel)
    }
  }, [proposalId, supabase, fetchProposal])

  return {
    proposal,
    isLoading,
    error,
    refetch: fetchProposal
  }
}