# SiTa Minter Analytics Integration Guide

This guide provides instructions for configuring and updating analytics and tracking integrations in the SiTa Minter application.

## Table of Contents

1. [Introduction](#introduction)
2. [Privacy-First Analytics Approach](#privacy-first-analytics-approach)
3. [Analytics Implementation Files](#analytics-implementation-files)
4. [Configuring Analytics Providers](#configuring-analytics-providers)
5. [Event Tracking](#event-tracking)
6. [User Consent Management](#user-consent-management)
7. [Data Anonymization](#data-anonymization)
8. [Testing Analytics](#testing-analytics)
9. [Compliance Considerations](#compliance-considerations)

## Introduction

SiTa Minter implements lightweight analytics to understand application usage patterns while respecting user privacy. This guide explains how to configure analytics providers, track events, and ensure compliance with privacy regulations.

## Privacy-First Analytics Approach

SiTa Minter follows these principles for analytics:

1. **Minimal Data Collection**: Only collect what is necessary
2. **Anonymized Data**: No personally identifiable information (PII)
3. **User Consent**: Clear opt-in/opt-out options
4. **Transparent Disclosure**: Clear communication about data usage
5. **Local Storage Preference**: Prioritize local analytics where possible

## Analytics Implementation Files

Analytics functionality is primarily implemented in these files:

- `client/src/lib/analytics.ts` - Core analytics implementation
- `client/src/components/ConsentBanner.tsx` - User consent UI
- `client/src/hooks/use-analytics.ts` - Hook for tracking events
- `client/src/context/AnalyticsContext.tsx` - Analytics state management

## Configuring Analytics Providers

SiTa Minter is designed to work with multiple analytics providers through a unified API.

### Adding or Updating a Provider

To configure an analytics provider:

```typescript
// In client/src/lib/analytics.ts
export const ANALYTICS_PROVIDERS = {
  // Simple in-app analytics (stored locally, no external service)
  local: {
    enabled: true,
    initialize: () => {
      // Initialize local storage for analytics
      if (!localStorage.getItem('sita_analytics')) {
        localStorage.setItem('sita_analytics', JSON.stringify({ events: [] }));
      }
    },
    trackEvent: (event, properties) => {
      if (!localStorage.getItem('sita_analytics')) return;
      
      const analytics = JSON.parse(localStorage.getItem('sita_analytics'));
      analytics.events.push({
        event,
        properties,
        timestamp: new Date().toISOString()
      });
      
      // Limit stored events to prevent storage issues
      if (analytics.events.length > 100) {
        analytics.events = analytics.events.slice(-100);
      }
      
      localStorage.setItem('sita_analytics', JSON.stringify(analytics));
    }
  },
  
  // Server-side analytics (sends to your backend API)
  server: {
    enabled: false, // Set to true to enable
    initialize: () => {
      // No initialization needed for server analytics
    },
    trackEvent: async (event, properties) => {
      try {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event,
            properties,
            timestamp: new Date().toISOString()
          }),
        });
      } catch (error) {
        console.error('Failed to send analytics event:', error);
      }
    }
  },
  
  // Example third-party provider (placeholder - replace with actual implementation)
  thirdParty: {
    enabled: false, // Set to true to enable
    initialize: () => {
      // Initialize third-party analytics SDK
      if (typeof window !== 'undefined' && window.analyticsProvider) {
        window.analyticsProvider.init('YOUR_API_KEY');
      }
    },
    trackEvent: (event, properties) => {
      // Send to third-party provider
      if (typeof window !== 'undefined' && window.analyticsProvider) {
        window.analyticsProvider.track(event, properties);
      }
    }
  }
};
```

### Environment Variables for Analytics Configuration

For security and flexibility, store API keys and configuration in environment variables:

```
# Example .env configuration
VITE_ANALYTICS_ENABLED=true
VITE_ANALYTICS_PROVIDER=local
VITE_ANALYTICS_API_KEY=your_api_key_here
```

Then use these variables in your configuration:

```typescript
// In client/src/lib/analytics.ts
export const ANALYTICS_PROVIDERS = {
  // ...provider implementations
  
  thirdParty: {
    enabled: import.meta.env.VITE_ANALYTICS_ENABLED === 'true' &&
             import.meta.env.VITE_ANALYTICS_PROVIDER === 'thirdParty',
    initialize: () => {
      if (typeof window !== 'undefined' && window.analyticsProvider) {
        window.analyticsProvider.init(import.meta.env.VITE_ANALYTICS_API_KEY);
      }
    },
    // ...
  }
};
```

## Event Tracking

SiTa Minter tracks specific events to understand application usage.

### Standard Events

These standard events are tracked throughout the application:

```typescript
// In client/src/lib/analytics.ts
export const ANALYTICS_EVENTS = {
  // Page views
  PAGE_VIEW: 'page_view',
  
  // Wallet interactions
  WALLET_CONNECT_STARTED: 'wallet_connect_started',
  WALLET_CONNECTED: 'wallet_connected',
  WALLET_DISCONNECTED: 'wallet_disconnected',
  
  // Token creation flow
  TOKEN_CREATION_STARTED: 'token_creation_started',
  TOKEN_CREATION_COMPLETED: 'token_creation_completed',
  TOKEN_CREATION_FAILED: 'token_creation_failed',
  
  // User interactions
  BUTTON_CLICKED: 'button_clicked',
  LINK_CLICKED: 'link_clicked',
  FORM_SUBMITTED: 'form_submitted',
  TERMS_ACCEPTED: 'terms_accepted',
  
  // Feature usage
  NETWORK_SWITCHED: 'network_switched',
  LANGUAGE_CHANGED: 'language_changed',
  HELP_REQUESTED: 'help_requested'
};
```

### Adding New Events

To add a new event type:

1. Add the event to the `ANALYTICS_EVENTS` object
2. Implement tracking at the appropriate point in the code

```typescript
// Example: Adding a new "FAQ_VIEWED" event
export const ANALYTICS_EVENTS = {
  // Existing events...
  FAQ_VIEWED: 'faq_viewed'
};

// In FAQ component
import { useAnalytics } from '@/hooks/use-analytics';

function FAQComponent() {
  const { trackEvent } = useAnalytics();
  
  const handleQuestionClick = (questionId) => {
    // Track the event
    trackEvent(ANALYTICS_EVENTS.FAQ_VIEWED, {
      question_id: questionId
    });
    
    // Rest of the click handler
  };
  
  // ...
}
```

### Event Properties

When tracking events, include relevant properties for context:

```typescript
// Example event with properties
trackEvent(ANALYTICS_EVENTS.TOKEN_CREATION_COMPLETED, {
  token_name: tokenName,
  token_symbol: tokenSymbol,
  token_supply: tokenSupply,
  network: currentNetwork.id,
  time_to_complete: timeToCompleteMs, // Time from start to completion
  wallet_type: connectedWallet.type
});
```

## User Consent Management

SiTa Minter implements a consent management system for analytics.

### Consent Banner Component

The `ConsentBanner` component manages user preferences:

```tsx
// Example implementation
function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const { setAnalyticsConsent } = useAnalytics();
  
  useEffect(() => {
    // Check if user has already made a choice
    const consentStatus = localStorage.getItem('analytics_consent');
    if (consentStatus === null) {
      setShowBanner(true);
    }
  }, []);
  
  const acceptAnalytics = () => {
    setAnalyticsConsent(true);
    localStorage.setItem('analytics_consent', 'accepted');
    setShowBanner(false);
  };
  
  const declineAnalytics = () => {
    setAnalyticsConsent(false);
    localStorage.setItem('analytics_consent', 'declined');
    setShowBanner(false);
  };
  
  if (!showBanner) return null;
  
  return (
    <div className="consent-banner">
      <p>
        We use anonymous analytics to improve SiTa Minter. No personal information is collected.
        {/* Add multilingual support here */}
      </p>
      <div className="consent-actions">
        <button onClick={acceptAnalytics}>Accept</button>
        <button onClick={declineAnalytics}>Decline</button>
      </div>
    </div>
  );
}
```

### Respecting User Preferences

The analytics hook respects user consent:

```typescript
// In hooks/use-analytics.ts
export function useAnalytics() {
  const [hasConsent, setHasConsent] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('analytics_consent') === 'accepted';
  });
  
  const trackEvent = useCallback((event, properties = {}) => {
    // Only track if user has given consent
    if (!hasConsent) return;
    
    // Track across all enabled providers
    Object.values(ANALYTICS_PROVIDERS).forEach(provider => {
      if (provider.enabled) {
        provider.trackEvent(event, {
          ...properties,
          timestamp: new Date().toISOString(),
          language: document.documentElement.lang || 'en'
        });
      }
    });
  }, [hasConsent]);
  
  const setAnalyticsConsent = useCallback((consent) => {
    setHasConsent(consent);
  }, []);
  
  return { trackEvent, hasConsent, setAnalyticsConsent };
}
```

## Data Anonymization

SiTa Minter anonymizes all collected data:

```typescript
// In lib/analytics.ts
// Function to anonymize potentially sensitive data
export function anonymizeData(properties) {
  const anonymized = { ...properties };
  
  // Remove wallet addresses
  if (anonymized.address) {
    anonymized.address = anonymized.address.slice(0, 6) + '...' + anonymized.address.slice(-4);
  }
  
  // Remove token name details but keep length info
  if (anonymized.token_name) {
    anonymized.token_name_length = anonymized.token_name.length;
    delete anonymized.token_name;
  }
  
  // Remove specific amounts but keep magnitude
  if (anonymized.token_supply) {
    anonymized.token_supply_magnitude = Math.floor(Math.log10(anonymized.token_supply));
    delete anonymized.token_supply;
  }
  
  return anonymized;
}

// Use in trackEvent
trackEvent(ANALYTICS_EVENTS.TOKEN_CREATION_COMPLETED, anonymizeData({
  token_name: tokenName,
  token_supply: tokenSupply,
  // ...
}));
```

## Testing Analytics

When implementing or updating analytics:

1. **Developer Mode**:

```typescript
// In lib/analytics.ts
const ANALYTICS_DEBUG = import.meta.env.DEV;

export function trackEvent(event, properties) {
  // In development, log events to console
  if (ANALYTICS_DEBUG) {
    console.log('[Analytics]', event, properties);
  }
  
  // Normal tracking logic
  // ...
}
```

2. **Test All Events**: Ensure every defined event is properly triggered
3. **Validate Data**: Check that the correct properties are included
4. **Verify Anonymization**: Confirm sensitive data is properly anonymized
5. **Test Consent Flow**: Verify analytics respects user consent settings

## Compliance Considerations

When configuring analytics, ensure compliance with:

### GDPR Compliance

- Obtain explicit consent before collecting data
- Provide clear information about data usage
- Allow users to withdraw consent at any time
- Implement data retention policies

```typescript
// Example data retention policy for local analytics
const cleanupOldEvents = () => {
  if (!localStorage.getItem('sita_analytics')) return;
  
  const analytics = JSON.parse(localStorage.getItem('sita_analytics'));
  const now = new Date();
  
  // Remove events older than 90 days
  analytics.events = analytics.events.filter(event => {
    const eventDate = new Date(event.timestamp);
    const daysDifference = (now - eventDate) / (1000 * 60 * 60 * 24);
    return daysDifference <= 90;
  });
  
  localStorage.setItem('sita_analytics', JSON.stringify(analytics));
};

// Run cleanup periodically
useEffect(() => {
  cleanupOldEvents();
  const interval = setInterval(cleanupOldEvents, 24 * 60 * 60 * 1000); // Daily
  
  return () => clearInterval(interval);
}, []);
```

### Privacy Policy

Update your privacy policy to include:

1. What data is collected
2. How it is used
3. With whom it is shared (if applicable)
4. How long it is retained
5. User rights regarding their data

## Conclusion

Analytics can provide valuable insights while respecting user privacy. Configure your analytics implementation to collect only necessary data, obtain proper consent, and maintain transparency about data usage.

When adding new features to SiTa Minter, consider what events should be tracked to understand feature adoption and user experience, while always maintaining the privacy-first approach.