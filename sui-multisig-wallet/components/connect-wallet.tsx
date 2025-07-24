"use client"

import { ConnectButton, useCurrentAccount, useSuiClient } from "@mysten/dapp-kit"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useCallback } from "react"
import { CoinBalance } from "@mysten/sui/client"
import { Copy, Check, RefreshCw, Wallet } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useWalletPublicKey } from '@/hooks/use-wallet-public-key'

const SUI_COIN_TYPE = '0x2::sui::SUI';
const MIST_PER_SUI = 1_000_000_000;

export function ConnectWallet() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { formattedPublicKey } = useWalletPublicKey();
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [walletBalance, setWalletBalance] = useState<CoinBalance | null>(null);
  const [isLoadingWalletBalance, setIsLoadingWalletBalance] = useState<boolean>(false);

  const formatBalance = (totalBalance: string) => {
    const balanceInMist = BigInt(totalBalance);
    return (Number(balanceInMist) / MIST_PER_SUI).toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 4 
    });
  };

  const fetchWalletBalance = useCallback(async () => {
    if (!currentAccount?.address) {
      setWalletBalance(null);
      return;
    }
    setIsLoadingWalletBalance(true);
    try {
      const coinBalance = await suiClient.getBalance({
        owner: currentAccount.address,
        coinType: SUI_COIN_TYPE,
      });
      setWalletBalance(coinBalance);
    } catch (error: any) {
      console.error("Error fetching wallet balance:", error);
      setWalletBalance(null);
    } finally {
      setIsLoadingWalletBalance(false);
    }
  }, [suiClient, currentAccount?.address]);

  useEffect(() => {
    if (currentAccount?.address) {
      fetchWalletBalance();
    } else {
      setWalletBalance(null);
      setIsLoadingWalletBalance(false);
    }
  }, [currentAccount?.address, fetchWalletBalance]);


  const handleCopyPublicKey = () => {
    if (formattedPublicKey) {
      navigator.clipboard.writeText(formattedPublicKey);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleCopyAddress = () => {
    if (currentAccount?.address) {
      navigator.clipboard.writeText(currentAccount.address);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Override the default ConnectButton with our custom dropdown
  if (currentAccount) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline-block">
              {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
            </span>
            <span className="sm:hidden">
              {currentAccount.address.slice(0, 4)}...
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Wallet Details</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Balance */}
          <DropdownMenuItem className="flex-col items-start gap-1">
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-medium">Balance</span>
              <div className="flex items-center gap-2">
                {isLoadingWalletBalance ? (
                  <span className="text-sm text-muted-foreground">Loading...</span>
                ) : walletBalance ? (
                  <span className="text-sm font-mono">{formatBalance(walletBalance.totalBalance)} SUI</span>
                ) : (
                  <span className="text-sm text-muted-foreground">Error</span>
                )}
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchWalletBalance();
                  }}
                  disabled={isLoadingWalletBalance}
                >
                  <RefreshCw className={`h-3 w-3 ${isLoadingWalletBalance ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </DropdownMenuItem>

          {/* Address */}
          <DropdownMenuItem 
            className="flex-col items-start gap-1 cursor-pointer"
            onClick={handleCopyAddress}
          >
            <span className="text-sm font-medium">Address</span>
            <div className="flex items-center gap-2 w-full">
              <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                {currentAccount.address}
              </code>
              {copySuccess ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </div>
          </DropdownMenuItem>

          {/* Public Key */}
          {formattedPublicKey && (
            <DropdownMenuItem 
              className="flex-col items-start gap-1 cursor-pointer"
              onClick={handleCopyPublicKey}
            >
              <span className="text-sm font-medium">Formatted Public Key</span>
              <div className="flex items-center gap-2 w-full">
                <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                  {formattedPublicKey}
                </code>
                {copySuccess ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </div>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          
          {/* Disconnect using ConnectButton */}
          <div className="p-2">
            <ConnectButton 
              connectText="Switch Wallet"
              style={{
                width: '100%',
              }}
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return <ConnectButton />;
}