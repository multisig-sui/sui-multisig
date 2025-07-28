"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoadingScreen } from "@/components/loading-screen"

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to wallets page
    router.push('/wallets')
  }, [router])

  return <LoadingScreen />
}
