'use client'

import { use } from 'react'
import { SidebarProvider } from "@/components/ui/sidebar"
import { VaultSidebar } from "@/components/vault-sidebar"
import { VaultDashboard } from "@/components/vault-dashboard"
import { TransactionProposal } from "@/components/transaction-proposal"
import { SimpleSignatureFlow } from "@/components/simple-signature-flow"
import { SimpleTransactionHistory } from "@/components/simple-transaction-history"
import { WalletSettings } from "@/components/wallet-settings"
import { SignerManagement } from "@/components/signer-management"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { VaultLogo } from "@/components/vault-logo"
import { ConnectWallet } from "@/components/connect-wallet"
import { useState } from "react"
import { useWalletData } from "@/hooks/use-wallet-data"

export default function WalletPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const walletId = resolvedParams.id
  
  const [activeView, setActiveView] = useState("dashboard")
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null)
  
  // Get wallet data including multisig address
  const walletData = useWalletData(walletId)
  
  const wallet = walletData.wallet

  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <VaultDashboard 
            walletId={walletId}
            onViewTransaction={(id) => {
              setSelectedTransaction(id)
              setActiveView("signatures")
            }}
            onNavigate={setActiveView}
          />
        )
      case "history":
        return (
          <SimpleTransactionHistory 
            walletId={walletId}
            onViewTransaction={(id) => {
              setSelectedTransaction(id)
              setActiveView("signatures")
            }}
          />
        )
      case "propose":
        return (
          <TransactionProposal 
            walletId={walletId}
            multisigAddress={wallet?.address}
            onComplete={() => setActiveView("dashboard")}
          />
        )
      case "signatures":
        return (
          <SimpleSignatureFlow 
            walletId={walletId}
            transactionId={selectedTransaction}
            onNavigate={setActiveView}
          />
        )
      case "signers":
        return <SignerManagement />
      case "settings":
        return <WalletSettings />
      default:
        return (
          <VaultDashboard 
            walletId={walletId}
            onViewTransaction={(id) => {
              setSelectedTransaction(id)
              setActiveView("signatures")
            }}
            onNavigate={setActiveView}
          />
        )
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
            {renderActiveView()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}