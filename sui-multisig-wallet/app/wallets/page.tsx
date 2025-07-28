'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Wallet, Users, FileJson } from "lucide-react"
import { getStoredWallets } from '@/lib/local-storage'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function WalletsPage() {
  const router = useRouter()
  const [localWallets, setLocalWallets] = useState<any[]>([])
  const [supabaseWallets, setSupabaseWallets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load local wallets
    const wallets = getStoredWallets()
    setLocalWallets(wallets)

    // Try to load Supabase wallets
    const loadSupabaseWallets = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('wallets')
          .select(`
            *,
            owners(*)
          `)
          .order('created_at', { ascending: false })
        
        if (!error && data) {
          setSupabaseWallets(data)
        }
      } catch (error) {
        console.error('Error loading Supabase wallets:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSupabaseWallets()
  }, [])

  const allWallets = [...localWallets, ...supabaseWallets]

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Multisig Wallets</h1>
            <p className="text-muted-foreground mt-2">
              Manage your Sui multisig wallets
            </p>
          </div>
          <Button onClick={() => router.push('/create')} className="apple-button">
            <Plus className="h-4 w-4 mr-2" />
            Create Wallet
          </Button>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        ) : allWallets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No wallets yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first multisig wallet or import an existing one
              </p>
              <div className="flex gap-4">
                <Button onClick={() => router.push('/create')}>
                  Create New Wallet
                </Button>
                <Button variant="outline" onClick={() => router.push('/create?tab=import')}>
                  <FileJson className="h-4 w-4 mr-2" />
                  Import Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {allWallets.map((wallet) => {
              const isLocal = !wallet.created_at
              const signers = isLocal ? wallet.signers : wallet.owners
              const signersCount = signers?.length || 0
              
              return (
                <Card 
                  key={wallet.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/wallet/${wallet.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Wallet className="h-5 w-5" />
                          {wallet.name}
                        </CardTitle>
                        <CardDescription className="mt-2 font-mono text-xs">
                          {wallet.address}
                        </CardDescription>
                      </div>
                      {isLocal && (
                        <Badge variant="secondary">Local</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{signersCount} signers</span>
                        </div>
                        <Badge variant="secondary">
                          Threshold: {wallet.threshold}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {wallet.created_at 
                          ? `Created ${new Date(wallet.created_at).toLocaleDateString()}`
                          : 'Imported wallet'
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}