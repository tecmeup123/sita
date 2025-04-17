// Import from our wrapper instead of directly from the package
import { ccc } from "./cccWrapper";

/**
 * Creates properly formatted token info bytes according to XUDT standard
 * @param decimals Token decimals as a number
 * @param symbol Token symbol string
 * @param name Token name string (if empty, symbol is used)
 * @returns Properly formatted token info bytes
 */
export function tokenInfoToBytes(
  decimals: string | number,
  symbol: string,
  name: string,
) {
  const decimalNum = typeof decimals === 'string' ? parseInt(decimals) : decimals;
  const symbolBytes = ccc.bytesFrom(symbol, "utf8");
  const nameBytes = ccc.bytesFrom(name === "" ? symbol : name, "utf8");
  
  return ccc.bytesConcat(
    ccc.numToBytes(decimalNum, 1),  // 1 byte for decimals
    ccc.numToBytes(nameBytes.length, 1),  // 1 byte for name length
    nameBytes,  // name bytes
    ccc.numToBytes(symbolBytes.length, 1),  // 1 byte for symbol length
    symbolBytes,  // symbol bytes
  );
}

interface TokenOptions {
  amount: string;
  decimals: string;
  symbol: string;
  name: string;
}

/**
 * Checks if an OutPoint exists and is a live cell on the blockchain
 * @param client The CKB client
 * @param txHash Transaction hash of the OutPoint
 * @param index Index of the OutPoint
 * @returns True if the cell exists, false otherwise
 */
export async function isLiveCell(client: any, txHash: string, index: string | number) {
  try {
    console.log(`Checking if cell ${txHash}:${index} is live...`);
    // Create an OutPoint object
    const outPoint = {
      tx_hash: txHash,
      index: typeof index === 'string' ? index : "0x" + index.toString(16)
    };
    
    // Query the blockchain for the cell
    const cellStatus = await client.getLiveCell(outPoint, true);
    console.log("Cell status:", cellStatus);
    
    // If we get here without error, the cell exists
    return true;
  } catch (error) {
    console.error("Cell does not exist or is not live:", error);
    return false;
  }
}

/**
 * Wait for block confirmations until a cell becomes live
 * @param client CKB client
 * @param txHash Transaction hash 
 * @param index Cell index
 * @param maxAttempts Maximum number of attempts
 * @param delayMs Delay between attempts in milliseconds
 * @returns Promise that resolves when the cell is live or rejects after max attempts
 */
export async function waitForLiveCell(client: any, txHash: string, index: string | number, maxAttempts = 10, delayMs = 3000) {
  console.log(`Waiting for cell ${txHash}:${index} to become live...`);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const live = await isLiveCell(client, txHash, index);
    if (live) {
      console.log(`Cell ${txHash}:${index} is now live after ${attempt + 1} attempts`);
      return true;
    }
    
    console.log(`Attempt ${attempt + 1}/${maxAttempts} failed, waiting ${delayMs}ms before next check...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  throw new Error(`Cell ${txHash}:${index} did not become live after ${maxAttempts} attempts`);
}

/**
 * Creates a CKB signer with enhanced error handling for different networks
 * @param network The network to connect to ("mainnet" or "testnet")
 * @returns A configured CKB signer connected to the specified network
 */
export async function createSigner(network: string = "mainnet") {
  // Define RPC endpoints for mainnet with fallbacks
  const rpcEndpoints = {
    mainnet: [
      "https://mainnet.ckb.dev/rpc",
      "https://rpc.ankr.com/nervos", 
      "https://mainnet.ckbapp.dev/rpc"
    ]
  };
  
  // Check for pre-existing wallet connection attempt
  try {
    const storedConnectionState = localStorage.getItem('joyid_connection_state');
    if (storedConnectionState) {
      const { timestamp, network: savedNetwork } = JSON.parse(storedConnectionState);
      
      // If connection attempt is less than 5 minutes old and for the same network
      if (Date.now() - timestamp < 300000 && savedNetwork === network) {
        console.log("Detected recent connection attempt, using cached state");
      } else {
        // Clear stale connection state
        localStorage.removeItem('joyid_connection_state');
      }
    }
    
    // Save current connection attempt
    localStorage.setItem('joyid_connection_state', JSON.stringify({
      timestamp: Date.now(),
      network,
      status: 'connecting'
    }));
  } catch (e) {
    console.warn("Could not access localStorage for connection state", e);
  }
  
  // Select the appropriate endpoints based on network
  const endpoints = network === "mainnet" ? rpcEndpoints.mainnet : rpcEndpoints.testnet;
  let lastError: Error | null = null;
  
  // Security check - warn if switching networks during active transaction
  const hasActiveTx = Object.keys(sessionStorage)
    .some(key => key.startsWith('active_tx_'));
  
  if (hasActiveTx) {
    console.warn("⚠️ WARNING: Switching networks while having active transactions could lead to loss of funds!");
  }
  
  // Try each endpoint until one works
  for (const url of endpoints) {
    try {
      console.log(`Creating CKB client for ${network} using endpoint: ${url}...`);
      
      // Create the appropriate client type based on network
      const client = network === "mainnet" 
        ? new ccc.ClientPublicMainnet({ url }) 
        : new ccc.ClientPublicTestnet({ url });
        
      console.log(`CKB client created successfully for ${network}`);
      
      // Check if we can connect to the node with a simple request and retry up to 3 times
      let nodeConnected = false;
      let retryCount = 0;
      let tipHeader;
      
      while (!nodeConnected && retryCount < 3) {
        try {
          // Use a basic RPC call that all CKB nodes support
          tipHeader = await client.getTipHeader();
          nodeConnected = true;
          console.log(`Successfully connected to CKB node. Current tip block: ${tipHeader.number}`);
        } catch (nodeError) {
          retryCount++;
          console.warn(`Node connectivity check failed for ${url} (attempt ${retryCount}/3):`, nodeError);
          
          if (retryCount >= 3) {
            throw new Error(`Node connectivity check failed after multiple attempts: ${nodeError}`);
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Create CkbSigner with the appropriate parameters
      console.log("Creating JoyID signer...");
      // Use window.location to create a dynamic URL for the logo
      const logoUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/assets/N.png`
        : '/assets/N.png';
        
      console.log("Using logo URL:", logoUrl);
      
      const signer = new ccc.JoyId.CkbSigner(
        client, 
        "SiTa Minter", 
        logoUrl
      );
      
      console.log("Connecting to JoyID wallet...");
      await signer.connect();
      console.log("JoyID wallet connected successfully");
      
      // Update connection state
      try {
        localStorage.setItem('joyid_connection_state', JSON.stringify({
          timestamp: Date.now(),
          network,
          status: 'connected',
          blockNumber: tipHeader?.number || 'unknown'
        }));
      } catch (e) {
        console.warn("Could not update connection state", e);
      }
      
      return signer;
    } catch (error) {
      console.warn(`Connection attempt to ${url} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Update connection state to reflect error
      try {
        const currentState = JSON.parse(localStorage.getItem('joyid_connection_state') || '{}');
        localStorage.setItem('joyid_connection_state', JSON.stringify({
          ...currentState,
          lastError: String(error),
          lastErrorTime: Date.now()
        }));
      } catch (e) {
        console.warn("Could not update connection state with error", e);
      }
      
      // Continue to the next endpoint
    }
  }
  
  // If we get here, all endpoints failed
  const errorMessage = `Failed to connect to any ${network} CKB node. Please check your internet connection and try again.`;
  console.error(errorMessage);
  console.error("Last error:", lastError);
  
  // Set final error state
  try {
    localStorage.setItem('joyid_connection_state', JSON.stringify({
      timestamp: Date.now(),
      network,
      status: 'failed',
      error: lastError?.message || 'Unknown error'
    }));
  } catch (e) {
    console.warn("Could not update connection state with failure", e);
  }
  
  // Provide more specific guidance based on the error
  if (lastError?.message?.includes("Network Error") || lastError?.message?.includes("Failed to fetch")) {
    throw new Error(`Network connectivity issue: Please check your internet connection and try again. If you're using a VPN or firewall, it might be blocking access to CKB nodes.`);
  } else if (lastError?.message?.includes("timeout")) {
    throw new Error(`Connection timeout: The CKB network nodes are responding slowly or not at all. This could be due to network congestion or regional access issues.`);
  } else if (lastError?.message?.includes("account") || lastError?.message?.includes("wallet")) {
    throw new Error(`Wallet connection issue: Failed to connect to your JoyID wallet. Please make sure your wallet is unlocked and properly configured.`);
  } else {
    throw new Error(`${errorMessage} Details: ${lastError?.message || 'Unknown error'}`);
  }
}

/**
 * Retrieves the main address lock script from the signer with improved error handling
 * @param signer The connected CKB signer instance
 * @returns The lock script for the user's main address
 */
export async function getMainAddress(signer: any) {
  try {
    console.log("Getting main address from signer...");
    const { script } = await signer.getRecommendedAddressObj();
    console.log("Main address script retrieved:", script);
    return script;
  } catch (error) {
    console.error("Failed to get address:", error);
    
    // Classify error types for better user guidance
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes("wallet") || errorMsg.includes("account") || errorMsg.includes("connect")) {
      throw new Error(`Wallet connection issue: Unable to access your wallet address. Please make sure your JoyID wallet is unlocked and try again.`);
    } else if (errorMsg.includes("timeout") || errorMsg.includes("timed out")) {
      throw new Error(`Connection timeout: The request to get your address timed out. This could be due to network issues. Please check your internet connection and try again.`);
    } else {
      throw new Error(`Failed to get your wallet address: ${errorMsg}. Please ensure your wallet is connected correctly.`);
    }
  }
}

/**
 * Creates a seal transaction with enhanced error handling
 * @param signer The connected CKB signer instance
 * @param script The user's lock script
 * @returns Transaction hash of the created seal
 */
export async function createSeal(signer: any, script: any) {
  try {
    console.log("Creating seal transaction...");
    
    // Validate inputs
    if (!signer) {
      throw new Error("Wallet not connected. Please connect your JoyID wallet first.");
    }
    
    if (!script) {
      throw new Error("Invalid wallet address. Please try reconnecting your wallet.");
    }
    
    // Create the transaction
    console.log("Building seal transaction with script:", script);
    const susTx = ccc.Transaction.from({ outputs: [{ lock: script }] });
    
    // Complete the transaction
    console.log("Completing transaction inputs...");
    await susTx.completeInputsByCapacity(signer);
    
    console.log("Calculating transaction fee...");
    await susTx.completeFeeBy(signer, 1000);
    
    // Send the transaction
    console.log("Sending seal transaction...");
    const susTxHash = await signer.sendTransaction(susTx);
    console.log("Seal transaction sent successfully, hash:", susTxHash);
    
    // Mark the cell as unusable in the client cache to prevent reuse in future transactions
    console.log("Marking cell as unusable in cache...");
    await signer.client.cache.markUnusable({
      txHash: susTxHash,
      index: 0,
    });
    console.log("Cell marked as unusable");
    
    return susTxHash;
  } catch (error) {
    console.error("Failed to create seal:", error);
    
    // Classify error types for better user guidance
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes("insufficient capacity")) {
      throw new Error(`Insufficient balance: You don't have enough CKB in your wallet to perform this action. Please add more CKB to your wallet and try again.`);
    } else if (errorMsg.includes("signature") || errorMsg.includes("sign")) {
      throw new Error(`Signature error: Failed to sign the transaction. Please try again and ensure you approve the transaction in your wallet.`);
    } else if (errorMsg.includes("timeout") || errorMsg.includes("timed out")) {
      throw new Error(`Connection timeout: The transaction request timed out. This could be due to network issues. Please check your internet connection and try again.`);
    } else if (errorMsg.includes("rejected") || errorMsg.includes("cancel")) {
      throw new Error(`Transaction rejected: You declined to sign the transaction. Please try again and approve the transaction when prompted.`);
    } else {
      throw new Error(`Failed to create seal: ${errorMsg}. Please try again later.`);
    }
  }
}

/**
 * Creates a lock seal transaction with enhanced error handling
 * @param signer The connected CKB signer instance
 * @param script The user's lock script
 * @param susTxHash Transaction hash of the seal transaction
 * @returns Object containing the lock transaction hash and single-use lock script
 */
export async function lockSeal(signer: any, script: any, susTxHash: string) {
  try {
    console.log("Creating lock seal transaction...");
    
    // Validate inputs
    if (!signer) {
      throw new Error("Wallet not connected. Please connect your JoyID wallet first.");
    }
    
    if (!script) {
      throw new Error("Invalid wallet address. Please try reconnecting your wallet.");
    }
    
    if (!susTxHash) {
      throw new Error("Missing seal transaction hash. Please retry the token creation process from the beginning.");
    }
    
    // Wait for the seal transaction to be confirmed
    console.log("Waiting for seal transaction to be confirmed...");
    try {
      await signer.client.waitTransaction(susTxHash, 3); // Wait for 3 confirmations
      console.log("Seal transaction confirmed");
    } catch (waitError) {
      console.warn("Warning: Could not confirm seal transaction:", waitError);
      // Continue anyway, as the transaction might still be valid
    }
    
    // Create the single-use lock
    console.log("Creating single-use lock script...");
    const singleUseLock = await ccc.Script.fromKnownScript(
      signer.client,
      ccc.KnownScript.SingleUseLock,
      ccc.OutPoint.from({ txHash: susTxHash, index: 0 }).toBytes()
    );
    console.log("Single-use lock created:", singleUseLock);
    
    // Create and send the lock transaction
    console.log("Building lock transaction...");
    const lockTx = ccc.Transaction.from({ outputs: [{ lock: singleUseLock }] });
    
    console.log("Completing transaction inputs...");
    await lockTx.completeInputsByCapacity(signer);
    
    console.log("Calculating transaction fee...");
    await lockTx.completeFeeBy(signer, 1000);
    
    console.log("Sending lock transaction...");
    const lockTxHash = await signer.sendTransaction(lockTx);
    console.log("Lock transaction sent successfully, hash:", lockTxHash);
    
    return { lockTxHash, singleUseLock };
  } catch (error) {
    console.error("Failed to lock seal:", error);
    
    // Classify error types for better user guidance
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes("insufficient capacity")) {
      throw new Error(`Insufficient balance: You don't have enough CKB in your wallet to perform this action. Please add more CKB to your wallet and try again.`);
    } else if (errorMsg.includes("cell not found") || errorMsg.includes("outpoint not found")) {
      throw new Error(`Transaction not found: The seal transaction cannot be found on the blockchain. It may have been rejected or is still pending. Please try creating your token again.`);
    } else if (errorMsg.includes("signature") || errorMsg.includes("sign")) {
      throw new Error(`Signature error: Failed to sign the transaction. Please try again and ensure you approve the transaction in your wallet.`);
    } else if (errorMsg.includes("timeout") || errorMsg.includes("timed out")) {
      throw new Error(`Connection timeout: The transaction request timed out. This could be due to network issues. Please check your internet connection and try again.`);
    } else if (errorMsg.includes("rejected") || errorMsg.includes("cancel")) {
      throw new Error(`Transaction rejected: You declined to sign the transaction. Please try again and approve the transaction when prompted.`);
    } else {
      throw new Error(`Failed to lock seal: ${errorMsg}. Please try again later.`);
    }
  }
}

/**
 * Send a fee payment to the platform (SiTa Minter)
 * @param signer The CKB signer instance
 * @param amount Amount in CKB (default 300)
 * @param network Network to use ("mainnet" or "testnet")
 * @returns Transaction hash of the fee payment
 */
export async function sendPlatformFee(
  signer: any,
  amount: number = 300,
  network: string = "mainnet"
) {
  try {
    const feeAmount = BigInt(amount * 10**8); // Convert CKB to shannons (1 CKB = 10^8 shannons)
    
    // Get the appropriate fee collector address based on network
    const feeCollectorAddress = network === "mainnet" 
      ? "ckb1qrgqep8saj8agswr30pls73hra28ry8jlnlc3ejzh3dl2ju7xxpjxqgqqxgv3c3yxv4z2e5ezw0zpmtqde3vd47uzvu09kfc"
      : "ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqq9qfz8aff6h03swsaj5pkglpjuhvkp2gmswummjn";
    
    console.log(`Sending platform fee of ${amount} CKB to SiTa Minter (${network}):`, feeCollectorAddress);
    
    // Create address object from the fee collector address and get its lock script
    const addressObj = await ccc.Address.fromString(feeCollectorAddress, signer.client);
    const feeCollectorLock = addressObj.script;
    
    // Get the sender script using getRecommendedAddressObj (not getAddress which doesn't exist)
    // This line is key to fixing the error
    const { script: senderScript } = await signer.getRecommendedAddressObj();
    
    // Log detailed information for debugging
    console.log("=== PLATFORM FEE TRANSACTION DETAILS ===");
    console.log("Fee collector address:", feeCollectorAddress);
    console.log("Fee collector lock script:", feeCollectorLock);
    console.log("Sender lock script:", senderScript);
    console.log("Fee amount (CKB):", amount);
    console.log("Fee amount (shannons):", feeAmount.toString());
    console.log("Network:", network);
    
    // Create a simple transaction to send the fee
    const feeTx = ccc.Transaction.from({
      outputs: [
        {
          lock: feeCollectorLock,
          capacity: feeAmount,
        }
      ],
      outputsData: [
        "0x", // Empty data for fee output
      ],
    });
    
    // Complete the transaction by adding inputs, calculating fees, etc.
    console.log("Completing inputs by capacity...");
    await feeTx.completeInputsByCapacity(signer);
    
    console.log("Completing fee calculation...");
    await feeTx.completeFeeBy(signer, 1000);
    
    console.log("Sending fee transaction...");
    const feeTxHash = await signer.sendTransaction(feeTx);
    console.log("Fee transaction sent successfully, hash:", feeTxHash);
    
    return feeTxHash;
  } catch (error) {
    console.error("Failed to send platform fee:", error);
    console.error("Error type:", typeof error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace available");
    
    // Classify error types for better user guidance
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes("insufficient capacity")) {
      throw new Error(`Insufficient balance: You don't have enough CKB in your wallet to pay the platform fee. Please add more CKB to your wallet and try again.`);
    } else if (errorMsg.includes("signature") || errorMsg.includes("sign")) {
      throw new Error(`Signature error: Failed to sign the fee transaction. Please try again and ensure you approve the transaction in your wallet.`);
    } else if (errorMsg.includes("timeout") || errorMsg.includes("timed out")) {
      throw new Error(`Connection timeout: The fee transaction request timed out. This could be due to network issues. Please check your internet connection and try again.`);
    } else if (errorMsg.includes("rejected") || errorMsg.includes("cancel")) {
      throw new Error(`Transaction rejected: You declined to sign the fee transaction. Please try again and approve the transaction when prompted.`);
    } else {
      throw new Error(`Failed to send platform fee: ${errorMsg}. Please try again later.`);
    }
  }
}

/**
 * Issues a new token on CKB blockchain (without the platform fee)
 * @param signer The CKB signer instance
 * @param script The user's lock script
 * @param singleUseLock The single-use lock script
 * @param susTxHash Transaction hash of the seal transaction
 * @param lockTxHash Transaction hash of the lock transaction
 * @param tokenOptions Token parameters (amount, decimals, symbol, name)
 * @param network Network to use ("mainnet" or "testnet")
 * @returns Transaction hash of the issued token
 */
export async function issueToken(
  signer: any, 
  script: any, 
  singleUseLock: any, 
  susTxHash: string, 
  lockTxHash: string, 
  tokenOptions: TokenOptions,
  network: string = "mainnet"
) {
  try {
    console.log("Starting token issuance process");
    console.log("Token options:", tokenOptions);
    console.log("Transaction hashes - SUS:", susTxHash, "Lock:", lockTxHash);
    console.log("Network:", network);
    
    const { amount, decimals, symbol, name } = tokenOptions;
    
    console.log("Creating mint transaction...");
    
    // Create the token type script first
    const tokenTypeScript = await ccc.Script.fromKnownScript(
      signer.client, 
      ccc.KnownScript.XUdt,
      singleUseLock.hash()
    );
    
    // Create the token info type script
    const tokenInfoTypeScript = await ccc.Script.fromKnownScript(
      signer.client,
      ccc.KnownScript.UniqueType,
      "00".repeat(32)
    );
    
    // Create the mint transaction
    const mintTx = ccc.Transaction.from({
      inputs: [
        { previousOutput: { txHash: susTxHash, index: 0 } },
        { previousOutput: { txHash: lockTxHash, index: 0 } },
      ],
      outputs: [
        // User's tokens
        {
          lock: script,
          type: tokenTypeScript,
        },
        // Token info cell
        {
          lock: script,
          type: tokenInfoTypeScript,
        }
      ],
      outputsData: [
        // Full token amount
        ccc.numLeToBytes(BigInt(amount), 16),
        // Token info data
        tokenInfoToBytes(decimals, symbol, name),
      ],
    });
    console.log("Mint transaction created");
    
    console.log("Adding cell dependencies...");
    await mintTx.addCellDepsOfKnownScripts(
      signer.client,
      ccc.KnownScript.SingleUseLock,
      ccc.KnownScript.XUdt,
      ccc.KnownScript.UniqueType
    );
    console.log("Cell dependencies added");
    
    console.log("Completing inputs by capacity...");
    await mintTx.completeInputsByCapacity(signer);
    console.log("Inputs completed");
    
    console.log("Setting type args...");
    mintTx.outputs[1].type!.args = ccc.hexFrom(
      ccc.bytesFrom(ccc.hashTypeId(mintTx.inputs[0], 1)).slice(0, 20)
    );
    console.log("Type args set");
    
    console.log("Completing fee calculation...");
    await mintTx.completeFeeBy(signer, 1000);
    console.log("Fee calculation completed");
    
    console.log("Sending transaction...");
    const mintTxHash = await signer.sendTransaction(mintTx);
    console.log("Transaction sent successfully, hash:", mintTxHash);
    
    return mintTxHash;
  } catch (error) {
    console.error("Failed to issue token:", error);
    console.error("Error type:", typeof error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace available");
    
    // Classify error types for better user guidance
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes("insufficient capacity")) {
      throw new Error(`Insufficient balance: You don't have enough CKB in your wallet to complete the token issuance. Please add more CKB to your wallet and try again.`);
    } else if (errorMsg.includes("signature") || errorMsg.includes("sign")) {
      throw new Error(`Signature error: Failed to sign the token issuance transaction. Please try again and ensure you approve the transaction in your wallet.`);
    } else if (errorMsg.includes("timeout") || errorMsg.includes("timed out")) {
      throw new Error(`Connection timeout: The transaction request timed out. This could be due to network issues. Please check your internet connection and try again.`);
    } else if (errorMsg.includes("rejected") || errorMsg.includes("cancel")) {
      throw new Error(`Transaction rejected: You declined to sign the transaction. Please try again and approve the transaction when prompted.`);
    } else if (errorMsg.includes("cell not found") || errorMsg.includes("cell consumed") || errorMsg.includes("not live")) {
      throw new Error(`Previous transaction not confirmed: The prerequisite transactions have not been confirmed yet. Please wait a few minutes and try again.`);
    } else {
      throw new Error(`Failed to issue token: ${errorMsg}. Please try again later.`);
    }
  }
}

/**
 * Sends a tip in tokens to the platform creator
 * @param signer The CKB signer instance
 * @param tokenTypeHash The token type script hash (XUDT args)
 * @param tokenAmount Total token amount
 * @param tipPercentage Percentage of tokens to allocate to creator (1-100)
 * @param network Network to use ("mainnet" or "testnet")
 * @param mintTxHash The transaction hash of the token mint transaction (used to wait before sending)
 * @returns Transaction hash of the tip transaction
 */
/**
 * Direct creator tip implementation - simplified approach.
 * This function creates a new cell and sends tokens directly to the creator.
 * 
 * @param signer The CKB signer instance
 * @param tokenTypeHash The token type script hash (XUDT args)
 * @param tokenAmount Total token amount string
 * @param tipPercentage Percentage of tokens to tip (1-25%)
 * @param network Network to use ("mainnet" or "testnet")
 * @param mintTxHash Optional: transaction hash of the mint transaction
 * @returns Transaction hash of the tip transaction
 */
export async function sendCreatorTip(
  signer: any,
  tokenTypeHash: string,
  tokenAmount: string,
  tipPercentage: number = 5,
  network: string = "mainnet",
  mintTxHash: string = ""
) {
  try {
    // Additional validation to prevent null errors
    if (!signer) {
      throw new Error("Signer is required but not provided");
    }
    
    if (!tokenTypeHash) {
      throw new Error("Token type hash is required but not provided");
    }
    
    console.log("Starting creator tip with direct cell creation approach");
    console.log(`Token type hash: ${tokenTypeHash}`);
    console.log(`Tip percentage: ${tipPercentage}%`);
    console.log(`Total token amount: ${tokenAmount}`);
    console.log(`Network: ${network}`);
    console.log(`Mint transaction hash: ${mintTxHash}`);
    
    // Ensure tokenTypeHash is properly formatted (without 0x prefix)
    const cleanTokenTypeHash = tokenTypeHash.startsWith('0x') ? tokenTypeHash.slice(2) : tokenTypeHash;
    
    // Calculate tip amount (limit to 1-25%)
    const validPercentage = Math.max(1, Math.min(25, tipPercentage));
    const tipAmount = (BigInt(tokenAmount) * BigInt(validPercentage)) / BigInt(100);
    
    console.log(`Creator gets ${tipAmount} tokens (${validPercentage}%)`);
    
    // Get the creator's address based on network
    const creatorAddress = network === "mainnet" 
      ? "ckb1qrgqep8saj8agswr30pls73hra28ry8jlnlc3ejzh3dl2ju7xxpjxqgqqxgv3c3yxv4z2e5ezw0zpmtqde3vd47uzvu09kfc"
      : "ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqq9qfz8aff6h03swsaj5pkglpjuhvkp2gmswummjn";
    
    console.log(`Creator address: ${creatorAddress}`);
    
    // Wait for mint transaction to be confirmed if provided
    if (mintTxHash) {
      console.log(`Waiting for mint transaction ${mintTxHash} to be confirmed...`);
      try {
        await signer.client.waitTransaction(mintTxHash);
        console.log("Mint transaction confirmed");
        
        // Wait for indexing - this is critical for finding the token cells later
        // Increase the wait time to ensure proper indexing
        const indexWaitTime = 180000; // 3 minutes
        console.log(`Waiting ${indexWaitTime/1000} seconds for blockchain indexing...`);
        console.log("The CKB blockchain needs time to index new tokens before they can be transferred.");
        console.log("This waiting period is necessary to ensure your tokens are properly recognized by the network.");
        
        // Use a progressive waiting approach with status updates
        const updateInterval = 30000; // 30 seconds
        let elapsed = 0;
        
        while (elapsed < indexWaitTime) {
          await new Promise(resolve => setTimeout(resolve, Math.min(updateInterval, indexWaitTime - elapsed)));
          elapsed += updateInterval;
          const remainingTime = Math.max(0, (indexWaitTime - elapsed) / 1000);
          console.log(`Still waiting for indexing... ${Math.ceil(remainingTime)} seconds remaining`);
        }
        
        console.log("Indexing wait completed");
      } catch (waitError) {
        console.warn("Error waiting for transaction, continuing anyway:", waitError);
      }
    }
    
    // Parse the creator's address to get the lock script
    const creatorAddressObj = await ccc.Address.fromString(creatorAddress, signer.client);
    if (!creatorAddressObj) {
      throw new Error("Failed to parse creator address");
    }
    
    console.log("Creator lock script:", JSON.stringify(creatorAddressObj.script));
    
    // Get XUDT script info
    const scriptInfo = await signer.client.getKnownScript(ccc.KnownScript.XUdt);
    console.log("Got XUDT script info:", scriptInfo);
    
    // Get user's recommended lock script
    const { script: userLockScript } = await signer.getRecommendedAddressObj();
    console.log("User lock script:", userLockScript);
    
    // Create token type script
    const tokenTypeScript = {
      codeHash: scriptInfo.codeHash,
      hashType: scriptInfo.hashType,
      args: cleanTokenTypeHash
    };
    console.log("Token type script:", tokenTypeScript);
    
    // Try to find user's token cells
    try {
      console.log("Creating collector to find token cells");
      const collector = signer.client.collector.newType({
        codeHash: tokenTypeScript.codeHash,
        hashType: tokenTypeScript.hashType,
        args: tokenTypeScript.args
      });
      
      collector.addRule({
        script: userLockScript,
        field: "lock"
      });
      
      console.log("Collecting token cells...");
      const cells = await collector.collect();
      console.log(`Found ${cells.length} token cells belonging to user`);
      
      if (cells.length === 0) {
        console.log("No token cells found, trying again with additional waiting time...");
        
        // Wait for an additional 60 seconds and try one more time
        await new Promise(resolve => setTimeout(resolve, 60000));
        
        console.log("Retrying cell collection after additional wait...");
        const retryCollector = signer.client.collector.newType({
          codeHash: tokenTypeScript.codeHash,
          hashType: tokenTypeScript.hashType,
          args: tokenTypeScript.args
        });
        
        retryCollector.addRule({
          script: userLockScript,
          field: "lock"
        });
        
        const retryCells = await retryCollector.collect();
        console.log(`Retry found ${retryCells.length} token cells belonging to user`);
        
        if (retryCells.length === 0) {
          console.log("Still no token cells found after retry, proceeding anyway...");
        }
      }
    } catch (collectError) {
      console.warn("Error collecting token cells:", collectError);
    }
    
    // Create UDT helper
    console.log("Creating UDT helper...");
    
    // In case we need to use the mint transaction directly (if indexing is too slow)
    let mintOutpoint = null;
    if (mintTxHash) {
      try {
        // This is an alternative approach if indexing is slow
        console.log("Setting up backup mint transaction reference if needed...");
        mintOutpoint = {
          txHash: mintTxHash,
          index: "0x0" // Typically the token cell is at index 0
        };
      } catch (err) {
        console.warn("Could not create mint outpoint backup:", err);
      }
    }
    
    const udt = new ccc.udt.Udt(
      {
        txHash: scriptInfo.cellDeps[0].cellDep.outPoint.txHash,
        index: scriptInfo.cellDeps[0].cellDep.outPoint.index.toString(),
      },
      tokenTypeScript
    );
    
    // Create the transfer transaction
    console.log("Building tip transaction with amount:", tipAmount.toString());
    try {
      const { res: tipTx } = await udt.transfer(
        signer,
        [
          {
            to: creatorAddressObj.script,
            amount: tipAmount.toString(),
          }
        ]
      );
      
      console.log("Transfer transaction created successfully");
      
      // Complete the transaction with all necessary inputs/outputs
      console.log("Completing transaction...");
      const completedTx = await udt.completeBy(tipTx, signer);
      
      // Add CKB inputs for capacity
      console.log("Adding CKB inputs for capacity...");
      await completedTx.completeInputsByCapacity(signer);
      
      // Calculate fee
      console.log("Calculating transaction fee...");
      await completedTx.completeFeeBy(signer, 1000);
      
      // Log transaction details
      console.log(`Final transaction has ${completedTx.inputs.length} inputs and ${completedTx.outputs.length} outputs`);
      
      // Send the transaction
      console.log("Sending tip transaction...");
      const tipTxHash = await signer.sendTransaction(completedTx);
      console.log("Tip transaction sent successfully:", tipTxHash);
      
      return tipTxHash;
    } catch (transferError) {
      console.error("Error in token transfer:", transferError);
      throw transferError;
    }
  } catch (error: any) {
    console.error("Failed to send creator tip:", error);
    
    // Extract the error message
    const errorMessage = error && typeof error === 'object' && 'message' in error 
      ? error.message 
      : 'Unknown error';
    
    // Provide specific user-friendly errors based on the failure
    if (errorMessage.includes("not enough available capacity") || 
        errorMessage.includes("insufficient") || 
        errorMessage.includes("capacity")) {
      throw new Error("Not enough CKB to complete the tip transaction. Your token was created successfully, but we couldn't send the tip.");
    }
    
    // If the issue is related to finding the token
    if (errorMessage.includes("Cannot find live cells") || 
        errorMessage.includes("Cannot find any") ||
        errorMessage.includes("No available") ||
        errorMessage.includes("No token")) {
      throw new Error("Your token was created successfully, but we couldn't find it to send a tip. The blockchain may need more time to index your tokens.");
    }
    
    // If the user canceled or rejected the transaction
    if (errorMessage.includes("Rejected") || 
        errorMessage.includes("rejected") ||
        errorMessage.includes("cancel") ||
        errorMessage.includes("Cancel")) {
      throw new Error("Tip transaction was canceled. Your token was created successfully, but no tip was sent.");
    }
    
    // General error case
    throw new Error(`Failed to send creator tip: ${errorMessage}`);
  }
}
