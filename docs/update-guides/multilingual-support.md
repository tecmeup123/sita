# Multilingual Support Guide

SiTa Minter supports six languages: English, Chinese, Spanish, Portuguese, French, and Italian. This guide explains how to maintain and update multilingual content across the application.

## Language Selection

The language selection is handled through the Language Context in:

```
client/src/context/LanguageContext.tsx
```

## Translation Pattern

Components with multilingual content typically follow this pattern:

```tsx
// Example of multilingual content structure
const contentByLanguage = {
  en: {
    title: "English Title",
    description: "English description text",
    button: "Continue"
  },
  zh: {
    title: "中文标题",
    description: "中文描述文本",
    button: "继续"
  },
  es: {
    title: "Título en Español",
    description: "Texto de descripción en español",
    button: "Continuar"
  },
  pt: {
    title: "Título em Português",
    description: "Texto descritivo em português",
    button: "Continuar"
  },
  fr: {
    title: "Titre en Français",
    description: "Texte descriptif en français",
    button: "Continuer"
  },
  it: {
    title: "Titolo in Italiano",
    description: "Testo descrittivo in italiano",
    button: "Continuare"
  }
};

// Usage in component
const { language } = useLanguage();
const content = contentByLanguage[language] || contentByLanguage.en;

return (
  <div>
    <h2>{content.title}</h2>
    <p>{content.description}</p>
    <button>{content.button}</button>
  </div>
);
```

## Components with Multilingual Content

Key components with multilingual content include:

1. **WelcomeDialog.tsx** - Initial user greeting
2. **TermsDialog.tsx** - Legal terms and conditions
3. **FAQBot.tsx** - Frequently asked questions
4. **token-issuer.tsx** - Main application interface
5. **WalletConnector.tsx** - Wallet connection UI

## Adding New Text

When adding new text to the application:

1. Identify the component where the text will appear
2. Add the English text first
3. Add translations for all other supported languages
4. Test the display in each language

## Best Practices for Translations

1. **Maintain Consistent Terminology**: Use consistent terms across translations
2. **Respect Cultural Differences**: Be aware of cultural nuances and adapt content appropriately
3. **Consider Text Expansion**: Some languages require more space than English
4. **Maintain Formatting**: Keep HTML/JSX formatting consistent across languages
5. **Test in Context**: View each translation in the actual UI to ensure proper display

## Example: Adding New FAQ Item

```tsx
// In FAQBot.tsx
const faqData = {
  en: [
    // Existing items
    {
      question: "What is the RGB++ protocol?",
      answer: "RGB++ is a token issuance protocol that enables the creation of Bitcoin-compatible tokens on the Nervos Network."
    }
  ],
  zh: [
    // Existing items
    {
      question: "什么是RGB++协议？",
      answer: "RGB++是一种代币发行协议，它使在Nervos Network上创建与比特币兼容的代币成为可能。"
    }
  ],
  // Add to other languages as well
};
```

## Handling Dynamic Text

For dynamic text (like error messages or variable content):

```tsx
const getErrorMessage = (code: string, language: string) => {
  const errorMessages = {
    'invalid_wallet': {
      en: 'Invalid wallet address',
      zh: '钱包地址无效',
      es: 'Dirección de billetera inválida',
      pt: 'Endereço de carteira inválido',
      fr: 'Adresse de portefeuille invalide',
      it: 'Indirizzo del portafoglio non valido'
    },
    // Other error codes
  };
  
  return errorMessages[code]?.[language] || errorMessages[code]?.en || 'Unknown error';
};
```

## Updating Existing Translations

When updating existing translations:

1. Start with the English version
2. Update all other language versions
3. Maintain the same meaning and tone across all languages
4. Test in the UI to ensure proper display

## Important Notes

- Always include translations for all six supported languages
- Default to English if a translation is missing
- Keep translations concise to accommodate UI space constraints
- For technical terms, consider providing additional explanation in non-English versions
- Test all translations in context to ensure proper display and functionality