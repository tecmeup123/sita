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

export async function createSigner() {
  try {
    console.log("Creating CKB client...");
    const client = new ccc.ClientPublicMainnet({
      url: "https://mainnet.ckb.dev/rpc"
    });
    console.log("CKB client created successfully");

    // Create CkbSigner with the appropriate parameters
    console.log("Creating JoyID signer...");
    const signer = new ccc.JoyId.CkbSigner(
      client, 
      "RGBForge", 
      "../assets/rgb-logo.png"
    );

    console.log("Connecting to JoyID wallet...");
    await signer.connect();
    console.log("JoyID wallet connected successfully");
    return signer;
  } catch (error) {
    console.error("Failed to create signer:", error);
    console.error("Error type:", typeof error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace available");
    throw new Error(`Failed to create signer: ${error}`);
  }
}

export async function getMainAddress(signer: any) {
  try {
    const { script } = await signer.getRecommendedAddressObj();
    return script;
  } catch (error) {
    throw new Error(`Failed to get address: ${error}`);
  }
}

export async function createSeal(signer: any, script: any) {
  try {
    const susTx = ccc.Transaction.from({ outputs: [{ lock: script }] });
    await susTx.completeInputsByCapacity(signer);
    await susTx.completeFeeBy(signer, 1000);
    const susTxHash = await signer.sendTransaction(susTx);

    // Mark the cell as unusable in the client cache to prevent reuse in future transactions
    await signer.client.cache.markUnusable({
      txHash: susTxHash,
      index: 0,
    });

    return susTxHash;
  } catch (error) {
    throw new Error(`Failed to create seal: ${error}`);
  }
}

export async function lockSeal(signer: any, script: any, susTxHash: string) {
  try {
    const singleUseLock = await ccc.Script.fromKnownScript(
      signer.client,
      ccc.KnownScript.SingleUseLock,
      ccc.OutPoint.from({ txHash: susTxHash, index: 0 }).toBytes()
    );
    const lockTx = ccc.Transaction.from({ outputs: [{ lock: singleUseLock }] });
    await lockTx.completeInputsByCapacity(signer);
    await lockTx.completeFeeBy(signer, 1000);
    const lockTxHash = await signer.sendTransaction(lockTx);
    return { lockTxHash, singleUseLock };
  } catch (error) {
    throw new Error(`Failed to lock seal: ${error}`);
  }
}

/**
 * Send a fee payment to the platform (RGBForge)
 * @param signer The CKB signer instance
 * @param amount Amount in CKB (default 100)
 * @param network Network to use ("mainnet" or "testnet")
 * @returns Transaction hash of the fee payment
 */
export async function sendPlatformFee(
  signer: any,
  amount: number = 100,
  network: string = "mainnet"
) {
  try {
    const feeAmount = BigInt(amount * 10**8); // Convert CKB to shannons (1 CKB = 10^8 shannons)

    // Get the appropriate fee collector address based on network
    const feeCollectorAddress = network === "mainnet" 
      ? "ckb1qrgqep8saj8agswr30pls73hra28ry8jlnlc3ejzh3dl2ju7xxpjxqgqqxgv3c3yxv4z2e5ezw0zpmtqde3vd47uzvu09kfc"
      : "ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqq9qfz8aff6h03swsaj5pkglpjuhvkp2gmswummjn";

    console.log(`Sending platform fee of ${amount} CKB to RGBForge (${network}):`, feeCollectorAddress);

    // Get lock script args from the address
    const addressInfo = network === "mainnet"
      ? { args: "0x3f69cf42381720f7cb4f6561e30349f5c6d445fc" } // Mainnet address args  
      : { args: "0xc5807b628aba2abb872800e912804fc7c9662fe3" }; // Testnet address args

    const feeCollectorLock = ccc.Script.from({
      codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8", // Secp256k1Blake160
      hashType: "type",
      args: addressInfo.args,
    });
    console.log("Fee collector lock script:", feeCollectorLock);

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
    throw new Error(`Failed to send platform fee: ${error}`);
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

    // Create the mint transaction without fee collection
    const mintTx = ccc.Transaction.from({
      inputs: [
        { previousOutput: { txHash: susTxHash, index: 0 } },
        { previousOutput: { txHash: lockTxHash, index: 0 } },
      ],
      outputs: [
        {
          lock: script,
          type: tokenTypeScript,
        },
        {
          lock: script,
          type: tokenInfoTypeScript,
        }
      ],
      outputsData: [
        ccc.numLeToBytes(BigInt(amount), 16), // amount already includes decimals from the UI
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
    throw new Error(`Failed to issue token: ${error}`);
  }
}