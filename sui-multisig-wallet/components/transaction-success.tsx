"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { CheckCircle, ExternalLink, Copy, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import confetti from "canvas-confetti"

interface TransactionSuccessProps {
  transactionHash: string
  amount?: string
  recipient?: string
  onContinue?: () => void
}

export function TransactionSuccess({ transactionHash, amount, recipient, onContinue }: TransactionSuccessProps) {
  const confettiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Trigger confetti when component mounts
    if (confettiRef.current) {
      const rect = confettiRef.current.getBoundingClientRect()
      const x = (rect.left + rect.width / 2) / window.innerWidth
      const y = (rect.top + rect.height / 2) / window.innerHeight

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x, y: y - 0.1 },
        colors: ["#4f46e5", "#8b5cf6", "#06b6d4"],
      })
    }
  }, [])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transactionHash)
  }

  return (
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      >
        <Card className="glass-card overflow-hidden border-green-200 dark:border-green-800">
          <CardContent className="p-0">
            <div className="p-8 flex flex-col items-center text-center" ref={confettiRef}>
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-6">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>

              <h2 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-2">Transaction Executed! 🎉</h2>

              <p className="text-lg mb-6">
                {amount && recipient ? (
                  <>
                    <span className="font-semibold">{amount} SUI</span> has been sent to{" "}
                    <span className="font-mono">
                      {recipient.slice(0, 6)}...{recipient.slice(-4)}
                    </span>{" "}
                    like a boss.
                  </>
                ) : (
                  "Your transaction has been successfully executed."
                )}
              </p>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl w-full mb-6">
                <p className="text-sm text-muted-foreground mb-1">Transaction Hash</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm truncate">
                    {transactionHash.slice(0, 18)}...{transactionHash.slice(-8)}
                  </p>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={copyToClipboard} className="h-8 w-8">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(`https://suiexplorer.com/txblock/${transactionHash}`, "_blank")}
                      className="h-8 w-8"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              <Button onClick={onContinue} className="apple-button group">
                Continue
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
