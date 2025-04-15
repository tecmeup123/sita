# Updating the Cost Breakdown

The cost breakdown information is displayed in the token creation form, typically in `token-issuer.tsx`:

```
client/src/pages/token-issuer.tsx
```

## How to Update Fee Information

1. Locate the cost breakdown component in the token issuer page
2. Update the fee amounts and descriptions as needed
3. Ensure translations for all supported languages are updated

## Fee Structure

The current fee structure includes:

1. **Platform Support Fee:** 300 CKB
   - Fixed fee for using the platform

2. **Network Transaction Fees:** Variable
   - Dependent on current network conditions
   - Covers gas costs for blockchain operations

3. **Creator Tip (Optional):** 144 CKB + Selected percentage of tokens
   - Optional fee to support the creators
   - Includes fixed transaction fee plus token percentage

## Example Implementation

```tsx
const getFeeDescription = (language: string) => {
  switch (language) {
    case 'en':
      return (
        <div className="space-y-2 text-sm">
          <p><span className="font-semibold">Platform Support Fee:</span> 300 CKB</p>
          <p><span className="font-semibold">Network Transaction Fees:</span> Variable (based on blockchain conditions)</p>
          <p><span className="font-semibold">Creator Tip (Optional):</span> 144 CKB + selected token percentage</p>
        </div>
      );
    case 'zh':
      return (
        <div className="space-y-2 text-sm">
          <p><span className="font-semibold">平台支持费用:</span> 300 CKB</p>
          <p><span className="font-semibold">网络交易费用:</span> 可变（取决于区块链状况）</p>
          <p><span className="font-semibold">创建者小费（可选）:</span> 144 CKB + 选定的代币百分比</p>
        </div>
      );
    // Add other languages (es, pt, fr, it)
    default:
      return (
        <div className="space-y-2 text-sm">
          <p><span className="font-semibold">Platform Support Fee:</span> 300 CKB</p>
          <p><span className="font-semibold">Network Transaction Fees:</span> Variable (based on blockchain conditions)</p>
          <p><span className="font-semibold">Creator Tip (Optional):</span> 144 CKB + selected token percentage</p>
        </div>
      );
  }
};
```

## Updating Fee Calculations

If the fee amounts change, you'll need to update any calculations that use these values:

```typescript
// Example fee calculation
const calculateTotalFee = (tipPercentage: number): number => {
  const platformFee = 300; // CKB
  const tipTransactionFee = tipPercentage > 0 ? 144 : 0; // CKB
  
  // Network fee is variable and estimated elsewhere
  const estimatedNetworkFee = getEstimatedNetworkFee();
  
  return platformFee + tipTransactionFee + estimatedNetworkFee;
};
```

## Important Notes

- Keep fee descriptions clear and transparent
- Update all language versions when changing fee information
- If fee structure changes significantly, update the Terms & Conditions as well
- The UI should clearly distinguish between fixed fees and variable/optional fees
- Consider adding tooltips or help text for users to understand the fee structure better
- Test calculations with various input values to ensure correct totals