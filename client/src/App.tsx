import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/not-found";
import TokenIssuer from "./pages/token-issuer";
import Footer from "./components/Footer";
import FAQBot from "./components/FAQBot";
import { useState, useEffect } from "react";
import { WalletProvider } from "./context/WalletContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={TokenIssuer} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  // Initialize states from localStorage
  const [language, setLanguage] = useState(() => {
    try {
      const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('sitaminter_language') : null;
      return savedLanguage || "en"; // Default to English if nothing is saved
    } catch (e) {
      return "en"; // Fallback to default in case localStorage is not available
    }
  });
  
  // Initialize network state from localStorage
  const [network, setNetwork] = useState<"mainnet" | "testnet">(() => {
    try {
      const savedNetwork = typeof window !== 'undefined' ? localStorage.getItem('sitaminter_network') : null;
      return (savedNetwork === "mainnet" ? "mainnet" : "testnet");
    } catch (e) {
      return "testnet"; // Fallback to testnet in case localStorage is not available
    }
  });

  // Define proper types for custom events
  interface LanguageChangeEvent extends CustomEvent {
    detail: { language: string };
  }

  interface NetworkChangeEvent extends CustomEvent {
    detail: { network: "mainnet" | "testnet" };
  }

  // Listen for language changes from the TokenIssuer component
  useEffect(() => {
    const handleLanguageChange = (event: LanguageChangeEvent) => {
      setLanguage(event.detail.language);
    };

    window.addEventListener('language-change', handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener('language-change', handleLanguageChange as EventListener);
    };
  }, []);
  
  // Listen for network changes from the TokenIssuer component
  useEffect(() => {
    const handleNetworkChange = (event: NetworkChangeEvent) => {
      setNetwork(event.detail.network);
    };

    window.addEventListener('network-change', handleNetworkChange as EventListener);

    return () => {
      window.removeEventListener('network-change', handleNetworkChange as EventListener);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">      
      <main className="flex-grow">
        <Router />
      </main>
      <Footer language={language} network={network} />
      <FAQBot language={language} network={network} />
      <Toaster />
    </div>
  );
}

function App() {
  // Configure the wallets that will be shown in the connector dialog
  const allowedWallets = ['joyid', 'metamask', 'utxo-global'];
  
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider availableWallets={allowedWallets}>
        <AppContent />
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
