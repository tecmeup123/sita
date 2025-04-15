# Updating the Welcome Dialog

The Welcome Dialog is defined in `WelcomeDialog.tsx`:

```
client/src/components/WelcomeDialog.tsx
```

## How to Update

1. Locate the `welcomeContent` object in the component
2. Each language has its own welcome message with title, content, and button text
3. Update the content while maintaining the structure
4. Ensure all language versions are updated for consistency

## File Structure

```typescript
const welcomeContent = {
  en: {
    title: "Welcome to SiTa Minter",
    content: (
      <>
        <p className="text-center mb-4">
          SiTa Minter allows you to create Bitcoin tokens powered by the Nervos Network RGB++ protocol.
        </p>
        <div className="space-y-2">
          <p>
            <span className="font-semibold">Simple and Intuitive:</span> Create your own custom token with just a few clicks, no coding required.
          </p>
          {/* More content */}
        </div>
      </>
    ),
    button: "Get Started"
  },
  // Other languages (zh, es, pt, fr, it)
};
```

## Important Notes

- The content uses JSX with HTML elements for formatting
- Maintain consistent structure across all languages
- Keep formatting elements like `<p>`, `<span>`, and className attributes
- The welcome dialog appears for first-time visitors
- Update all language versions when making changes

## Example Update

To update the English welcome content:

```tsx
en: {
  title: "Welcome to SiTa Minter",
  content: (
    <>
      <p className="text-center mb-4">
        SiTa Minter allows you to create Bitcoin tokens powered by the Nervos Network RGB++ protocol.
      </p>
      <div className="space-y-2">
        <p>
          <span className="font-semibold">Simple and Intuitive:</span> Create your own custom token with just a few clicks, no coding required.
        </p>
        <p>
          <span className="font-semibold">Bitcoin Ecosystem:</span> Your tokens are compatible with Bitcoin, leveraging its security and global recognition.
        </p>
        <p>
          <span className="font-semibold">Powered by RGB++:</span> Benefit from advanced features while maintaining Bitcoin's security model.
        </p>
        <p>
          <span className="font-semibold">Start Now:</span> Connect your wallet to begin minting your Bitcoin-compatible token.
        </p>
      </div>
    </>
  ),
  button: "Get Started"
}
```

Make sure to update this content across all supported languages, adapting it appropriately for each language while maintaining the same meaning and structure.