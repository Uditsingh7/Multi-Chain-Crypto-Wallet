'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CopyIcon, ReloadIcon } from "@radix-ui/react-icons"
import { useCopyToClipboard } from 'usehooks-ts'
import toast from 'react-hot-toast';
import { generateMnemonic, mnemonicToSeed } from 'bip39';
import { derivePath } from 'ed25519-hd-key'
import nacl from 'tweetnacl'
import { Keypair } from '@solana/web3.js'
import { Wallet, HDNodeWallet } from 'ethers'
import axios from 'axios';

interface WalletInfo {
  id: number;
  ethereum: {
    address: string;
    publicKey: string;
    balance: string;
  };
  solana: {
    address: string;
    publicKey: string;
    balance: string;
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

function BalanceDisplay({ balance }: { balance: string }) {
  return (
    <div className="bg-muted rounded-md p-2 mt-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Balance:</span>
        <span className="text-sm">{balance}</span>
      </div>
    </div>
  )
}

function WalletDisplay({ wallet, onRefreshBalance }: { wallet: WalletInfo; onRefreshBalance: (id: number) => void }) {
  return (
    <Tabs defaultValue="ethereum" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="ethereum">Ethereum</TabsTrigger>
        <TabsTrigger value="solana">Solana</TabsTrigger>
      </TabsList>
      <TabsContent value="ethereum">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Public Key:</Label>
            <div className="flex items-center">
              <p className="text-xs truncate max-w-[200px]">{wallet.ethereum.publicKey}</p>
              <CopyButton text={wallet.ethereum.publicKey} />
            </div>
          </div>
          <BalanceDisplay balance={wallet.ethereum.balance} />
        </div>
      </TabsContent>
      <TabsContent value="solana">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Public Key:</Label>
            <div className="flex items-center">
              <p className="text-xs truncate max-w-[200px]">{wallet.solana.publicKey}</p>
              <CopyButton text={wallet.solana.publicKey} />
            </div>
          </div>
          <BalanceDisplay balance={wallet.solana.balance} />
        </div>
      </TabsContent>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onRefreshBalance(wallet.id)}
        className="mt-2 w-full"
      >
        <ReloadIcon className="mr-2 h-4 w-4" />
        Refresh Balance
      </Button>
    </Tabs>
  )
}

export default function Dashboard() {
  const [mnemonic, setMnemonic] = useState('')
  const [wallets, setWallets] = useState<WalletInfo[]>([])
  const [newWallet, setNewWallet] = useState<WalletInfo | null>(null)

  const generateMnemonicPhrase = async () => {
    const mn = await generateMnemonic();
    setMnemonic(mn)
  }

  const generateSolanaKeys = async (length: number) => {
    const seed = await mnemonicToSeed(mnemonic);
    const path = `m/44'/501'/${length}'/0'`
    const derivedSeed = derivePath(path, seed.toString('hex')).key
    const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey
    const keyPair = Keypair.fromSecretKey(secret)
    return { solPublicKey: keyPair.publicKey.toBase58() };
  }

  const getKeys = async () => {
    const solKeys: string[] = [];
    const ethKeys: string[] = [];

    wallets.forEach((el) => {
      if (el?.solana?.publicKey) {
        solKeys.push(el?.solana?.publicKey);
      }
      if (el?.ethereum?.publicKey) {
        ethKeys.push(el?.ethereum?.publicKey)
      }
    })

    return { solKeys, ethKeys }
  }

  const getSolanabalance = async (pkey: string) => {
    const { solKeys, ethKeys } = await getKeys();
    console.log(solKeys, ethKeys)
    const body =
    {
      "jsonrpc": "2.0",
      "id": 1,
      "method": "getMultipleAccounts",
      "params": [pkey]

    }
    // const res = await axios.get("https://solana-mainnet.g.alchemy.com/v2/DWNmMNUP_y_QieqcWTAa3XesYH47sCNU")
  }

  const generateEthKeys = async (length: number) => {
    const seed = await mnemonicToSeed(mnemonic)
    const derivationPath = `m/44'/60'/${length}'/0'`
    const hdNode = HDNodeWallet.fromSeed(seed);
    const child = hdNode.derivePath(derivationPath)
    const privateKey = child.privateKey;
    const wallet = new Wallet(privateKey);
    return { ethPublicKey: wallet.address }
  }

  const addWallet = async () => {
    const { solPublicKey } = await generateSolanaKeys(wallets.length)
    const { ethPublicKey } = await generateEthKeys(wallets.length);
    const newWalletInfo: WalletInfo = {
      id: wallets.length + 1,
      ethereum: {
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        publicKey: ethPublicKey,
        balance: '0 ETH',
      },
      solana: {
        address: Math.random().toString(36).substr(2, 44),
        publicKey: solPublicKey,
        balance: '0 SOL',
      },
    }
    setWallets([...wallets, newWalletInfo])
    setNewWallet(newWalletInfo)
  }

  const refreshBalance = async (id: number) => {
    const { solKeys, ethKeys } = await getKeys();
    console.log(solKeys, ethKeys)
    const body =
    {
      "jsonrpc": "2.0",
      "id": 1,
      "method": "getBalance",
      "params": []
    }
    console.log(body)
    const res = await axios.post("https://solana-mainnet.g.alchemy.com/v2/DWNmMNUP_y_QieqcWTAa3XesYH47sCNU", body)
    console.log(res);
    // In a real application, you would fetch the actual balance from the blockchain here
    // For this example, we'll just set a random balance
    setWallets(wallets.map(wallet => {
      if (wallet.id === id) {
        body.params = [wallet?.solana?.publicKey]
        return {
          ...wallet,
          ethereum: {
            ...wallet.ethereum,
            balance: `${(Math.random() * 10).toFixed(4)} ETH`
          },
          solana: {
            ...wallet.solana,
            balance: `${(Math.random() * 100).toFixed(4)} SOL`
          }
        }
      }
      return wallet
    }))
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
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
              <Button onClick={generateMnemonicPhrase}>Generate</Button>
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
                  <WalletDisplay wallet={newWallet} onRefreshBalance={refreshBalance} />
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
                      <WalletDisplay wallet={wallet} onRefreshBalance={refreshBalance} />
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
    </div>
  )
}