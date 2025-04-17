"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, Wallet, RefreshCw, Link, AlertTriangle, Copy, Check, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { JoyIDIcon, MetaMaskIcon, UtxoGlobalIcon } from "./wallet-icons";
import { useWalletConnection, formatAddress } from "@/hooks/use-wallet-connection";

export default function WalletConnector({ 
  size = "default",
  translations = {
    connect: "Connect Wallet",
    connecting: "Connecting...",
    disconnect: "Disconnect",
    walletConnectedTo: "Wallet Connected to",
    testnetText: "Testnet",
    mainnetText: "Mainnet",
  } 
}: { 
  size?: "sm" | "default" | "lg";
  translations?: {
    connect: string;
    connecting: string;
    disconnect: string;
    walletConnectedTo: string;
    testnetText: string;
    mainnetText: string;
  };
}) {
  // Use our custom hook to manage wallet connection logic and state
  const { 
    walletConnected, 
    connecting, 
    network, 
    walletAddress,
    walletBalance,
    refreshing,
    showConnectDialog,
    setShowConnectDialog,
    connectionError,
    setConnectionError,
    copied,
    setCopied,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    copyAddressToClipboard
  } = useWalletConnection();

  const { toast } = useToast();

  // Adjust button size based on prop
  const buttonClass = size === "sm" ? "h-8 w-8" : 
                      size === "lg" ? "h-12 w-12" : 
                      "h-10 w-10";

  // CONNECTED STATE - Icon-based as requested
  if (walletConnected && walletAddress) {
    return (
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className={`${buttonClass} rounded-full border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/30 shadow-sm transition-all duration-300 group relative overflow-hidden`}
                >
                  {/* Connected icon - wallet with network-colored indicator */}
                  <Wallet className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />

                  {/* Indicator dot in top-right corner */}
                  <span className={`absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-orange-500 border border-white dark:border-gray-800 animate-pulse`}></span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Wallet Connected</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent align="end" className="w-72 rounded-lg p-2">
          <div className={`bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 rounded-md p-3 mb-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full bg-orange-500 dark:bg-orange-400 animate-pulse`}></div>
                <h4 className={`font-semibold text-orange-700 dark:text-orange-400`}>Connected</h4>
              </div>
              <span className={`text-xs bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full`}>
                {translations.mainnetText}
              </span>
            </div>

            <div className={`mt-2 p-2 bg-white/80 dark:bg-black/20 rounded-md border border-orange-200 dark:border-orange-800`}>
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">Wallet Address</div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={copyAddressToClipboard}
                >
                  {copied ? 
                    <Check className={`h-3 w-3 text-orange-500`} /> : 
                    <Copy className="h-3 w-3 text-gray-500 hover:text-primary" />
                  }
                </Button>
              </div>
              <div className="text-sm font-mono text-gray-800 dark:text-gray-200 mt-1">
                {walletAddress ? (
                  <>{formatAddress(walletAddress)}</>
                ) : (
                  <span className="text-gray-400">Not connected</span>
                )}
              </div>
            </div>
          </div>

          {/* Balance with refresh button - now showing full formatted balance */}
          <div className={`flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/10 rounded-md mb-2`}>
            <div className="flex items-center gap-2">
              <Wallet className={`w-4 h-4 text-orange-500 dark:text-orange-400`} />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Balance</div>
                <div className={`font-semibold text-orange-700 dark:text-orange-300`}>
                  {walletBalance !== null ? (
                    `${walletBalance} CKB`
                  ) : (
                    <span className="text-red-500 dark:text-red-400">Balance unavailable</span>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshBalance}
              disabled={refreshing}
              className={`h-8 gap-1 text-xs border-orange-200 hover:bg-orange-100 text-orange-600 dark:border-orange-800 dark:hover:bg-orange-900/20`}
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? "Updating..." : "Refresh"}
            </Button>
          </div>

          {/* Disconnect button with network-specific colors */}
          <Button 
            variant="outline"
            size="sm" 
            className={`w-full justify-center mt-1 bg-red-500 hover:bg-red-600 text-white border-red-400 hover:border-red-500 dark:bg-red-600 dark:hover:bg-red-700 dark:border-red-700`}
            onClick={disconnectWallet}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {translations.disconnect}
          </Button>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // CONNECTING STATE - Icon-based loading
  if (connecting) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon"
              className={`${buttonClass} rounded-full border-orange-200 bg-orange-50 dark:bg-orange-900/20 text-orange-600 shadow-sm transition-all duration-300 relative overflow-hidden`}
              disabled={true}
            >
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className={`absolute inset-0 rounded-full bg-orange-100/60 dark:bg-orange-700/30 animate-pulse`}></span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{translations.connecting}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } 

  // Dialog for wallet selection/connection
  const WalletConnectDialog = () => (
    <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
      <DialogContent className="sm:max-w-md">
        <div className="flex items-center justify-between">
          <DialogHeader className="p-0">
            <DialogTitle className="text-xl font-semibold">Connect your wallet</DialogTitle>
            <DialogDescription className="text-gray-500">
              Select a wallet to connect to the SiTa Minter application
            </DialogDescription>
          </DialogHeader>
          <DialogClose className="h-7 w-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center">
            <X className="h-4 w-4" />
          </DialogClose>
        </div>

        {connectionError && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md flex items-center gap-2 text-sm mb-3">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <p>{connectionError}</p>
          </div>
        )}

        <div className="grid gap-4 py-4">
          {/* JoyID Wallet Option */}
          <Button 
            variant="outline"
            onClick={() => {
              try {
                connectWallet();
                // Dialog will be automatically closed by the hook on successful connection
              } catch (err) {
                console.error("Connection error:", err);
                setConnectionError("Connection failed. Please check your network and try again.");
              }
            }}
            className="w-full justify-between items-center h-16 px-4 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <JoyIDIcon />
              </div>
              <div className="text-left">
                <div className="font-medium">JoyID Wallet</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Secure your SiTa experience</div>
              </div>
            </div>
            <Link className="h-4 w-4 text-gray-400" />
          </Button>

          {/* UTXO Global Wallet Option */}
          <Button 
            variant="outline"
            onClick={() => {
              try {
                connectWallet();
                // Dialog will be automatically closed by the hook on successful connection
              } catch (err) {
                console.error("Connection error:", err);
                setConnectionError("Connection failed. Please check your network and try again.");
              }
            }}
            className="w-full justify-between items-center h-16 px-4 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <UtxoGlobalIcon />
              </div>
              <div className="text-left">
                <div className="font-medium">UTXO Global</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Your universal wallet</div>
              </div>
            </div>
            <Link className="h-4 w-4 text-gray-400" />
          </Button>

          {/* MetaMask Wallet Option */}
          <Button 
            variant="outline"
            onClick={() => {
              try {
                connectWallet();
                // Dialog will be automatically closed by the hook on successful connection
              } catch (err) {
                console.error("Connection error:", err);
                setConnectionError("Connection failed. Please check your network and try again.");
              }
            }}
            className="w-full justify-between items-center h-16 px-4 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <MetaMaskIcon />
              </div>
              <div className="text-left">
                <div className="font-medium">MetaMask</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Connect with MetaMask</div>
              </div>
            </div>
            <Link className="h-4 w-4 text-gray-400" />
          </Button>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          By connecting your wallet, you agree to the <a href="/terms" className="text-primary underline">Terms of Service</a>
        </div>
      </DialogContent>
    </Dialog>
  );

  // NOT CONNECTED STATE - Icon-based button
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline"
              size="icon"
              className={`${buttonClass} rounded-full border-gray-200 text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 shadow-sm transition-all duration-300`}
              onClick={connectWallet}
            >
              <Wallet className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{translations.connect}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Render dialog component when needed */}
      {WalletConnectDialog()}
    </>
  );
}