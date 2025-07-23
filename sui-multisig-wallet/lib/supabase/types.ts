export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      wallets: {
        Row: {
          id: string
          name: string
          address: string
          threshold: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          threshold: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          threshold?: number
          created_at?: string
          updated_at?: string
        }
      }
      owners: {
        Row: {
          id: string
          wallet_id: string
          name: string
          type: 'ed25519' | 'passkey' | 'zklogin'
          public_key: string
          weight: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          name: string
          type: 'ed25519' | 'passkey' | 'zklogin'
          public_key: string
          weight?: number
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          name?: string
          type?: 'ed25519' | 'passkey' | 'zklogin'
          public_key?: string
          weight?: number
          metadata?: Json
          created_at?: string
        }
      }
      proposals: {
        Row: {
          id: string
          wallet_id: string
          title: string
          description: string | null
          tx_bytes: string
          status: 'pending' | 'executing' | 'executed' | 'cancelled'
          created_by: string
          executed_digest: string | null
          created_at: string
          executed_at: string | null
        }
        Insert: {
          id?: string
          wallet_id: string
          title: string
          description?: string | null
          tx_bytes: string
          status?: 'pending' | 'executing' | 'executed' | 'cancelled'
          created_by: string
          executed_digest?: string | null
          created_at?: string
          executed_at?: string | null
        }
        Update: {
          id?: string
          wallet_id?: string
          title?: string
          description?: string | null
          tx_bytes?: string
          status?: 'pending' | 'executing' | 'executed' | 'cancelled'
          created_by?: string
          executed_digest?: string | null
          created_at?: string
          executed_at?: string | null
        }
      }
      signatures: {
        Row: {
          id: string
          proposal_id: string
          owner_id: string
          signature: string
          signed_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          owner_id: string
          signature: string
          signed_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          owner_id?: string
          signature?: string
          signed_at?: string
        }
      }
    }
    Views: {
      wallet_proposals: {
        Row: {
          id: string
          wallet_id: string
          title: string
          description: string | null
          tx_bytes: string
          status: 'pending' | 'executing' | 'executed' | 'cancelled'
          created_by: string
          executed_digest: string | null
          created_at: string
          executed_at: string | null
          wallet_name: string
          threshold: number
          signature_count: number
          total_weight: number
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easier use
export type Wallet = Database['public']['Tables']['wallets']['Row']
export type Owner = Database['public']['Tables']['owners']['Row']
export type Proposal = Database['public']['Tables']['proposals']['Row']
export type Signature = Database['public']['Tables']['signatures']['Row']
export type WalletProposal = Database['public']['Views']['wallet_proposals']['Row']

// Types with relations
export type ProposalWithSignatures = Proposal & {
  signatures: (Signature & {
    owner: Owner
  })[]
}

export type WalletWithOwners = Wallet & {
  owners: Owner[]
}