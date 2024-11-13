'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CopyIcon } from "@radix-ui/react-icons"
import { useCopyToClipboard } from 'usehooks-ts'
import toast from 'react-hot-toast';

interface WalletInfo {
  id: number;
  ethereum: {
    address: string;
    publicKey: string;
  };
  solana: {
    address: string;
    publicKey: string;
  };
}

function CopyButton({ text }: { text: string }) {
  const [_, copy] = useCopyToClipboard()

  const handleCopy = () => {
    copy(text)
    toast.success("Copied to clipboard")
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleCopy} className="h-4 w-4 ml-2">
      <CopyIcon className="h-3 w-3" />
      <span className="sr-only">Copy to clipboard</span>
    </Button>
  )
}

function WalletDisplay({ wallet }: { wallet: WalletInfo }) {
  return (
    <Tabs defaultValue="ethereum" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="ethereum">Ethereum</TabsTrigger>
        <TabsTrigger value="solana">Solana</TabsTrigger>
      </TabsList>
      <TabsContent value="ethereum">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Address:</Label>
            <p className="text-xs">{wallet.ethereum.address}</p>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Public Key:</Label>
            <div className="flex items-center">
              <p className="text-xs truncate max-w-[200px]">{wallet.ethereum.publicKey}</p>
              <CopyButton text={wallet.ethereum.publicKey} />
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="solana">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Address:</Label>
            <p className="text-xs">{wallet.solana.address}</p>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Public Key:</Label>
            <div className="flex items-center">
              <p className="text-xs truncate max-w-[200px]">{wallet.solana.publicKey}</p>
              <CopyButton text={wallet.solana.publicKey} />
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

export default function Dashboard() {
  const [mnemonic, setMnemonic] = useState('')
  const [wallets, setWallets] = useState<WalletInfo[]>([])
  const [newWallet, setNewWallet] = useState<WalletInfo | null>(null)

  const generateMnemonic = () => {
    setMnemonic('example mnemonic phrase word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12')
  }

  const addWallet = () => {
    const newWalletInfo: WalletInfo = {
      id: wallets.length + 1,
      ethereum: {
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        publicKey: `0x${Math.random().toString(16).substr(2, 130)}`,
      },
      solana: {
        address: Math.random().toString(36).substr(2, 44),
        publicKey: Math.random().toString(36).substr(2, 44),
      },
    }
    setWallets([...wallets, newWalletInfo])
    setNewWallet(newWalletInfo)
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Multi-Chain Crypto Wallet</CardTitle>
        <CardDescription>Manage multiple wallets across blockchains</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mnemonic">Mnemonic Phrase</Label>
          <div className="flex space-x-2">
            <Input
              id="mnemonic"
              value={mnemonic}
              readOnly
              className="flex-grow"
              placeholder="Your mnemonic phrase will appear here"
            />
            <Button onClick={generateMnemonic}>Generate</Button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Wallets ({wallets.length})</Label>
            <Button onClick={addWallet} disabled={!mnemonic}>Add Wallet</Button>
          </div>
          {newWallet && (
            <Card className="bg-muted">
              <CardHeader>
                <CardTitle className="text-sm">New Wallet Added (#{newWallet.id})</CardTitle>
              </CardHeader>
              <CardContent>
                <WalletDisplay wallet={newWallet} />
              </CardContent>
            </Card>
          )}
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {wallets.map((wallet) => (
                <Card key={wallet.id}>
                  <CardHeader>
                    <CardTitle className="text-sm">Wallet #{wallet.id}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WalletDisplay wallet={wallet} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Note: This is a design demo. In a real application, never share your mnemonic phrase.
        </p>
      </CardFooter>
    </Card>
  )
}