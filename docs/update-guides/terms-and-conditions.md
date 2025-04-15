# Updating Terms & Conditions

The Terms & Conditions are managed in the `TermsDialog.tsx` component:

```
client/src/components/TermsDialog.tsx
```

## How to Update

1. Locate the relevant language section in the `termsContent` object 
2. Each language has its own T&C section with headings, subheadings, and content
3. Modify the content while maintaining the structure
4. Make sure to update all language versions for consistency

## File Structure

```typescript
const termsContent = {
  en: {
    title: "Terms & Conditions",
    sections: [
      {
        heading: "1. Introduction",
        content: "..."
      },
      // More sections
    ]
  },
  // Other languages (zh, es, pt, fr, it)
};
```

## Important Notes

- Always maintain proper formatting in the Markdown content
- Update all translations to ensure consistency across languages
- The dialog displays translated terms based on the user's selected language
- Keep legal terminology consistent between translations
- Each section can have multiple paragraphs of content
- Ensure proper escaping of any special characters

## Example Update

To update a section in the English terms:

```typescript
{
  heading: "7. Fees and Costs",
  content: `
    7.1 Minting tokens with SiTa Minter includes the following costs:
    - Platform Support Fee: 300 CKB
    - Network Transaction Fees: Variable based on blockchain conditions
    - Creator Tip (Optional): 144 CKB transaction fee plus tokens based on user-selected percentage
    
    7.2 User acknowledges these fees are necessary for transaction processing and platform maintenance.
  `
}
```

Make sure to update this section across all supported languages.