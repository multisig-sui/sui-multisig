"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Clock, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import confetti from "canvas-confetti"

interface Signer {
  id: string
  name: string
  address: string
  hasSigned: boolean
  signedAt?: Date
  avatar?: string
  walletType?: "zkLogin" | "Ledger" | "Suiet" | "Other"
}

interface CollaborativeSignatureFlowProps {
  signers: Signer[]
  requiredSignatures: number
  onComplete?: () => void
}

export function CollaborativeSignatureFlow({
  signers: initialSigners,
  requiredSignatures,
  onComplete,
}: CollaborativeSignatureFlowProps) {
  const [signers, setSigners] = useState<Signer[]>(initialSigners)
  const [isComplete, setIsComplete] = useState(false)

  const signedCount = signers.filter((s) => s.hasSigned).length
  const progress = (signedCount / requiredSignatures) * 100

  useEffect(() => {
    if (signedCount >= requiredSignatures && !isComplete) {
      setIsComplete(true)

      // Trigger confetti when all required signatures are collected
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#4f46e5", "#8b5cf6", "#06b6d4"],
      })

      if (onComplete) {
        setTimeout(onComplete, 1000)
      }
    }
  }, [signedCount, requiredSignatures, isComplete, onComplete])

  // This would be called when a signature is added in a real app
  const simulateNewSignature = (signerId: string) => {
    setSigners(
      signers.map((s) => (s.id === signerId && !s.hasSigned ? { ...s, hasSigned: true, signedAt: new Date() } : s)),
    )
  }

  const getWalletIcon = (type?: string) => {
    switch (type) {
      case "zkLogin":
        return "🔐"
      case "Ledger":
        return "🔒"
      case "Suiet":
        return "🦊"
      default:
        return "👛"
    }
  }

  return (
    <TooltipProvider>
      <Card className="elevated-card overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              Signature Collection
              <p className="text-sm font-normal text-muted-foreground">
                {signedCount} of {requiredSignatures} required signatures
              </p>
            </div>
            <Badge
              variant={isComplete ? "default" : "secondary"}
              className={isComplete ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : ""}
            >
              {isComplete ? "Ready to Execute" : "Collecting Signatures"}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0/{requiredSignatures}</span>
              <span>
                {signedCount}/{requiredSignatures}
              </span>
              <span>
                {requiredSignatures}/{requiredSignatures}
              </span>
            </div>
          </div>

          {/* Signers list */}
          <div className="space-y-3">
            {signers.map((signer) => (
              <motion.div
                key={signer.id}
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  signer.hasSigned
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : "bg-muted/50 border-border"
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-gray-800 shadow-md">
                    <AvatarFallback
                      className={`${
                        signer.hasSigned
                          ? "bg-gradient-to-br from-green-500 to-emerald-600"
                          : "bg-gradient-to-br from-purple-500 to-blue-600"
                      } text-white`}
                    >
                      {signer.name[0]}
                    </AvatarFallback>
                    {signer.avatar && <AvatarImage src={signer.avatar || "/placeholder.svg"} />}
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{signer.name}</p>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-sm">{getWalletIcon(signer.walletType)}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Using {signer.walletType || "Unknown wallet"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {signer.address.slice(0, 6)}...{signer.address.slice(-4)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <AnimatePresence>
                    {signer.hasSigned ? (
                      <motion.div
                        className="flex items-center gap-2 text-green-700 dark:text-green-300"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      >
                        <Check className="h-5 w-5" />
                        <div className="text-right">
                          <p className="text-sm font-medium">Signed</p>
                          {signer.signedAt && <p className="text-xs">{signer.signedAt.toLocaleTimeString()}</p>}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400"
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Clock className="h-5 w-5" />
                        <p className="text-sm">Pending</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Demo button to simulate signature - would be removed in production */}
                  {!signer.hasSigned && (
                    <button
                      onClick={() => simulateNewSignature(signer.id)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      (Demo: Sign)
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {isComplete && (
            <motion.div
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-xl text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="font-semibold text-green-700 dark:text-green-300">
                🎉 All required signatures collected! Ready to execute.
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
