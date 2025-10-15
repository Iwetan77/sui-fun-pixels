"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface WalletContextType {
  address: string | null
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Check if wallet is already connected
    const savedAddress = localStorage.getItem("sui_wallet_address")
    if (savedAddress) {
      setAddress(savedAddress)
      setIsConnected(true)
    }
  }, [])

  const connect = async () => {
    try {
      // Check if Sui Wallet is installed
      if (typeof window !== "undefined" && "suiWallet" in window) {
        // @ts-ignore - Sui wallet types
        const wallet = window.suiWallet
        const accounts = await wallet.requestPermissions()

        if (accounts && accounts.length > 0) {
          const walletAddress = accounts[0]
          setAddress(walletAddress)
          setIsConnected(true)
          localStorage.setItem("sui_wallet_address", walletAddress)
        }
      } else {
        // Simulate wallet connection for demo purposes
        const mockAddress = `0x${Math.random().toString(16).substring(2, 42)}`
        setAddress(mockAddress)
        setIsConnected(true)
        localStorage.setItem("sui_wallet_address", mockAddress)
        console.log("[v0] Sui Wallet not detected. Using mock address for demo.")
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
  }

  const disconnect = () => {
    setAddress(null)
    setIsConnected(false)
    localStorage.removeItem("sui_wallet_address")
  }

  return (
    <WalletContext.Provider value={{ address, isConnected, connect, disconnect }}>{children}</WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
