import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface TransactionItem {
  hash: string;
  type: string;
  amount?: string;
  network: string;
  time?: string;
  status?: 'pending' | 'confirmed' | 'failed';
}

interface TransactionDetailsProps {
  transactions: TransactionItem[];
  title?: string;
  description?: string;
  network: 'mainnet' | 'testnet';
}

export default function TransactionDetails({ 
  transactions, 
  title = "Transaction Details", 
  description = "A summary of your recent transactions",
  network = 'testnet'
}: TransactionDetailsProps) {
  // Helper to shorten transaction hashes for display
  const shortenHash = (hash: string) => {
    if (!hash) return '';
    if (hash.startsWith('0x')) {
      return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
    }
    return `${hash.slice(0, 4)}...${hash.slice(-4)}`;
  };

  // Get the explorer base URL based on network
  const getExplorerBaseUrl = () => {
    return network === 'mainnet' 
      ? 'https://explorer.nervos.org' 
      : 'https://pudge.explorer.nervos.org';
  };

  // Determine appropriate badge color based on transaction type and network
  const getBadgeVariant = (type: string, network: string) => {
    if (type.includes('Tip') || type.includes('Support')) {
      return 'secondary';
    }
    if (type.includes('Token') || type.includes('Issuance')) {
      return 'default';
    }
    return 'outline';
  };

  return (
    <Card className="w-full mb-4 border-2 shadow-md">
      <CardHeader className={`pb-2 bg-orange-50`}>
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {transactions.map((tx, index) => (
            <div key={tx.hash || index}>
              <div className="flex flex-col gap-2 py-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={getBadgeVariant(tx.type, network)} className="font-semibold">
                      {tx.type}
                    </Badge>
                    {tx.status && (
                      <Badge variant={tx.status === 'confirmed' ? 'secondary' : tx.status === 'pending' ? 'outline' : 'destructive'} className="ml-2">
                        {tx.status}
                      </Badge>
                    )}
                  </div>
                  {tx.time && <span className="text-xs text-gray-500">{tx.time}</span>}
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  {tx.hash && (
                    <a 
                      href={`${getExplorerBaseUrl()}/transaction/${tx.hash}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {shortenHash(tx.hash)}
                      <span className="i-lucide-external-link w-3 h-3"></span>
                    </a>
                  )}
                  
                  {tx.amount && (
                    <span className="text-sm font-medium">
                      {tx.amount}
                    </span>
                  )}
                </div>
              </div>
              {index < transactions.length - 1 && <Separator className="my-2" />}
            </div>
          ))}
          
          {transactions.length === 0 && (
            <div className="py-3 text-center text-gray-500">
              No transactions to display
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className={`text-xs text-gray-500 bg-orange-50`}>
        <p>All transactions recorded on the CKB {network}</p>
      </CardFooter>
    </Card>
  );
}