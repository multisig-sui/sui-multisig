"use client"

import { useState } from "react"
import { Scan, ArrowRight, ArrowLeft, Check, Copy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { QRCodeSVG } from "qrcode.react"
import { motion } from "framer-motion"

interface QrSignatureFlowProps {
  transactionId: string
  transactionData: string
  onSignatureReceived: (signature: string) => void
}

export function QrSignatureFlow({ transactionId, transactionData, onSignatureReceived }: QrSignatureFlowProps) {
  const [activeTab, setActiveTab] = useState("generate")
  const [manualSignature, setManualSignature] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // In a real app, this would be actual transaction data
  const qrData = JSON.stringify({
    type: "sui-multisig-payload",
    id: transactionId,
    data: transactionData.slice(0, 100) + "...", // Truncated for demo
  })

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(qrData)
  }

  const handleManualSubmit = () => {
    if (manualSignature.trim()) {
      setIsSuccess(true)
      setTimeout(() => {
        onSignatureReceived(manualSignature)
      }, 1500)
    }
  }

  // This would be replaced with actual QR scanning logic
  const handleScanComplete = () => {
    setIsScanning(false)
    setIsSuccess(true)
    setTimeout(() => {
      onSignatureReceived(
        "0x" +
          Array(64)
            .fill("0123456789ABCDEF"[Math.floor(Math.random() * 16)])
            .join(""),
      )
    }, 1500)
  }

  return (
    <Card className="elevated-card overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle>Offline Signature</CardTitle>
        <CardDescription>Generate QR code for offline signing or scan a signature</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="generate" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="generate">Generate QR</TabsTrigger>
            <TabsTrigger value="scan">Scan Signature</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-xl border border-border">
              <div className="bg-white p-4 rounded-lg mb-4">
                <QRCodeSVG value={qrData} size={200} level="H" />
              </div>
              <p className="text-sm text-center text-muted-foreground mb-4">
                Scan this QR code with an offline device to sign the transaction
              </p>
              <Button variant="outline" size="sm" onClick={handleCopyToClipboard} className="bg-transparent">
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy Payload
              </Button>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setActiveTab("scan")} className="text-sm">
                <ArrowRight className="h-4 w-4 mr-1.5" />
                Next: Scan Signature
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="scan" className="space-y-6">
            {!isScanning && !isSuccess ? (
              <>
                <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-xl border border-border">
                  <Button onClick={() => setIsScanning(true)} className="apple-button mb-6">
                    <Scan className="h-4 w-4 mr-2" />
                    Scan QR Signature
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">Or paste the signature manually below</p>
                </div>

                <div className="space-y-2">
                  <Textarea
                    placeholder="Paste signature here (0x...)"
                    value={manualSignature}
                    onChange={(e) => setManualSignature(e.target.value)}
                    className="font-mono text-sm h-24"
                  />
                  <Button onClick={handleManualSubmit} disabled={!manualSignature.trim()} className="w-full">
                    Submit Signature
                  </Button>
                </div>

                <Button variant="ghost" onClick={() => setActiveTab("generate")} className="text-sm">
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Back to Generate QR
                </Button>
              </>
            ) : isScanning ? (
              <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-xl border border-border">
                <div className="relative w-64 h-64 mb-4">
                  <div className="absolute inset-0 border-2 border-dashed border-primary rounded-lg animate-pulse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Scan className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                  {/* This would be replaced with an actual camera view */}
                  <div className="absolute inset-0 bg-black/5 rounded-lg"></div>
                </div>
                <p className="text-sm text-center text-muted-foreground mb-4">
                  Position the QR code in the center of the frame
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsScanning(false)} className="bg-transparent">
                    Cancel
                  </Button>
                  <Button onClick={handleScanComplete}>Simulate Scan</Button>
                </div>
              </div>
            ) : (
              <motion.div
                className="flex flex-col items-center justify-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-1">Signature Received!</h3>
                <p className="text-sm text-center text-green-600 dark:text-green-400 mb-4">
                  The signature has been successfully added to the transaction
                </p>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
