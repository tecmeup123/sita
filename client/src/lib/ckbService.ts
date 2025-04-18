/**
 * CKB Service - Direct CKB RPC calls
 */

import { scriptToHash } from "@nervosnetwork/ckb-sdk-utils";
import axios from 'axios';
import { Script } from './types/ckb';

// @ts-ignore - CCC types are not fully compatible with our Script type
import * as ccc from '@ckb-ccc/ccc';

// Create an axios instance for CKB RPC calls
const createCkbRpcClient = (network: 'mainnet' | 'testnet') => {
  return axios.create({
    baseURL: network === 'mainnet' 
      ? 'https://mainnet.ckb.dev/rpc'
      : 'https://testnet.ckb.dev/rpc',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Get capacity (balance) for a lock script directly using CKB RPC
 * @param script The lock script to check
 * @param network The CKB network (mainnet/testnet)
 * @returns The balance in CKB
 */
export async function getBalanceForScript(
  script: any, 
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<string> {
  console.log("Getting balance using direct RPC for script:", JSON.stringify(script));

  try {
    // Create RPC client
    const rpcClient = createCkbRpcClient(network);

    // First try getting capacity directly
    const response = await rpcClient.post('', {
      id: Date.now(),
      jsonrpc: '2.0',
      method: 'get_cells_capacity',
      params: [
        {
          script: {
            code_hash: script.codeHash,
            hash_type: script.hashType.toLowerCase(),
            args: script.args
          },
          script_type: 'lock'
        }
      ]
    });

    console.log("RPC response:", response.data);

    // Extract capacity
    if (response.data && response.data.result && response.data.result.capacity) {
      const capacityInShannons = BigInt(response.data.result.capacity);
      const capacityInCkb = Number(capacityInShannons) / 10**8;

      console.log("Capacity in shannons:", capacityInShannons.toString());
      console.log("Capacity in CKB:", capacityInCkb.toFixed(8));

      return capacityInCkb.toFixed(8);
    }

    return "0";
  } catch (error) {
    console.error("Error fetching balance via RPC:", error);
    try {
      // Fallback to get_live_cells method
      const liveCellsResponse = await rpcClient.post('', {
        id: Date.now(),
        jsonrpc: '2.0',
        method: 'get_live_cells',
        params: [
          {
            script: {
              code_hash: script.codeHash,
              hash_type: script.hashType.toLowerCase(),
              args: script.args
            },
            script_type: 'lock',
            filter: null
          },
          "asc",
          "0x64" // Limit to 100 cells
        ]
      });

      if (liveCellsResponse.data && liveCellsResponse.data.result) {
        const cells = liveCellsResponse.data.result.objects || [];
        const totalCapacity = cells.reduce((sum: bigint, cell: any) => {
          return sum + BigInt(cell.output.capacity || 0);
        }, BigInt(0));
        
        const capacityInCkb = Number(totalCapacity) / 10**8;
        return capacityInCkb.toFixed(8);
      }
    } catch (fallbackError) {
      console.error("Fallback balance check failed:", fallbackError);
    }
    return "0";
  }
}

/**
 * Get cell details for a lock hash
 * @param lockHash The lock hash to check
 * @param network The CKB network (mainnet/testnet)
 */
export async function getCellsByLockHash(
  lockHash: string,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<any[]> {
  try {
    // Create RPC client
    const rpcClient = createCkbRpcClient(network);

    // Call get_cells API with proper formatting for CKB RPC
    const response = await rpcClient.post('', {
      id: Date.now(),
      jsonrpc: '2.0',
      method: 'get_cells',
      params: [
        {
          script: {
            code_hash: lockHash, // This should be a script hash, not a lock hash
            hash_type: "type",
            args: ""
          },
          script_type: 'lock',
          filter: {
            script_len_range: ["0x0", "0x1000"]
          }
        },
        "asc",
        "0x64" // 100 cells max
      ]
    });

    console.log("Cell response:", response.data);
    return response.data.result && response.data.result.objects 
      ? response.data.result.objects 
      : [];
  } catch (error) {
    console.error("Error fetching cells via RPC:", error);
    return [];
  }
}