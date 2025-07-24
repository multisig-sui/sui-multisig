'use client'

import { useState } from 'react'
import { CreateMultisigWallet } from '@/components/create-multisig-wallet'
import { AddressConverter } from '@/components/address-converter'
import { SidebarProvider } from "@/components/ui/sidebar"
import { VaultSidebar } from "@/components/vault-sidebar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { VaultLogo } from "@/components/vault-logo"
import { ConnectWallet } from "@/components/connect-wallet"
import { useRouter } from 'next/navigation'
import { SuiMultisigConfig } from '@/lib/types/sui'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function CreatePage() {
  const router = useRouter()
  const [isCreatingInDb, setIsCreatingInDb] = useState(false)
  const [activeView, setActiveView] = useState("create")

  const handleComplete = async (config: SuiMultisigConfig) => {
    setIsCreatingInDb(true)
    
    try {
      const supabase = createClient()
      
      // Create wallet in database
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .insert({
          name: 'My Multisig Wallet',
          address: config.multisigAddress,
          threshold: config.threshold
        })
        .select()
        .single()
      
      if (walletError) throw walletError
      
      // Create owners
      const owners = config.signers.map(signer => ({
        wallet_id: wallet.id,
        name: `Signer ${signer.publicKey.slice(0, 8)}`,
        type: signer.keyScheme,
        public_key: signer.publicKey,
        weight: signer.weight,
        metadata: {}
      }))
      
      const { error: ownersError } = await supabase
        .from('owners')
        .insert(owners)
      
      if (ownersError) throw ownersError
      
      toast.success('Multisig wallet created successfully!')
      
      // Navigate to the wallet dashboard
      router.push(`/wallet/${wallet.id}`)
    } catch (error) {
      console.error('Error creating wallet:', error)
      toast.error('Failed to create wallet in database')
    } finally {
      setIsCreatingInDb(false)
    }
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <VaultSidebar activeView={activeView} onViewChange={setActiveView} />
        <div className="flex-1 flex flex-col">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4 md:px-6">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border mx-2" />
            <VaultLogo size="sm" showText={false} />
            <span className="vault-subheading brand-orchid">VaultLink</span>
            <div className="ml-auto">
              <ConnectWallet />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <CreateMultisigWallet 
                    onComplete={handleComplete}
                    isLoading={isCreatingInDb}
                  />
                </div>
                
                <div className="lg:col-span-1">
                  <AddressConverter />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}