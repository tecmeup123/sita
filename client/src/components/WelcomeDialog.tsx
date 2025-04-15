import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, ExternalLink } from "lucide-react";
import LogoImage from "../assets/logo.png";

interface WelcomeDialogProps {
  language: string;
  translations: Record<string, any>;
  t: (key: any) => string;
  network?: "mainnet" | "testnet";
  /**
   * Optional: Control dialog open state externally
   * If provided, the component will use these props instead of internal state
   */
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

export function WelcomeDialog({ 
  language, 
  translations, 
  t, 
  network = "testnet",
  isOpen: externalIsOpen,
  setIsOpen: externalSetIsOpen
}: WelcomeDialogProps) {
  // Use internal state if external control is not provided
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Track if this is the first render
  const isFirstRender = useRef(true);
  
  // Check if the user has visited before
  const hasVisitedBefore = useRef(localStorage.getItem('sitaminter_visited') === 'true');
  
  // Determine which state and setter to use
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalSetIsOpen || setInternalIsOpen;

  // Automatically open the welcome dialog for first-time visitors
  useEffect(() => {
    // Only run this once on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      
      // Auto-open the dialog for first-time visitors only
      if (!hasVisitedBefore.current) {
        setIsOpen(true);
      }
    }
  }, [externalSetIsOpen, setIsOpen]);
  
  // When dialog is closed, mark as visited
  useEffect(() => {
    if (!isOpen && !hasVisitedBefore.current) {
      localStorage.setItem('sitaminter_visited', 'true');
      hasVisitedBefore.current = true;
    }
  }, [isOpen]);

  // Multi-language welcome content
  const welcomeContent = {
    en: {
      title: "Welcome to SITA MINTER",
      description: "Create Bitcoin assets powered by Nervos Network and RGB++ protocol",
      features: [
        "Create your own tokens in minutes",
        "No coding or technical knowledge required",
        "Once your token is in the blockchain, it's there forever! 🚀"
      ],
      getStarted: "Get Started",
      registerJoyID: "Register JoyID",
      buyCKB: "Buy CKB on BitMart",
      noWalletMessage: "Don't have a wallet? Create one and fund it with CKB:"
    },
    zh: {
      title: "欢迎使用 SITA MINTER",
      description: "基于Nervos Network和RGB++协议创建比特币资产",
      features: [
        "在几分钟内创建自己的代币",
        "无需编码或技术知识",
        "一旦您的代币上链，它将永远存在！🚀"
      ],
      getStarted: "开始使用",
      registerJoyID: "注册JoyID",
      buyCKB: "在BitMart上购买CKB",
      noWalletMessage: "还没有钱包？创建一个并充值CKB："
    },
    es: {
      title: "Bienvenido a SITA MINTER",
      description: "Crea activos Bitcoin con la tecnología de Nervos Network y el protocolo RGB++",
      features: [
        "Crea tus propios tokens en minutos",
        "No se requiere programación ni conocimiento técnico",
        "¡Una vez que tu token está en la blockchain, estará allí para siempre! 🚀"
      ],
      getStarted: "Comenzar",
      registerJoyID: "Registrar JoyID",
      buyCKB: "Comprar CKB en BitMart",
      noWalletMessage: "¿No tienes una billetera? Crea una y cárgala con CKB:"
    },
    pt: {
      title: "Bem-vindo ao SITA MINTER",
      description: "Crie ativos Bitcoin com a tecnologia da Nervos Network e protocolo RGB++",
      features: [
        "Crie os seus próprios tokens em minutos",
        "Não é necessário conhecimento técnico ou de programação",
        "Quando o seu token estiver na blockchain, permanecerá lá para sempre! 🚀"
      ],
      getStarted: "Começar",
      registerJoyID: "Registar JoyID",
      buyCKB: "Comprar CKB na BitMart",
      noWalletMessage: "Não tem uma carteira? Crie uma e carregue-a com CKB:"
    },
    fr: {
      title: "Bienvenue sur SITA MINTER",
      description: "Créez des actifs Bitcoin alimentés par Nervos Network et le protocole RGB++",
      features: [
        "Créez vos propres jetons en quelques minutes",
        "Aucune connaissance technique ou de programmation requise",
        "Une fois que votre jeton est sur la blockchain, il y reste pour toujours ! 🚀"
      ],
      getStarted: "Commencer",
      registerJoyID: "Enregistrer JoyID",
      buyCKB: "Acheter CKB sur BitMart",
      noWalletMessage: "Vous n'avez pas de portefeuille ? Créez-en un et alimentez-le avec CKB :"
    },
    it: {
      title: "Benvenuto a SITA MINTER",
      description: "Crea asset Bitcoin alimentati da Nervos Network e dal protocollo RGB++",
      features: [
        "Crea i tuoi token in pochi minuti",
        "Nessuna conoscenza tecnica o di programmazione richiesta",
        "Una volta che il tuo token è nella blockchain, ci rimarrà per sempre! 🚀"
      ],
      getStarted: "Iniziare",
      registerJoyID: "Registra JoyID",
      buyCKB: "Acquista CKB su BitMart",
      noWalletMessage: "Non hai un portafoglio? Creane uno e caricalo con CKB:"
    }
  };

  // Get content based on current language, fallback to English
  const content = (welcomeContent as any)[language] || welcomeContent.en;

  // Colors based on current network
  const accentColor = network === "mainnet" 
    ? "from-orange-400 via-orange-500 to-red-500" 
    : "from-purple-400 via-purple-500 to-indigo-500";
  
  const accentBgLight = network === "mainnet" ? "bg-orange-50" : "bg-purple-50";
  const accentBorder = network === "mainnet" ? "border-orange-200" : "border-purple-200";
  const accentIcon = network === "mainnet" ? "text-orange-500" : "text-purple-600";
  const accentButtonBg = network === "mainnet" ? "bg-orange-500 hover:bg-orange-600" : "bg-purple-500 hover:bg-purple-600";
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent 
        className={`max-w-md rounded-xl overflow-hidden ${accentBgLight} border ${accentBorder} p-0 animate-in fade-in-50 zoom-in-90 duration-300`}
        aria-describedby="welcome-dialog-description"
      >
        {/* Logo Header */}
        <div className="w-full flex justify-center py-4 bg-black border-b border-gray-200">
          <img src={LogoImage} alt="SITA MINTER Logo" className="h-14 animate-in slide-in-from-top-4 duration-500" />
        </div>
        <DialogTitle className="sr-only">{content.title}</DialogTitle>
        <div id="welcome-dialog-description" className="sr-only">{content.description}</div>
        
        {/* Content */}
        <div className="px-4 py-3">
          <DialogDescription className="text-sm text-center font-medium text-neutral-800 mb-3">
            {content.description}
          </DialogDescription>
          
          <div className="space-y-2 mb-3">
            {content.features.map((feature: string, index: number) => (
              <div key={index} className="flex items-start gap-2">
                <Check className={`h-4 w-4 ${accentIcon} shrink-0 mt-0.5`} />
                <span className="text-neutral-700 text-xs">{feature}</span>
              </div>
            ))}
          </div>
          
          <div className="bg-white p-2 rounded-md border border-neutral-200 shadow-sm mb-2">
            <p className="text-neutral-700 text-xs font-medium mb-1">
              {content.noWalletMessage}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <a 
                href="https://app.joy.id/?invitationCode=gWkx7T" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 text-xs p-1.5 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                <span>{content.registerJoyID}</span>
                <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
              </a>
              <a 
                href="https://www.bitmart.com/invite/tecmeup/en-US" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-1 text-xs p-1.5 ${accentButtonBg} text-white rounded-md transition-colors`}
              >
                <span>{content.buyCKB}</span>
                <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
              </a>
            </div>
          </div>
        </div>
        
        <DialogFooter className="p-3 pt-0">
          <Button 
            onClick={() => setIsOpen(false)} 
            className={`w-full h-8 flex items-center justify-center gap-1 bg-gradient-to-br ${accentColor} border border-white text-white rounded-lg transition-all shadow-md hover:opacity-90`}
          >
            {content.getStarted}
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}