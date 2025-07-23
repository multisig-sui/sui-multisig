import { createClient } from './client'
import type { Database } from './types'

type ProposalInsert = Database['public']['Tables']['proposals']['Insert']

export async function createProposal(proposal: ProposalInsert) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('proposals')
    .insert(proposal)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating proposal:', error)
    throw error
  }
  
  return data
}

export async function submitSignature({
  proposalId,
  ownerId,
  signature
}: {
  proposalId: string
  ownerId: string
  signature: string
}) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('signatures')
    .insert({
      proposal_id: proposalId,
      owner_id: ownerId,
      signature
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error submitting signature:', error)
    throw error
  }
  
  return data
}

export async function updateProposalStatus(
  proposalId: string,
  status: 'pending' | 'executing' | 'executed' | 'cancelled',
  executedDigest?: string
) {
  const supabase = createClient()
  
  const updates: any = { status }
  
  if (status === 'executed' && executedDigest) {
    updates.executed_digest = executedDigest
    updates.executed_at = new Date().toISOString()
  }
  
  const { data, error } = await supabase
    .from('proposals')
    .update(updates)
    .eq('id', proposalId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating proposal:', error)
    throw error
  }
  
  return data
}