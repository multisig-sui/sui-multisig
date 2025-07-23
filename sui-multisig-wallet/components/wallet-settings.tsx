"use client"

import { useState } from "react"
import { Shield, Bell, Download, Upload, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export function WalletSettings() {
  const [notifications, setNotifications] = useState({
    newTransactions: true,
    signatures: true,
    executed: false,
  })

  return (
    <div className="responsive-container sidebar-responsive-content">
      <div className="max-w-adaptive max-w-4xl mx-auto">
        <div className="margin-responsive-y">
          <h1 className="text-responsive-xl font-bold mb-2">Wallet Settings</h1>
          <p className="text-muted-foreground">Manage your multisig wallet configuration</p>
        </div>

        <div className="space-y-6">
          {/* Wallet Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Wallet Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="responsive-grid responsive-grid-2 gap-4">
                <div>
                  <Label>Wallet Address</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value="0x1234567890abcdef1234567890abcdef12345678" readOnly className="font-mono text-sm" />
                    <Button variant="outline" size="sm">
                      Copy
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Threshold Policy</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      2 of 3
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configure when you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Transaction Proposals</p>
                  <p className="text-sm text-muted-foreground">Get notified when new transactions are proposed</p>
                </div>
                <Switch
                  checked={notifications.newTransactions}
                  onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, newTransactions: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Signature Requests</p>
                  <p className="text-sm text-muted-foreground">Get notified when your signature is needed</p>
                </div>
                <Switch
                  checked={notifications.signatures}
                  onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, signatures: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Transaction Executed</p>
                  <p className="text-sm text-muted-foreground">Get notified when transactions are executed</p>
                </div>
                <Switch
                  checked={notifications.executed}
                  onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, executed: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Backup & Recovery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Backup & Recovery
              </CardTitle>
              <CardDescription>Export and import wallet configurations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Export Configuration
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Configuration
                </Button>
              </div>
              <Alert>
                <AlertDescription>
                  Keep your wallet configuration file safe. You'll need it to restore access to your multisig wallet.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions that affect your wallet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-red-200 dark:border-red-800">
                <AlertDescription>These actions cannot be undone. Please proceed with caution.</AlertDescription>
              </Alert>
              <Button variant="destructive" className="w-full">
                Remove Wallet from Device
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
