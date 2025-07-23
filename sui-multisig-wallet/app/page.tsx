"use client"

import { useState, useEffect } from "react"
import { SuiMultisigConfig } from "@/lib/types/sui"
import { SidebarProvider } from "@/components/ui/sidebar"
import { VaultSidebar } from "@/components/vault-sidebar"
import { VaultDashboard } from "@/components/vault-dashboard"
import { SimpleCreateWallet } from "@/components/simple-create-wallet"
import { CreateMultisigWallet } from "@/components/create-multisig-wallet"
import { TransactionProposal } from "@/components/transaction-proposal"
import { SimpleSignatureFlow } from "@/components/simple-signature-flow"
import { SimpleTransactionHistory } from "@/components/simple-transaction-history"
import { WalletSettings } from "@/components/wallet-settings"
import { SignerManagement } from "@/components/signer-management"
import { LoadingScreen } from "@/components/loading-screen"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { VaultLogo } from "@/components/vault-logo"
import { ConnectWallet } from "@/components/connect-wallet"

function MainContent({
  activeView,
  selectedTransaction,
  setSelectedTransaction,
  setActiveView,
  activeMultisigConfig,
  setActiveMultisigConfig,
}: {
  activeView: string
  selectedTransaction: string | null
  setSelectedTransaction: (id: string | null) => void
  setActiveView: (view: string) => void
  activeMultisigConfig: SuiMultisigConfig | null
  setActiveMultisigConfig: (config: SuiMultisigConfig | null) => void
}) {
  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard":
        return <VaultDashboard onViewTransaction={setSelectedTransaction} onNavigate={setActiveView} />
      case "history":
        return <SimpleTransactionHistory onViewTransaction={setSelectedTransaction} />
      case "create":
        return <CreateMultisigWallet onComplete={(config) => {
          setActiveMultisigConfig(config)
          setActiveView("dashboard")
        }} />
      case "propose":
        return <TransactionProposal onComplete={() => setActiveView("dashboard")} />
      case "signatures":
        return <SimpleSignatureFlow transactionId={selectedTransaction} onNavigate={setActiveView} />
      case "signers":
        return <SignerManagement />
      case "settings":
        return <WalletSettings />
      default:
        return <VaultDashboard onViewTransaction={setSelectedTransaction} onNavigate={setActiveView} />
    }
  }

  return (
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
      <main className="flex-1 overflow-auto">{renderActiveView()}</main>
    </div>
  )
}

export default function Home() {
  const [activeView, setActiveView] = useState("dashboard")
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeMultisigConfig, setActiveMultisigConfig] = useState<SuiMultisigConfig | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <VaultSidebar activeView={activeView} onViewChange={setActiveView} />
        <MainContent
          activeView={activeView}
          selectedTransaction={selectedTransaction}
          setSelectedTransaction={setSelectedTransaction}
          setActiveView={setActiveView}
          activeMultisigConfig={activeMultisigConfig}
          setActiveMultisigConfig={setActiveMultisigConfig}
        />
      </div>
    </SidebarProvider>
  )
}
