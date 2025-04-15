import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, HelpCircle, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
  keywords: string[];
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

interface FAQBotProps {
  language: string;
  network?: "mainnet" | "testnet";
}

export default function FAQBot({ language, network = "testnet" }: FAQBotProps) {
  // Dialog open state
  const [isOpen, setIsOpen] = useState(false);
  
  // Listen for open-faqbot event
  useEffect(() => {
    // Event handler to open the FAQBot dialog
    const handleOpenFAQBot = () => {
      setIsOpen(true);
    };
    
    // Add event listener
    window.addEventListener('open-faqbot', handleOpenFAQBot);
    
    // Clean up listener on component unmount
    return () => {
      window.removeEventListener('open-faqbot', handleOpenFAQBot);
    };
  }, []);
  // Search query
  const [searchQuery, setSearchQuery] = useState("");
  // Currently viewed question
  const [activeQuestion, setActiveQuestion] = useState<FAQItem | null>(null);
  // Reference to the search input
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when dialog opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Short delay to ensure the dialog is fully rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Reset active question when dialog is closed
  useEffect(() => {
    if (!isOpen) {
      setActiveQuestion(null);
      setSearchQuery("");
    }
  }, [isOpen]);

  // FAQ data with multilingual support
  const faqData = {
    en: {
      categories: [
        {
          title: "Getting Started",
          items: [
            {
              question: "What is SITA MINTER?",
              answer: "SITA MINTER is a decentralized application (dApp) that allows you to create your own Bitcoin tokens on the Nervos CKB blockchain using the RGB++ protocol. It provides a simple interface to define your token's properties and issue it without any coding knowledge. With BIFI UNLEASHED, it empowers you to create Bitcoin-powered tokens in a simple, secure way.",
              keywords: ["sita", "minter", "about", "what", "app", "application"]
            },
            {
              question: "How do I create a token?",
              answer: "To create a token, first connect your wallet by clicking the wallet button in the top right. SITA MINTER supports multiple wallets including JoyID, UTXO Global, and MetaMask. Then fill in the token details (symbol, name, amount, decimals), choose whether to tip the creator, and click the '1-Click Create' button. Follow the prompts to approve the necessary transactions.",
              keywords: ["create", "token", "issue", "how", "steps", "tutorial"]
            },
            {
              question: "What wallets are supported?",
              answer: "SITA MINTER supports multiple wallets for interacting with the Nervos CKB blockchain: JoyID (a secure, non-custodial wallet using secure enclave technology), UTXO Global (a multi-chain wallet supporting BTC and CKB), and MetaMask (through a special connector for CKB support). Choose the wallet you're most comfortable with.",
              keywords: ["wallet", "connect", "install", "get", "setup", "joyid", "utxo global", "metamask"],
              action: (
                <div className="flex flex-col gap-2 mt-2">
                  <a
                    href="https://app.joy.id/?invitationCode=xYDVgh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center py-2 px-4 rounded-md font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <span>Get JoyID Wallet</span>
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                  <a
                    href="https://wallet.utxo.global/download"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center py-2 px-4 rounded-md font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    <span>Get UTXO Global Wallet</span>
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center py-2 px-4 rounded-md font-medium text-white bg-orange-600 hover:bg-orange-700 transition-colors"
                  >
                    <span>Get MetaMask</span>
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </div>
              )
            }
          ]
        },
        {
          title: "Token Creation",
          items: [
            {
              question: "What should I enter for 'Token Symbol'?",
              answer: "The token symbol is a short identifier for your token, typically 3-5 capital letters (like BTC or ETH). This will be the main way to identify your token on exchanges and wallets.",
              keywords: ["symbol", "ticker", "abbreviation", "token name"]
            },
            {
              question: "What should I enter for 'Token Name'?",
              answer: "The token name is the full name of your token (e.g., 'Bitcoin' or 'Ethereum'). It should be descriptive and represent the purpose or brand of your token.",
              keywords: ["name", "full name", "token name", "title"]
            },
            {
              question: "What are token 'Decimals'?",
              answer: "Decimals define how divisible your token is. For example, with 8 decimals, 1 token can be divided into 100,000,000 smaller units. Most tokens use between 8-18 decimals. If you're unsure, 8 is a good standard choice.",
              keywords: ["decimals", "divisible", "fraction", "division"]
            },
            {
              question: "What should I set for 'Total Supply'?",
              answer: "Total supply is the maximum number of tokens that will exist. Consider your project's economics - too few might limit adoption, too many might devalue each token. Common supplies range from thousands to billions depending on your token's purpose.",
              keywords: ["supply", "amount", "total", "quantity", "number"]
            }
          ]
        },
        {
          title: "Technical Questions",
          items: [
            {
              question: "What is Nervos CKB?",
              answer: "Nervos CKB (Common Knowledge Base) is a public, permissionless blockchain and the layer 1 of the Nervos Network. It provides a secure foundation for the creation and management of digital assets, using a unique cell model for state representation.",
              keywords: ["nervos", "ckb", "blockchain", "network"]
            },
            {
              question: "What is RGB++?",
              answer: "RGB++ is a token issuance protocol built on the Nervos CKB blockchain. It enables the creation of custom tokens with programmable logic, using a contract-based approach that leverages the CKB's cell model. SITA MINTER uses RGB++ to simplify token creation.",
              keywords: ["rgb", "rgb++", "protocol", "token standard"]
            },
            {
              question: "How do I get CKB for transaction fees?",
              answer: "To pay for transaction fees, you need CKB in your wallet. For testnet, you can get free CKB from the testnet faucet. For mainnet, you can purchase CKB from exchanges like BitMart, Binance, or Coinbase.",
              keywords: ["ckb", "fees", "gas", "transaction", "cost", "buy"],
              action: (
                <div className="flex flex-col gap-2 mt-2">
                  <a
                    href="https://faucet.nervos.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center py-2 px-4 rounded-md font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    <span>Get CKB from Faucet (Testnet)</span>
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                  <a
                    href="https://www.bitmart.com/invite/q6Y7xj/en"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center py-2 px-4 rounded-md font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <span>Buy CKB on BitMart (Mainnet)</span>
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </div>
              )
            },
            {
              question: "Is my token permanent?",
              answer: "Yes, once your token is created on the blockchain, it exists permanently. The blockchain is immutable, meaning your token will continue to exist even if SITA MINTER or other services become unavailable. Make sure you've set the properties correctly before issuing.",
              keywords: ["permanent", "forever", "immutable", "change", "delete"]
            },
            {
              question: "Are there any fees for using SITA MINTER?",
              answer: "Yes, SITA MINTER charges a platform support fee of 300 CKB for each token creation to maintain and develop the service. Additionally, blockchain operations require network fees including seal cell creation (61 CKB) and lock cell creation (61 CKB). The total basic cost is approximately 422 CKB. You can view the full fee breakdown in the token creation form.",
              keywords: ["platform fee", "cost", "charges", "pricing", "support fee", "service fee", "300 CKB"]
            }
          ]
        }
      ]
    },
    zh: {
      categories: [
        {
          title: "入门指南",
          items: [
            {
              question: "什么是 SITA MINTER？",
              answer: "SITA MINTER 是一个去中心化应用（dApp），它允许您使用 RGB++ 协议在 Nervos CKB 区块链上创建您自己的比特币代币。它提供了一个简单的界面来定义您的代币属性并发行它，无需任何编程知识。通过 BIFI UNLEASHED，它使您能够以简单、安全的方式创建比特币驱动的代币。",
              keywords: ["sita", "minter", "关于", "什么", "应用", "平台"]
            },
            {
              question: "如何创建代币？",
              answer: "要创建代币，首先通过点击右上角的钱包按钮连接您的钱包。SITA MINTER 支持多种钱包，包括 JoyID、UTXO Global 和 MetaMask。然后填写代币详情（符号、名称、数量、小数位数），选择是否给创建者小费，并点击'一键创建'按钮。按照提示批准必要的交易。",
              keywords: ["创建", "代币", "发行", "如何", "步骤", "教程"]
            },
            {
              question: "支持哪些钱包？",
              answer: "SITA MINTER 支持多种与 Nervos CKB 区块链交互的钱包：JoyID（使用安全飞地技术的安全非托管钱包）、UTXO Global（支持 BTC 和 CKB 的多链钱包）以及 MetaMask（通过特殊连接器支持 CKB）。选择您最熟悉的钱包使用。",
              keywords: ["钱包", "连接", "安装", "获取", "设置", "joyid", "utxo global", "metamask"]
            }
          ]
        },
        {
          title: "代币创建",
          items: [
            {
              question: "我应该为'代币符号'输入什么？",
              answer: "代币符号是您代币的简短标识符，通常是 3-5 个大写字母（如 BTC 或 ETH）。这将是在交易所和钱包上识别您代币的主要方式。",
              keywords: ["符号", "ticker", "缩写", "代币名称"]
            },
            {
              question: "我应该为'代币名称'输入什么？",
              answer: "代币名称是您代币的全名（例如，'比特币'或'以太坊'）。它应该是描述性的，并代表您代币的目的或品牌。",
              keywords: ["名称", "全名", "代币名称", "标题"]
            },
            {
              question: "什么是代币'小数位'？",
              answer: "小数位定义您的代币可分割的程度。例如，有 8 个小数位，1 个代币可以分为 100,000,000 个更小的单位。大多数代币使用 8-18 个小数位。如果您不确定，8 是一个很好的标准选择。",
              keywords: ["小数位", "可分割", "分数", "分割"]
            },
            {
              question: "我应该设置多少'总供应量'？",
              answer: "总供应量是将存在的最大代币数量。考虑您项目的经济性 - 太少可能会限制采用，太多可能会使每个代币贬值。根据您代币的目的，常见的供应量从数千到数十亿不等。",
              keywords: ["供应量", "数量", "总数", "数目"]
            }
          ]
        },
        {
          title: "技术问题",
          items: [
            {
              question: "什么是 Nervos CKB？",
              answer: "Nervos CKB（通用知识库）是一个公共的、无需许可的区块链，也是 Nervos 网络的第一层。它为数字资产的创建和管理提供了安全基础，使用独特的单元模型进行状态表示。",
              keywords: ["nervos", "ckb", "区块链", "网络"]
            },
            {
              question: "什么是 RGB++？",
              answer: "RGB++ 是构建在 Nervos CKB 区块链上的代币发行协议。它使用基于合约的方法创建具有可编程逻辑的自定义代币，利用 CKB 的单元模型。SITA MINTER 使用 RGB++ 简化代币创建。",
              keywords: ["rgb", "rgb++", "协议", "代币标准"]
            },
            {
              question: "如何获得交易费用的 CKB？",
              answer: "要支付交易费用，您需要在钱包中有 CKB。对于测试网，您可以从测试网水龙头获得免费 CKB。对于主网，您可以从 BitMart、币安或 Coinbase 等交易所购买 CKB。",
              keywords: ["ckb", "费用", "gas", "交易", "成本", "购买"]
            },
            {
              question: "我的代币是永久的吗？",
              answer: "是的，一旦您的代币在区块链上创建，它就永久存在。区块链是不可变的，这意味着即使 SITA MINTER 或其他服务不可用，您的代币也将继续存在。确保在发行之前正确设置属性。",
              keywords: ["永久", "永远", "不可变", "变更", "删除"]
            },
            {
              question: "使用 SITA MINTER 有费用吗？",
              answer: "是的，SITA MINTER 对每次代币创建收取 300 CKB 的平台支持费，用于维护和开发服务。此外，区块链操作需要网络费用，包括创建封印单元（61 CKB）和锁定单元（61 CKB）。基本总成本约为 422 CKB。您可以在代币创建表单中查看完整的费用明细。",
              keywords: ["平台费", "成本", "收费", "价格", "支持费", "服务费", "300 CKB"]
            }
          ]
        }
      ]
    },
    es: {
      categories: [
        {
          title: "Primeros Pasos",
          items: [
            {
              question: "¿Qué es SITA MINTER?",
              answer: "SITA MINTER es una aplicación descentralizada (dApp) que le permite crear sus propios tokens de Bitcoin en la blockchain Nervos CKB utilizando el protocolo RGB++. Proporciona una interfaz simple para definir las propiedades de su token y emitirlo sin ningún conocimiento de programación. Con BIFI UNLEASHED, le permite crear tokens impulsados por Bitcoin de manera simple y segura.",
              keywords: ["sita", "minter", "sobre", "qué", "app", "aplicación"]
            },
            {
              question: "¿Cómo creo un token?",
              answer: "Para crear un token, primero conecte su billetera haciendo clic en el botón de billetera en la parte superior derecha. SITA MINTER admite múltiples billeteras, incluyendo JoyID, UTXO Global y MetaMask. Luego complete los detalles del token (símbolo, nombre, cantidad, decimales), elija si desea dar propina al creador, y haga clic en el botón 'Crear con 1-Clic'. Siga las indicaciones para aprobar las transacciones necesarias.",
              keywords: ["crear", "token", "emitir", "cómo", "pasos", "tutorial"]
            },
            {
              question: "¿Qué billeteras son compatibles?",
              answer: "SITA MINTER admite múltiples billeteras para interactuar con la blockchain Nervos CKB: JoyID (una billetera segura y no custodiada que utiliza tecnología de enclave seguro), UTXO Global (una billetera multi-cadena que admite BTC y CKB), y MetaMask (a través de un conector especial para soporte de CKB). Elija la billetera con la que se sienta más cómodo.",
              keywords: ["joyid", "billetera", "conectar", "instalar", "obtener", "configurar", "utxo global", "metamask"]
            }
          ]
        },
        {
          title: "Creación de Tokens",
          items: [
            {
              question: "¿Qué debo ingresar para 'Símbolo del Token'?",
              answer: "El símbolo del token es un identificador corto para su token, típicamente 3-5 letras mayúsculas (como BTC o ETH). Esta será la principal forma de identificar su token en exchanges y billeteras.",
              keywords: ["símbolo", "ticker", "abreviatura", "nombre del token"]
            },
            {
              question: "¿Qué debo ingresar para 'Nombre del Token'?",
              answer: "El nombre del token es el nombre completo de su token (p. ej., 'Bitcoin' o 'Ethereum'). Debe ser descriptivo y representar el propósito o la marca de su token.",
              keywords: ["nombre", "nombre completo", "nombre del token", "título"]
            },
            {
              question: "¿Qué son los 'Decimales' del token?",
              answer: "Los decimales definen cuán divisible es su token. Por ejemplo, con 8 decimales, 1 token puede dividirse en 100,000,000 unidades más pequeñas. La mayoría de los tokens usan entre 8-18 decimales. Si no está seguro, 8 es una buena elección estándar.",
              keywords: ["decimales", "divisible", "fracción", "división"]
            },
            {
              question: "¿Qué debo establecer para 'Suministro Total'?",
              answer: "El suministro total es la cantidad máxima de tokens que existirán. Considere la economía de su proyecto - muy pocos podrían limitar la adopción, demasiados podrían devaluar cada token. Los suministros comunes varían desde miles hasta miles de millones dependiendo del propósito de su token.",
              keywords: ["suministro", "cantidad", "total", "número"]
            }
          ]
        },
        {
          title: "Preguntas Técnicas",
          items: [
            {
              question: "¿Qué es Nervos CKB?",
              answer: "Nervos CKB (Common Knowledge Base) es una blockchain pública y sin permisos, y la capa 1 de la Red Nervos. Proporciona una base segura para la creación y gestión de activos digitales, utilizando un modelo de celda único para la representación de estados.",
              keywords: ["nervos", "ckb", "blockchain", "red"]
            },
            {
              question: "¿Qué es RGB++?",
              answer: "RGB++ es un protocolo de emisión de tokens construido sobre la blockchain Nervos CKB. Permite la creación de tokens personalizados con lógica programable, utilizando un enfoque basado en contratos que aprovecha el modelo de celda de CKB. SITA MINTER utiliza RGB++ para simplificar la creación de tokens.",
              keywords: ["rgb", "rgb++", "protocolo", "estándar de token"]
            },
            {
              question: "¿Cómo obtengo CKB para las tarifas de transacción?",
              answer: "Para pagar las tarifas de transacción, necesita CKB en su billetera. Para testnet, puede obtener CKB gratis del faucet de testnet. Para mainnet, puede comprar CKB en exchanges como BitMart, Binance o Coinbase.",
              keywords: ["ckb", "tarifas", "gas", "transacción", "costo", "comprar"]
            },
            {
              question: "¿Mi token es permanente?",
              answer: "Sí, una vez que su token se crea en la blockchain, existe permanentemente. La blockchain es inmutable, lo que significa que su token seguirá existiendo incluso si SITA MINTER u otros servicios no están disponibles. Asegúrese de haber configurado las propiedades correctamente antes de emitir.",
              keywords: ["permanente", "para siempre", "inmutable", "cambiar", "eliminar"]
            },
            {
              question: "¿Hay alguna tarifa por usar SITA MINTER?",
              answer: "Sí, SITA MINTER cobra una tarifa de soporte de plataforma de 300 CKB por cada creación de token para mantener y desarrollar el servicio. Además, las operaciones de blockchain requieren tarifas de red, incluyendo la creación de celdas de sello (61 CKB) y la creación de celdas de bloqueo (61 CKB). El costo básico total es aproximadamente 422 CKB. Puede ver el desglose completo de tarifas en el formulario de creación de tokens.",
              keywords: ["tarifa de plataforma", "costo", "cargos", "precios", "tarifa de soporte", "tarifa de servicio", "300 CKB"]
            }
          ]
        }
      ]
    },
    pt: {
      categories: [
        {
          title: "Começando",
          items: [
            {
              question: "O que é SITA MINTER?",
              answer: "SITA MINTER é uma aplicação descentralizada (dApp) que permite criar seus próprios tokens de Bitcoin na blockchain Nervos CKB usando o protocolo RGB++. Fornece uma interface simples para definir as propriedades do seu token e emiti-lo sem qualquer conhecimento de programação. Com BIFI UNLEASHED, permite criar tokens baseados em Bitcoin de forma simples e segura.",
              keywords: ["sita", "minter", "sobre", "o que", "app", "aplicação"]
            },
            {
              question: "Como crio um token?",
              answer: "Para criar um token, primeiro conecte sua carteira clicando no botão de carteira no canto superior direito. SITA MINTER suporta múltiplas carteiras, incluindo JoyID, UTXO Global e MetaMask. Depois preencha os detalhes do token (símbolo, nome, quantidade, decimais), escolha se quer dar gorjeta ao criador, e clique no botão 'Criar com 1-Clique'. Siga as instruções para aprovar as transações necessárias.",
              keywords: ["criar", "token", "emitir", "como", "passos", "tutorial"]
            },
            {
              question: "Quais carteiras são suportadas?",
              answer: "SITA MINTER suporta múltiplas carteiras para interagir com a blockchain Nervos CKB: JoyID (uma carteira segura e não-custodial que utiliza tecnologia de enclave seguro), UTXO Global (uma carteira multi-chain que suporta BTC e CKB), e MetaMask (através de um conector especial para suporte CKB). Escolha a carteira com a qual se sente mais confortável.",
              keywords: ["joyid", "carteira", "conectar", "instalar", "obter", "configurar", "utxo global", "metamask"]
            }
          ]
        },
        {
          title: "Criação de Tokens",
          items: [
            {
              question: "O que devo inserir para 'Símbolo do Token'?",
              answer: "O símbolo do token é um identificador curto para o seu token, tipicamente 3-5 letras maiúsculas (como BTC ou ETH). Esta será a principal forma de identificar o seu token em exchanges e carteiras.",
              keywords: ["símbolo", "ticker", "abreviatura", "nome do token"]
            },
            {
              question: "O que devo inserir para 'Nome do Token'?",
              answer: "O nome do token é o nome completo do seu token (ex., 'Bitcoin' ou 'Ethereum'). Deve ser descritivo e representar o propósito ou a marca do seu token.",
              keywords: ["nome", "nome completo", "nome do token", "título"]
            },
            {
              question: "O que são 'Decimais' do token?",
              answer: "Decimais definem quão divisível é o seu token. Por exemplo, com 8 decimais, 1 token pode ser dividido em 100.000.000 unidades menores. A maioria dos tokens usa entre 8-18 decimais. Se não tiver certeza, 8 é uma boa escolha padrão.",
              keywords: ["decimais", "divisível", "fração", "divisão"]
            },
            {
              question: "O que devo definir para 'Fornecimento Total'?",
              answer: "Fornecimento total é o número máximo de tokens que existirão. Considere a economia do seu projeto - muito poucos podem limitar a adoção, demasiados podem desvalorizar cada token. Fornecimentos comuns variam de milhares a bilhões dependendo do propósito do seu token.",
              keywords: ["fornecimento", "quantidade", "total", "número"]
            }
          ]
        },
        {
          title: "Questões Técnicas",
          items: [
            {
              question: "O que é Nervos CKB?",
              answer: "Nervos CKB (Common Knowledge Base) é uma blockchain pública e sem permissão, e a camada 1 da Rede Nervos. Fornece uma base segura para a criação e gestão de ativos digitais, usando um modelo de célula único para representação de estado.",
              keywords: ["nervos", "ckb", "blockchain", "rede"]
            },
            {
              question: "O que é RGB++?",
              answer: "RGB++ é um protocolo de emissão de tokens construído na blockchain Nervos CKB. Permite a criação de tokens personalizados com lógica programável, usando uma abordagem baseada em contratos que aproveita o modelo de célula do CKB. SITA MINTER usa RGB++ para simplificar a criação de tokens.",
              keywords: ["rgb", "rgb++", "protocolo", "padrão de token"]
            },
            {
              question: "Como obtenho CKB para taxas de transação?",
              answer: "Para pagar taxas de transação, você precisa de CKB na sua carteira. Para testnet, você pode obter CKB grátis do faucet de testnet. Para mainnet, você pode comprar CKB em exchanges como BitMart, Binance ou Coinbase.",
              keywords: ["ckb", "taxas", "gas", "transação", "custo", "comprar"]
            },
            {
              question: "Meu token é permanente?",
              answer: "Sim, uma vez que seu token é criado na blockchain, ele existe permanentemente. A blockchain é imutável, o que significa que seu token continuará a existir mesmo se SITA MINTER ou outros serviços ficarem indisponíveis. Certifique-se de definir as propriedades corretamente antes de emitir.",
              keywords: ["permanente", "para sempre", "imutável", "alterar", "excluir"]
            },
            {
              question: "Existem taxas para usar o SITA MINTER?",
              answer: "Sim, o SITA MINTER cobra uma taxa de suporte à plataforma de 300 CKB para cada criação de token para manter e desenvolver o serviço. Além disso, as operações de blockchain requerem taxas de rede, incluindo criação de célula de selo (61 CKB) e criação de célula de bloqueio (61 CKB). O custo básico total é aproximadamente 422 CKB. Você pode ver o detalhamento completo das taxas no formulário de criação de token.",
              keywords: ["taxa de plataforma", "custo", "cobranças", "preços", "taxa de suporte", "taxa de serviço", "300 CKB"]
            }
          ]
        }
      ]
    },
    fr: {
      categories: [
        {
          title: "Démarrage",
          items: [
            {
              question: "Qu'est-ce que SITA MINTER ?",
              answer: "SITA MINTER est une application décentralisée (dApp) qui vous permet de créer vos propres jetons Bitcoin sur la blockchain Nervos CKB en utilisant le protocole RGB++. Elle fournit une interface simple pour définir les propriétés de votre jeton et l'émettre sans aucune connaissance en programmation. Avec BIFI UNLEASHED, elle vous permet de créer des jetons alimentés par Bitcoin de manière simple et sécurisée.",
              keywords: ["sita", "minter", "à propos", "quoi", "app", "application"]
            },
            {
              question: "Comment créer un jeton ?",
              answer: "Pour créer un jeton, connectez d'abord votre portefeuille en cliquant sur le bouton du portefeuille en haut à droite. SITA MINTER prend en charge plusieurs portefeuilles, notamment JoyID, UTXO Global et MetaMask. Ensuite, remplissez les détails du jeton (symbole, nom, montant, décimales), choisissez si vous souhaitez donner un pourboire au créateur, et cliquez sur le bouton 'Créer en 1-Clic'. Suivez les instructions pour approuver les transactions nécessaires.",
              keywords: ["créer", "jeton", "émettre", "comment", "étapes", "tutoriel"]
            },
            {
              question: "Quels portefeuilles sont pris en charge ?",
              answer: "SITA MINTER prend en charge plusieurs portefeuilles pour interagir avec la blockchain Nervos CKB : JoyID (un portefeuille sécurisé et non-custodial utilisant la technologie d'enclave sécurisée), UTXO Global (un portefeuille multi-chaînes supportant BTC et CKB), et MetaMask (via un connecteur spécial pour la prise en charge de CKB). Choisissez le portefeuille avec lequel vous êtes le plus à l'aise.",
              keywords: ["joyid", "portefeuille", "connecter", "installer", "obtenir", "configurer", "utxo global", "metamask"]
            }
          ]
        },
        {
          title: "Création de Jetons",
          items: [
            {
              question: "Que dois-je entrer pour 'Symbole du Jeton' ?",
              answer: "Le symbole du jeton est un identifiant court pour votre jeton, généralement 3-5 lettres majuscules (comme BTC ou ETH). Ce sera la principale façon d'identifier votre jeton sur les bourses et les portefeuilles.",
              keywords: ["symbole", "ticker", "abréviation", "nom du jeton"]
            },
            {
              question: "Que dois-je entrer pour 'Nom du Jeton' ?",
              answer: "Le nom du jeton est le nom complet de votre jeton (par ex., 'Bitcoin' ou 'Ethereum'). Il doit être descriptif et représenter l'objectif ou la marque de votre jeton.",
              keywords: ["nom", "nom complet", "nom du jeton", "titre"]
            },
            {
              question: "Que sont les 'Décimales' du jeton ?",
              answer: "Les décimales définissent à quel point votre jeton est divisible. Par exemple, avec 8 décimales, 1 jeton peut être divisé en 100 000 000 unités plus petites. La plupart des jetons utilisent entre 8-18 décimales. Si vous n'êtes pas sûr, 8 est un bon choix standard.",
              keywords: ["décimales", "divisible", "fraction", "division"]
            },
            {
              question: "Que dois-je définir pour 'Approvisionnement Total' ?",
              answer: "L'approvisionnement total est le nombre maximum de jetons qui existeront. Considérez l'économie de votre projet - trop peu pourrait limiter l'adoption, trop pourrait dévaluer chaque jeton. Les approvisionnements communs vont de milliers à milliards selon l'objectif de votre jeton.",
              keywords: ["approvisionnement", "montant", "total", "quantité", "nombre"]
            }
          ]
        },
        {
          title: "Questions Techniques",
          items: [
            {
              question: "Qu'est-ce que Nervos CKB ?",
              answer: "Nervos CKB (Common Knowledge Base) est une blockchain publique et sans permission, et la couche 1 du réseau Nervos. Elle fournit une base sécurisée pour la création et la gestion d'actifs numériques, en utilisant un modèle de cellule unique pour la représentation d'état.",
              keywords: ["nervos", "ckb", "blockchain", "réseau"]
            },
            {
              question: "Qu'est-ce que RGB++ ?",
              answer: "RGB++ est un protocole d'émission de jetons construit sur la blockchain Nervos CKB. Il permet la création de jetons personnalisés avec une logique programmable, en utilisant une approche basée sur les contrats qui exploite le modèle de cellule de CKB. SITA MINTER utilise RGB++ pour simplifier la création de jetons.",
              keywords: ["rgb", "rgb++", "protocole", "standard de jeton"]
            },
            {
              question: "Comment obtenir des CKB pour les frais de transaction ?",
              answer: "Pour payer les frais de transaction, vous avez besoin de CKB dans votre portefeuille. Pour le testnet, vous pouvez obtenir des CKB gratuits du faucet testnet. Pour le mainnet, vous pouvez acheter des CKB sur des bourses comme BitMart, Binance ou Coinbase.",
              keywords: ["ckb", "frais", "gas", "transaction", "coût", "acheter"]
            },
            {
              question: "Mon jeton est-il permanent ?",
              answer: "Oui, une fois que votre jeton est créé sur la blockchain, il existe de façon permanente. La blockchain est immuable, ce qui signifie que votre jeton continuera d'exister même si SITA MINTER ou d'autres services deviennent indisponibles. Assurez-vous d'avoir défini les propriétés correctement avant d'émettre.",
              keywords: ["permanent", "pour toujours", "immuable", "changer", "supprimer"]
            },
            {
              question: "Y a-t-il des frais pour utiliser SITA MINTER ?",
              answer: "Oui, SITA MINTER facture des frais de support de plateforme de 300 CKB pour chaque création de jeton afin de maintenir et développer le service. De plus, les opérations blockchain nécessitent des frais de réseau, y compris la création de cellule de scellement (61 CKB) et la création de cellule de verrouillage (61 CKB). Le coût de base total est d'environ 422 CKB. Vous pouvez consulter la ventilation complète des frais dans le formulaire de création de jetons.",
              keywords: ["frais de plateforme", "coût", "charges", "tarification", "frais de support", "frais de service", "300 CKB"]
            }
          ]
        }
      ]
    },
    it: {
      categories: [
        {
          title: "Per Iniziare",
          items: [
            {
              question: "Cos'è SITA MINTER?",
              answer: "SITA MINTER è un'applicazione decentralizzata (dApp) che ti permette di creare i tuoi token Bitcoin sulla blockchain Nervos CKB utilizzando il protocollo RGB++. Fornisce un'interfaccia semplice per definire le proprietà del tuo token ed emetterlo senza alcuna conoscenza di programmazione. Con BIFI UNLEASHED, ti permette di creare token alimentati da Bitcoin in modo semplice e sicuro.",
              keywords: ["sita", "minter", "cosa", "app", "applicazione"]
            },
            {
              question: "Come creo un token?",
              answer: "Per creare un token, prima connetti il tuo portafoglio cliccando sul pulsante del portafoglio in alto a destra. SITA MINTER supporta molteplici portafogli tra cui JoyID, UTXO Global e MetaMask. Poi compila i dettagli del token (simbolo, nome, importo, decimali), scegli se dare una mancia al creatore, e clicca sul pulsante 'Crea con 1-Click'. Segui le istruzioni per approvare le transazioni necessarie.",
              keywords: ["creare", "token", "emettere", "come", "passi", "tutorial"]
            },
            {
              question: "Quali portafogli sono supportati?",
              answer: "SITA MINTER supporta molteplici portafogli per interagire con la blockchain Nervos CKB: JoyID (un portafoglio sicuro e non-custodial che utilizza la tecnologia secure enclave), UTXO Global (un portafoglio multi-catena che supporta BTC e CKB), e MetaMask (tramite un connettore speciale per il supporto di CKB). Scegli il portafoglio con cui ti senti più a tuo agio.",
              keywords: ["joyid", "portafoglio", "connettere", "installare", "ottenere", "configurare", "utxo global", "metamask"]
            }
          ]
        },
        {
          title: "Creazione di Token",
          items: [
            {
              question: "Cosa devo inserire per 'Simbolo del Token'?",
              answer: "Il simbolo del token è un identificatore breve per il tuo token, tipicamente 3-5 lettere maiuscole (come BTC o ETH). Questo sarà il modo principale per identificare il tuo token su scambi e portafogli.",
              keywords: ["simbolo", "ticker", "abbreviazione", "nome del token"]
            },
            {
              question: "Cosa devo inserire per 'Nome del Token'?",
              answer: "Il nome del token è il nome completo del tuo token (es., 'Bitcoin' o 'Ethereum'). Dovrebbe essere descrittivo e rappresentare lo scopo o il brand del tuo token.",
              keywords: ["nome", "nome completo", "nome del token", "titolo"]
            },
            {
              question: "Cosa sono i 'Decimali' del token?",
              answer: "I decimali definiscono quanto è divisibile il tuo token. Ad esempio, con 8 decimali, 1 token può essere diviso in 100.000.000 unità più piccole. La maggior parte dei token usa tra 8-18 decimali. Se non sei sicuro, 8 è una buona scelta standard.",
              keywords: ["decimali", "divisibile", "frazione", "divisione"]
            },
            {
              question: "Cosa devo impostare per 'Fornitura Totale'?",
              answer: "La fornitura totale è il numero massimo di token che esisteranno. Considera l'economia del tuo progetto - troppo pochi potrebbero limitare l'adozione, troppi potrebbero svalutare ogni token. Le forniture comuni vanno da migliaia a miliardi a seconda dello scopo del tuo token.",
              keywords: ["fornitura", "quantità", "totale", "numero"]
            }
          ]
        },
        {
          title: "Domande Tecniche",
          items: [
            {
              question: "Cos'è Nervos CKB?",
              answer: "Nervos CKB (Common Knowledge Base) è una blockchain pubblica e senza permessi, e il livello 1 della Rete Nervos. Fornisce una base sicura per la creazione e gestione di asset digitali, utilizzando un modello di cella unico per la rappresentazione dello stato.",
              keywords: ["nervos", "ckb", "blockchain", "rete"]
            },
            {
              question: "Cos'è RGB++?",
              answer: "RGB++ è un protocollo di emissione di token costruito sulla blockchain Nervos CKB. Permette la creazione di token personalizzati con logica programmabile, utilizzando un approccio basato su contratti che sfrutta il modello di cella di CKB. SITA MINTER utilizza RGB++ per semplificare la creazione di token.",
              keywords: ["rgb", "rgb++", "protocollo", "standard di token"]
            },
            {
              question: "Come ottengo CKB per le commissioni di transazione?",
              answer: "Per pagare le commissioni di transazione, hai bisogno di CKB nel tuo portafoglio. Per testnet, puoi ottenere CKB gratuiti dal faucet testnet. Per mainnet, puoi acquistare CKB da scambi come BitMart, Binance o Coinbase.",
              keywords: ["ckb", "commissioni", "gas", "transazione", "costo", "comprare"]
            },
            {
              question: "Il mio token è permanente?",
              answer: "Sì, una volta che il tuo token è creato sulla blockchain, esiste permanentemente. La blockchain è immutabile, il che significa che il tuo token continuerà ad esistere anche se SITA MINTER o altri servizi diventano indisponibili. Assicurati di aver impostato le proprietà correttamente prima dell'emissione.",
              keywords: ["permanente", "per sempre", "immutabile", "cambiare", "eliminare"]
            },
            {
              question: "Ci sono costi per l'utilizzo di SITA MINTER?",
              answer: "Sì, SITA MINTER addebita una commissione di supporto alla piattaforma di 300 CKB per ogni creazione di token per mantenere e sviluppare il servizio. Inoltre, le operazioni blockchain richiedono commissioni di rete, inclusa la creazione di celle di sigillo (61 CKB) e la creazione di celle di blocco (61 CKB). Il costo base totale è di circa 422 CKB. Puoi visualizzare la ripartizione completa delle commissioni nel modulo di creazione del token.",
              keywords: ["commissione piattaforma", "costo", "addebiti", "prezzi", "commissione supporto", "commissione servizio", "300 CKB"]
            }
          ]
        }
      ]
    }
  };

  // Get the correct language data or fallback to English
  const langData = faqData[language as keyof typeof faqData] || faqData.en;

  // Function to search FAQs
  const searchFAQs = () => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: FAQItem[] = [];

    // Search through all categories and items
    langData.categories.forEach((category: FAQCategory) => {
      category.items.forEach((item: FAQItem) => {
        // Check if query matches question, answer, or keywords
        if (
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query) ||
          item.keywords.some(keyword => keyword.toLowerCase().includes(query))
        ) {
          results.push(item);
        }
      });
    });

    return results;
  };

  // Get search results
  const searchResults = searchQuery ? searchFAQs() : [];

  // Colors based on current network
  const accentColor = network === "mainnet" 
    ? "from-orange-400 via-orange-500 to-red-500" 
    : "from-purple-400 via-purple-500 to-indigo-500";
  
  const accentBgLight = network === "mainnet" ? "bg-orange-50" : "bg-purple-50";
  const accentBorder = network === "mainnet" ? "border-orange-200" : "border-purple-200";
  const accentText = network === "mainnet" ? "text-orange-600" : "text-purple-600";
  const accentBg = network === "mainnet" ? "bg-orange-500" : "bg-purple-500";
  const hoverBg = network === "mainnet" ? "hover:bg-orange-600" : "hover:bg-purple-600";

  // Title translations
  const titles = {
    en: "FAQ & Help",
    zh: "常见问题与帮助",
    es: "Preguntas frecuentes y ayuda",
    pt: "Perguntas frequentes e ajuda",
    fr: "FAQ et aide",
    it: "FAQ e aiuto"
  };

  // Placeholder translations
  const placeholders = {
    en: "Search for help...",
    zh: "搜索帮助...",
    es: "Buscar ayuda...",
    pt: "Procurar ajuda...",
    fr: "Rechercher de l'aide...",
    it: "Cerca aiuto..."
  };

  // Button translations
  const buttons = {
    en: "Back to categories",
    zh: "返回分类",
    es: "Volver a categorías",
    pt: "Voltar às categorias",
    fr: "Retour aux catégories",
    it: "Torna alle categorie"
  };

  // Get translated UI text
  const title = titles[language as keyof typeof titles] || titles.en;
  const placeholder = placeholders[language as keyof typeof placeholders] || placeholders.en;
  const backButton = buttons[language as keyof typeof buttons] || buttons.en;

  return (
    <>
      {/* FAQ Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className={cn(
            "max-w-2xl rounded-xl overflow-hidden",
            accentBgLight,
            "border",
            accentBorder,
            "p-0 animate-in fade-in-50 zoom-in-90 duration-300 max-h-[80vh] overflow-y-auto"
          )}
        >
          <DialogHeader className={cn("sticky top-0 z-10 p-4 bg-white shadow-sm flex flex-col gap-2")}>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="rounded-full h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={placeholder}
                className="pl-10 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                ref={searchInputRef}
              />
            </div>
          </DialogHeader>

          <div className="p-4">
            {/* Show active question */}
            {activeQuestion && (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveQuestion(null)}
                  className="mb-4 text-sm"
                >
                  <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                  {backButton}
                </Button>
                <h3 className={cn("text-lg font-semibold mb-3", accentText)}>{activeQuestion.question}</h3>
                <p className="text-neutral-700 text-sm">{activeQuestion.answer}</p>
              </div>
            )}

            {/* Search results */}
            {searchQuery && !activeQuestion && (
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-3">
                  {searchResults.length > 0 
                    ? searchResults.length === 1 
                      ? searchResults.length + " result" 
                      : searchResults.length + " results"
                    : "No results found"}
                </h3>
                <ul className="space-y-2">
                  {searchResults.map((item, index) => (
                    <li key={index}>
                      <button
                        onClick={() => setActiveQuestion(item)}
                        className={cn(
                          "text-left w-full p-3 rounded-lg border",
                          "hover:border-gray-300 transition-colors",
                          "flex items-start",
                          accentBorder
                        )}
                      >
                        <span className="font-medium">{item.question}</span>
                        <ChevronRight className="h-4 w-4 ml-auto mt-1 flex-shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Default categories view */}
            {!searchQuery && !activeQuestion && (
              <div className="space-y-6">
                {langData.categories.map((category: FAQCategory, catIndex: number) => (
                  <div key={catIndex}>
                    <h3 className={cn("text-base font-bold mb-3", accentText)}>{category.title}</h3>
                    <ul className="space-y-2">
                      {category.items.map((item: FAQItem, itemIndex: number) => (
                        <li key={itemIndex}>
                          <button
                            onClick={() => setActiveQuestion(item)}
                            className={cn(
                              "text-left w-full p-3 rounded-lg border",
                              "hover:border-gray-300 transition-colors",
                              "flex items-start",
                              accentBorder
                            )}
                          >
                            <span className="font-medium">{item.question}</span>
                            <ChevronRight className="h-4 w-4 ml-auto mt-1 flex-shrink-0" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className={cn("p-4 bg-white border-t border-gray-200")}>
            <div className="w-full text-center text-sm">
              <a 
                href="https://t.me/telmotalks/781" 
                target="_blank" 
                rel="noopener noreferrer"
                className={cn("text-gray-500 hover:underline", accentText)}
              >
                {language === "en" && "Can't find what you're looking for? Join our Telegram community!"}
                {language === "zh" && "找不到您需要的信息？加入我们的Telegram社区！"}
                {language === "es" && "¿No encuentras lo que buscas? ¡Únete a nuestra comunidad de Telegram!"}
                {language === "pt" && "Não encontrou o que procura? Junte-se à nossa comunidade no Telegram!"}
                {language === "fr" && "Vous ne trouvez pas ce que vous cherchez ? Rejoignez notre communauté Telegram !"}
                {language === "it" && "Non trovi quello che cerchi? Unisciti alla nostra comunità Telegram!"}
              </a>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}