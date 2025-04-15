import { useState } from "react";
import { ExternalLink } from "lucide-react";
import TermsDialog from "./TermsDialog";

interface FooterProps {
  language: string;
  network?: "mainnet" | "testnet";
}

export default function Footer({ language, network = "testnet" }: FooterProps) {
  const [termsOpen, setTermsOpen] = useState(false);
  
  // Colors based on current network
  const accentTextGradient = network === "mainnet" 
    ? "text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600" 
    : "text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600";
  
  // Determine text based on language
  let termsAndConditionsText = "Terms & Conditions";
  let contactText = "Contact";
  let disclaimerText = "Disclaimer";
  let disclaimerContent = 'This app does not provide investment advice. Use at your own risk.';
  
  // Translations for footer text
  const translations = {
    en: {
      termsAndConditions: "Terms & Conditions",
      privacyPolicy: "Privacy Policy",
      contact: "Contact",
      disclaimer: "Disclaimer",
      disclaimerContent: "This app does not provide investment advice. Use at your own risk.",
      understand: "I Understand",
      lastUpdated: "Last Updated",
      officialDocument: "Official Document",
      natureOfSitaMinter: "Nature of Sita Minter",
      userResponsibility: "User Responsibility",
      noLiabilityForIP: "No Liability for Intellectual Property Infringement",
      noWarranties: "No Warranties",
      limitationOfLiability: "Limitation of Liability",
      decentralizedGovernance: "Decentralized Governance",
      feesAndCosts: "Fees and Costs",
      prohibitedActivities: "Prohibited Activities",
      indemnification: "Indemnification",
      termination: "Termination",
      governingLaw: "Governing Law",
      amendments: "Amendments",
      welcomeText: "Welcome to Sita Minter (\"the dApp\"), a decentralized application built on the Nervos Network that enables users to create and mint custom tokens. By accessing or using Sita Minter, you agree to be bound by the following Terms and Conditions (\"T&Cs\"). If you do not agree with these T&Cs, please refrain from using the dApp."
    },
    zh: {
      termsAndConditions: "条款和条件",
      privacyPolicy: "隐私政策",
      contact: "联系我们",
      disclaimer: "免责声明",
      disclaimerContent: "本应用不提供投资建议。使用风险自负。",
      understand: "我理解",
      lastUpdated: "最后更新",
      officialDocument: "官方文件",
      natureOfSitaMinter: "Sita Minter 的性质",
      userResponsibility: "用户责任",
      noLiabilityForIP: "对知识产权侵权不承担责任",
      noWarranties: "无保证",
      limitationOfLiability: "责任限制",
      decentralizedGovernance: "去中心化治理",
      feesAndCosts: "费用和成本",
      prohibitedActivities: "禁止活动",
      indemnification: "赔偿",
      termination: "终止",
      governingLaw: "适用法律",
      amendments: "修订",
      welcomeText: "欢迎使用Sita Minter (\"dApp\"), 这是一个建立在Nervos Network上的去中心化应用程序，使用户能够创建和铸造自定义代币。通过访问或使用Sita Minter，您同意遵守以下条款和条件 (\"T&C\")。如果您不同意这些T&C，请不要使用该dApp。"
    },
    es: {
      termsAndConditions: "Términos y Condiciones",
      privacyPolicy: "Política de Privacidad",
      contact: "Contacto",
      disclaimer: "Aviso Legal",
      disclaimerContent: "Esta aplicación no proporciona asesoramiento de inversión. Úsela bajo su propio riesgo.",
      understand: "Entiendo",
      lastUpdated: "Última Actualización",
      officialDocument: "Documento Oficial",
      natureOfSitaMinter: "Naturaleza de Sita Minter",
      userResponsibility: "Responsabilidad del Usuario",
      noLiabilityForIP: "Sin Responsabilidad por Infracción de Propiedad Intelectual",
      noWarranties: "Sin Garantías",
      limitationOfLiability: "Limitación de Responsabilidad",
      decentralizedGovernance: "Gobernanza Descentralizada",
      feesAndCosts: "Tarifas y Costos",
      prohibitedActivities: "Actividades Prohibidas",
      indemnification: "Indemnización",
      termination: "Terminación",
      governingLaw: "Ley Aplicable",
      amendments: "Enmiendas",
      welcomeText: "Bienvenido a Sita Minter (\"la dApp\"), una aplicación descentralizada construida en la Red Nervos que permite a los usuarios crear y acuñar tokens personalizados. Al acceder o usar Sita Minter, acepta estar sujeto a los siguientes Términos y Condiciones (\"T&C\"). Si no está de acuerdo con estos T&C, absténgase de usar la dApp."
    },
    pt: {
      termsAndConditions: "Termos e Condições",
      privacyPolicy: "Política de Privacidade",
      contact: "Contacto",
      disclaimer: "Aviso Legal",
      disclaimerContent: "Esta aplicação não fornece aconselhamento de investimento. Utilize por sua conta e risco.",
      understand: "Eu Compreendo",
      lastUpdated: "Última Atualização",
      officialDocument: "Documento Oficial",
      natureOfSitaMinter: "Natureza do Sita Minter",
      userResponsibility: "Responsabilidade do Utilizador",
      noLiabilityForIP: "Sem Responsabilidade por Violação de Propriedade Intelectual",
      noWarranties: "Sem Garantias",
      limitationOfLiability: "Limitação de Responsabilidade",
      decentralizedGovernance: "Governança Descentralizada",
      feesAndCosts: "Taxas e Custos",
      prohibitedActivities: "Atividades Proibidas",
      indemnification: "Indemnização",
      termination: "Rescisão",
      governingLaw: "Lei Aplicável",
      amendments: "Alterações",
      welcomeText: "Bem-vindo ao Sita Minter (\"o dApp\"), uma aplicação descentralizada construída na Nervos Network que permite aos utilizadores criar e emitir tokens personalizados. Ao aceder ou utilizar o Sita Minter, concorda em ficar vinculado aos seguintes Termos e Condições (\"T&C\"). Se não concordar com estes T&C, por favor abstenha-se de utilizar o dApp."
    },
    fr: {
      termsAndConditions: "Termes et Conditions",
      privacyPolicy: "Politique de Confidentialité",
      contact: "Contact",
      disclaimer: "Avertissement",
      disclaimerContent: "Cette application ne fournit pas de conseils d'investissement. Utilisez-la à vos risques et périls.",
      understand: "Je Comprends",
      lastUpdated: "Dernière Mise à Jour",
      officialDocument: "Document Officiel",
      natureOfSitaMinter: "Nature de Sita Minter",
      userResponsibility: "Responsabilité de l'Utilisateur",
      noLiabilityForIP: "Aucune Responsabilité pour Violation de Propriété Intellectuelle",
      noWarranties: "Aucune Garantie",
      limitationOfLiability: "Limitation de Responsabilité",
      decentralizedGovernance: "Gouvernance Décentralisée",
      feesAndCosts: "Frais et Coûts",
      prohibitedActivities: "Activités Interdites",
      indemnification: "Indemnisation",
      termination: "Résiliation",
      governingLaw: "Droit Applicable",
      amendments: "Modifications",
      welcomeText: "Bienvenue sur Sita Minter (\"le dApp\"), une application décentralisée construite sur le réseau Nervos qui permet aux utilisateurs de créer et d'émettre des jetons personnalisés. En accédant ou en utilisant Sita Minter, vous acceptez d'être lié par les Conditions Générales suivantes (\"CGU\"). Si vous n'acceptez pas ces CGU, veuillez vous abstenir d'utiliser le dApp."
    },
    it: {
      termsAndConditions: "Termini e Condizioni",
      privacyPolicy: "Politica sulla Privacy",
      contact: "Contatto",
      disclaimer: "Avvertenza",
      disclaimerContent: "Questa applicazione non fornisce consulenza finanziaria. Utilizzala a tuo rischio.",
      understand: "Ho Capito",
      lastUpdated: "Ultimo Aggiornamento",
      officialDocument: "Documento Ufficiale",
      natureOfSitaMinter: "Natura di Sita Minter",
      userResponsibility: "Responsabilità dell'Utente",
      noLiabilityForIP: "Nessuna Responsabilità per Violazione di Proprietà Intellettuale",
      noWarranties: "Nessuna Garanzia",
      limitationOfLiability: "Limitazione di Responsabilità",
      decentralizedGovernance: "Governance Decentralizzata",
      feesAndCosts: "Costi e Tariffe",
      prohibitedActivities: "Attività Proibite",
      indemnification: "Indennizzo",
      termination: "Terminazione",
      governingLaw: "Legge Applicabile",
      amendments: "Modifiche",
      welcomeText: "Benvenuto su Sita Minter (\"la dApp\"), un'applicazione decentralizzata costruita sulla rete Nervos che consente agli utenti di creare e coniare token personalizzati. Accedendo o utilizzando Sita Minter, accetti di essere vincolato dai seguenti Termini e Condizioni (\"T&C\"). Se non sei d'accordo con questi T&C, ti preghiamo di astenerti dall'utilizzare la dApp."
    }
  };
  
  // Apply translations based on language
  if (translations[language as keyof typeof translations]) {
    const trans = translations[language as keyof typeof translations];
    termsAndConditionsText = trans.termsAndConditions;
    contactText = trans.contact;
    disclaimerText = trans.disclaimer;
    disclaimerContent = trans.disclaimerContent;
  }
  
  const copyright = `© ${new Date().getFullYear()} SITA MINTER`;
  
  return (
    <footer className="mt-auto py-4 px-4 border-t border-gray-200 text-xs text-gray-600">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex flex-wrap items-center gap-4 justify-center sm:justify-start">
          <button 
            onClick={() => setTermsOpen(true)}
            className="hover:underline"
          >
            {termsAndConditionsText}
          </button>
          <a 
            href="https://t.me/telmotalks/781" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:underline"
          >
            {contactText}
            <ExternalLink className="h-3 w-3" />
          </a>
          <span>{copyright}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-400">
              {disclaimerText}: {disclaimerContent}
            </p>
          </div>
        </div>
      </div>
      
      {/* Terms and Conditions Dialog */}
      <TermsDialog 
        language={language} 
        network={network} 
        isOpen={termsOpen} 
        onOpenChange={setTermsOpen} 
      />
    </footer>
  );
}