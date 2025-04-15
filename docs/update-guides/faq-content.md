# Updating FAQ Content

The FAQ content is managed in the `FAQBot.tsx` component:

```
client/src/components/FAQBot.tsx
```

## How to Update

1. Locate the `faqData` object in the component
2. Each language has its own set of questions and answers
3. Update existing FAQs or add new ones as needed
4. Ensure all languages have matching FAQ entries

## File Structure

```typescript
const faqData = {
  en: [
    {
      question: "What is SiTa Minter?",
      answer: "SiTa Minter is a platform that allows you to create Bitcoin tokens powered by the Nervos Network RGB++ protocol. It simplifies the token creation process with an intuitive interface, no coding required."
    },
    // More FAQ entries
  ],
  // Other languages (zh, es, pt, fr, it)
};
```

## Important Notes

- Keep answers concise and user-friendly
- Maintain consistent information across all languages
- For technical explanations, use simple language accessible to non-technical users
- Include links to external resources where appropriate
- Update all translations when adding new FAQs
- Test the responsiveness of the FAQBot with new content

## Example Update

To add a new FAQ about the RGB++ protocol:

```typescript
// In English section
{
  question: "What is the RGB++ protocol?",
  answer: "RGB++ is a token issuance protocol that enables the creation of Bitcoin-compatible tokens on the Nervos Network. It combines the security of Bitcoin with the flexibility of Nervos CKB, allowing for trustless, scalable, and privacy-preserving token issuance."
}

// Make sure to add the corresponding translation in other languages
// zh section
{
  question: "什么是RGB++协议？",
  answer: "RGB++是一种代币发行协议，它使在Nervos Network上创建与比特币兼容的代币成为可能。它结合了比特币的安全性和Nervos CKB的灵活性，实现了无需信任、可扩展且保护隐私的代币发行。"
}
// ... and so on for other languages
```

Ensure all translations maintain the same technical accuracy while being culturally appropriate for each language.