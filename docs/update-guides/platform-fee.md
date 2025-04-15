# How to Update the Platform Fee

This guide provides step-by-step instructions for updating the platform fee in the SiTa Minter application. The platform fee is currently set at 300 CKB and is charged for every token creation.

## Overview of Platform Fee Implementation

The platform fee is implemented in several places throughout the codebase:

1. **Core Fee Transaction Logic**: The platform fee is primarily implemented in the `sendPlatformFee()` function in `client/src/lib/ckb.ts`
2. **UI Descriptions**: Fee descriptions appear in the token creation interface in `client/src/pages/token-issuer.tsx`
3. **Terms & Conditions**: The fee is documented in the Terms & Conditions in `client/src/components/TermsDialog.tsx`

## Step 1: Update the Core Fee Function

The most important step is to update the default fee amount in the `sendPlatformFee()` function:

1. Open the file: `client/src/lib/ckb.ts`
2. Locate the `sendPlatformFee()` function (around line 441)
3. Update the default value for the `amount` parameter:

```typescript
export async function sendPlatformFee(
  signer: any,
  amount: number = 300, // Change this value to your new platform fee
  network: string = "mainnet"
) {
  // Function implementation...
}
```

## Step 2: Update Fee References in Token Issuer Page

The token creator page has multiple references to the platform fee amount:

1. Open the file: `client/src/pages/token-issuer.tsx`
2. Update the platform fee amount in the following locations:

   a. In the token creation function (around line 1487):
   ```typescript
   const feeTransactionHash = await sendPlatformFee(signer!, 300, network);
   ```

   b. In transaction logs (around line 1484):
   ```typescript
   setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ℹ️ Step 1/4: Sending platform support fee (300 CKB)...`);
   ```

   c. In the transaction record (around line 1754):
   ```typescript
   supportTx: { hash: feeTxHash || '', type: "Platform Support", amount: "300 CKB", network },
   ```

   d. In the fee breakdown display (around lines 2677, 2685, and 2689):
   ```typescript
   <span className="font-medium">300 CKB</span>
   ```
   ```typescript
   <span className="font-medium">~300 CKB</span>
   ```
   ```typescript
   <span>${(300 * parseFloat(ckbPrice.toString())).toFixed(2)}</span>
   ```

## Step 3: Update Fee Description in All Languages

In the token issuer page, there are descriptions of the platform fee in multiple languages:

1. Find the translations section in `client/src/pages/token-issuer.tsx`
2. Update the fee amount in the info notes for all supported languages:
   - English: Line ~308 (`infoNote: "The platform support fee (300 CKB) helps maintain...`)
   - Chinese: Line ~445
   - Spanish: Line ~579
   - Portuguese: Line ~840
   - French: Line ~710
   - Italian: Line ~970

## Step 4: Update Terms & Conditions

The Terms & Conditions document also references the platform fee:

1. Open the file: `client/src/components/TermsDialog.tsx`
2. Find all occurrences of "300 CKB" (around lines 418-423)
3. Update the fee amount in all language versions:
   ```jsx
   {language === "en" && "Platform support fee (300 CKB): This fee supports ongoing development and maintenance of the Sita Minter platform."}
   {language === "zh" && "平台支持费用 (300 CKB)：此费用用于支持 Sita Minter 平台的持续开发和维护。"}
   // Update for all other languages as well
   ```

## Step 5: Update Cost Breakdown Documentation

The cost breakdown documentation should also be updated:

1. Open the file: `docs/update-guides/cost-breakdown.md`
2. Update the platform fee amount in the fee structure section:
   ```markdown
   1. **Platform Support Fee:** 300 CKB
      - Fixed fee for using the platform
   ```
3. Update the example code snippets to reflect the new fee amount

## Testing Your Changes

After updating the fee amount:

1. Run the application using the workflow: `npm run dev`
2. Test the token creation process to ensure:
   - The new fee amount is displayed correctly in the UI
   - The transaction sends the correct amount to the fee collector address
   - All language versions show the updated fee amount

## Important Considerations

1. **Backward Compatibility**: Changing the fee might affect users who are in the middle of transactions or have expectations about costs
2. **Documentation**: Make sure to update all references to the fee amount
3. **Announcement**: Consider updating the welcome dialog to inform users of the fee change
4. **Justification**: When changing the fee, consider adding a brief explanation of why the change was made

## Fee Calculation Modifications

If you're implementing a more complex fee structure (e.g., variable fees based on token parameters):

1. Create a fee calculation function in `client/src/lib/ckb.ts`:
   ```typescript
   export function calculatePlatformFee(tokenAmount: number, hasCustomOptions: boolean): number {
     // Your fee calculation logic here
     const baseFee = 300; // Base fee
     // Add conditional logic if needed
     return baseFee;
   }
   ```

2. Import and use this function in the token issuer page
3. Update the UI to display the dynamic fee calculation

Remember to thoroughly test any changes to the fee structure to ensure they work correctly in all scenarios.