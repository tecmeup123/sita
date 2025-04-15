"use client";

import { useState, useEffect } from "react";
import { Info, Check, Hourglass, Rocket, MessageCircle, Twitter, Heart, Tag, AlertCircle, Book } from "lucide-react";
import { GiUsaFlag, GiBrazil, GiFrance, GiPortugal, GiSpain } from "react-icons/gi";
import axios from "axios";
import { parseError, handleError, formatErrorForDisplay, ErrorType } from "../lib/errorHandling";
import { NetworkType, safeNetworkSwitch } from "../lib/networkValidation";
import { ccc } from "../lib/cccWrapper";
// Import country-specific flag icons
import { 
  FaFlag as GenericFlag
} from "react-icons/fa";
import { RiChinaRailwayFill } from "react-icons/ri";
import { WelcomeDialog } from "../components/WelcomeDialog";
// Import the wallet context hook
import { useWallet } from "../context/WalletContext";
import WalletConnector from "../components/WalletConnector";

// Security helper: sanitize text to prevent XSS
function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Function to convert numbers to words with capitalized first letters
function numberToWords(num: number): string {
  if (isNaN(num)) return '';
  if (num === 0) return 'Zero';
  
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function chunk(n: number): string {
    if (n === 0) return '';
    else if (n < 20) return units[n] + ' ';
    else if (n < 100) return tens[Math.floor(n / 10)] + ' ' + chunk(n % 10);
    else return units[Math.floor(n / 100)] + ' Hundred ' + chunk(n % 100);
  }
  
  // For very large numbers, limit to a readable range
  if (num > 999999999999) return 'Over a Trillion';
  
  const billion = Math.floor(num / 1000000000);
  const million = Math.floor((num % 1000000000) / 1000000);
  const thousand = Math.floor((num % 1000000) / 1000);
  const remainder = num % 1000;
  
  let words = '';
  
  if (billion) words += chunk(billion) + 'Billion ';
  if (million) words += chunk(million) + 'Million ';
  if (thousand) words += chunk(thousand) + 'Thousand ';
  if (remainder) words += chunk(remainder);
  
  return words.trim();
}

// Function to fetch current CKB price from Binance API
function useCkbPrice() {
  const [ckbPrice, setCkbPrice] = useState(0.05); // Default fallback price in USD
  const [fetchStatus, setFetchStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setFetchStatus('loading');
        
        // First try to get CKB-USDT price directly
        const ckbResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=CKBUSDT');
        if (ckbResponse.ok) {
          const ckbData = await ckbResponse.json();
          const price = parseFloat(ckbData.price);
          if (!isNaN(price) && price > 0) {
            setCkbPrice(price);
            setFetchStatus('success');
            setLastUpdated(new Date());
            console.log(`CKB price updated: $${price} USD`);
            return;
          }
        }
        
        // If direct pair fails, try CKB-BTC and BTC-USDT
        const ckbBtcResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=CKBBTC');
        const btcUsdtResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        
        if (ckbBtcResponse.ok && btcUsdtResponse.ok) {
          const ckbBtcData = await ckbBtcResponse.json();
          const btcUsdtData = await btcUsdtResponse.json();
          
          // Calculate CKB price in USD via BTC
          const ckbBtcPrice = parseFloat(ckbBtcData.price);
          const btcUsdtPrice = parseFloat(btcUsdtData.price);
          
          if (!isNaN(ckbBtcPrice) && !isNaN(btcUsdtPrice) && ckbBtcPrice > 0 && btcUsdtPrice > 0) {
            const calculatedPrice = ckbBtcPrice * btcUsdtPrice;
            setCkbPrice(calculatedPrice);
            setFetchStatus('success');
            setLastUpdated(new Date());
            console.log(`CKB price updated via BTC: $${calculatedPrice} USD`);
            return;
          }
        }
        
        throw new Error('Failed to fetch CKB price from Binance');
      } catch (error) {
        console.error("Error fetching CKB price:", error);
        setFetchStatus('error');
        // Keep default fallback price if fetch fails
      }
    };
    
    fetchPrice();
    // Refresh price every 5 minutes
    const interval = setInterval(fetchPrice, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return { 
    price: ckbPrice, 
    status: fetchStatus, 
    lastUpdated 
  };
}

// Define a constant for the JoyID logo for consistency
const JOYID_LOGO_URL = window.location.origin + "/src/assets/joyid-logo.png";

import { tokenInfoToBytes, issueToken, sendPlatformFee, sendCreatorTip } from "../lib/ckb";
import LogoImage from "../assets/logo.png";
import BtcfiUnleashedBanner from "@assets/N (457 x 83 px) (500 x 150 px)_20250405_120815_0000.png";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";



export default function TokenIssuer() {
  const { toast } = useToast();

  
  // Language selector state
  const [language, setLanguage] = useState<string>(() => {
    // Try to load from localStorage, default to English
    const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('sitaminter_language') : null;
    return savedLanguage || "en";
  });

  // Network selection state
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>(() => {
    // Try to load from localStorage, default to testnet
    const savedNetwork = typeof window !== 'undefined' ? localStorage.getItem('sitaminter_network') : null;
    return (savedNetwork === 'mainnet' ? 'mainnet' : 'testnet');
  });
  

  
  // Debug CCC library structure not needed anymore
  const [amount, setAmount] = useState("");
  const [decimals, setDecimals] = useState("");
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  

  const [status, setStatus] = useState("Welcome to SITA MINTER. Click 'Connect Wallet' to begin creating your token.");
  
  // Use wallet context instead of local state
  const { 
    walletConnected, 
    signer, 
    walletAddress, 
    userScript,
    network: walletNetwork,
    processingTransaction,
    connectWallet: contextConnectWallet,
    disconnectWallet: contextDisconnectWallet,
    acquireTransactionLock,
    releaseTransactionLock
  } = useWallet();
  
  // Define properly typed custom events
  interface LanguageChangeEventDetail {
    language: string;
  }

  // Emit language change event for other components to listen to
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('sitaminter_language', language);
    
    // Dispatch custom event for App component to listen to
    const event = new CustomEvent<LanguageChangeEventDetail>('language-change', { 
      detail: { language } 
    });
    window.dispatchEvent(event);
  }, [language]);
  
  // Emit network change event when network changes
  useEffect(() => {
    // Skip explicit network events for now to avoid import errors
    
    // Network change handling can be added here if needed
    // No cached queries to invalidate after removing promotions
  }, [network]);
  
  // Language options with flag icons and colors
  const languages = [
    { code: "en", name: "EN", longName: "English", color: "#1E40AF", flag: GiUsaFlag }, // USA
    { code: "zh", name: "CN", longName: "中文", color: "#DC2626", flag: RiChinaRailwayFill }, // Chinese
    { code: "es", name: "ES", longName: "Español", color: "#EA580C", flag: GiSpain }, // Spanish
    { code: "pt", name: "PT", longName: "Português", color: "#047857", flag: GiPortugal }, // Portuguese from Portugal
    { code: "fr", name: "FR", longName: "Français", color: "#4338CA", flag: GiFrance }, // French
    { code: "it", name: "IT", longName: "Italiano", color: "#CA8A04", flag: GenericFlag }  // Italian
  ];
  
  // Translations for the UI
  const translations = {
    en: {
      // Header
      connectWallet: "Connect Wallet",
      connect: "Connect",
      connecting: "Connecting...",
      disconnectWallet: "Disconnect Wallet",
      disconnect: "Disconnect",
      
      // Transaction details - removed as requested
      
      // Main content
      walletConnectedTo: "Wallet Connected to",
      mainnetText: "Mainnet",
      testnetText: "Testnet",
      appDescription: "Unlock Bitcoin's Next Level!",
      
      // Welcome dialog
      whatIsSitaMinter: "What is SITA MINTER?",
      aboutSitaMinter: "SITA MINTER is a user-friendly platform for creating and issuing custom tokens on the CKB blockchain without requiring technical knowledge.",
      
      // Form
      createToken: "Create a Token",
      walletRequirement: "Connect your wallet and make sure you have enough funds in it (min. 500 CKB).",
      
      // Form fields
      nameLabel: "Name",
      namePlaceholder: "Full name of your token",
      nameHelp: "Descriptive name (e.g., MyToken, BitcoinSatoshi)",
      
      symbolLabel: "Symbol",
      symbolPlaceholder: "Token symbol (e.g., BTC, ETH)",
      symbolHelp: "Short identifier for your token (3-4 characters)",
      
      amountLabel: "Amount",
      amountPlaceholder: "How many tokens to issue?",
      amountHelp: "Total supply of your token (e.g., 1000)",
      tokensText: "tokens",
      
      decimalsLabel: "Decimals",
      decimalsPlaceholder: "Number of decimal places",
      decimalsHelp: "Divisibility of your token (e.g., 8 for 0.00000001)",
      
      // Creator tip
      tipCreatorLabel: "Tip Creator with Tokens",
      tipPercentageLabel: "Percentage to tip",
      keepTokens: "You'll keep",
      andTip: "and tip the creator with",
      enterTokenAmount: "Please enter a token amount above to see how many tokens will be tipped to the creator",
      
      // Token issuance
      oneClickCreation: "One-click token creation",
      createTokenButton: "Create Token",
      withOneClick: "with One Click",
      creatingToken: "Creating...",
      signTransactions: "You will need to sign {steps} transactions with JoyID: platform fee, seal, lock, token issuance{tip}. Please ensure pop-ups are enabled in your browser.",
      
      // Errors
      walletNotConnected: "Wallet not connected",
      connectWalletFirst: "Please connect your JoyID wallet first.",
      missingInformation: "Missing information",
      fillAllDetails: "Please fill in all token details (name, symbol, amount, and decimals).",
      invalidDecimals: "Invalid decimals",
      decimalsRangeError: "Decimals must be a non-negative integer between 0 and 18.",
      invalidSymbol: "Invalid symbol",
      symbolFormatError: "Symbol must be 1-8 uppercase alphanumeric characters.",
      invalidAmount: "Invalid amount",
      amountRangeError: "Amount must be a positive number within reasonable limits (0 - 10^18).",
      invalidName: "Invalid name",
      nameLengthError: "Token name must be less than 64 characters.",
      
      // Fee Breakdown
      viewFeeBreakdown: "View Detailed Fee Breakdown",
      tokenCreationCosts: "Token Creation Costs:",
      platformSupportFee: "Platform Support Fee:",
      networkFees: "Network Transaction Fees:",
      totalBasicCost: "Total Basic Cost:",
      approximateUsdValue: "Approximate USD Value:",
      additionalTippingCosts: "Additional Tipping Costs:",
      tippingCellCapacity: "Creator Tip Transaction Fee:",
      totalTippingCost: "Total Tipping Cost:",
      tokenAmountToCreator: "Token Amount to Creator:",
      currentCkbPrice: "Current CKB Price:",
      infoNote: "The platform support fee (300 CKB) helps maintain and improve SITA MINTER's tools for the CKB community.",
      loadingPrice: "Loading price from Binance...",
      priceUpdated: "Updated",
      estimatedPrice: "Using estimated price - could not connect to Binance",
      note: "Note:",
      
      // Privacy Note
      privacyNote: "Privacy Note:",
      privacyNoteText: "We don't store your wallet data—transactions are processed on-chain only.",
      
      // Processing steps and transaction details
      processingPlatformFee: "Processing platform fee",
      creatingSealTransaction: "Creating seal transaction",
      creatingLockTransaction: "Creating lock transaction",
      finalizingTokenCreation: "Finalizing token creation",
      processingCreatorTip: "Processing creator tip",
      transactionDetails: "Transaction Details",
      transactionLogs: "Transaction Logs:",
      processingText: "Processing...",
      collapseText: "Collapse",
      expandText: "Expand",
      
      // Token Creation Process
      tokenCreationProcess: "Token Creation Process",
      waitingForSetup: "Waiting for Setup",
      readyForTokenCreation: "Ready for Token Creation",
      processing: "Processing",
      createSeal: "Create Seal",
      sealDescription: "Creates a seal cell that will be used in the token creation process",
      sealComplete: "Seal transaction confirmed and ready for use",
      createLock: "Create Lock",
      lockDescription: "Creates a single-use lock cell used to secure your token",
      lockComplete: "Lock transaction confirmed and ready for use",
      issueToken: "Issue Token",
      issueDescription: "Creates your new token with specified parameters",
      creatorTip: "Creator Tip",
      tipDescription: "Send {percent}% of tokens to the platform creator",
      viewTransaction: "View Transaction",
      complete: "Complete",
      
      // Token Statistics
      tokensIssued: "Tokens Issued Through SITA MINTER",
      totalTokensIssued: "Total Tokens Issued:",
      totalIssuanceCount: "Number of Issuances:",
      statsLoading: "Loading token statistics...",
      
      // Network Selection
      networkSelection: "Network Selection",
      mainnet: "Mainnet",
      testnet: "Testnet",
      testnetInfo: "Using <span>testnet</span> for free testing. Get testnet CKB from",
      testnetFaucet: "CKB Testnet Faucet",
      mainnetWarning: "To prevent spending real CKB, try creating your token first using our test environment."
    },
    
    zh: {
      // Header
      connectWallet: "连接钱包",
      connect: "连接",
      connecting: "连接中...",
      disconnectWallet: "断开钱包",
      disconnect: "断开",
      
      // Transaction details - removed as requested
      
      // Main content
      walletConnectedTo: "钱包已连接至",
      mainnetText: "主网",
      testnetText: "测试网",
      appDescription: "解锁比特币的新层次！",
      
      // Welcome dialog
      whatIsSitaMinter: "什么是 SITA MINTER？",
      aboutSitaMinter: "SITA MINTER 是一个用户友好的平台，用于在CKB区块链上创建和发行自定义代币，无需技术知识。",
      
      // Form
      createToken: "创建代币",
      walletRequirement: "连接您的钱包并确保其中有足够的资金（最低500 CKB）。",
      
      // Form fields
      nameLabel: "名称",
      namePlaceholder: "代币全称",
      nameHelp: "描述性名称（例如，MyToken，BitcoinSatoshi）",
      
      symbolLabel: "符号",
      symbolPlaceholder: "代币符号（例如，BTC，ETH）",
      symbolHelp: "代币的简短标识符（3-4个字符）",
      
      amountLabel: "数量",
      amountPlaceholder: "发行多少代币？",
      amountHelp: "代币总供应量（例如，1000）",
      tokensText: "代币",
      
      decimalsLabel: "小数位",
      decimalsPlaceholder: "小数位数",
      decimalsHelp: "代币的可分割性（例如，8表示0.00000001）",
      
      // Creator tip
      tipCreatorLabel: "向创建者打赏代币",
      tipPercentageLabel: "打赏百分比",
      keepTokens: "您将保留",
      andTip: "并向创建者打赏",
      enterTokenAmount: "请在上方输入代币数量以查看将打赏给创建者的代币数量",
      
      // Token issuance
      oneClickCreation: "一键创建代币",
      createTokenButton: "创建代币",
      withOneClick: "一键",
      creatingToken: "创建中...",
      signTransactions: "您需要使用 JoyID 签署 {steps} 个交易：平台费、印章、锁定、代币发行{tip}。请确保浏览器已启用弹出窗口。",
      
      // Errors
      walletNotConnected: "钱包未连接",
      connectWalletFirst: "请先连接您的 JoyID 钱包。",
      missingInformation: "信息缺失",
      fillAllDetails: "请填写所有代币详细信息（名称，符号，数量和小数位）。",
      invalidDecimals: "无效的小数位",
      decimalsRangeError: "小数位必须是0到18之间的非负整数。",
      invalidSymbol: "无效的符号",
      symbolFormatError: "符号必须是1-8个大写字母数字字符。",
      invalidAmount: "无效的数量",
      amountRangeError: "数量必须是在合理范围内的正数（0 - 10^18）。",
      invalidName: "无效的名称",
      nameLengthError: "代币名称必须少于64个字符。",
      
      // Fee Breakdown
      viewFeeBreakdown: "查看详细费用明细",
      tokenCreationCosts: "代币创建费用：",
      platformSupportFee: "平台支持费：",
      networkFees: "网络交易费：",
      totalBasicCost: "基本总成本：",
      approximateUsdValue: "美元近似价值：",
      additionalTippingCosts: "额外打赏费用：",
      tippingCellCapacity: "创建者打赏交易费：",
      totalTippingCost: "打赏总成本：",
      tokenAmountToCreator: "创建者获得代币数量：",
      currentCkbPrice: "当前 CKB 价格：",
      infoNote: "平台支持费 (300 CKB) 有助于维护和改进 SITA MINTER 为 CKB 社区提供的工具。",
      note: "注意：",
      
      // Privacy Note
      privacyNote: "隐私提示：",
      privacyNoteText: "我们不存储您的钱包数据——交易仅在链上处理。",
      
      // Processing steps and transaction details
      processingPlatformFee: "处理平台费用",
      creatingSealTransaction: "创建印章交易",
      creatingLockTransaction: "创建锁定交易",
      finalizingTokenCreation: "完成代币创建",
      processingCreatorTip: "处理创建者打赏",
      transactionDetails: "交易详情",
      transactionLogs: "交易日志：",
      processingText: "处理中...",
      collapseText: "收起",
      expandText: "展开",
      
      // Token Creation Process
      tokenCreationProcess: "代币创建流程",
      waitingForSetup: "等待设置",
      readyForTokenCreation: "准备创建代币",
      processing: "处理中",
      createSeal: "创建印章",
      sealDescription: "创建将用于代币创建过程的印章单元",
      sealComplete: "印章交易已确认并准备使用",
      createLock: "创建锁定",
      lockDescription: "创建用于保护您代币的单次使用锁定单元",
      lockComplete: "锁定交易已确认并准备使用",
      issueToken: "发行代币",
      issueDescription: "使用指定参数创建您的新代币",
      creatorTip: "创建者打赏",
      tipDescription: "将 {percent}% 的代币发送给平台创建者",
      viewTransaction: "查看交易",
      complete: "完成",
      
      // Token Statistics
      tokensIssued: "通过 SITA MINTER 发行的代币",
      totalTokensIssued: "已发行代币总量：",
      totalIssuanceCount: "发行次数：",
      statsLoading: "正在加载代币统计信息...",
      
      // Network Selection
      networkSelection: "网络选择",
      mainnet: "主网",
      testnet: "测试网",
      testnetInfo: "使用<span>测试网</span>进行免费测试。从以下地址获取测试网 CKB：",
      testnetFaucet: "CKB 测试网水龙头",
      mainnetWarning: "为防止消费真实 CKB，请先使用测试环境创建您的代币。"
    },
    
    es: {
      // Header
      connectWallet: "Conectar Billetera",
      connect: "Conectar",
      connecting: "Conectando...",
      disconnectWallet: "Desconectar Billetera",
      disconnect: "Desconectar",
      
      // Transaction details - removed as requested
      
      // Main content
      walletConnectedTo: "Billetera conectada a",
      mainnetText: "Red Principal",
      testnetText: "Red de Prueba",
      appDescription: "¡Desbloquea el siguiente nivel de Bitcoin!",
      
      // Welcome dialog
      whatIsSitaMinter: "¿Qué es SITA MINTER?",
      aboutSitaMinter: "SITA MINTER es una plataforma fácil de usar para crear y emitir tokens personalizados en la blockchain CKB sin requerir conocimientos técnicos.",
      
      // Form
      createToken: "Crear un Token",
      walletRequirement: "Conecta tu billetera y asegúrate de tener fondos suficientes (mín. 500 CKB).",
      
      // Form fields
      nameLabel: "Nombre",
      namePlaceholder: "Nombre completo de tu token",
      nameHelp: "Nombre descriptivo (ej., MiToken, BitcoinSatoshi)",
      
      symbolLabel: "Símbolo",
      symbolPlaceholder: "Símbolo del token (ej., BTC, ETH)",
      symbolHelp: "Identificador corto para tu token (3-4 caracteres)",
      
      amountLabel: "Cantidad",
      amountPlaceholder: "¿Cuántos tokens emitir?",
      amountHelp: "Suministro total de tu token (ej., 1000)",
      tokensText: "tokens",
      
      decimalsLabel: "Decimales",
      decimalsPlaceholder: "Número de lugares decimales",
      decimalsHelp: "Divisibilidad de tu token (ej., 8 para 0.00000001)",
      
      // Creator tip
      tipCreatorLabel: "Dar Propina al Creador con Tokens",
      tipPercentageLabel: "Porcentaje de propina",
      keepTokens: "Mantendrás",
      andTip: "y darás al creador",
      enterTokenAmount: "Ingresa una cantidad de tokens arriba para ver cuántos tokens se darán al creador",
      
      // Token issuance
      oneClickCreation: "Creación de token con un clic",
      createTokenButton: "Crear Token",
      withOneClick: "con Un Clic",
      creatingToken: "Creando...",
      signTransactions: "Necesitarás firmar {steps} transacciones con JoyID: tarifa de plataforma, sello, bloqueo, emisión de token{tip}. Asegúrate de que las ventanas emergentes estén habilitadas en tu navegador.",
      
      // Errors
      walletNotConnected: "Billetera no conectada",
      connectWalletFirst: "Por favor conecta tu billetera JoyID primero.",
      missingInformation: "Información faltante",
      fillAllDetails: "Por favor completa todos los detalles del token (nombre, símbolo, cantidad y decimales).",
      invalidDecimals: "Decimales inválidos",
      decimalsRangeError: "Los decimales deben ser un número entero no negativo entre 0 y 18.",
      invalidSymbol: "Símbolo inválido",
      symbolFormatError: "El símbolo debe tener entre 1 y 8 caracteres alfanuméricos en mayúsculas.",
      invalidAmount: "Cantidad inválida",
      amountRangeError: "La cantidad debe ser un número positivo dentro de límites razonables (0 - 10^18).",
      invalidName: "Nombre inválido",
      nameLengthError: "El nombre del token debe tener menos de 64 caracteres.",
      
      // Fee Breakdown
      viewFeeBreakdown: "Ver Desglose Detallado de Tarifas",
      tokenCreationCosts: "Costos de Creación de Tokens:",
      platformSupportFee: "Tarifa de Soporte de Plataforma:",
      networkFees: "Tarifas de Transacción de Red:",
      totalBasicCost: "Costo Básico Total:",
      approximateUsdValue: "Valor Aproximado en USD:",
      additionalTippingCosts: "Costos Adicionales de Propina:",
      tippingCellCapacity: "Tarifa de Transacción de Propina al Creador:",
      totalTippingCost: "Costo Total de Propina:",
      tokenAmountToCreator: "Cantidad de Tokens para el Creador:",
      currentCkbPrice: "Precio Actual de CKB:",
      infoNote: "La tarifa de soporte de plataforma (300 CKB) ayuda a mantener y mejorar las herramientas de SITA MINTER para la comunidad CKB.",
      note: "Nota:",
      
      // Privacy Note
      privacyNote: "Nota de Privacidad:",
      privacyNoteText: "No almacenamos sus datos de billetera—las transacciones se procesan únicamente en la cadena.",
      
      // Processing steps and transaction details
      processingPlatformFee: "Procesando tarifa de plataforma",
      creatingSealTransaction: "Creando transacción de sello",
      creatingLockTransaction: "Creando transacción de bloqueo",
      finalizingTokenCreation: "Finalizando creación de token",
      processingCreatorTip: "Procesando propina para el creador",
      transactionDetails: "Detalles de Transacción",
      transactionLogs: "Registros de Transacción:",
      processingText: "Procesando...",
      collapseText: "Colapsar",
      expandText: "Expandir",
      
      // Token Creation Process
      tokenCreationProcess: "Proceso de Creación de Token",
      waitingForSetup: "Esperando Configuración",
      readyForTokenCreation: "Listo para Crear Token",
      processing: "Procesando",
      createSeal: "Crear Sello",
      sealDescription: "Crea una celda de sello que se utilizará en el proceso de creación del token",
      sealComplete: "Transacción de sello confirmada y lista para usar",
      createLock: "Crear Bloqueo",
      lockDescription: "Crea una celda de bloqueo de uso único utilizada para asegurar tu token",
      lockComplete: "Transacción de bloqueo confirmada y lista para usar",
      issueToken: "Emitir Token",
      issueDescription: "Crea tu nuevo token con los parámetros especificados",
      creatorTip: "Propina al Creador",
      tipDescription: "Enviar {percent}% de tokens al creador de la plataforma",
      viewTransaction: "Ver Transacción",
      complete: "Completado",
      
      // Token Statistics
      tokensIssued: "Tokens Emitidos A Través de SITA MINTER",
      totalTokensIssued: "Total de Tokens Emitidos:",
      totalIssuanceCount: "Número de Emisiones:",
      statsLoading: "Cargando estadísticas de tokens...",
      
      // Network Selection
      networkSelection: "Selección de Red",
      mainnet: "Red Principal",
      testnet: "Red de Prueba",
      testnetInfo: "Usando <span>red de prueba</span> para pruebas gratuitas. Obtenga CKB de prueba en",
      testnetFaucet: "Grifo CKB de Prueba",
      mainnetWarning: "Para evitar gastar CKB real, primero intente crear su token usando nuestro entorno de prueba."
    },
    
    // Complete translations for Portuguese, French, and Italian
    fr: {
      // Header
      connectWallet: "Connecter Portefeuille",
      connect: "Connecter",
      connecting: "Connexion...",
      disconnectWallet: "Déconnecter Portefeuille",
      disconnect: "Déconnecter",
      
      // Transaction details - removed as requested
      
      // Main content
      walletConnectedTo: "Portefeuille connecté à",
      mainnetText: "Réseau Principal",
      testnetText: "Réseau de Test",
      appDescription: "Débloquez le niveau supérieur de Bitcoin !",
      
      // Form
      createToken: "Créer un Jeton",
      walletRequirement: "Connectez votre portefeuille et assurez-vous d'avoir suffisamment de fonds (min. 500 CKB).",
      
      // Form fields
      nameLabel: "Nom",
      namePlaceholder: "Nom complet de votre jeton",
      nameHelp: "Nom descriptif (ex., MonJeton, BitcoinSatoshi)",
      
      symbolLabel: "Symbole",
      symbolPlaceholder: "Symbole du jeton (ex., BTC, ETH)",
      symbolHelp: "Identifiant court pour votre jeton (3-4 caractères)",
      
      amountLabel: "Montant",
      amountPlaceholder: "Combien de jetons émettre ?",
      amountHelp: "Approvisionnement total de votre jeton (ex., 1000)",
      tokensText: "jetons",
      
      decimalsLabel: "Décimales",
      decimalsPlaceholder: "Nombre de décimales",
      decimalsHelp: "Divisibilité de votre jeton (ex., 8 pour 0,00000001)",
      
      // Creator tip
      tipCreatorLabel: "Pourboire au Créateur en Jetons",
      tipPercentageLabel: "Pourcentage de pourboire",
      keepTokens: "Vous garderez",
      andTip: "et donnerez au créateur",
      enterTokenAmount: "Entrez un montant de jetons ci-dessus pour voir combien de jetons seront donnés au créateur",
      
      // Token issuance
      oneClickCreation: "Création de jeton en un clic",
      createTokenButton: "Créer Jeton",
      withOneClick: "en Un Clic",
      creatingToken: "Création...",
      signTransactions: "Vous devrez signer {steps} transactions avec JoyID: frais de plateforme, sceau, verrouillage, émission de jeton{tip}. Assurez-vous que les pop-ups sont activés dans votre navigateur.",
      
      // Errors
      walletNotConnected: "Portefeuille non connecté",
      connectWalletFirst: "Veuillez d'abord connecter votre portefeuille JoyID.",
      missingInformation: "Information manquante",
      fillAllDetails: "Veuillez remplir tous les détails du jeton (nom, symbole, montant et décimales).",
      invalidDecimals: "Décimales invalides",
      decimalsRangeError: "Les décimales doivent être un nombre entier non négatif entre 0 et 18.",
      invalidSymbol: "Symbole invalide",
      symbolFormatError: "Le symbole doit comporter entre 1 et 8 caractères alphanumériques en majuscules.",
      invalidAmount: "Montant invalide",
      amountRangeError: "Le montant doit être un nombre positif dans des limites raisonnables (0 - 10^18).",
      invalidName: "Nom invalide",
      nameLengthError: "Le nom du jeton doit comporter moins de 64 caractères.",
      
      // Fee Breakdown
      viewFeeBreakdown: "Voir Détail des Frais",
      tokenCreationCosts: "Coûts de Création de Jetons:",
      platformSupportFee: "Frais de Support de la Plateforme:",
      networkFees: "Frais de Transaction Réseau:",
      totalBasicCost: "Coût Total de Base:",
      approximateUsdValue: "Valeur Approximative en USD:",
      additionalTippingCosts: "Coûts Supplémentaires de Pourboire:",
      tippingCellCapacity: "Frais de Transaction pour Pourboire au Créateur:",
      totalTippingCost: "Coût Total de Pourboire:",
      tokenAmountToCreator: "Montant de Jetons pour le Créateur:",
      currentCkbPrice: "Prix Actuel du CKB:",
      infoNote: "Les frais de support de la plateforme (300 CKB) aident à maintenir et améliorer les outils de SITA MINTER pour la communauté CKB.",
      note: "Note:",
      
      // Privacy Note
      privacyNote: "Note de Confidentialité:",
      privacyNoteText: "Nous ne stockons pas vos données de portefeuille—les transactions sont traitées uniquement sur la blockchain.",
      
      // Processing steps and transaction details
      processingPlatformFee: "Traitement des frais de plateforme",
      creatingSealTransaction: "Création de la transaction de sceau",
      creatingLockTransaction: "Création de la transaction de verrouillage",
      finalizingTokenCreation: "Finalisation de la création du jeton",
      processingCreatorTip: "Traitement du pourboire au créateur",
      transactionDetails: "Détails de la Transaction",
      transactionLogs: "Journaux de Transaction:",
      processingText: "Traitement...",
      collapseText: "Réduire",
      expandText: "Étendre",
      
      // Token Creation Process
      tokenCreationProcess: "Processus de Création de Jeton",
      waitingForSetup: "En Attente de Configuration",
      readyForTokenCreation: "Prêt pour la Création de Jeton",
      processing: "Traitement",
      createSeal: "Créer Sceau",
      sealDescription: "Crée une cellule de sceau qui sera utilisée dans le processus de création du jeton",
      sealComplete: "Transaction de sceau confirmée et prête à l'utilisation",
      createLock: "Créer Verrouillage",
      lockDescription: "Crée une cellule de verrouillage à usage unique utilisée pour sécuriser votre jeton",
      lockComplete: "Transaction de verrouillage confirmée et prête à l'utilisation",
      issueToken: "Émettre Jeton",
      issueDescription: "Crée votre nouveau jeton avec les paramètres spécifiés",
      creatorTip: "Pourboire au Créateur",
      tipDescription: "Envoyer {percent}% des jetons au créateur de la plateforme",
      viewTransaction: "Voir Transaction",
      complete: "Terminé",
      
      // Token Statistics
      tokensIssued: "Jetons Émis Via SITA MINTER",
      totalTokensIssued: "Total des Jetons Émis:",
      totalIssuanceCount: "Nombre d'Émissions:",
      statsLoading: "Chargement des statistiques de jetons...",
      
      // Network Selection
      networkSelection: "Sélection de Réseau",
      mainnet: "Réseau Principal",
      testnet: "Réseau de Test",
      testnetInfo: "Utilisation du <span>réseau de test</span> pour tests gratuits. Obtenez du CKB de test sur",
      testnetFaucet: "Robinet CKB de Test",
      mainnetWarning: "Pour éviter de dépenser du vrai CKB, essayez d'abord de créer votre jeton en utilisant notre environnement de test."
    },
    
    pt: {
      // Header
      connectWallet: "Ligar Carteira",
      connect: "Ligar",
      connecting: "A ligar...",
      disconnectWallet: "Desligar Carteira",
      disconnect: "Desligar",
      
      // Transaction details - removed as requested
      
      // Main content
      walletConnectedTo: "Carteira ligada a",
      mainnetText: "Rede Principal",
      testnetText: "Rede de Teste",
      appDescription: "Desbloqueie o próximo nível do Bitcoin!",
      
      // Form
      createToken: "Criar um Token",
      walletRequirement: "Ligue a sua carteira e certifique-se de que tem fundos suficientes (mín. 500 CKB).",
      
      // Form fields
      nameLabel: "Nome",
      namePlaceholder: "Nome completo do seu token",
      nameHelp: "Nome descritivo (ex., MeuToken, BitcoinSatoshi)",
      
      symbolLabel: "Símbolo",
      symbolPlaceholder: "Símbolo do token (ex., BTC, ETH)",
      symbolHelp: "Identificador curto para o seu token (3-4 caracteres)",
      
      amountLabel: "Quantidade",
      amountPlaceholder: "Quantos tokens emitir?",
      amountHelp: "Fornecimento total do seu token (ex., 1000)",
      tokensText: "tokens",
      
      decimalsLabel: "Decimais",
      decimalsPlaceholder: "Número de casas decimais",
      decimalsHelp: "Divisibilidade do seu token (ex., 8 para 0,00000001)",
      
      // Creator tip
      tipCreatorLabel: "Dar Gorjeta ao Criador com Tokens",
      tipPercentageLabel: "Percentagem para gorjeta",
      keepTokens: "Manterá",
      andTip: "e dará ao criador",
      enterTokenAmount: "Insira uma quantidade de tokens acima para ver quantos tokens serão dados ao criador",
      
      // Token issuance
      oneClickCreation: "Criação de token com um clique",
      createTokenButton: "Criar Token",
      withOneClick: "com Um Clique",
      creatingToken: "A criar...",
      signTransactions: "Precisará de assinar {steps} transações com JoyID: taxa de plataforma, selo, bloqueio, emissão de token{tip}. Certifique-se de que os pop-ups estão ativados no seu navegador.",
      
      // Errors
      walletNotConnected: "Carteira não ligada",
      connectWalletFirst: "Por favor, ligue a sua carteira JoyID primeiro.",
      missingInformation: "Informação em falta",
      fillAllDetails: "Por favor, preencha todos os detalhes do token (nome, símbolo, quantidade e decimais).",
      invalidDecimals: "Decimais inválidos",
      decimalsRangeError: "Os decimais devem ser um número inteiro não negativo entre 0 e 18.",
      invalidSymbol: "Símbolo inválido",
      symbolFormatError: "O símbolo deve ter entre 1 e 8 caracteres alfanuméricos em maiúsculas.",
      invalidAmount: "Quantidade inválida",
      amountRangeError: "A quantidade deve ser um número positivo dentro de limites razoáveis (0 - 10^18).",
      invalidName: "Nome inválido",
      nameLengthError: "O nome do token deve ter menos de 64 caracteres.",
      
      // Fee Breakdown
      viewFeeBreakdown: "Ver Detalhes das Taxas",
      tokenCreationCosts: "Custos de Criação de Tokens:",
      platformSupportFee: "Taxa de Suporte da Plataforma:",
      networkFees: "Taxas de Transação de Rede:",
      totalBasicCost: "Custo Básico Total:",
      approximateUsdValue: "Valor Aproximado em USD:",
      additionalTippingCosts: "Custos Adicionais de Gorjeta:",
      tippingCellCapacity: "Taxa de Transação para Gorjeta ao Criador:",
      totalTippingCost: "Custo Total de Gorjeta:",
      tokenAmountToCreator: "Quantidade de Tokens para o Criador:",
      currentCkbPrice: "Preço Atual do CKB:",
      infoNote: "A taxa de suporte da plataforma (300 CKB) ajuda a manter e melhorar as ferramentas do SITA MINTER para a comunidade CKB.",
      note: "Nota:",
      
      // Privacy Note
      privacyNote: "Nota de Privacidade:",
      privacyNoteText: "Não armazenamos os seus dados de carteira—as transações são processadas apenas na blockchain.",
      
      // Processing steps and transaction details
      processingPlatformFee: "A processar taxa de plataforma",
      creatingSealTransaction: "A criar transação de selo",
      creatingLockTransaction: "A criar transação de bloqueio",
      finalizingTokenCreation: "A finalizar criação de token",
      processingCreatorTip: "A processar gorjeta para o criador",
      transactionDetails: "Detalhes da Transação",
      transactionLogs: "Registos de Transação:",
      processingText: "A processar...",
      collapseText: "Recolher",
      expandText: "Expandir",
      
      // Token Creation Process
      tokenCreationProcess: "Processo de Criação de Token",
      waitingForSetup: "À espera de Configuração",
      readyForTokenCreation: "Pronto para Criar Token",
      processing: "A processar",
      createSeal: "Criar Selo",
      sealDescription: "Cria uma célula de selo que será utilizada no processo de criação do token",
      sealComplete: "Transação de selo confirmada e pronta para uso",
      createLock: "Criar Bloqueio",
      lockDescription: "Cria uma célula de bloqueio de uso único utilizada para proteger o seu token",
      lockComplete: "Transação de bloqueio confirmada e pronta para uso",
      issueToken: "Emitir Token",
      issueDescription: "Cria o seu novo token com os parâmetros especificados",
      creatorTip: "Gorjeta ao Criador",
      tipDescription: "Enviar {percent}% de tokens ao criador da plataforma",
      viewTransaction: "Ver Transação",
      complete: "Concluído",
      
      // Token Statistics
      tokensIssued: "Tokens Emitidos Através do SITA MINTER",
      totalTokensIssued: "Total de Tokens Emitidos:",
      totalIssuanceCount: "Número de Emissões:",
      statsLoading: "A carregar estatísticas de tokens...",
      
      // Network Selection
      networkSelection: "Seleção de Rede",
      mainnet: "Rede Principal",
      testnet: "Rede de Teste",
      testnetInfo: "A utilizar <span>rede de teste</span> para testes gratuitos. Obtenha CKB de teste em",
      testnetFaucet: "Fonte CKB de Teste",
      mainnetWarning: "Para evitar gastar CKB real, tente criar o seu token primeiro usando o nosso ambiente de teste."
    },
    
    it: {
      // Header
      connectWallet: "Connetti Portafoglio",
      connect: "Connetti",
      connecting: "Connessione...",
      disconnectWallet: "Disconnetti Portafoglio",
      disconnect: "Disconnetti",
      
      // Transaction details - removed as requested
      
      // Main content
      walletConnectedTo: "Portafoglio connesso a",
      mainnetText: "Rete Principale",
      testnetText: "Rete di Test",
      appDescription: "Sblocca il nuovo livello di Bitcoin!",
      
      // Form
      createToken: "Crea un Token",
      walletRequirement: "Connetti il tuo portafoglio e assicurati di avere fondi sufficienti (min. 500 CKB).",
      
      // Form fields
      nameLabel: "Nome",
      namePlaceholder: "Nome completo del tuo token",
      nameHelp: "Nome descrittivo (es., MioToken, BitcoinSatoshi)",
      
      symbolLabel: "Simbolo",
      symbolPlaceholder: "Simbolo del token (es., BTC, ETH)",
      symbolHelp: "Identificativo breve per il tuo token (3-4 caratteri)",
      
      amountLabel: "Quantità",
      amountPlaceholder: "Quanti token emettere?",
      amountHelp: "Fornitura totale del tuo token (es., 1000)",
      tokensText: "token",
      
      decimalsLabel: "Decimali",
      decimalsPlaceholder: "Numero di decimali",
      decimalsHelp: "Divisibilità del tuo token (es., 8 per 0,00000001)",
      
      // Creator tip
      tipCreatorLabel: "Mancia al Creatore con Token",
      tipPercentageLabel: "Percentuale di mancia",
      keepTokens: "Manterrai",
      andTip: "e darai al creatore",
      enterTokenAmount: "Inserisci una quantità di token sopra per vedere quanti token verranno dati al creatore",
      
      // Token issuance
      oneClickCreation: "Creazione token con un clic",
      createTokenButton: "Crea Token",
      withOneClick: "con Un Clic",
      creatingToken: "Creazione...",
      signTransactions: "Dovrai firmare {steps} transazioni con JoyID: commissione piattaforma, sigillo, blocco, emissione token{tip}. Assicurati che i pop-up siano abilitati nel tuo browser.",
      
      // Errors
      walletNotConnected: "Portafoglio non connesso",
      connectWalletFirst: "Per favore, connetti prima il tuo portafoglio JoyID.",
      missingInformation: "Informazione mancante",
      fillAllDetails: "Per favore, compila tutti i dettagli del token (nome, simbolo, quantità e decimali).",
      invalidDecimals: "Decimali non validi",
      decimalsRangeError: "I decimali devono essere un numero intero non negativo tra 0 e 18.",
      invalidSymbol: "Simbolo non valido",
      symbolFormatError: "Il simbolo deve avere tra 1 e 8 caratteri alfanumerici maiuscoli.",
      invalidAmount: "Quantità non valida",
      amountRangeError: "La quantità deve essere un numero positivo entro limiti ragionevoli (0 - 10^18).",
      invalidName: "Nome non valido",
      nameLengthError: "Il nome del token deve avere meno di 64 caratteri.",
      
      // Fee Breakdown
      viewFeeBreakdown: "Visualizza Dettaglio Costi",
      tokenCreationCosts: "Costi di Creazione Token:",
      platformSupportFee: "Tariffa di Supporto Piattaforma:",
      networkFees: "Commissioni di Transazione Rete:",
      totalBasicCost: "Costo Base Totale:",
      approximateUsdValue: "Valore Approssimativo in USD:",
      additionalTippingCosts: "Costi Aggiuntivi di Mancia:",
      tippingCellCapacity: "Commissione di Transazione per Mancia al Creatore:",
      totalTippingCost: "Costo Totale di Mancia:",
      tokenAmountToCreator: "Quantità di Token per il Creatore:",
      currentCkbPrice: "Prezzo Attuale del CKB:",
      infoNote: "La tariffa di supporto della piattaforma (300 CKB) aiuta a mantenere e migliorare gli strumenti di SITA MINTER per la comunità CKB.",
      note: "Nota:",
      
      // Privacy Note
      privacyNote: "Nota sulla Privacy:",
      privacyNoteText: "Non memorizziamo i dati del tuo portafoglio—le transazioni vengono elaborate solo sulla blockchain.",
      
      // Processing steps and transaction details
      processingPlatformFee: "Elaborazione commissione piattaforma",
      creatingSealTransaction: "Creazione transazione di sigillo",
      creatingLockTransaction: "Creazione transazione di blocco",
      finalizingTokenCreation: "Finalizzazione creazione token",
      processingCreatorTip: "Elaborazione mancia al creatore",
      transactionDetails: "Dettagli Transazione",
      transactionLogs: "Registri Transazione:",
      processingText: "Elaborazione...",
      collapseText: "Comprimi",
      expandText: "Espandi",
      
      // Token Creation Process
      tokenCreationProcess: "Processo di Creazione Token",
      waitingForSetup: "In Attesa di Configurazione",
      readyForTokenCreation: "Pronto per la Creazione Token",
      processing: "Elaborazione",
      createSeal: "Crea Sigillo",
      sealDescription: "Crea una cella di sigillo che verrà utilizzata nel processo di creazione del token",
      sealComplete: "Transazione di sigillo confermata e pronta per l'uso",
      createLock: "Crea Blocco",
      lockDescription: "Crea una cella di blocco monouso utilizzata per proteggere il tuo token",
      lockComplete: "Transazione di blocco confermata e pronta per l'uso",
      issueToken: "Emetti Token",
      issueDescription: "Crea il tuo nuovo token con i parametri specificati",
      creatorTip: "Mancia al Creatore",
      tipDescription: "Invia {percent}% dei token al creatore della piattaforma",
      viewTransaction: "Visualizza Transazione",
      complete: "Completato",
      
      // Token Statistics
      tokensIssued: "Token Emessi Tramite SITA MINTER",
      totalTokensIssued: "Totale Token Emessi:",
      totalIssuanceCount: "Numero di Emissioni:",
      statsLoading: "Caricamento statistiche token...",
      
      // Network Selection
      networkSelection: "Selezione Rete",
      mainnet: "Rete Principale",
      testnet: "Rete di Test",
      testnetInfo: "Utilizzo della <span>rete di test</span> per test gratuiti. Ottieni CKB di test da",
      testnetFaucet: "Rubinetto CKB di Test",
      mainnetWarning: "Per evitare di spendere CKB reali, prova prima a creare il tuo token utilizzando il nostro ambiente di test."
    }
  };
  
  // Function to get translated text
  const t = (key: keyof typeof translations.en | 'signTransactions' | 'connecting') => {
    // Default to English if the selected language doesn't have the translation
    // or if the key doesn't exist
    const lang = translations[language as keyof typeof translations] || translations.en;
    return (lang as any)[key] || translations.en[key] || key;
  };
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [ckbBalance, setCkbBalance] = useState("0");
  // Using walletAddress from WalletContext instead of local state
  const { price: ckbPrice, status: priceStatus, lastUpdated: priceLastUpdated } = useCkbPrice(); // Get the current CKB price
  
  // Store transaction hashes and state for the multi-step process
  const [sealTxHash, setSealTxHash] = useState("");
  const [lockTxHash, setLockTxHash] = useState("");
  const [feeTxHash, setFeeTxHash] = useState("");
  const [sealIsLive, setSealIsLive] = useState(false);
  const [lockIsLive, setLockIsLive] = useState(false);
  
  // Define network change event interface
  interface NetworkChangeEventDetail {
    network: 'mainnet' | 'testnet';
  }

  // Emit network change event for other components to listen to
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('sitaminter_network', network);
    
    // Dispatch custom event for App component to listen to
    const event = new CustomEvent<NetworkChangeEventDetail>('network-change', { 
      detail: { network } 
    });
    window.dispatchEvent(event);
  }, [network]);
  const [logsExpanded, setLogsExpanded] = useState(false);
  
  // Store client/signer globally to reuse across steps
  // Initialize client, signer, and user script from localStorage if available
  const [ckbClient, setCkbClient] = useState<any>(() => {
    // Client can't be serialized directly, will be recreated in useEffect
    return null;
  });
  
  // Using signer from WalletContext instead of local state
  
  // Using userScript from WalletContext instead of local state
  const [singleUseLock, setSingleUseLock] = useState<any>(null);
  const [tipCreator, setTipCreator] = useState(false);
  const [tipPercentage, setTipPercentage] = useState(5); // Default to 5%
  
  // Use the context's connectWallet function, but wrap it to handle our UI updates
  const connectWallet = async () => {
    try {
      setStatus(`Connecting to wallet on ${network}...`);
      
      // Use the context's connect function
      await contextConnectWallet();
      
      // The context will take care of setting up the signer, address, and script
      // We just need to update our UI state
      
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Wallet connected successfully on ${walletNetwork}!`);
      return signer; // Return the signer from context for any code that expects it
    } catch (e: any) {
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Failed to connect wallet: ${e.message}`);
      return null;
    }
  };

  // Auto reconnect wallet on page load if the user previously connected
  useEffect(() => {
    // Check if we should attempt to reconnect (if localStorage indicates a wallet was connected)
    const wasConnected = localStorage.getItem('sitaminter_wallet_connected') === 'true';
    const savedAddress = localStorage.getItem('sitaminter_wallet_address');
    
    // Use the signer from context instead of the local one (which is now deprecated)
    if (wasConnected && savedAddress && !signer) {
      console.log("Attempting to reconnect previously connected wallet");
      
      // Show a loading state
      setStatus("Reconnecting your wallet...");
      
      // Attempt to reconnect wallet
      connectWallet()
        .then(returnedSigner => {
          if (returnedSigner) {
            setStatus(`Welcome back! Your wallet (${savedAddress.slice(0, 8)}...${savedAddress.slice(-8)}) has been reconnected.`);
          } else {
            // If reconnection fails, clean up the stale connection info
            // Use context's disconnectWallet instead of direct state manipulation
            contextDisconnectWallet();
            setStatus("Previous wallet session expired. Please connect your wallet again to continue.");
          }
        })
        .catch(err => {
          console.error("Error reconnecting wallet:", err);
          // Clean up stale connection if reconnect fails
          // Use context's disconnectWallet instead of direct state manipulation
          contextDisconnectWallet(); 
          // Clear local storage - the context will handle its own storage
          localStorage.removeItem('sitaminter_wallet_connected');
          localStorage.removeItem('sitaminter_wallet_address');
          localStorage.removeItem('sitaminter_user_script');
          setStatus("Could not reconnect to your wallet. Please connect again to continue.");
        });
    }
  }, [signer, contextConnectWallet, contextDisconnectWallet, network, walletNetwork]);

  // Function to fetch wallet balance - disabled to prevent infinite render issues
  const fetchWalletBalance = async (_signer: any, _script: any) => {
    // No-op function to prevent infinite render loops
    return "0";
  };
  
  // Function to get wallet address in readable format (deprecated - using context now)
  // Preserved for backward compatibility with existing function calls
  const getWalletAddress = async (signer: any) => {
    try {
      if (!signer) return "";
      
      // Get the address object
      const addressObj = await signer.getRecommendedAddressObj();
      const { address } = addressObj;
      
      // No need to update state, just return the address - context handles state
      // Store for backward compatibility
      localStorage.setItem('sitaminter_wallet_address', address);
      return address;
    } catch (e: any) {
      console.error("Error getting wallet address:", e);
      return "";
    }
  };
  
  // Function to disconnect wallet - leverages WalletContext's disconnectWallet
  const disconnectWallet = () => {
    // Use the context's disconnect function
    contextDisconnectWallet();
    
    // Reset local state
    setSealTxHash("");
    setLockTxHash("");
    setSealIsLive(false);
    setLockIsLive(false);
    
    // Update UI
    setStatus("Wallet disconnected. Click 'Connect Wallet' to begin creating your token.");
  };
  
  // Step 1: Create the seal transaction
  const createSealTransaction = async () => {
    if (!signer || !userScript) {
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Please connect your wallet first`);
      return;
    }
    
    try {
      setIsProcessing(true);
      setCurrentStep(1);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ℹ️ Creating seal transaction (Step 1/4)...`);
      
      // Add timestamp to prevent transaction replay attacks
      const timestamp = Math.floor(Date.now() / 1000).toString(16);
      const susTx = ccc.Transaction.from({ 
        outputs: [{ lock: userScript }],
        outputsData: [`0x${timestamp}`] // Add timestamp as cell data
      });
      await susTx.completeInputsByCapacity(signer!);
      await susTx.completeFeeBy(signer!, 1000);
      
      const txHash = await signer.sendTransaction(susTx);
      setSealTxHash(txHash);
      
      // Mark the cell as unusable in the client cache to prevent reuse
      await signer!.client.cache.markUnusable({
        txHash: txHash,
        index: 0,
      });
      
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Seal created! Transaction: ${getExplorerBaseUrl()}/transaction/${txHash}`);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ⏳ Waiting for transaction confirmation...`);
      
      await signer!.client.waitTransaction(txHash);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Seal transaction confirmed`);
      
      // We don't need to check if the cell is "live" - we can proceed directly
      setSealIsLive(true);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Seal cell ready! You can proceed to the next step.`);
    } catch (error: any) {
      console.error("Error creating seal transaction:", error);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Error creating seal: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Step 2: Create the lock transaction
  const createLockTransaction = async () => {
    if (!signer || !sealTxHash || !sealIsLive) {
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Please create a seal transaction first`);
      return;
    }
    
    try {
      setIsProcessing(true);
      setCurrentStep(2);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ℹ️ Creating lock transaction (Step 2/4)...`);
      
      // Create OutPoint from seal transaction
      const sealOutPoint = ccc.OutPoint.from({ txHash: sealTxHash, index: "0x0" });
      const outPointBytes = sealOutPoint.toBytes();
      
      // Create SingleUseLock with the OutPoint bytes
      const singleLock = await ccc.Script.fromKnownScript(
        signer!.client,
        ccc.KnownScript.SingleUseLock,
        outPointBytes
      );
      setSingleUseLock(singleLock);
      
      // Add timestamp to prevent transaction replay attacks
      const lockTimestamp = Math.floor(Date.now() / 1000).toString(16);
      const lockTx = ccc.Transaction.from({ 
        outputs: [{ lock: singleLock }],
        outputsData: [`0x${lockTimestamp}`] // Add timestamp as cell data
      });
      await lockTx.completeInputsByCapacity(signer!);
      await lockTx.completeFeeBy(signer!, 1000);
      
      const txHash = await signer.sendTransaction(lockTx);
      setLockTxHash(txHash);
      
      // Mark the cell as unusable in the client cache to prevent reuse
      await signer!.client.cache.markUnusable({
        txHash: txHash,
        index: 0,
      });
      
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Lock created! Transaction: ${getExplorerBaseUrl()}/transaction/${txHash}`);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ⏳ Waiting for transaction confirmation...`);
      
      await signer!.client.waitTransaction(txHash);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Lock transaction confirmed`);
      
      // We don't need to check if the cell is "live" - we can proceed directly
      setLockIsLive(true);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Lock cell ready! You can proceed to the final step.`);
    } catch (error: any) {
      console.error("Error creating lock transaction:", error);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Error creating lock: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 3: Final token issuance
  const finalizeTokenIssuance = async () => {
    if (!signer || !sealTxHash || !lockTxHash || !sealIsLive || !lockIsLive || !userScript || !singleUseLock) {
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Please complete both previous steps first and ensure cells are live`);
      return;
    }
    
    if (!amount || !decimals || !symbol) {
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Please fill in all required token details (amount, decimals, symbol)`);
      return;
    }
    
    try {
      setIsProcessing(true);
      setCurrentStep(3);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ℹ️ Creating token (Step 3/4)...`);
      
      // Prepare token data - convert amount based on decimals
      const parsedAmount = parseFloat(amount);
      const parsedDecimals = parseInt(decimals);
      
      // For large numbers, we need to be careful with precision
      // Calculate the amount in base units (amount * 10^decimals)
      // This properly accounts for decimals (e.g., 1000 tokens with 8 decimals = 100,000,000,000 base units)
      const fullAmountStr = Math.floor(parsedAmount * Math.pow(10, parsedDecimals)).toString();
      
      // Check if userScript is null before proceeding
      if (!userScript) {
        throw new Error("User script is not available. Please reconnect your wallet.");
      }
      
      // Use the token issuance function from lib/ckb.ts
      const mintTxHash = await issueToken(
        signer,
        userScript,
        singleUseLock,
        sealTxHash,
        lockTxHash,
        {
          amount: fullAmountStr,
          decimals: parsedDecimals.toString(),
          symbol,
          name: name || symbol
        },
        network
      );
      
      // If tip creator is enabled, send a separate transaction for the tip
      if (tipCreator && tipPercentage > 0) {
        setCurrentStep(4); // Update to step 4 (tipping)
        setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ℹ️ Step 4/4: Sending tip to platform creator (${tipPercentage}% of tokens)...`);
        
        try {
          // Get the tokenTypeHash from the singleUseLock (with careful null checking)
          if (!singleUseLock) {
            throw new Error("Single-use lock script is not available");
          }
          const tokenTypeHash = singleUseLock.hash().slice(2); // Remove '0x' prefix
          
          // Calculate human-readable tip amount for display
          const tipAmountHuman = (parseFloat(amount) * Number(tipPercentage) / 100).toFixed(2);
          
          setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 💰 Preparing to send ${tipAmountHuman} ${symbol} tokens to creator...`);
          
          // Use the simplified direct tip approach
          const tipTxHash = await sendCreatorTip(
            signer,
            tokenTypeHash,
            fullAmountStr,
            Number(tipPercentage),
            network,
            mintTxHash // Pass the mint transaction hash to help with timing
          );
          
          if (!tipTxHash) {
            throw new Error("Tip transaction failed - no transaction hash returned");
          }
          
          // Update UI with success
          setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Tip transaction sent! Transaction: ${getExplorerBaseUrl()}/transaction/${tipTxHash}`);
          setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Thank you for supporting the platform creator!`);
          
          // Show success toast with transaction link
          toast({
            title: "Creator tip sent",
            description: `Successfully sent ${tipAmountHuman} ${symbol} tokens to the creator. Click to view transaction.`,
            variant: network === "mainnet" ? "orange" : "purple",
            action: (
              <a 
                href={`${getExplorerBaseUrl()}/transaction/${tipTxHash}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1 text-sm underline"
              >
                View transaction →
              </a>
            )
          });
          
        } catch (tipError: any) {
          console.error("Error sending creator tip:", tipError);
          
          // Handle user-friendly error message
          const errorMessage = tipError.message || "Unknown error sending tip";
          
          // Some errors are expected and can be shown with more user-friendly messages
          let userFriendlyMessage = errorMessage;
          let actionSuggestion = "";
          
          // Check for specific error types
          if (errorMessage.includes("couldn't find it") || 
              errorMessage.includes("blockchain may need more time") ||
              errorMessage.includes("indexed")) {
            // Indexing issue - token was created but not yet indexed
            userFriendlyMessage = "Your token was created successfully!";
            actionSuggestion = "The network needs time to index your new tokens before they can be sent. You can try tipping again in 5-10 minutes.";
          } else if (errorMessage.includes("canceled") || errorMessage.includes("rejected")) {
            // User canceled the transaction
            userFriendlyMessage = "Tip transaction was canceled.";
            actionSuggestion = "Your token was created successfully, but no tip was sent.";
          } else if (errorMessage.includes("capacity") || errorMessage.includes("enough CKB")) {
            // Not enough CKB
            userFriendlyMessage = "Not enough CKB for the tip transaction.";
            actionSuggestion = "Your token was created successfully, but you need more CKB to send a tip.";
          }
          
          // Update UI with the error
          setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ℹ️ ${userFriendlyMessage}`);
          
          if (actionSuggestion) {
            setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 💡 ${actionSuggestion}`);
          }
          
          // Show a toast with the user-friendly message
          toast({
            title: "Token created successfully",
            description: userFriendlyMessage,
            variant: "orange"
          });
        }
      }
      
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Token issued! Transaction: ${getExplorerBaseUrl()}/transaction/${mintTxHash}`);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ⏳ Waiting for transaction confirmation...`);
      
      await signer!.client.waitTransaction(mintTxHash);
      
      // Sanitize user inputs before displaying them
      const safeName = sanitizeText(name);
      const safeSymbol = sanitizeText(symbol);
      
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Congratulations! Your ${safeSymbol} token is now live on the CKB ${network}!`);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 💡 Your token details:
      - Symbol: ${safeSymbol}
      - Name: ${safeName || safeSymbol}
      - Total Supply: ${parsedAmount}
      - Decimals: ${parsedDecimals}
      - Owner Address: ${walletAddress}
      `);
    } catch (error: any) {
      console.error("Error creating token:", error);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Error creating token: ${error.message}`);
      
      if (error.message && error.message.includes("TransactionFailedToResolve")) {
        setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ⚠️ Transaction resolution error. The cells might not be fully confirmed yet.`);
        setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 💡 Suggestion: Please wait a bit longer and try again. The CKB blockchain needs time to confirm transactions.`);
      }
    } finally {
      setIsProcessing(false);
      setCurrentStep(0);
    }
  };
  
  // Automated one-click token issuance
  const issueTokenAutomated = async () => {
    // Validate inputs
    if (!amount || !decimals || !symbol) {
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Please fill in all required token details (amount, decimals, symbol, name)`);
      return;
    }

    if (!walletConnected) {
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Please connect your JoyID wallet first`);
      return;
    }
    
    // Check if there's already a transaction in progress
    if (processingTransaction) {
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Transaction already in progress. Please wait for it to complete.`);
      return;
    }
    
    // Try to acquire transaction lock
    if (!acquireTransactionLock()) {
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Cannot start a new transaction while another is in progress`);
      return;
    }

    setIsProcessing(true);
    setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 🚀 Starting automated token issuance process...`);

    try {
      // Step 1: Send platform fee FIRST
      setCurrentStep(1);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ℹ️ Step 1/4: Sending platform support fee (300 CKB)...`);
      
      try {
        const feeTransactionHash = await sendPlatformFee(signer!, 300, network);
        setFeeTxHash(feeTransactionHash);
        
        setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Thank you for your support! Transaction: ${getExplorerBaseUrl()}/transaction/${feeTransactionHash}`);
        setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ⏳ Waiting for your support transaction confirmation...`);
        
        await signer!.client.waitTransaction(feeTransactionHash);
        setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Support transaction confirmed`);
      } catch (feeError: any) {
        console.error("Error sending support contribution:", feeError);
        
        // More user-friendly error message
        const userMessage = feeError.message && feeError.message.includes("User Rejected") 
          ? "Fee approval needed. Please try again." 
          : `Fee processing issue: ${feeError.message}`;
        
        setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Platform support fee is required: ${userMessage}`);
        setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] Please try again to create your token.`);
        
        // Show a user-friendly toast
        toast({
          title: "Fee approval required",
          description: "Please approve the fee transaction to continue token creation.",
          variant: network === "mainnet" ? "orange" : "purple"
        });
        
        // Exit early if platform fee fails - this is now required
        setIsProcessing(false);
        setCurrentStep(0);
        return;
      }
      
      // Step 2: Create Seal (previously Step 1)
      setCurrentStep(2);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ℹ️ Step 2/4: Creating seal transaction...`);
      
      // Add timestamp to prevent transaction replay attacks
      const timestamp = Math.floor(Date.now() / 1000).toString(16);
      
      // Check if userScript is null
      if (!userScript) {
        throw new Error("User script is not available. Please reconnect your wallet.");
      }
      
      const susTx = ccc.Transaction.from({ 
        outputs: [{ lock: userScript }],
        outputsData: [`0x${timestamp}`] // Add timestamp as cell data
      });
      await susTx.completeInputsByCapacity(signer!);
      await susTx.completeFeeBy(signer!, 1000);
      
      const sealTxHash = await signer!.sendTransaction(susTx);
      setSealTxHash(sealTxHash);
      
      // Mark the cell as unusable in the client cache to prevent reuse
      await signer!.client.cache.markUnusable({
        txHash: sealTxHash,
        index: 0,
      });
      
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Seal created! Transaction: ${getExplorerBaseUrl()}/transaction/${sealTxHash}`);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ⏳ Waiting for transaction confirmation...`);
      
      await signer!.client.waitTransaction(sealTxHash);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Seal transaction confirmed`);
      setSealIsLive(true);
      
      // Step 3: Create Lock (previously Step 2)
      setCurrentStep(3);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ℹ️ Step 3/4: Creating lock transaction...`);
      
      // Create OutPoint from seal transaction
      const sealOutPoint = ccc.OutPoint.from({ txHash: sealTxHash, index: "0x0" });
      const outPointBytes = sealOutPoint.toBytes();
      
      // Create SingleUseLock with the OutPoint bytes
      const singleLock = await ccc.Script.fromKnownScript(
        signer!.client,
        ccc.KnownScript.SingleUseLock,
        outPointBytes
      );
      setSingleUseLock(singleLock);
      
      // Add timestamp to prevent transaction replay attacks
      const lockTimestamp = Math.floor(Date.now() / 1000).toString(16);
      const lockTx = ccc.Transaction.from({ 
        outputs: [{ lock: singleLock }],
        outputsData: [`0x${lockTimestamp}`] // Add timestamp as cell data
      });
      await lockTx.completeInputsByCapacity(signer!);
      await lockTx.completeFeeBy(signer!, 1000);
      
      const lockTxHash = await signer!.sendTransaction(lockTx);
      setLockTxHash(lockTxHash);
      
      // Mark the cell as unusable in the client cache to prevent reuse
      await signer!.client.cache.markUnusable({
        txHash: lockTxHash,
        index: 0,
      });
      
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Lock created! Transaction: ${getExplorerBaseUrl()}/transaction/${lockTxHash}`);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ⏳ Waiting for transaction confirmation...`);
      
      await signer!.client.waitTransaction(lockTxHash);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Lock transaction confirmed`);
      setLockIsLive(true);
      
      // Step 4: Issue Token (previously Step 3)
      setCurrentStep(4);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ℹ️ Step 4/4: Creating token...`);
      
      // Prepare token data - convert amount based on decimals
      const parsedAmount = parseFloat(amount);
      const parsedDecimals = parseInt(decimals);
      
      // Calculate the amount in base units (amount * 10^decimals)
      // This properly accounts for decimals (e.g., 1000 tokens with 8 decimals = 100,000,000,000 base units)
      const fullAmountStr = Math.floor(parsedAmount * Math.pow(10, parsedDecimals)).toString();
      
      // Check if userScript is null before proceeding
      if (!userScript) {
        throw new Error("User script is not available. Please reconnect your wallet.");
      }
      
      // Use the token issuance function (without the fee and without creator tip) from lib/ckb.ts
      const mintTxHash = await issueToken(
        signer,
        userScript,
        singleLock,
        sealTxHash,
        lockTxHash,
        {
          amount: fullAmountStr,
          decimals: parsedDecimals.toString(),
          symbol,
          name: name || symbol
        },
        network
      );
      
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Token issued! Transaction: ${getExplorerBaseUrl()}/transaction/${mintTxHash}`);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ⏳ Waiting for transaction confirmation...`);
      
      await signer!.client.waitTransaction(mintTxHash);
      
      // Step 5: Send creator tip if enabled
      let tipTxHash = "";
      if (tipCreator && tipPercentage > 0) {
        setCurrentStep(5);
        setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ℹ️ Step 5/5: Sending tip to platform creator (${tipPercentage}% of tokens)...`);
        
        try {
          // Calculate human-readable tip amount for display
          const tipAmountHuman = (parseFloat(amount) * Number(tipPercentage) / 100).toFixed(2);
          
          // Get the creator's address based on network
          const creatorAddress = network === "mainnet" 
            ? "ckb1qrgqep8saj8agswr30pls73hra28ry8jlnlc3ejzh3dl2ju7xxpjxqgqqxgv3c3yxv4z2e5ezw0zpmtqde3vd47uzvu09kfc"
            : "ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqq9qfz8aff6h03swsaj5pkglpjuhvkp2gmswummjn";
            
          // Use the token type hash from the single-use lock directly
          // This is more reliable than trying to extract it from the transaction
          
          // Since singleUseLock might be lost between state updates, we'll recreate it directly
          // from the seal transaction outpoint that we stored earlier
          let tokenTypeHash = "";
          
          try {
            if (singleUseLock) {
              // Use existing singleUseLock if available
              tokenTypeHash = singleUseLock.hash().slice(2);
              setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✓ Using existing single-use lock hash for token type`);
            } else if (sealTxHash) {
              // Recreate the single-use lock script from the seal transaction hash
              setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ⚠️ Single-use lock not found in state, recreating from seal transaction...`);
              const sealOutPoint = ccc.OutPoint.from({ txHash: sealTxHash, index: "0x0" });
              const outPointBytes = sealOutPoint.toBytes();
              
              // Create SingleUseLock with the OutPoint bytes
              const recreatedSingleUseLock = await ccc.Script.fromKnownScript(
                signer!.client,
                ccc.KnownScript.SingleUseLock,
                outPointBytes
              );
              
              tokenTypeHash = recreatedSingleUseLock.hash().slice(2);
              setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✓ Successfully recreated single-use lock for token type`);
            } else {
              throw new Error("Cannot find seal transaction hash to recreate single-use lock");
            }
          } catch (lockError: any) {
            console.error("Error creating single-use lock:", lockError);
            throw new Error(`Failed to get token type hash: ${lockError?.message || "Unknown error"}`);
          }
          
          // Format values for display
          const tokenInfo = {
            name: sanitizeText(name || symbol),
            symbol: sanitizeText(symbol),
            tipAmount: tipAmountHuman,
            tipPercentage: Number(tipPercentage),
            creatorAddress,
            tokenTypeHash,
            explorerUrl: `${getExplorerBaseUrl()}/transaction/${mintTxHash}`
          };

          setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 💰 Creator tip: ${tokenInfo.tipAmount} ${tokenInfo.symbol} tokens (${tokenInfo.tipPercentage}%)`);
          setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 📝 Creator address: ${tokenInfo.creatorAddress}`);
          setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 🔑 Token type hash: ${tokenInfo.tokenTypeHash}`);
          
          // Use the SAME APPROACH as how the platform fee is sent (which works perfectly)
          // But instead of sending CKB, we'll use this successful approach with our newly minted tokens
          setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ⏳ Preparing to send token tip to creator...`);
          
          try {
            // Use the simplified direct tip implementation
            setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 💰 Preparing to send ${tipAmountHuman} ${symbol} tokens to creator...`);
            setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ⏳ Waiting for blockchain indexing - this takes 3-5 minutes...`);
            setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 💡 The blockchain needs time to index your new tokens before they can be transferred.`);
            
            toast({
              title: `Sending token tip`,
              description: `Waiting for blockchain indexing (3-5 min), then you'll need to approve the transfer of ${tipPercentage}% of your tokens.`,
              variant: network === "mainnet" ? "orange" : "purple"
            });
            
            // Use our improved sendCreatorTip function with the same parameters
            tipTxHash = await sendCreatorTip(
              signer,
              tokenTypeHash,
              fullAmountStr,
              Number(tipPercentage),
              network,
              mintTxHash // Pass the mint transaction hash to help with timing
            );
            
            // Show success message
            setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Token tip sent successfully! Transaction: ${getExplorerBaseUrl()}/transaction/${tipTxHash}`);
            setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ⏳ Waiting for tip transaction confirmation...`);
            
            // Wait for transaction confirmation
            await signer!.client.waitTransaction(tipTxHash);
            
            setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Tip transaction confirmed! Thank you for supporting the creator.`);
          } catch (tipError: any) {
            console.error("Token tip error:", tipError);
            
            // Show error
            setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ⚠️ Could not send token tip: ${tipError.message}`);
            setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 📝 Your tokens were created successfully but the tip transaction failed.`);
            setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 💡 This is often due to blockchain indexing delays. You can try again later if you'd like to send a tip.`);
            
            // Still mark the process as complete for the user interface
            tipTxHash = "tip_error_but_tokens_created";
          }
        } catch (tipError: any) {
          console.error("Error preparing creator tip:", tipError);
          setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ⚠️ Could not prepare creator tip: ${tipError.message}`);
          setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 💡 Your token was issued successfully! You can send a tip manually later when your tokens are indexed.`);
        }
      }
      
      // Transaction summary removed as requested
      
      // For text status output
      const txSummary = {
        supportTx: { hash: feeTxHash || '', type: "Platform Support", amount: "300 CKB", network },
        sealTx: { hash: sealTxHash || '', type: "Seal Creation", network },
        lockTx: { hash: lockTxHash || '', type: "Lock Creation", network },
        mintTx: { hash: mintTxHash || '', type: "Token Issuance", network },
        tipTx: tipCreator && tipTxHash && tipTxHash !== "tip_error_but_tokens_created" 
          ? { hash: tipTxHash, type: "Creator Tip", amount: `${(parseFloat(amount) * Number(tipPercentage) / 100).toFixed(2)} ${symbol}`, network }
          : null
      };
      
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 🎉 All done! Your token ${symbol} has been created successfully!`);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 💰 Thank you for using and supporting SITA MINTER!`);
      
      // Add detailed transaction summary to logs
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 📋 Transaction Summary:`);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ------------------------------`);
      Object.values(txSummary).filter(Boolean).forEach(tx => {
        if (tx) {
          const amountInfo = 'amount' in tx && tx.amount ? ` (${tx.amount})` : '';
          setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✓ ${tx.type}: ${getExplorerBaseUrl()}/transaction/${tx.hash}${amountInfo}`);
        }
      });
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ------------------------------`);
      
      // Now also show a nice UI component with the transaction details
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 🖥️ Displaying detailed transaction summary UI...`);
      
      // Token statistics have been removed per user request
      
      // Sanitize user inputs before displaying them
      const safeName = sanitizeText(name);
      const safeSymbol = sanitizeText(symbol);
      
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Congratulations! Your ${safeSymbol} token is now live on the CKB ${network}!`);
      
      // Show a success toast with transaction details
      toast({
        title: `${safeSymbol} Token Created Successfully!`,
        description: `Your token is now live on the CKB ${network}. You can view the issuance transaction on the explorer.`,
        variant: network === "mainnet" ? "orange" : "purple",
        action: (
          <a 
            href={`${getExplorerBaseUrl()}/transaction/${mintTxHash}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-1 text-sm underline"
          >
            View Transaction →
          </a>
        )
      });
      
      // Add tipping details if enabled
      const tipMsg = tipCreator && tipTxHash
        ? `\n      - Creator Tip: ${tipPercentage}% (${parseFloat(amount) * tipPercentage / 100} tokens)`
        : '';
      
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 💡 Your token details:
      - Symbol: ${safeSymbol}
      - Name: ${safeName || safeSymbol}
      - Total Supply: ${amount}
      - Decimals: ${decimals}
      - Owner Address: ${walletAddress}${tipMsg}
      `);
      
      // Transaction summary has been removed
    } catch (error: any) {
      console.error("Error in automated token issuance:", error);
      
      // Create a more user-friendly error message
      let userFriendlyMessage = "An issue occurred during token creation.";
      let detailedMessage = error.message || "Unknown error";
      let suggestion = "Please try again.";
      
      if (error.message) {
        if (error.message.includes("User Rejected")) {
          userFriendlyMessage = "Transaction approval needed.";
          suggestion = "Please approve the transaction to continue.";
        } else if (error.message.includes("TransactionFailedToResolve")) {
          userFriendlyMessage = "Blockchain confirmation delay.";
          suggestion = "Please wait a moment and try again. The CKB blockchain needs time to confirm transactions.";
        } else if (error.message.includes("insufficient capacity")) {
          userFriendlyMessage = "Not enough CKB in your wallet.";
          suggestion = "Please add more CKB to your wallet and try again.";
        }
      }
      
      // Update status with more user-friendly message
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ ${userFriendlyMessage}`);
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 💡 ${suggestion}`);
      
      // Show a toast with the user-friendly message
      toast({
        title: userFriendlyMessage,
        description: suggestion,
        variant: network === "mainnet" ? "orange" : "purple"
      });
      
      // Add the technical details at the end for debugging purposes
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] Technical details: ${detailedMessage}`);
    } finally {
      // Release the transaction lock to allow future transactions
      releaseTransactionLock();
      setIsProcessing(false);
      setCurrentStep(0);
    }
  };

  // Original full token issuance (keeping it for reference)
  const fullIssueTokenProcess = async () => {
    // Enhanced input validation
    if (!amount || !decimals || !symbol) {
      console.log("Token issuance aborted: Missing required fields");
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Please fill in all required fields (amount, decimals, symbol)`);
      return;
    }
    
    // Validate amount (must be a positive number)
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      console.log("Token issuance aborted: Invalid amount");
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Amount must be a positive number`);
      return;
    }
    
    // Validate decimals (must be an integer between 0 and 18)
    const parsedDecimals = parseInt(decimals);
    if (isNaN(parsedDecimals) || parsedDecimals < 0 || parsedDecimals > 18) {
      console.log("Token issuance aborted: Invalid decimals");
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Decimals must be an integer between 0 and 18`);
      return;
    }
    
    // Validate symbol (alphanumeric only, 2-8 characters)
    if (!symbol.match(/^[A-Za-z0-9]{2,8}$/)) {
      console.log("Token issuance aborted: Invalid symbol format");
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Symbol must be 2-8 alphanumeric characters`);
      return;
    }
    
    // Validate name if provided (prevent XSS)
    if (name && !name.match(/^[A-Za-z0-9\s]{1,30}$/)) {
      console.log("Token issuance aborted: Invalid name format");
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Name must be 1-30 alphanumeric characters and spaces`);
      return;
    }

    if (!walletConnected) {
      console.log("Token issuance aborted: Wallet not connected");
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Please connect your wallet first`);
      return;
    }
    
    // Check if there's already a transaction in progress
    if (processingTransaction) {
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Transaction already in progress. Please wait for it to complete.`);
      return;
    }
    
    // Try to acquire transaction lock
    if (!acquireTransactionLock()) {
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Cannot start a new transaction while another is in progress`);
      return;
    }

    console.log("Starting token issuance with values:", { amount, decimals, symbol, name });
    setIsProcessing(true);

    try {
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ℹ️ Starting token issuance process...`);
      console.log("Creating CKB client...");
      const client = new ccc.ClientPublicMainnet({
        url: "https://mainnet.ckb.dev/rpc"
      });
      console.log("CKB client created");
      
      console.log("Creating JoyID signer...");
      const signer = new ccc.JoyId.CkbSigner(
        client,
        "SITA MINTER",
        JOYID_LOGO_URL
      );
      console.log("JoyID signer created");
      
      console.log("Connecting to JoyID wallet...");
      await signer.connect();
      console.log("Connected to JoyID wallet");

      console.log("Getting recommended address...");
      const { script } = await signer.getRecommendedAddressObj();
      console.log("Got script:", script);

      // Step 1: Create Seal
      console.log("Step 1: Creating seal...");
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ℹ️ Creating seal (Step 1/4)...`);
      setCurrentStep(1);
      
      console.log("Creating transaction with outputs...");
      // Add timestamp to prevent transaction replay attacks
      const timestamp = Math.floor(Date.now() / 1000).toString(16);
      console.log("Adding timestamp for replay protection:", timestamp);
      const susTx = ccc.Transaction.from({ 
        outputs: [{ lock: script }],
        outputsData: [`0x${timestamp}`] // Add timestamp as cell data
      });
      
      console.log("Completing inputs by capacity...");
      await susTx.completeInputsByCapacity(signer!);
      
      console.log("Completing fee calculation...");
      await susTx.completeFeeBy(signer!, 1000);
      
      console.log("Sending transaction...");
      const susTxHash = await signer.sendTransaction(susTx);
      console.log("Transaction sent, hash:", susTxHash);
      
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Seal created! Transaction: ${getExplorerBaseUrl()}/transaction/${susTxHash}`);
      
      // Wait for transaction confirmation
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ⏳ Waiting for seal transaction confirmation...`);
      console.log("Waiting for seal transaction to be confirmed...");
      await signer!.client.waitTransaction(susTxHash);
      console.log("Seal transaction confirmed");
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Seal transaction confirmed`);

      // Step 2: Lock Seal
      console.log("Step 2: Locking seal...");
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ℹ️ Locking seal (Step 2/4)...`);
      setCurrentStep(2);
      
      console.log("Creating SingleUseLock script...");
      
      // Create OutPoint object and get bytes separately to ensure it's properly formed
      console.log("Creating OutPoint from seal transaction...");
      const sealOutPoint = ccc.OutPoint.from({ txHash: susTxHash, index: "0x0" });
      console.log("OutPoint created:", sealOutPoint);
      
      const outPointBytes = sealOutPoint.toBytes();
      console.log("OutPoint bytes:", outPointBytes);
      
      // Create SingleUseLock with the OutPoint bytes
      const singleUseLock = await ccc.Script.fromKnownScript(
        signer!.client,
        ccc.KnownScript.SingleUseLock,
        outPointBytes
      );
      console.log("SingleUseLock created:", singleUseLock);
      
      console.log("Creating lock transaction...");
      // Add timestamp to prevent transaction replay attacks
      const lockTimestamp = Math.floor(Date.now() / 1000).toString(16);
      console.log("Adding timestamp for replay protection:", lockTimestamp);
      const lockTx = ccc.Transaction.from({ 
        outputs: [{ lock: singleUseLock }],
        outputsData: [`0x${lockTimestamp}`] // Add timestamp as cell data
      });
      
      console.log("Completing inputs by capacity for lock tx...");
      await lockTx.completeInputsByCapacity(signer!);
      
      console.log("Completing fee calculation for lock tx...");
      await lockTx.completeFeeBy(signer!, 1000);
      
      console.log("Sending lock transaction...");
      const lockTxHash = await signer!.sendTransaction(lockTx);
      console.log("Lock transaction sent, hash:", lockTxHash);
      
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Lock set! Transaction: ${getExplorerBaseUrl()}/transaction/${lockTxHash}`);
      
      // Wait for lock transaction confirmation
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ⏳ Waiting for lock transaction confirmation...`);
      console.log("Waiting for lock transaction to be confirmed...");
      await signer!.client.waitTransaction(lockTxHash);
      console.log("Lock transaction confirmed");
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Lock transaction confirmed`);

      // Step 3: Issue Token
      console.log("Step 3: Issuing token...");
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ℹ️ Issuing token (Step 3/4)...`);
      setCurrentStep(3);
      
      console.log("Creating mint transaction...");
      console.log("Token details:", { amount, decimals, symbol, name });
      
      try {
        // Import SingleUseLock script for the token issuance first
        console.log("Creating SingleUseLock script...");
        const singleUseLock = await ccc.Script.fromKnownScript(
          signer!.client,
          ccc.KnownScript.SingleUseLock,
          outPointBytes
        );
        console.log("Created SingleUseLock script:", singleUseLock);
        
        console.log("Preparing token data...");
        
        // For large numbers, we need to be careful with precision
        // Convert to string first, then manipulate
        const parsedAmount = parseFloat(amount);
        const parsedDecimals = parseInt(decimals);
        
        // Calculate the amount in base units (amount * 10^decimals)
        // This properly accounts for decimals (e.g., 1000 tokens with 8 decimals = 100,000,000,000 base units)
        const fullAmountStr = Math.floor(parsedAmount * Math.pow(10, parsedDecimals)).toString();
        // Convert to BigInt
        const fullAmount = BigInt(fullAmountStr);
        
        console.log(`Creating token with amount: ${parsedAmount}, decimals: ${parsedDecimals}`);
        console.log(`Full amount string: ${fullAmountStr}`);
        console.log(`Full amount as BigInt: ${fullAmount}`);
        
        const tokenData = ccc.numLeToBytes(fullAmount, 16);
        console.log("Token data prepared:", tokenData);
        
        console.log("Preparing token info data...");
        // reuse the same parsedDecimals variable that was already declared
        console.log(`Creating token info with decimals: ${parsedDecimals}, symbol: ${symbol}, name: ${name || symbol}`);
        const tokenInfoData = tokenInfoToBytes(parsedDecimals, symbol, name || symbol);
        console.log("Token info data prepared:", tokenInfoData);
        
        console.log("Creating mint transaction structure...");
        
        // Create OutPoint objects for inputs
        console.log("Creating OutPoint objects for mint transaction inputs...");
        const sealOutPointForMint = ccc.OutPoint.from({ txHash: susTxHash, index: "0x0" });
        console.log("Seal OutPoint for mint:", sealOutPointForMint);
        
        const lockOutPoint = ccc.OutPoint.from({ txHash: lockTxHash, index: "0x0" });
        console.log("Lock OutPoint:", lockOutPoint);
        
        // Validate and wait for cells to be live and available before using them
        try {
          console.log("Waiting for seal cell to become available...");
          setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ⏳ Waiting for seal cell to become available (may take up to 30 seconds)...`);
          // Mark the cell as unusable in the client cache to prevent reuse
          signer!.client.cache.markUnusable({
            txHash: susTxHash,
            index: 0,
          });
          setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Seal cell is now confirmed and available`);
          
          console.log("Waiting for lock cell to become available...");
          setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ⏳ Waiting for lock cell to become available (may take up to 30 seconds)...`);
          // Mark the cell as unusable in the client cache to prevent reuse
          signer!.client.cache.markUnusable({
            txHash: lockTxHash,
            index: 0,
          });
          setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Lock cell is now confirmed and available`);
        } catch (error: any) {
          const errorMsg = `Cell verification error: ${error.message}. Please try again later as the blockchain may need more time to confirm transactions.`;
          console.error(errorMsg);
          setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ ${errorMsg}`);
          setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 💡 Hint: You can try again in a few minutes when blockchain confirmations have settled.`);
          throw new Error("Cell verification failed. Please try again later.");
        }
        
        // We've already created the SingleUseLock script above
        
        // Use the issueToken function from ckb.ts which now does token issuance only (fee is separate)
        console.log("Issuing token...");
        setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 💰 Thank you for using SITA MINTER! Your support is greatly appreciated.`);
        
        const tokenOptions = {
          amount: fullAmountStr,
          decimals: parsedDecimals.toString(),
          symbol: symbol,
          name: name || symbol
        };
        
        console.log("Token options:", tokenOptions);
        console.log("Using seal tx hash:", susTxHash);
        console.log("Using lock tx hash:", lockTxHash);
        
        // Check if script is null before proceeding
        if (!script) {
          throw new Error("Lock script is not available. Please reconnect your wallet.");
        }
        
        // Using the issueToken function to create the token (fee is collected separately)
        const mintTxHash = await issueToken(
          signer,
          script,
          singleUseLock,
          susTxHash,
          lockTxHash,
          tokenOptions,
          network
        );
        console.log("Mint transaction sent, hash:", mintTxHash);
        
        setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Token issued! Transaction: ${getExplorerBaseUrl()}/transaction/${mintTxHash}`);

        console.log("Waiting for transaction confirmation...");
        await signer!.client.waitTransaction(mintTxHash);
        console.log("Transaction confirmed");
        
        // Sanitize symbol before displaying
        const safeSymbol = sanitizeText(symbol);
        setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ✅ Congratulations! Your ${safeSymbol} token is now live on the CKB ${network}!`);
      } catch (mintError: any) {
        // Standardize the error for mint transaction specifically
        const standardError = handleError(mintError);
        
        setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Error during token minting: ${standardError.message}`);
        
        // Add suggestion if available
        if (standardError.suggestion) {
          setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 💡 ${standardError.suggestion}`);
        }
        
        throw mintError; // Rethrow to be caught by the outer catch block
      }
    } catch (e: any) {
      // Standardize the error
      const standardError = handleError(e);
      
      // Display error to user with standardized message
      setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ❌ Error: ${standardError.message}`);
      
      // Add suggestion if available
      if (standardError.suggestion) {
        setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] 💡 Suggestion: ${standardError.suggestion}`);
      }
      
      // In development mode, add more details
      if (process.env.NODE_ENV === 'development') {
        setStatus((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] Debug Details: ${JSON.stringify(standardError, null, 2)}`);
      }
      
      // Specific behavior based on error type
      switch (standardError.type) {
        case ErrorType.INSUFFICIENT_FUNDS:
          toast({
            title: "Insufficient Funds",
            description: "You don't have enough CKB in your wallet to complete this transaction.",
            variant: "destructive"
          });
          break;
          
        case ErrorType.WALLET_CONNECTION_ERROR:
          toast({
            title: "Wallet Disconnected",
            description: "Your wallet disconnected during the transaction. Please reconnect and try again.",
            variant: "destructive"
          });
          break;
          
        case ErrorType.TRANSACTION_REJECTED:
          toast({
            title: "Transaction Rejected",
            description: "You rejected the transaction in your wallet.",
            variant: "destructive"
          });
          break;
          
        case ErrorType.NETWORK_ERROR:
          toast({
            title: "Network Mismatch",
            description: "Please make sure your wallet is connected to the same network as the application.",
            variant: "destructive"
          });
          break;
      }
    } finally {
      console.log("Token issuance process finished");
      // Release the transaction lock to allow future transactions
      releaseTransactionLock();
      setIsProcessing(false);
      setCurrentStep(0);
    }
  };

  // Helper to get explorer URL base based on network
  const getExplorerBaseUrl = () => {
    return network === "mainnet" ? "https://explorer.nervos.org" : "https://explorer.nervos.org/aggron";
  };
  
  const renderStepIndicator = (step: number, currentState: number) => {
    const activeColor = network === "mainnet" ? "bg-orange-400" : "bg-purple-400";
    
    if (currentState === 0) {
      return (
        <span className="absolute flex items-center justify-center w-8 h-8 bg-neutral-100 rounded-full -left-4 ring-4 ring-white">
          <span className="text-neutral-500 font-medium">{step}</span>
        </span>
      );
    } else if (currentState === step) {
      return (
        <span className={`absolute flex items-center justify-center w-8 h-8 ${activeColor} rounded-full -left-4 ring-4 ring-white`}>
          <Hourglass className="w-4 h-4 text-white" />
        </span>
      );
    } else if (currentState > step) {
      return (
        <span className={`absolute flex items-center justify-center w-8 h-8 ${activeColor} rounded-full -left-4 ring-4 ring-white`}>
          <Check className="w-4 h-4 text-white" />
        </span>
      );
    } else {
      return (
        <span className="absolute flex items-center justify-center w-8 h-8 bg-neutral-100 rounded-full -left-4 ring-4 ring-white">
          <span className="text-neutral-500 font-medium">{step}</span>
        </span>
      );
    }
  };

  // Create a type-safe wrapper function for the WelcomeDialog component
  const tDialog = (key: string): string => {
    // Default to English if the selected language doesn't have the translation
    // or if the key doesn't exist
    const lang = translations[language as keyof typeof translations] || translations.en;
    return (lang as any)[key] || translations.en[key as keyof typeof translations.en] || key;
  };
  
  // State for controlling welcome dialog when manually opened from help button
  // Initial state is false - the WelcomeDialog will handle first-time visitor detection internally
  const [welcomeDialogOpen, setWelcomeDialogOpen] = useState(false);
  
  // Helper translation for dialog
  const getHelpTranslation = (language: string) => {
    const helpTexts: Record<string, string> = {
      en: "Help & About",
      zh: "帮助和关于",
      es: "Ayuda y Acerca de",
      pt: "Ajuda e Sobre",
      fr: "Aide et À Propos",
      it: "Aiuto e Informazioni"
    };
    return helpTexts[language] || helpTexts.en;
  };
  
  return (
    <div className="bg-neutral-50 font-sans text-neutral-800 min-h-screen relative flex flex-col">
      {/* Welcome dialog that shows on first visit (auto) or when button is clicked */}
      <WelcomeDialog 
        language={language} 
        translations={translations} 
        t={tDialog} 
        network={network}
        isOpen={welcomeDialogOpen}
        setIsOpen={setWelcomeDialogOpen}
      />
      
      {/* Testnet watermark that only shows in testnet mode */}
      {network === "testnet" && (
        <div className="absolute inset-0" style={{ zIndex: 0, pointerEvents: 'none' }}>
          <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pt-6 h-full">
            <div className="grid grid-cols-3 grid-rows-3 gap-4 h-full">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="flex items-center justify-center">
                  <span className="text-gray-200 opacity-40 font-bold text-7xl transform -rotate-12 select-none">TEST</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Fixed Header - Black background */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-neutral-800 shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-row items-center justify-between h-20">
            <div className="flex items-center">
              <img src={LogoImage} alt="SITA MINTER Logo" className="h-16" />
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Language Dropdown */}
              <div className="relative">
                <select 
                  className="bg-neutral-800 text-white text-sm rounded-lg border border-neutral-700 px-3 py-1.5 appearance-none cursor-pointer focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  value={language}
                  onChange={(e) => {
                    const newLanguage = e.target.value;
                    setLanguage(newLanguage);
                    localStorage.setItem('sitaminter_language', newLanguage);
                    // Dispara evento personalizado para atualizar outros componentes
                    const event = new CustomEvent('language-change', { 
                      detail: { language: newLanguage } 
                    });
                    window.dispatchEvent(event);
                  }}
                  aria-label="Select language"
                >
                  {languages.map((lang) => (
                    <option 
                      key={lang.code} 
                      value={lang.code}
                    >
                      {lang.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {/* Wallet Connection Section in fixed header */}
              <WalletConnector 
                size="sm"
                translations={{
                  connect: t('connect'),
                  connecting: t('connecting'),
                  disconnect: t('disconnect'),
                  walletConnectedTo: t('walletConnectedTo'),
                  testnetText: t('testnetText'),
                  mainnetText: t('mainnetText'),
                }}
              />
            </div>
          </div>
        </div>
      </header>
      
      {/* Spacer to push content down by header height */}
      <div className="h-20"></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 w-full box-border">
        {/* Spotlight Section - Banner after header */}
        <div className="mb-8">
          <div className={`w-full rounded-xl overflow-hidden shadow-lg bg-orange-500`}>
            <div className="py-2 px-4 flex flex-col items-center justify-center relative">
              <div className="flex flex-col items-center w-full">
                <div className="relative w-full flex justify-center">
                  <img 
                    src={BtcfiUnleashedBanner} 
                    alt="BTCFI UNLEASHED - Powered by Nervos Network" 
                    className="h-auto max-h-20 md:max-h-24 w-auto mx-auto"
                  />
                  {/* RGB++ Badge positioned on top right of the banner image */}
                  <div className="absolute top-0 right-1 rounded-full bg-white px-2 py-0.5 border-2 border-white flex items-center" style={{ fontSize: '0.65rem' }}>
                    <span className="font-bold mr-px text-red-600">R</span>
                    <span className="font-bold mr-px text-green-600">G</span>
                    <span className="font-bold mr-px text-blue-600">B</span>
                    <span className="font-bold text-black">++</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    // Create and dispatch a custom event to open the FAQBot
                    const openFAQBotEvent = new CustomEvent('open-faqbot');
                    window.dispatchEvent(openFAQBotEvent);
                  }}
                  className="mt-2 px-4 py-1 bg-white text-orange-600 hover:bg-gray-100 transition-colors duration-200 ease-in-out rounded-md font-medium text-sm shadow-sm"
                >
                  {language === 'en' ? 'Learn More' : 
                   language === 'zh' ? '了解更多' :
                   language === 'es' ? 'Saber más' :
                   language === 'pt' ? 'Saiba Mais' :
                   language === 'fr' ? 'En Savoir Plus' :
                   language === 'it' ? 'Scopri di Più' : 'Learn More'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 w-full">
          {/* Main Form Section */}
          <div className={`lg:col-span-3 ${network === "mainnet" ? "bg-orange-50" : "bg-purple-50"} rounded-xl shadow-sm border ${network === "mainnet" ? "border-orange-200" : "border-purple-200"} overflow-hidden`}>
            <div className={`p-6 pb-4 border-b ${network === "mainnet" ? "border-orange-200 bg-gradient-to-r from-orange-100 to-orange-50" : "border-purple-200 bg-gradient-to-r from-purple-100 to-purple-50"}`}>
              <h2 className={`text-xl font-bold ${network === "mainnet" ? "text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600" : "text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600"}`}>
                {translations[language as keyof typeof translations]?.createToken || translations.en.createToken}
              </h2>
            </div>
            
            <form className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Symbol Field */}
              <div>
                <label htmlFor="symbol" className="block text-sm font-medium text-neutral-900 mb-1">{t('symbolLabel')}</label>
                <div className="relative">
                  <input 
                    id="symbol"
                    type="text" 
                    placeholder={t('symbolPlaceholder')} 
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors uppercase"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-400">
                    <Tag className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-1 text-sm text-neutral-500">{t('symbolHelp')}</p>
              </div>
              
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-900 mb-1">{t('nameLabel')}</label>
                <div className="relative">
                  <input 
                    id="name"
                    type="text" 
                    placeholder={t('namePlaceholder')} 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
                <p className="mt-1 text-sm text-neutral-500">{t('nameHelp')}</p>
              </div>
              
              {/* Amount Field */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-neutral-900 mb-1">{t('amountLabel')}</label>
                <div className="relative">
                  <input 
                    id="amount"
                    type="text" 
                    placeholder={t('amountPlaceholder')} 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-400 text-sm">
                    {t('tokensText')}
                  </div>
                </div>
                {amount && !isNaN(parseFloat(amount)) && (
                  <div className={`mt-1 text-sm font-medium ${network === "mainnet" ? "text-orange-600 bg-orange-50 border-orange-100" : "text-purple-600 bg-purple-50 border-purple-100"} border px-3 py-1.5 rounded-md inline-block shadow-sm`}>
                    <span className={`inline-block mr-2 ${network === "mainnet" ? "text-orange-500" : "text-purple-500"}`}>✓</span>
                    {numberToWords(parseFloat(amount))}
                  </div>
                )}
                <p className="mt-1 text-sm text-neutral-500">{t('amountHelp')}</p>
              </div>
              
              {/* Decimals Field */}
              <div>
                <label htmlFor="decimals" className="block text-sm font-medium text-neutral-900 mb-1">{t('decimalsLabel')}</label>
                <div className="relative">
                  <input 
                    id="decimals"
                    type="text" 
                    placeholder={t('decimalsPlaceholder')} 
                    value={decimals}
                    onChange={(e) => setDecimals(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
                <p className="mt-1 text-sm text-neutral-500">{t('decimalsHelp')}</p>
              </div>
              
              {/* Creator Tip Options */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="tipCreator" className="text-sm font-medium text-neutral-900 flex items-center">
                    <Heart className="h-4 w-4 mr-1" />
                    {t('tipCreatorLabel')}
                  </label>
                  <div 
                    className="relative cursor-pointer"
                    onClick={() => setTipCreator(!tipCreator)}
                  >
                    <div 
                      className={`w-12 h-6 transition-colors duration-200 ease-in-out rounded-full ${
                        tipCreator 
                          ? (network === "mainnet" ? 'bg-orange-500' : 'bg-purple-500')
                          : 'bg-neutral-300'
                      }`}
                    >
                      <div 
                        className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transform transition-transform duration-200 ease-in-out ${
                          tipCreator ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
                {tipCreator && (
                  <div className="mt-2">
                    <label className="block text-xs text-neutral-700 mb-1">{t('tipPercentageLabel')} ({tipPercentage}%)</label>
                    <input
                      type="range"
                      min="1"
                      max="25"
                      step="1"
                      value={tipPercentage}
                      onChange={(e) => setTipPercentage(parseInt(e.target.value))}
                      className={`w-full h-2 ${
                        network === "mainnet" ? "bg-orange-100" : "bg-purple-100"
                      } rounded-lg appearance-none cursor-pointer`}
                    />
                    <div className="flex justify-between text-xs text-neutral-500 mt-1">
                      <span>1%</span>
                      <span className="hidden sm:inline">5%</span>
                      <span>10%</span>
                      <span className="hidden sm:inline">15%</span>
                      <span>20%</span>
                      <span>25%</span>
                    </div>
                    
                    {/* Tip calculation info */}
                    <p className="mt-2 text-xs text-neutral-800 bg-yellow-50 border border-yellow-200 rounded-md p-2">
                      <AlertCircle className="h-3 w-3 text-yellow-600 inline align-middle mr-1" />
                      {amount ? (
                        <>{t('keepTokens')} {100 - tipPercentage}% ({parseFloat(amount) * (100 - tipPercentage) / 100} tokens) {t('andTip')} {tipPercentage}% ({parseFloat(amount) * tipPercentage / 100} tokens)</>
                      ) : (
                        <>{t('enterTokenAmount')}</>
                      )}
                    </p>
                    
                    {/* Transaction fees info button - REMOVED */}
                  </div>
                )}
              </div>
              
              {/* Token Issuance Buttons */}
              <div className="pt-4 space-y-3">
                
                {/* 1-click Create Label */}
                <div className="text-sm font-semibold text-left text-neutral-800">
                  1-click Create
                </div>
                
                {/* Automated One-Click Issuance */}
                <button 
                  type="button" 
                  onClick={() => {
                    if (!walletConnected) {
                      toast({
                        title: "Wallet not connected",
                        description: "Please connect your JoyID wallet first.",
                        variant: network === "mainnet" ? "orange" : "purple"
                      });
                      return;
                    }
                    
                    if (!amount || !decimals || !symbol || !name) {
                      toast({
                        title: "Missing information",
                        description: "Please fill in all token details (name, symbol, amount, and decimals).",
                        variant: network === "mainnet" ? "orange" : "purple"
                      });
                      return;
                    }
                    
                    // Validate decimals (must be a non-negative integer between 0 and 18)
                    const parsedDecimals = parseInt(decimals);
                    if (isNaN(parsedDecimals) || parsedDecimals < 0 || parsedDecimals > 18) {
                      toast({
                        title: "Invalid decimals",
                        description: "Decimals must be a non-negative integer between 0 and 18.",
                        variant: network === "mainnet" ? "orange" : "purple"
                      });
                      return;
                    }
                    
                    // Validate symbol (must be 1-8 alphanumeric characters)
                    if (symbol.length < 1 || symbol.length > 8 || !/^[A-Z0-9]+$/.test(symbol)) {
                      toast({
                        title: "Invalid symbol",
                        description: "Symbol must be 1-8 uppercase alphanumeric characters.",
                        variant: network === "mainnet" ? "orange" : "purple"
                      });
                      return;
                    }
                    
                    // Validate amount (must be a positive number within reasonable limits)
                    const parsedAmount = parseFloat(amount);
                    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 1e18) {
                      toast({
                        title: "Invalid amount",
                        description: "Amount must be a positive number within reasonable limits (0 - 10^18).",
                        variant: network === "mainnet" ? "orange" : "purple"
                      });
                      return;
                    }
                    
                    // Validate name (must be reasonable length and characters)
                    if (name.length > 64) {
                      toast({
                        title: "Invalid name",
                        description: "Token name must be less than 64 characters.",
                        variant: network === "mainnet" ? "orange" : "purple"
                      });
                      return;
                    }
                    
                    issueTokenAutomated();
                  }}
                  disabled={isProcessing}
                  className={`w-full flex items-center justify-center px-4 py-4 border-2 border-white outline outline-2 outline-white ${
                    isProcessing
                      ? 'bg-neutral-200 text-neutral-500 border-neutral-300 outline-neutral-200 cursor-not-allowed' 
                      : network === "mainnet" 
                        ? 'bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 text-white hover:shadow-lg hover:shadow-orange-200/50 hover:scale-[1.01]'
                        : 'bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-purple-200/50 hover:scale-[1.01]'
                  } font-medium rounded-lg transition-all shadow-md focus:outline-none focus:ring-2 ${network === "mainnet" ? "focus:ring-orange-400" : "focus:ring-purple-400"} focus:ring-offset-2`}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('creatingToken')} (Step {currentStep}/{tipCreator ? 5 : 4})...
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-1">
                      <Rocket className="w-6 h-6 mr-2" />
                      <span className="text-xl font-medium">{t('createTokenButton')}</span>
                    </div>
                  )}
                </button>
                <p className="mt-2 text-xs text-neutral-800 bg-yellow-50 border border-yellow-200 rounded-md p-2">
                  <AlertCircle className="h-3 w-3 text-yellow-600 inline align-middle mr-1" />
                  {t('signTransactions').replace('{steps}', tipCreator ? '5' : '4').replace('{tip}', tipCreator ? ', and creator tip' : '')}
                </p>
                
                {/* Detailed Fee Breakdown */}
                <details id="detailed-fee-breakdown" className="mt-2 text-xs border border-neutral-200 rounded-md">
                  <summary className="p-2 font-medium cursor-pointer hover:bg-neutral-50">
                    {t('viewFeeBreakdown')}
                  </summary>
                  <div className="p-3 pt-2 border-t border-neutral-200 bg-neutral-50">
                    <h4 className="font-semibold mb-2">{t('tokenCreationCosts')}</h4>
                    <ul className="space-y-2 pl-2">
                      <li className="flex justify-between">
                        <span>{t('platformSupportFee')}</span>
                        <span className="font-medium">300 CKB</span>
                      </li>
                      <li className="flex justify-between">
                        <span>{t('networkFees')}</span>
                        <span className="font-medium">~0.001 CKB</span>
                      </li>
                      <li className="border-t border-neutral-200 pt-1 flex justify-between">
                        <span className="font-medium">{t('totalBasicCost')}</span>
                        <span className="font-medium">~300 CKB</span>
                      </li>
                      <li className="flex justify-between text-xs text-neutral-600 pt-1">
                        <span>{t('approximateUsdValue')}</span>
                        <span>${(300 * parseFloat(ckbPrice.toString())).toFixed(2)}</span>
                      </li>
                    </ul>
                    
                    {tipCreator && (
                      <>
                        <h4 className="font-semibold mt-4 mb-2">{t('additionalTippingCosts')}</h4>
                        <ul className="space-y-2 pl-2">
                          <li className="flex justify-between">
                            <span>{t('tippingCellCapacity')}</span>
                            <span className="font-medium">144 CKB</span>
                          </li>
                          <li className="flex justify-between">
                            <span>{t('networkFees')}</span>
                            <span className="font-medium">~0.001 CKB</span>
                          </li>
                          <li className="border-t border-neutral-200 pt-1 flex justify-between">
                            <span className="font-medium">{t('totalTippingCost')}</span>
                            <span className="font-medium">~144 CKB</span>
                          </li>
                          <li className="flex justify-between text-xs text-neutral-600 pt-1">
                            <span>{t('approximateUsdValue')}</span>
                            <span>${(144 * parseFloat(ckbPrice.toString())).toFixed(2)}</span>
                          </li>
                          <li className="flex justify-between text-primary-700 mt-3 pt-2 border-t border-neutral-200">
                            <span className="font-medium">{t('tokenAmountToCreator')}</span>
                            <span className="font-medium">{amount && !isNaN(parseFloat(amount)) ? (parseFloat(amount) * tipPercentage / 100).toFixed(2) : '?'} {t('tokensText')} ({tipPercentage}%)</span>
                          </li>
                        </ul>
                      </>
                    )}
                    
                    <p className="mt-4 text-xs text-neutral-600 bg-neutral-100 p-2 rounded-md">
                      <span className="font-medium">{t('currentCkbPrice')}</span> 1 CKB ≈ ${parseFloat(ckbPrice.toString()).toFixed(4)} USD
                      <span className="block mt-1 text-xs opacity-75">
                        {priceStatus === 'loading' && `(${t('loadingPrice')})`}
                        {priceStatus === 'success' && priceLastUpdated && `(${t('priceUpdated')} ${priceLastUpdated.toLocaleTimeString()})`}
                        {priceStatus === 'error' && `(${t('estimatedPrice')})`}
                      </span>
                    </p>
                    
                    <p className="mt-2 text-xs text-neutral-600 pt-2">
                      <AlertCircle className="h-3 w-3 text-yellow-600 inline align-middle mr-1" />
                      <span className="font-medium">{t('note')}</span> {t('infoNote')}
                    </p>
                  </div>
                </details>
              </div>
            </form>
          </div>

          {/* Status and Info Section */}
          <div className="lg:col-span-2 flex flex-col">

            {/* Token Creation Process */}
            <div className={`${network === "mainnet" ? "bg-orange-50" : "bg-purple-50"} rounded-xl shadow-sm border ${network === "mainnet" ? "border-orange-200" : "border-purple-200"} mb-4 overflow-hidden`}>
              <div className={`p-4 flex items-center justify-between border-b ${network === "mainnet" ? "border-orange-200" : "border-purple-200"}`}>
                <h3 className="text-sm font-medium text-neutral-900">{t('tokenCreationProcess')}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isProcessing 
                    ? 'bg-warning-500 bg-opacity-10 text-warning-600' 
                    : lockIsLive && sealIsLive 
                      ? 'bg-success-500 bg-opacity-10 text-success-600'
                      : 'bg-neutral-100 text-neutral-800'
                }`}>
                  <span className={`w-2 h-2 mr-1.5 rounded-full ${
                    isProcessing 
                      ? 'bg-warning-500' 
                      : lockIsLive && sealIsLive 
                        ? 'bg-success-500'
                        : 'bg-neutral-400'
                  }`}></span>
                  {isProcessing 
                    ? t('processing')
                    : lockIsLive && sealIsLive 
                      ? t('readyForTokenCreation')
                      : t('waitingForSetup')}
                </span>
              </div>
              
              <div className="p-4">
                <div className="relative">
                  {/* Steps progress */}
                  <ol className={`relative border-l ${network === "mainnet" ? "border-orange-200" : "border-purple-200"} ml-3`}>
                    {/* Step 1 */}
                    <li className="mb-6 ml-6">
                      {renderStepIndicator(1, currentStep)}
                      <h3 className="flex items-center mb-1 text-sm font-semibold text-neutral-900">
                        {t('createSeal')}
                        {sealIsLive && <span className="bg-success-100 text-success-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded ml-2">{t('complete')}</span>}
                      </h3>
                      <p className="text-xs text-neutral-600">
                        {sealIsLive 
                          ? t('sealComplete')
                          : t('sealDescription')}
                      </p>
                      {sealTxHash && (
                        <a 
                          href={`${network === "mainnet" ? "https://explorer.nervos.org" : "https://explorer.nervos.org/aggron"}/transaction/${sealTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs font-medium text-primary-600 hover:underline mt-1"
                        >
                          {t('viewTransaction')}
                          <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
                          </svg>
                        </a>
                      )}
                    </li>
                    
                    {/* Step 2 */}
                    <li className="mb-6 ml-6">
                      {renderStepIndicator(2, currentStep)}
                      <h3 className="flex items-center mb-1 text-sm font-semibold text-neutral-900">
                        {t('createLock')}
                        {lockIsLive && <span className="bg-success-100 text-success-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded ml-2">{t('complete')}</span>}
                      </h3>
                      <p className="text-xs text-neutral-600">
                        {lockIsLive 
                          ? t('lockComplete')
                          : t('lockDescription')}
                      </p>
                      {lockTxHash && (
                        <a 
                          href={`${network === "mainnet" ? "https://explorer.nervos.org" : "https://explorer.nervos.org/aggron"}/transaction/${lockTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs font-medium text-primary-600 hover:underline mt-1"
                        >
                          {t('viewTransaction')}
                          <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
                          </svg>
                        </a>
                      )}
                    </li>
                    
                    {/* Step 3 */}
                    <li className={tipCreator ? "mb-6 ml-6" : "ml-6"}>
                      {renderStepIndicator(3, currentStep)}
                      <h3 className="flex items-center mb-1 text-sm font-semibold text-neutral-900">
                        {t('issueToken')}
                      </h3>
                      <p className="text-xs text-neutral-600">
                        {t('issueDescription')}
                      </p>
                    </li>
                    
                    {/* Step 4 (Creator Tip) - Only shown if tip is enabled */}
                    {tipCreator && (
                      <li className="ml-6">
                        {renderStepIndicator(4, currentStep)}
                        <h3 className="flex items-center mb-1 text-sm font-semibold text-neutral-900">
                          {t('creatorTip')}
                        </h3>
                        <p className="text-xs text-neutral-600">
                          {t('tipDescription').replace('{percent}', tipPercentage.toString())}
                        </p>
                      </li>
                    )}
                  </ol>
                </div>
              </div>
            </div>
            
            {/* Transaction Status - Collapsed by default */}
            <div className={`${network === "mainnet" ? "bg-orange-50" : "bg-purple-50"} rounded-xl shadow-sm border ${network === "mainnet" ? "border-orange-200" : "border-purple-200"} flex-grow overflow-hidden`}>
              {/* Always visible progress bar when processing */}
              {isProcessing && (
                <div className="px-4 pt-4">
                  <div className="space-y-2">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${network === "mainnet" ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 'bg-gradient-to-r from-purple-400 to-purple-500'}`} 
                        style={{ width: `${(currentStep / (tipCreator ? 5 : 4)) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-center text-gray-600">Step {currentStep} of {tipCreator ? 5 : 4}: {
                      currentStep === 1 ? t('processingPlatformFee') :
                      currentStep === 2 ? t('creatingSealTransaction') :
                      currentStep === 3 ? t('creatingLockTransaction') :
                      currentStep === 4 ? t('finalizingTokenCreation') :
                      currentStep === 5 ? t('processingCreatorTip') : ""
                    }</p>
                  </div>
                </div>
              )}
              <details 
                className="w-full" 
                open={logsExpanded}
                onToggle={(e) => setLogsExpanded((e.target as HTMLDetailsElement).open)}
              >
                <summary className={`p-4 border-b ${network === "mainnet" ? "border-orange-200" : "border-purple-200"} flex justify-between items-center cursor-pointer hover:bg-gray-50`}>
                  <h3 className="text-sm font-medium text-neutral-900">
                    {t('transactionDetails')}
                  </h3>
                  <div className="flex items-center">
                    {isProcessing && (
                      <div className="flex items-center text-sm text-purple-600 mr-2">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('processingText')}
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className="text-xs text-neutral-600 mr-2">{logsExpanded ? t('collapseText') : t('expandText')}</span>
                      <div 
                        className={`relative w-10 h-5 transition-colors duration-200 ease-in-out rounded-full ${
                          logsExpanded 
                            ? network === "mainnet" 
                              ? 'bg-orange-500' 
                              : 'bg-purple-500' 
                            : 'bg-neutral-300'
                        }`}
                      >
                        <div 
                          className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transform transition-transform duration-200 ease-in-out ${
                            logsExpanded ? 'translate-x-5' : 'translate-x-0'
                          }`} 
                        />
                      </div>
                    </div>
                  </div>
                </summary>
                
                {/* Status content (only shown when expanded) */}
                <div className="p-4 h-full">
                  {isProcessing ? (
                    <div>
                      {/* Logs */}
                      <h4 className="text-sm font-medium text-neutral-900 mb-2">{t('transactionLogs')}</h4>
                      <pre className="bg-neutral-50 text-xs text-neutral-700 p-3 rounded-lg h-40 overflow-auto border border-neutral-200 font-mono whitespace-pre-wrap">
                        {status}
                      </pre>
                    </div>
                  ) : (
                    <div>
                      <pre className="bg-neutral-50 text-sm text-neutral-700 p-3 rounded-lg h-52 overflow-auto border border-neutral-200 font-mono whitespace-pre-wrap">
                        {status}
                      </pre>
                      {/* Privacy Note */}
                      <p className="mt-3 text-xs text-neutral-800 bg-yellow-50 border border-yellow-200 rounded-md p-2">
                        <AlertCircle className="h-3 w-3 text-yellow-600 inline align-middle mr-1" />
                        <span className="font-medium">{t('privacyNote')}</span> {t('privacyNoteText')}
                      </p>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Black Footer */}
        <footer className="mt-8 bg-black text-white border-t border-neutral-800 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Network Toggle in Footer */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <div className="text-center mb-4 md:mb-0">
                <p className="font-medium mb-1">{t('networkSelection')}</p>
                <div className="flex items-center space-x-3">
                  <span className={`text-sm font-medium ${network === "mainnet" ? "text-orange-400" : "text-neutral-400"}`}>{t('mainnet')}</span>
                  
                  <div 
                    className="relative cursor-pointer"
                    onClick={() => {
                      // Use the network validation function to safely switch networks
                      const validationResult = safeNetworkSwitch(network as NetworkType, walletConnected);
                      
                      if (!validationResult.success) {
                        toast({ 
                          title: "Network Switch Blocked", 
                          description: validationResult.error?.message || "Cannot switch networks at this time.",
                          variant: "destructive" 
                        });
                        return;
                      }
                      
                      // If validation passed, update the network state (safeNetworkSwitch already updated localStorage)
                      if (validationResult.newNetwork) {
                        setNetwork(validationResult.newNetwork);
                      }
                    }}
                  >
                    <div 
                      className={`w-14 h-7 transition-colors duration-200 ease-in-out rounded-full ${
                        network === "mainnet" 
                          ? 'bg-orange-500' 
                          : 'bg-purple-500'
                      }`}
                    ></div>
                    <div 
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full transform transition-transform duration-200 ease-in-out ${
                        network === "mainnet" ? 'left-1' : 'left-8'
                      }`} 
                    ></div>
                  </div>
                  
                  <span className={`text-sm font-medium ${network === "testnet" ? "text-purple-400" : "text-neutral-400"}`}>{t('testnet')}</span>
                </div>
              </div>
              
              {/* Network-specific guidance notes */}
              <div className="text-center">
                {network === "testnet" ? (
                  <div className="text-xs p-2 bg-neutral-800 text-white rounded inline-block border-2 border-white shadow-md">
                    <AlertCircle className="h-3 w-3 text-yellow-600 inline align-middle mr-1" />
                    <span dangerouslySetInnerHTML={{ __html: t('testnetInfo').replace('<span>', '<span class="font-semibold">') }} /> <a href="https://faucet.nervos.org/" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">{t('testnetFaucet')}</a>.
                  </div>
                ) : (
                  <div className="text-xs p-2 bg-neutral-800 text-white rounded inline-block border-2 border-white shadow-md">
                    <AlertCircle className="h-3 w-3 text-yellow-600 inline align-middle mr-1" />
                    {t('mainnetWarning')}
                  </div>
                )}
              </div>
            </div>
            
            {/* Divider */}
            <div className="border-t border-neutral-800 my-4"></div>
            
            {/* Footer Links and Copyright */}
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-neutral-400 text-sm mb-4 md:mb-0">SITA MINTER by LusocryptoLabs © - 2023-2025</p>
              <div className="flex justify-center space-x-6 items-center">
                <button 
                  onClick={() => setWelcomeDialogOpen(true)}
                  className={`text-neutral-400 hover:text-white transition-colors flex items-center space-x-1`}
                >
                  <Info className="w-5 h-5" />
                  <span className="text-sm ml-1">{getHelpTranslation(language)}</span>
                </button>
                <a 
                  href="https://t.me/telmotalks" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
                <a 
                  href="https://x.com/tecmeup?t=F8ZYPNZuJkxOIxpLXLcw3A&s=09" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
