import { SuiMultisigConfig } from './types/sui'

export interface StoredWallet {
  id: string
  name: string
  address: string
  threshold: number
  signers: Array<{
    publicKey: string
    weight: number
    keyScheme: string
    name?: string
  }>
  createdAt: string
}

export interface StoredProposal {
  id: string
  walletId: string
  title: string
  description: string
  txBytes: string
  createdBy: string
  status: 'pending' | 'executed' | 'cancelled'
  createdAt: string
  executedDigest?: string
  signatures: Array<{
    id: string
    signerPublicKey: string
    signature: string
    createdAt: string
  }>
}

const WALLETS_KEY = 'sui_multisig_wallets'
const PROPOSALS_KEY = 'sui_multisig_proposals'

// Wallet functions
export function getStoredWallets(): StoredWallet[] {
  const data = localStorage.getItem(WALLETS_KEY)
  return data ? JSON.parse(data) : []
}

export function getStoredWallet(id: string): StoredWallet | null {
  const wallets = getStoredWallets()
  return wallets.find(w => w.id === id) || null
}

export function saveWallet(config: SuiMultisigConfig, name?: string): StoredWallet {
  const wallets = getStoredWallets()
  
  const newWallet: StoredWallet = {
    id: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: name || `Multisig Wallet ${wallets.length + 1}`,
    address: config.multisigAddress,
    threshold: config.threshold,
    signers: config.signers.map((s, idx) => ({
      ...s,
      name: `Signer ${idx + 1}`
    })),
    createdAt: new Date().toISOString()
  }
  
  wallets.push(newWallet)
  localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets))
  
  return newWallet
}

export function updateWallet(id: string, updates: Partial<StoredWallet>): void {
  const wallets = getStoredWallets()
  const index = wallets.findIndex(w => w.id === id)
  
  if (index !== -1) {
    wallets[index] = { ...wallets[index], ...updates }
    localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets))
  }
}

export function deleteWallet(id: string): void {
  const wallets = getStoredWallets()
  const filtered = wallets.filter(w => w.id !== id)
  localStorage.setItem(WALLETS_KEY, JSON.stringify(filtered))
  
  // Also delete associated proposals
  const proposals = getStoredProposals()
  const filteredProposals = proposals.filter(p => p.walletId !== id)
  localStorage.setItem(PROPOSALS_KEY, JSON.stringify(filteredProposals))
}

// Proposal functions
export function getStoredProposals(walletId?: string): StoredProposal[] {
  const data = localStorage.getItem(PROPOSALS_KEY)
  const proposals = data ? JSON.parse(data) : []
  
  if (walletId) {
    return proposals.filter((p: StoredProposal) => p.walletId === walletId)
  }
  
  return proposals
}

export function getStoredProposal(id: string): StoredProposal | null {
  const proposals = getStoredProposals()
  return proposals.find(p => p.id === id) || null
}

export function saveProposal(proposal: Omit<StoredProposal, 'id' | 'createdAt' | 'signatures'>): StoredProposal {
  const proposals = getStoredProposals()
  
  const newProposal: StoredProposal = {
    ...proposal,
    id: `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    signatures: []
  }
  
  proposals.push(newProposal)
  localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals))
  
  return newProposal
}

export function addSignature(proposalId: string, signerPublicKey: string, signature: string): void {
  const proposals = getStoredProposals()
  const index = proposals.findIndex(p => p.id === proposalId)
  
  if (index !== -1) {
    const newSignature = {
      id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      signerPublicKey,
      signature,
      createdAt: new Date().toISOString()
    }
    
    proposals[index].signatures.push(newSignature)
    localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals))
  }
}

export function updateProposalStatus(proposalId: string, status: StoredProposal['status'], executedDigest?: string): void {
  const proposals = getStoredProposals()
  const index = proposals.findIndex(p => p.id === proposalId)
  
  if (index !== -1) {
    proposals[index].status = status
    if (executedDigest) {
      proposals[index].executedDigest = executedDigest
    }
    localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals))
  }
}

// Helper function to export wallet configuration
export function exportWalletConfig(walletId: string): SuiMultisigConfig | null {
  const wallet = getStoredWallet(walletId)
  if (!wallet) return null
  
  return {
    multisigAddress: wallet.address,
    threshold: wallet.threshold,
    signers: wallet.signers.map(s => ({
      publicKey: s.publicKey,
      weight: s.weight,
      keyScheme: s.keyScheme as 'ed25519' | 'secp256k1' | 'secp256r1'
    }))
  }
}

// Helper function to clear all data (useful for testing)
export function clearAllData(): void {
  localStorage.removeItem(WALLETS_KEY)
  localStorage.removeItem(PROPOSALS_KEY)
}