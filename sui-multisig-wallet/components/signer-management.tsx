"use client"

import { useState } from "react"
import { Plus, Trash2, Shield, Key, UserCheck, UserX, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Signer {
  id: string
  name: string
  address: string
  weight: number
  isConnected: boolean
  addedDate: Date
  lastActivity?: Date
}

export function SignerManagement() {
  const [signers, setSigners] = useState<Signer[]>([
    {
      id: "1",
      name: "Alice (You)",
      address: "0xabc123456789abcdef123456789abcdef12345678",
      weight: 1,
      isConnected: true,
      addedDate: new Date("2024-01-01"),
      lastActivity: new Date("2024-01-15T10:30:00Z"),
    },
    {
      id: "2",
      name: "Bob",
      address: "0xdef456789abcdef123456789abcdef123456789ab",
      weight: 1,
      isConnected: false,
      addedDate: new Date("2024-01-01"),
      lastActivity: new Date("2024-01-14T16:45:00Z"),
    },
    {
      id: "3",
      name: "Charlie",
      address: "0x789xyz123456789abcdef123456789abcdef123456",
      weight: 1,
      isConnected: true,
      addedDate: new Date("2024-01-01"),
      lastActivity: new Date("2024-01-15T09:15:00Z"),
    },
  ])

  const [threshold, setThreshold] = useState(2)
  const [isAddingSigner, setIsAddingSigner] = useState(false)
  const [newSigner, setNewSigner] = useState({
    name: "",
    address: "",
    weight: 1,
  })

  const totalWeight = signers.reduce((sum, signer) => sum + signer.weight, 0)

  const addSigner = () => {
    if (newSigner.name && newSigner.address) {
      const signer: Signer = {
        id: Date.now().toString(),
        name: newSigner.name,
        address: newSigner.address,
        weight: newSigner.weight,
        isConnected: false,
        addedDate: new Date(),
      }
      setSigners([...signers, signer])
      setNewSigner({ name: "", address: "", weight: 1 })
      setIsAddingSigner(false)
    }
  }

  const removeSigner = (id: string) => {
    if (signers.length > 2) {
      setSigners(signers.filter((s) => s.id !== id))
    }
  }

  const updateSignerWeight = (id: string, weight: number) => {
    setSigners(signers.map((s) => (s.id === id ? { ...s, weight } : s)))
  }

  return (
    <TooltipProvider>
      <div className="responsive-container sidebar-responsive-content">
        <div className="max-w-adaptive max-w-6xl mx-auto">
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex-responsive justify-between margin-responsive-y">
              <div>
                <h1 className="text-responsive-xl font-bold">Signer Management</h1>
                <p className="text-muted-foreground">Manage authorized signers and threshold policy</p>
              </div>
              <Dialog open={isAddingSigner} onOpenChange={setIsAddingSigner}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Signer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Signer</DialogTitle>
                    <DialogDescription>Add a new authorized signer to the multisig wallet</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="signer-name">Name</Label>
                      <Input
                        id="signer-name"
                        placeholder="Signer name"
                        value={newSigner.name}
                        onChange={(e) => setNewSigner({ ...newSigner, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="signer-address">Address</Label>
                      <Input
                        id="signer-address"
                        placeholder="0x..."
                        value={newSigner.address}
                        onChange={(e) => setNewSigner({ ...newSigner, address: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signer-weight">Weight</Label>
                      <Select
                        value={newSigner.weight.toString()}
                        onValueChange={(value) => setNewSigner({ ...newSigner, weight: Number.parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((weight) => (
                            <SelectItem key={weight} value={weight.toString()}>
                              {weight}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddingSigner(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addSigner} disabled={!newSigner.name || !newSigner.address}>
                      Add Signer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Threshold Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Threshold Policy
                </CardTitle>
                <CardDescription>Configure the number of signatures required to execute transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="responsive-grid responsive-grid-3 gap-6">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <Label htmlFor="threshold">Required Signatures</Label>
                    <Select
                      value={threshold.toString()}
                      onValueChange={(value) => setThreshold(Number.parseInt(value))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: signers.length }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} of {signers.length}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Total Signers</p>
                    <p className="text-2xl font-bold text-primary">{signers.length}</p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Total Weight</p>
                    <p className="text-2xl font-bold text-primary">{totalWeight}</p>
                  </div>
                </div>

                {threshold > totalWeight && (
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Threshold cannot exceed total weight. Adjust signer weights or threshold.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Signers List */}
            <Card>
              <CardHeader>
                <CardTitle>Authorized Signers</CardTitle>
                <CardDescription>{signers.length} signers configured</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {signers.map((signer) => (
                    <div
                      key={signer.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {signer.name.split(" ")[0][0]}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{signer.name}</p>
                            {signer.isConnected ? (
                              <Tooltip>
                                <TooltipTrigger>
                                  <UserCheck className="h-4 w-4 text-green-500" />
                                </TooltipTrigger>
                                <TooltipContent>Online</TooltipContent>
                              </Tooltip>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger>
                                  <UserX className="h-4 w-4 text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent>Offline</TooltipContent>
                              </Tooltip>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground font-mono">{signer.address.slice(0, 20)}...</p>

                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>Added: {signer.addedDate.toLocaleDateString()}</span>
                            {signer.lastActivity && (
                              <span>Last active: {signer.lastActivity.toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium mb-1">Weight</p>
                          <Select
                            value={signer.weight.toString()}
                            onValueChange={(value) => updateSignerWeight(signer.id, Number.parseInt(value))}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((weight) => (
                                <SelectItem key={weight} value={weight.toString()}>
                                  {weight}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={signer.isConnected ? "default" : "secondary"}>
                            {signer.isConnected ? "Online" : "Offline"}
                          </Badge>

                          {signers.length > 2 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeSigner(signer.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remove signer</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                Changes to signers and threshold policy require approval from existing signers. Ensure all signers are
                trusted and have secure key management practices.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
