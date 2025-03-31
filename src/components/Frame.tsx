"use client";

import { useCallback, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useFrameSDK } from "~/hooks/useFrameSDK";
import { RECIPIENT_ADDRESS } from "~/lib/constants";
import { parseEther } from "viem";

export default function Frame() {
  const { isSDKLoaded, sdk } = useFrameSDK();
  const [amount, setAmount] = useState<string>("0.01");
  const [status, setStatus] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    if (!sdk) return;
    
    try {
      setStatus("Connecting wallet...");
      // Use the correct method for wallet connection in Frames v2
      // This will trigger the wallet connection flow
      await sdk.actions.signMessage({
        message: "Connect to Send ETH to furlong.eth"
      });
      setIsConnected(true);
      setStatus("Wallet connected!");
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setStatus("Failed to connect wallet. Please try again.");
    }
  }, [sdk]);

  const sendTransaction = useCallback(async () => {
    if (!sdk || !isConnected) {
      setStatus("Please connect your wallet first");
      return;
    }

    try {
      setIsSending(true);
      setStatus("Preparing transaction...");
      
      // Validate amount
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        setStatus("Please enter a valid amount");
        setIsSending(false);
        return;
      }

      // Convert ETH amount to wei
      const value = parseEther(amount);
      
      setStatus("Sending transaction...");
      // Use the correct method for sending transactions in Frames v2
      const result = await sdk.actions.transact({
        to: RECIPIENT_ADDRESS,
        value: value.toString(),
      });
      
      const hash = result.hash || result.txHash || "Transaction submitted";
      
      setTxHash(hash);
      setStatus("Transaction sent! Hash: " + hash.slice(0, 10) + "...");
    } catch (error) {
      console.error("Transaction failed:", error);
      setStatus("Transaction failed. Please try again.");
    } finally {
      setIsSending(false);
    }
  }, [sdk, isConnected, amount]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  if (!isSDKLoaded) {
    return <div>Loading Frame SDK...</div>;
  }

  return (
    <div className="w-[300px] mx-auto py-2 px-2">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Send ETH to furlong.eth</CardTitle>
          <CardDescription>
            Support df by sending some ETH directly from this frame
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (ETH)</Label>
            <Input
              id="amount"
              type="number"
              step="0.001"
              min="0.001"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.01"
              disabled={isSending}
            />
          </div>
          
          {status && (
            <div className="text-sm mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
              {status}
            </div>
          )}
          
          {txHash && (
            <div className="text-xs break-all">
              <span className="font-semibold">Transaction Hash:</span> {txHash}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {!isConnected ? (
            <Button 
              className="w-full" 
              onClick={connectWallet}
              disabled={isSending}
            >
              Connect Wallet
            </Button>
          ) : (
            <Button 
              className="w-full" 
              onClick={sendTransaction}
              disabled={isSending}
            >
              {isSending ? "Sending..." : `Send ${amount} ETH`}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
