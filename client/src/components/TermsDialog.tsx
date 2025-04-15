import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TermsDialogProps {
  language: string;
  network?: "mainnet" | "testnet";
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TermsDialog({ 
  language, 
  network = "testnet", 
  isOpen, 
  onOpenChange 
}: TermsDialogProps) {
  
  // Colors based on current network
  const accentTextGradient = network === "mainnet" 
    ? "text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600" 
    : "text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600";
  
  // Translations for footer text
  const translations = {
    en: {
      termsAndConditions: "Terms & Conditions",
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
      contact: "Contact",
      welcomeText: "Welcome to Sita Minter (\"the dApp\"), a decentralized application built on the Nervos Network that enables users to create and mint custom tokens. By accessing or using Sita Minter, you agree to be bound by the following Terms and Conditions (\"T&Cs\"). If you do not agree with these T&Cs, please refrain from using the dApp."
    },
    zh: {
      termsAndConditions: "条款和条件",
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
      contact: "联系方式",
      welcomeText: "欢迎使用Sita Minter (\"dApp\"), 这是一个建立在Nervos Network上的去中心化应用程序，使用户能够创建和铸造自定义代币。通过访问或使用Sita Minter，您同意遵守以下条款和条件 (\"T&C\")。如果您不同意这些T&C，请不要使用该dApp。"
    },
    es: {
      termsAndConditions: "Términos y Condiciones",
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
      contact: "Contacto",
      welcomeText: "Bienvenido a Sita Minter (\"la dApp\"), una aplicación descentralizada construida en la Red Nervos que permite a los usuarios crear y acuñar tokens personalizados. Al acceder o usar Sita Minter, acepta estar sujeto a los siguientes Términos y Condiciones (\"T&C\"). Si no está de acuerdo con estos T&C, absténgase de usar la dApp."
    },
    pt: {
      termsAndConditions: "Termos e Condições",
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
      contact: "Contato",
      welcomeText: "Bem-vindo ao Sita Minter (\"o dApp\"), uma aplicação descentralizada construída na Nervos Network que permite aos utilizadores criar e emitir tokens personalizados. Ao aceder ou utilizar o Sita Minter, concorda em ficar vinculado aos seguintes Termos e Condições (\"T&C\"). Se não concordar com estes T&C, por favor abstenha-se de utilizar o dApp."
    },
    fr: {
      termsAndConditions: "Termes et Conditions",
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
      contact: "Contact",
      welcomeText: "Bienvenue sur Sita Minter (\"le dApp\"), une application décentralisée construite sur le réseau Nervos qui permet aux utilisateurs de créer et d'émettre des jetons personnalisés. En accédant ou en utilisant Sita Minter, vous acceptez d'être lié par les Conditions Générales suivantes (\"CGU\"). Si vous n'acceptez pas ces CGU, veuillez vous abstenir d'utiliser le dApp."
    },
    it: {
      termsAndConditions: "Termini e Condizioni",
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
      contact: "Contatto",
      welcomeText: "Benvenuto su Sita Minter (\"la dApp\"), un'applicazione decentralizzata costruita sulla rete Nervos che consente agli utenti di creare e coniare token personalizzati. Accedendo o utilizzando Sita Minter, accetti di essere vincolato dai seguenti Termini e Condizioni (\"T&C\"). Se non sei d'accordo con questi T&C, ti preghiamo di astenerti dall'utilizzare la dApp."
    }
  };
  
  // Get translated text
  let termsAndConditionsText = translations.en.termsAndConditions;
  let understandText = translations.en.understand;
  
  // Apply translations based on language
  if (translations[language as keyof typeof translations]) {
    const trans = translations[language as keyof typeof translations];
    termsAndConditionsText = trans.termsAndConditions;
    understandText = trans.understand;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`max-w-3xl max-h-[80vh] overflow-y-auto ${network === "mainnet" ? "bg-orange-50" : "bg-purple-50"} border ${network === "mainnet" ? "border-orange-200" : "border-purple-200"} rounded-xl`}
        aria-describedby="terms-dialog-description"
      >
        <DialogTitle className={`text-center text-xl font-bold ${accentTextGradient}`}>
          {termsAndConditionsText}
        </DialogTitle>
        <div id="terms-dialog-description" className="sr-only">Legal terms and conditions for using the SITA MINTER application</div>
        
        <div className="space-y-5 text-sm px-2 text-gray-700">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h4 className={`font-bold text-lg ${accentTextGradient} mb-2`}>{termsAndConditionsText}</h4>
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-gray-500">
                {translations[language as keyof typeof translations]?.lastUpdated || translations.en.lastUpdated}: April 1, 2025
              </p>
              <div className={`px-2 py-1 rounded-full text-xs ${network === "mainnet" ? "bg-orange-100 text-orange-800" : "bg-purple-100 text-purple-800"} font-medium`}>
                {translations[language as keyof typeof translations]?.officialDocument || translations.en.officialDocument}
              </div>
            </div>
            <div className="mb-3">
              <p className="mb-3">
                {translations[language as keyof typeof translations]?.welcomeText || translations.en.welcomeText}
              </p>

              {/* Complete Terms sections */}
              <div className="space-y-4 mt-6">
                {/* Nature of Sita Minter */}
                <section>
                  <h5 className={`font-semibold ${accentTextGradient}`}>
                    1. {translations[language as keyof typeof translations]?.natureOfSitaMinter || translations.en.natureOfSitaMinter}
                  </h5>
                  <div className="pl-2 mt-2 space-y-2">
                    <p>
                      {language === "en" && "1.1. Sita Minter is a decentralized, open-source application operating on the Nervos Network, a public blockchain platform. It allows users to mint Bitcoin tokens via smart contracts deployed on the network using the RGB++ protocol. BIFI UNLEASHED enables seamless Bitcoin token creation."}
                      {language === "zh" && "1.1. Sita Minter 是一个去中心化的开源应用程序，运行在 Nervos Network 这一公共区块链平台上。它允许用户通过部署在网络上的智能合约使用 RGB++ 协议铸造比特币代币。BIFI UNLEASHED 实现无缝比特币代币创建。"}
                      {language === "es" && "1.1. Sita Minter es una aplicación descentralizada y de código abierto que opera en la Red Nervos, una plataforma de blockchain pública. Permite a los usuarios acuñar tokens de Bitcoin a través de contratos inteligentes desplegados en la red utilizando el protocolo RGB++. BIFI UNLEASHED permite la creación de tokens de Bitcoin de manera fluida."}
                      {language === "pt" && "1.1. O Sita Minter é uma aplicação descentralizada e de código aberto que opera na Nervos Network, uma plataforma blockchain pública. Permite aos utilizadores cunhar tokens de Bitcoin através de contratos inteligentes implementados na rede usando o protocolo RGB++. BIFI UNLEASHED permite a criação fluida de tokens de Bitcoin."}
                      {language === "fr" && "1.1. Sita Minter est une application décentralisée et open-source fonctionnant sur le réseau Nervos, une plateforme blockchain publique. Elle permet aux utilisateurs d'émettre des jetons Bitcoin via des contrats intelligents déployés sur le réseau en utilisant le protocole RGB++. BIFI UNLEASHED permet la création fluide de jetons Bitcoin."}
                      {language === "it" && "1.1. Sita Minter è un'applicazione decentralizzata e open-source che opera sulla rete Nervos, una piattaforma blockchain pubblica. Consente agli utenti di coniare token Bitcoin tramite smart contract distribuiti sulla rete utilizzando il protocollo RGB++. BIFI UNLEASHED permette la creazione fluida di token Bitcoin."}
                    </p>
                    <p>
                      {language === "en" && "1.2. Sita Minter functions in a decentralized manner and is not controlled or managed by a single entity. We, the creators of Sita Minter (\"the Creators\"), provide the code and interface as a tool but do not oversee or regulate the tokens minted or their use."}
                      {language === "zh" && "1.2. Sita Minter 以去中心化方式运作，不受单一实体控制或管理。我们，Sita Minter 的创建者（\"创建者\"），提供代码和接口作为工具，但不监督或规范铸造的代币或其使用。"}
                      {language === "es" && "1.2. Sita Minter funciona de manera descentralizada y no está controlado ni gestionado por una sola entidad. Nosotros, los creadores de Sita Minter (\"los Creadores\"), proporcionamos el código y la interfaz como una herramienta, pero no supervisamos ni regulamos los tokens acuñados o su uso."}
                      {language === "pt" && "1.2. O Sita Minter funciona de forma descentralizada e não é controlado ou gerido por uma única entidade. Nós, os criadores do Sita Minter (\"os Criadores\"), fornecemos o código e a interface como uma ferramenta, mas não supervisionamos ou regulamos os tokens cunhados ou a sua utilização."}
                      {language === "fr" && "1.2. Sita Minter fonctionne de manière décentralisée et n'est pas contrôlé ou géré par une seule entité. Nous, les créateurs de Sita Minter (\"les Créateurs\"), fournissons le code et l'interface comme un outil mais ne supervisons pas ou ne régulons pas les jetons émis ou leur utilisation."}
                      {language === "it" && "1.2. Sita Minter funziona in modo decentralizzato e non è controllato o gestito da una singola entità. Noi, i creatori di Sita Minter (\"i Creatori\"), forniamo il codice e l'interfaccia come strumento ma non supervisioniamo o regoliamo i token coniati o il loro utilizzo."}
                    </p>
                    <p>
                      {language === "en" && "1.3. The Nervos Network is a permissionless blockchain, and all interactions with Sita Minter are recorded on its decentralized ledger. The Creators cannot alter, reverse, or interfere with transactions once they are submitted to the network."}
                      {language === "zh" && "1.3. Nervos Network 是一个无需许可的区块链，与 Sita Minter 的所有交互都记录在其去中心化账本上。一旦交易提交到网络，创建者无法修改、撤销或干预这些交易。"}
                      {language === "es" && "1.3. La Red Nervos es una blockchain sin permisos, y todas las interacciones con Sita Minter se registran en su libro mayor descentralizado. Los Creadores no pueden alterar, revertir o interferir con las transacciones una vez que se envían a la red."}
                      {language === "pt" && "1.3. A Nervos Network é uma blockchain sem permissão, e todas as interações com o Sita Minter são registradas em seu livro-razão descentralizado. Os Criadores não podem alterar, reverter ou interferir nas transações uma vez que são enviadas para a rede."}
                      {language === "fr" && "1.3. Le réseau Nervos est une blockchain sans permission, et toutes les interactions avec Sita Minter sont enregistrées sur son registre décentralisé. Les Créateurs ne peuvent pas modifier, annuler ou interférer avec les transactions une fois qu'elles sont soumises au réseau."}
                      {language === "it" && "1.3. La rete Nervos è una blockchain senza permessi, e tutte le interazioni con Sita Minter sono registrate nel suo registro decentralizzato. I Creatori non possono alterare, invertire o interferire con le transazioni una volta che sono inviate alla rete."}
                    </p>
                  </div>
                </section>

                {/* User Responsibility */}
                <section>
                  <h5 className={`font-semibold ${accentTextGradient}`}>
                    2. {translations[language as keyof typeof translations]?.userResponsibility || translations.en.userResponsibility}
                  </h5>
                  <div className="pl-2 mt-2 space-y-2">
                    <p>
                      {language === "en" && "2.1. You, the user (\"User\"), are fully responsible for your use of Sita Minter, including the creation, naming, distribution, and management of any tokens you mint."}
                      {language === "zh" && "2.1. 您，用户（\"用户\"），对您使用 Sita Minter 的行为完全负责，包括您铸造的任何代币的创建、命名、分发和管理。"}
                      {language === "es" && "2.1. Usted, el usuario (\"Usuario\"), es totalmente responsable de su uso de Sita Minter, incluida la creación, denominación, distribución y gestión de cualquier token que acuñe."}
                      {language === "pt" && "2.1. Você, o utilizador (\"Utilizador\"), é totalmente responsável pelo seu uso do Sita Minter, incluindo a criação, nomeação, distribuição e gestão de quaisquer tokens que cunhe."}
                      {language === "fr" && "2.1. Vous, l'utilisateur (\"Utilisateur\"), êtes entièrement responsable de votre utilisation de Sita Minter, y compris la création, la dénomination, la distribution et la gestion de tous les jetons que vous émettez."}
                      {language === "it" && "2.1. Tu, l'utente (\"Utente\"), sei pienamente responsabile del tuo utilizzo di Sita Minter, inclusa la creazione, la denominazione, la distribuzione e la gestione di qualsiasi token che coni."}
                    </p>
                    <p>
                      {language === "en" && "2.2. Users must ensure their activities on Sita Minter comply with all applicable laws, including intellectual property laws, securities regulations, and consumer protection statutes, in their jurisdiction and beyond."}
                      {language === "zh" && "2.2. 用户必须确保他们在 Sita Minter 上的活动符合所有适用法律，包括知识产权法、证券法规和消费者保护法规，无论是在他们的司法管辖区内还是超出其范围。"}
                      {language === "es" && "2.2. Los Usuarios deben asegurarse de que sus actividades en Sita Minter cumplan con todas las leyes aplicables, incluidas las leyes de propiedad intelectual, regulaciones de valores y estatutos de protección al consumidor, en su jurisdicción y más allá."}
                      {language === "pt" && "2.2. Os Utilizadores devem garantir que as suas atividades no Sita Minter cumprem todas as leis aplicáveis, incluindo leis de propriedade intelectual, regulamentos de valores mobiliários e estatutos de proteção ao consumidor, na sua jurisdição e além."}
                      {language === "fr" && "2.2. Les Utilisateurs doivent s'assurer que leurs activités sur Sita Minter sont conformes à toutes les lois applicables, y compris les lois sur la propriété intellectuelle, les réglementations sur les valeurs mobilières et les statuts de protection des consommateurs, dans leur juridiction et au-delà."}
                      {language === "it" && "2.2. Gli Utenti devono assicurarsi che le loro attività su Sita Minter siano conformi a tutte le leggi applicabili, incluse le leggi sulla proprietà intellettuale, le normative sui titoli e gli statuti di protezione dei consumatori, nella loro giurisdizione e oltre."}
                    </p>
                    <p>
                      {language === "en" && "2.3. Sita Minter does not filter or review the content, names, or attributes of minted tokens. It is your sole responsibility to ensure that your tokens do not infringe upon trademarks, patents, copyrights, or other intellectual property rights of third parties."}
                      {language === "zh" && "2.3. Sita Minter 不会过滤或审查铸造的代币的内容、名称或属性。确保您的代币不侵犯第三方的商标、专利、版权或其他知识产权是您的唯一责任。"}
                      {language === "es" && "2.3. Sita Minter no filtra ni revisa el contenido, nombres o atributos de los tokens acuñados. Es su única responsabilidad asegurarse de que sus tokens no infrinjan marcas comerciales, patentes, derechos de autor u otros derechos de propiedad intelectual de terceros."}
                      {language === "pt" && "2.3. O Sita Minter não filtra nem revê o conteúdo, nomes ou atributos dos tokens cunhados. É da sua exclusiva responsabilidade garantir que os seus tokens não infringem marcas registradas, patentes, direitos autorais ou outros direitos de propriedade intelectual de terceiros."}
                      {language === "fr" && "2.3. Sita Minter ne filtre pas ou ne passe pas en revue le contenu, les noms ou les attributs des jetons émis. Il est de votre seule responsabilité de vous assurer que vos jetons ne portent pas atteinte aux marques, brevets, droits d'auteur ou autres droits de propriété intellectuelle de tiers."}
                      {language === "it" && "2.3. Sita Minter non filtra o esamina il contenuto, i nomi o gli attributi dei token coniati. È tua esclusiva responsabilità assicurarti che i tuoi token non violino marchi, brevetti, copyright o altri diritti di proprietà intellettuale di terze parti."}
                    </p>
                  </div>
                </section>

                {/* No Liability for Intellectual Property Infringement */}
                <section>
                  <h5 className={`font-semibold ${accentTextGradient}`}>
                    3. {translations[language as keyof typeof translations]?.noLiabilityForIP || translations.en.noLiabilityForIP}
                  </h5>
                  <div className="pl-2 mt-2 space-y-2">
                    <p>
                      {language === "en" && "3.1. The Creators are not liable for any claims, damages, or liabilities resulting from trademark infringement, patent violations, copyright disputes, or other intellectual property issues related to tokens minted or used via Sita Minter."}
                      {language === "zh" && "3.1. 创建者不对因商标侵权、专利侵权、版权纠纷或与通过 Sita Minter 铸造或使用的代币相关的其他知识产权问题而导致的任何索赔、损害或责任负责。"}
                      {language === "es" && "3.1. Los Creadores no son responsables de ninguna reclamación, daño o responsabilidad resultante de infracción de marcas, violaciones de patentes, disputas de derechos de autor u otros problemas de propiedad intelectual relacionados con tokens acuñados o utilizados a través de Sita Minter."}
                      {language === "pt" && "3.1. Os Criadores não são responsáveis por quaisquer reclamações, danos ou responsabilidades resultantes de violação de marcas registradas, violações de patentes, disputas de direitos autorais ou outras questões de propriedade intelectual relacionadas a tokens cunhados ou utilizados através do Sita Minter."}
                      {language === "fr" && "3.1. Les Créateurs ne sont pas responsables des réclamations, dommages ou responsabilités résultant de contrefaçon de marque, violations de brevet, litiges de droits d'auteur ou autres problèmes de propriété intellectuelle liés aux jetons émis ou utilisés via Sita Minter."}
                      {language === "it" && "3.1. I Creatori non sono responsabili per eventuali reclami, danni o responsabilità derivanti da violazioni di marchi, violazioni di brevetti, dispute sul copyright o altre questioni di proprietà intellettuale relative ai token coniati o utilizzati tramite Sita Minter."}
                    </p>
                    <p>
                      {language === "en" && "3.2. By using Sita Minter, you acknowledge that the Creators do not review, approve, or endorse any tokens created through the dApp, nor can they monitor or enforce intellectual property rights."}
                      {language === "zh" && "3.2. 通过使用 Sita Minter，您承认创建者不会审查、批准或认可通过该 dApp 创建的任何代币，他们也无法监控或执行知识产权。"}
                      {language === "es" && "3.2. Al usar Sita Minter, usted reconoce que los Creadores no revisan, aprueban o respaldan ningún token creado a través de la dApp, ni pueden monitorear o hacer cumplir los derechos de propiedad intelectual."}
                      {language === "pt" && "3.2. Ao utilizar o Sita Minter, você reconhece que os Criadores não revisam, aprovam ou endossam quaisquer tokens criados através da dApp, nem podem monitorar ou fazer cumprir direitos de propriedade intelectual."}
                      {language === "fr" && "3.2. En utilisant Sita Minter, vous reconnaissez que les Créateurs ne vérifient pas, n'approuvent pas ou n'endossent pas les jetons créés via la dApp, et qu'ils ne peuvent pas surveiller ou faire respecter les droits de propriété intellectuelle."}
                      {language === "it" && "3.2. Utilizzando Sita Minter, riconosci che i Creatori non revisionano, approvano o supportano alcun token creato attraverso la dApp, né possono monitorare o far rispettare i diritti di proprietà intellettuale."}
                    </p>
                    <p>
                      {language === "en" && "3.3. If you believe a token minted through Sita Minter infringes upon your intellectual property rights, you must address the issue directly with the User who minted it. The decentralized structure of the Nervos Network prevents the Creators from intervening in such matters."}
                      {language === "zh" && "3.3. 如果您认为通过 Sita Minter 铸造的代币侵犯了您的知识产权，您必须直接与铸造该代币的用户解决问题。Nervos Network 的去中心化结构使创建者无法干预此类事务。"}
                      {language === "es" && "3.3. Si cree que un token acuñado a través de Sita Minter infringe sus derechos de propiedad intelectual, debe abordar el problema directamente con el Usuario que lo acuñó. La estructura descentralizada de la Red Nervos impide que los Creadores intervengan en tales asuntos."}
                      {language === "pt" && "3.3. Se você acredita que um token cunhado através do Sita Minter infringe seus direitos de propriedade intelectual, deve abordar o problema diretamente com o Utilizador que o cunhou. A estrutura descentralizada da Nervos Network impede que os Criadores intervenham em tais assuntos."}
                      {language === "fr" && "3.3. Si vous pensez qu'un jeton émis via Sita Minter porte atteinte à vos droits de propriété intellectuelle, vous devez traiter directement le problème avec l'Utilisateur qui l'a émis. La structure décentralisée du réseau Nervos empêche les Créateurs d'intervenir dans ces affaires."}
                      {language === "it" && "3.3. Se ritieni che un token coniato tramite Sita Minter violi i tuoi diritti di proprietà intellettuale, devi affrontare il problema direttamente con l'Utente che lo ha coniato. La struttura decentralizzata della rete Nervos impedisce ai Creatori di intervenire in tali questioni."}
                    </p>
                  </div>
                </section>

                {/* No Warranties */}
                <section>
                  <h5 className={`font-semibold ${accentTextGradient}`}>
                    4. {translations[language as keyof typeof translations]?.noWarranties || translations.en.noWarranties}
                  </h5>
                  <div className="pl-2 mt-2 space-y-2">
                    <p>
                      {language === "en" && "4.1. Sita Minter is provided \"as is\" and \"as available,\" without warranties of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement."}
                      {language === "zh" && "4.1. Sita Minter 按「原样」和「可用性」提供，不提供任何明示或暗示的保证，包括但不限于适销性、特定用途的适用性或不侵权。"}
                      {language === "es" && "4.1. Sita Minter se proporciona \"tal cual\" y \"según disponibilidad\", sin garantías de ningún tipo, explícitas o implícitas, incluidas, entre otras, la comerciabilidad, la idoneidad para un propósito particular o la no infracción."}
                      {language === "pt" && "4.1. O Sita Minter é fornecido \"como está\" e \"conforme disponível\", sem garantias de qualquer tipo, expressas ou implícitas, incluindo, mas não limitado a, comercialização, adequação a um propósito específico ou não violação."}
                      {language === "fr" && "4.1. Sita Minter est fourni \"tel quel\" et \"selon disponibilité\", sans garanties d'aucune sorte, explicites ou implicites, y compris, mais sans s'y limiter, la qualité marchande, l'adéquation à un usage particulier ou la non-contrefaçon."}
                      {language === "it" && "4.1. Sita Minter è fornito \"così com'è\" e \"come disponibile\", senza garanzie di alcun tipo, esplicite o implicite, incluse ma non limitate a commerciabilità, idoneità per uno scopo particolare o non violazione."}
                    </p>
                    <p>
                      {language === "en" && "4.2. The Creators do not guarantee that Sita Minter will be free of errors, secure, or uninterrupted. The Nervos Network may experience delays, forks, or other issues outside our control."}
                      {language === "zh" && "4.2. 创建者不保证 Sita Minter 没有错误、安全或不中断。Nervos Network 可能会遇到我们无法控制的延迟、分叉或其他问题。"}
                      {language === "es" && "4.2. Los Creadores no garantizan que Sita Minter esté libre de errores, sea seguro o ininterrumpido. La Red Nervos puede experimentar retrasos, bifurcaciones u otros problemas fuera de nuestro control."}
                      {language === "pt" && "4.2. Os Criadores não garantem que o Sita Minter estará livre de erros, seguro ou ininterrupto. A Nervos Network pode experimentar atrasos, bifurcações ou outros problemas fora do nosso controle."}
                      {language === "fr" && "4.2. Les Créateurs ne garantissent pas que Sita Minter sera exempt d'erreurs, sécurisé ou ininterrompu. Le réseau Nervos peut subir des retards, des fourches ou d'autres problèmes hors de notre contrôle."}
                      {language === "it" && "4.2. I Creatori non garantiscono che Sita Minter sarà privo di errori, sicuro o ininterrotto. La rete Nervos potrebbe subire ritardi, fork o altri problemi al di fuori del nostro controllo."}
                    </p>
                  </div>
                </section>

                {/* Limitation of Liability */}
                <section>
                  <h5 className={`font-semibold ${accentTextGradient}`}>
                    5. {translations[language as keyof typeof translations]?.limitationOfLiability || translations.en.limitationOfLiability}
                  </h5>
                  <div className="pl-2 mt-2 space-y-2">
                    <p>
                      {language === "en" && "5.1. To the fullest extent permitted by law, the Creators shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of Sita Minter, including but not limited to:"}
                      {language === "zh" && "5.1. 在法律允许的最大范围内，创建者不对因您使用 Sita Minter 而产生的任何直接、间接、偶然、后果性或惩罚性损害负责，包括但不限于:"}
                      {language === "es" && "5.1. En la medida máxima permitida por la ley, los Creadores no serán responsables de ningún daño directo, indirecto, incidental, consecuente o punitivo que surja de su uso de Sita Minter, incluidos, entre otros:"}
                      {language === "pt" && "5.1. Na extensão máxima permitida por lei, os Criadores não serão responsáveis por quaisquer danos diretos, indiretos, incidentais, consequentes ou punitivos decorrentes do seu uso do Sita Minter, incluindo, mas não limitado a:"}
                      {language === "fr" && "5.1. Dans toute la mesure permise par la loi, les Créateurs ne seront pas responsables des dommages directs, indirects, accessoires, consécutifs ou punitifs résultant de votre utilisation de Sita Minter, y compris, mais sans s'y limiter:"}
                      {language === "it" && "5.1. Nella massima misura consentita dalla legge, i Creatori non saranno responsabili per qualsiasi danno diretto, indiretto, incidentale, consequenziale o punitivo derivante dall'uso di Sita Minter, inclusi ma non limitati a:"}
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        {language === "en" && "Financial losses from token value changes"}
                        {language === "zh" && "代币价值变化导致的财务损失"}
                        {language === "es" && "Pérdidas financieras por cambios en el valor del token"}
                        {language === "pt" && "Perdas financeiras devido a mudanças no valor do token"}
                        {language === "fr" && "Pertes financières dues aux variations de la valeur des jetons"}
                        {language === "it" && "Perdite finanziarie da cambiamenti di valore del token"}
                      </li>
                      <li>
                        {language === "en" && "Unauthorized access to your wallet or private keys"}
                        {language === "zh" && "未经授权访问您的钱包或私钥"}
                        {language === "es" && "Acceso no autorizado a su billetera o claves privadas"}
                        {language === "pt" && "Acesso não autorizado à sua carteira ou chaves privadas"}
                        {language === "fr" && "Accès non autorisé à votre portefeuille ou clés privées"}
                        {language === "it" && "Accesso non autorizzato al tuo portafoglio o chiavi private"}
                      </li>
                      <li>
                        {language === "en" && "Legal claims related to your minted tokens (e.g., intellectual property disputes)"}
                        {language === "zh" && "与您铸造的代币相关的法律索赔（例如，知识产权纠纷）"}
                        {language === "es" && "Reclamaciones legales relacionadas con sus tokens acuñados (por ejemplo, disputas de propiedad intelectual)"}
                        {language === "pt" && "Reclamações legais relacionadas aos seus tokens cunhados (por exemplo, disputas de propriedade intelectual)"}
                        {language === "fr" && "Réclamations juridiques liées à vos jetons émis (par exemple, litiges de propriété intellectuelle)"}
                        {language === "it" && "Rivendicazioni legali relative ai token coniati (ad esempio, controversie sulla proprietà intellettuale)"}
                      </li>
                      <li>
                        {language === "en" && "Technical failures of the Nervos Network or Sita Minter"}
                        {language === "zh" && "Nervos Network 或 Sita Minter 的技术故障"}
                        {language === "es" && "Fallos técnicos de la Red Nervos o Sita Minter"}
                        {language === "pt" && "Falhas técnicas da Nervos Network ou Sita Minter"}
                        {language === "fr" && "Défaillances techniques du réseau Nervos ou de Sita Minter"}
                        {language === "it" && "Guasti tecnici della rete Nervos o di Sita Minter"}
                      </li>
                    </ul>
                    <p>
                      {language === "en" && "5.2. The Creators bear no responsibility for how Users or third parties utilize, trade, or distribute tokens minted through Sita Minter."}
                      {language === "zh" && "5.2. 创建者对用户或第三方如何利用、交易或分发通过 Sita Minter 铸造的代币不承担任何责任。"}
                      {language === "es" && "5.2. Los Creadores no tienen ninguna responsabilidad por la forma en que los Usuarios o terceros utilizan, comercian o distribuyen los tokens acuñados a través de Sita Minter."}
                      {language === "pt" && "5.2. Os Criadores não assumem qualquer responsabilidade pela forma como os Utilizadores ou terceiros utilizam, negociam ou distribuem tokens cunhados através do Sita Minter."}
                      {language === "fr" && "5.2. Les Créateurs n'assument aucune responsabilité quant à la façon dont les Utilisateurs ou les tiers utilisent, échangent ou distribuent les jetons émis via Sita Minter."}
                      {language === "it" && "5.2. I Creatori non hanno alcuna responsabilità per come gli Utenti o terze parti utilizzano, scambiano o distribuiscono i token coniati tramite Sita Minter."}
                    </p>
                  </div>
                </section>

                {/* Decentralized Governance */}
                <section>
                  <h5 className={`font-semibold ${accentTextGradient}`}>
                    6. {translations[language as keyof typeof translations]?.decentralizedGovernance || translations.en.decentralizedGovernance}
                  </h5>
                  <div className="pl-2 mt-2 space-y-2">
                    <p>
                      {language === "en" && "6.1. Sita Minter operates via smart contracts on the Nervos Network. These contracts are autonomous and execute according to their programmed logic. The Creators do not hold custody over minted tokens or control User actions post-minting."}
                      {language === "zh" && "6.1. Sita Minter 通过 Nervos Network 上的智能合约运行。这些合约是自主的，并按照其程序逻辑执行。创建者不持有已铸造代币的托管权，也不控制用户在铸造后的行动。"}
                      {language === "es" && "6.1. Sita Minter opera a través de contratos inteligentes en la Red Nervos. Estos contratos son autónomos y se ejecutan según su lógica programada. Los Creadores no tienen custodia sobre los tokens acuñados ni controlan las acciones del Usuario después de la acuñación."}
                      {language === "pt" && "6.1. O Sita Minter opera via contratos inteligentes na Nervos Network. Estes contratos são autônomos e executam de acordo com sua lógica programada. Os Criadores não têm custódia sobre tokens cunhados ou controlam ações do Utilizador após a cunhagem."}
                      {language === "fr" && "6.1. Sita Minter fonctionne via des contrats intelligents sur le réseau Nervos. Ces contrats sont autonomes et s'exécutent selon leur logique programmée. Les Créateurs ne détiennent pas la garde des jetons émis ou ne contrôlent pas les actions de l'Utilisateur après l'émission."}
                      {language === "it" && "6.1. Sita Minter opera tramite smart contract sulla rete Nervos. Questi contratti sono autonomi e vengono eseguiti secondo la loro logica programmata. I Creatori non hanno la custodia dei token coniati o controllano le azioni dell'Utente dopo la coniazione."}
                    </p>
                    <p>
                      {language === "en" && "6.2. Updates or modifications to Sita Minter's code, if any, will be proposed and implemented through a decentralized governance process, subject to community participation where supported by the Nervos Network ecosystem."}
                      {language === "zh" && "6.2. 如有任何对 Sita Minter 代码的更新或修改，将通过去中心化治理流程提出和实施，并在 Nervos Network 生态系统支持的情况下接受社区参与。"}
                      {language === "es" && "6.2. Las actualizaciones o modificaciones al código de Sita Minter, si las hubiera, serán propuestas e implementadas a través de un proceso de gobernanza descentralizada, sujeto a la participación de la comunidad donde sea apoyado por el ecosistema de la Red Nervos."}
                      {language === "pt" && "6.2. Atualizações ou modificações no código do Sita Minter, se houver, serão propostas e implementadas através de um processo de governança descentralizada, sujeito à participação da comunidade onde for apoiado pelo ecossistema da Nervos Network."}
                      {language === "fr" && "6.2. Les mises à jour ou modifications du code de Sita Minter, le cas échéant, seront proposées et mises en œuvre par le biais d'un processus de gouvernance décentralisé, sous réserve de la participation de la communauté lorsqu'elle est soutenue par l'écosystème du réseau Nervos."}
                      {language === "it" && "6.2. Aggiornamenti o modifiche al codice di Sita Minter, se presenti, saranno proposti e implementati attraverso un processo di governance decentralizzato, soggetto alla partecipazione della comunità dove supportato dall'ecosistema della rete Nervos."}
                    </p>
                  </div>
                </section>

                {/* Fees and Costs Section */}
                <section>
                  <h5 className={`font-semibold ${accentTextGradient}`}>
                    7. {translations[language as keyof typeof translations]?.feesAndCosts || translations.en.feesAndCosts}
                  </h5>
                  <div className="pl-2 mt-2 space-y-2">
                    <p>
                      {language === "en" && "7.1 Minting Bitcoin tokens with Sita Minter through the RGB++ protocol involves the following fees:"}
                      {language === "zh" && "7.1 通过 RGB++ 协议使用 Sita Minter 铸造比特币代币涉及以下费用："}
                      {language === "es" && "7.1 La acuñación de tokens de Bitcoin con Sita Minter a través del protocolo RGB++ implica las siguientes tarifas:"}
                      {language === "pt" && "7.1 A cunhagem de tokens de Bitcoin com o Sita Minter através do protocolo RGB++ envolve as seguintes taxas:"}
                      {language === "fr" && "7.1 L'émission de jetons Bitcoin avec Sita Minter à travers le protocole RGB++ implique les frais suivants:"}
                      {language === "it" && "7.1 La creazione di token Bitcoin con Sita Minter attraverso il protocollo RGB++ comporta le seguenti tariffe:"}
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        {language === "en" && "Platform support fee (300 CKB): This fee supports ongoing development and maintenance of the Sita Minter platform."}
                        {language === "zh" && "平台支持费用 (300 CKB)：此费用用于支持 Sita Minter 平台的持续开发和维护。"}
                        {language === "es" && "Tarifa de soporte de plataforma (300 CKB): Esta tarifa apoya el desarrollo continuo y mantenimiento de la plataforma Sita Minter."}
                        {language === "pt" && "Taxa de suporte à plataforma (300 CKB): Esta taxa apoia o desenvolvimento contínuo e manutenção da plataforma Sita Minter."}
                        {language === "fr" && "Frais de support de plateforme (300 CKB): Ces frais supportent le développement continu et la maintenance de la plateforme Sita Minter."}
                        {language === "it" && "Commissione di supporto alla piattaforma (300 CKB): Questa commissione supporta lo sviluppo continuo e la manutenzione della piattaforma Sita Minter."}
                      </li>
                      <li>
                        {language === "en" && "Network transaction fees: A small amount of CKB is used to pay for gas (typically ~0.001 CKB)."}
                        {language === "zh" && "网络交易费用：少量 CKB 用于支付 gas 费用（通常约 0.001 CKB）。"}
                        {language === "es" && "Tarifas de transacción de red: Una pequeña cantidad de CKB se utiliza para pagar el gas (normalmente ~0.001 CKB)."}
                        {language === "pt" && "Taxas de transação de rede: Uma pequena quantidade de CKB é usada para pagar o gás (normalmente ~0.001 CKB)."}
                        {language === "fr" && "Frais de transaction réseau: Une petite quantité de CKB est utilisée pour payer le gaz (généralement ~0.001 CKB)."}
                        {language === "it" && "Commissioni di transazione di rete: Una piccola quantità di CKB viene utilizzata per pagare il gas (in genere ~0.001 CKB)."}
                      </li>
                      <li>
                        {language === "en" && "Creator tip (optional): If you choose to tip the creator, this will incur an additional 144 CKB in transaction fees."}
                        {language === "zh" && "创建者小费（可选）：如果您选择给创建者小费，这将产生额外 144 CKB 的交易费用。"}
                        {language === "es" && "Propina para el creador (opcional): Si elige dar propina al creador, esto incurrirá en 144 CKB adicionales en tarifas de transacción."}
                        {language === "pt" && "Gorjeta do criador (opcional): Se você optar por dar gorjeta ao criador, isso incorrerá em 144 CKB adicionais em taxas de transação."}
                        {language === "fr" && "Pourboire au créateur (facultatif): Si vous choisissez de donner un pourboire au créateur, cela entraînera 144 CKB supplémentaires en frais de transaction."}
                        {language === "it" && "Mancia al creatore (opzionale): Se scegli di dare una mancia al creatore, questo comporterà ulteriori 144 CKB in commissioni di transazione."}
                      </li>
                    </ul>
                    <p>
                      {language === "en" && "7.2 All fees are non-refundable once a transaction is submitted to the blockchain."}
                      {language === "zh" && "7.2 一旦交易提交到区块链，所有费用均不可退还。"}
                      {language === "es" && "7.2 Todas las tarifas no son reembolsables una vez que se envía una transacción a la blockchain."}
                      {language === "pt" && "7.2 Todas as taxas são não reembolsáveis uma vez que uma transação é submetida à blockchain."}
                      {language === "fr" && "7.2 Tous les frais sont non remboursables une fois qu'une transaction est soumise à la blockchain."}
                      {language === "it" && "7.2 Tutte le commissioni non sono rimborsabili una volta che una transazione è inviata alla blockchain."}
                    </p>
                    <p>
                      {language === "en" && "7.3 Sita Minter reserves the right to modify platform support fees with reasonable notice to users."}
                      {language === "zh" && "7.3 Sita Minter 保留在合理通知用户的情况下修改平台支持费用的权利。"}
                      {language === "es" && "7.3 Sita Minter se reserva el derecho de modificar las tarifas de soporte de la plataforma con un aviso razonable a los usuarios."}
                      {language === "pt" && "7.3 O Sita Minter reserva-se o direito de modificar as taxas de suporte à plataforma com aviso prévio razoável aos utilizadores."}
                      {language === "fr" && "7.3 Sita Minter se réserve le droit de modifier les frais de support de plateforme avec un préavis raisonnable aux utilisateurs."}
                      {language === "it" && "7.3 Sita Minter si riserva il diritto di modificare le commissioni di supporto alla piattaforma con ragionevole preavviso agli utenti."}
                    </p>
                  </div>
                </section>

                {/* No Liability for Intellectual Property Infringement */}
                <section>
                  <h5 className={`font-semibold ${accentTextGradient}`}>
                    3. {translations[language as keyof typeof translations]?.noLiabilityForIP || translations.en.noLiabilityForIP}
                  </h5>
                  <div className="pl-2 mt-2 space-y-2">
                    <p>
                      {language === "en" && "3.1. The Creators are not liable for any claims, damages, or liabilities resulting from trademark infringement, patent violations, copyright disputes, or other intellectual property issues related to tokens minted or used via Sita Minter."}
                      {language === "zh" && "3.1. 创建者不对因商标侵权、专利侵权、版权纠纷或与通过 Sita Minter 铸造或使用的代币相关的其他知识产权问题而导致的任何索赔、损害或责任负责。"}
                      {language === "es" && "3.1. Los Creadores no son responsables de ninguna reclamación, daño o responsabilidad resultante de infracción de marcas, violaciones de patentes, disputas de derechos de autor u otros problemas de propiedad intelectual relacionados con tokens acuñados o utilizados a través de Sita Minter."}
                      {language === "pt" && "3.1. Os Criadores não são responsáveis por quaisquer reclamações, danos ou responsabilidades resultantes de violação de marcas registradas, violações de patentes, disputas de direitos autorais ou outras questões de propriedade intelectual relacionadas a tokens cunhados ou utilizados através do Sita Minter."}
                      {language === "fr" && "3.1. Les Créateurs ne sont pas responsables des réclamations, dommages ou responsabilités résultant de contrefaçon de marque, violations de brevet, litiges de droits d'auteur ou autres problèmes de propriété intellectuelle liés aux jetons émis ou utilisés via Sita Minter."}
                      {language === "it" && "3.1. I Creatori non sono responsabili per eventuali reclami, danni o responsabilità derivanti da violazioni di marchi, violazioni di brevetti, dispute sul copyright o altre questioni di proprietà intellettuale relative ai token coniati o utilizzati tramite Sita Minter."}
                    </p>
                    <p>
                      {language === "en" && "3.2. By using Sita Minter, you acknowledge that the Creators do not review, approve, or endorse any tokens created through the dApp, nor can they monitor or enforce intellectual property rights."}
                      {language === "zh" && "3.2. 通过使用 Sita Minter，您承认创建者不会审查、批准或认可通过该 dApp 创建的任何代币，他们也无法监控或执行知识产权。"}
                      {language === "es" && "3.2. Al usar Sita Minter, usted reconoce que los Creadores no revisan, aprueban o respaldan ningún token creado a través de la dApp, ni pueden monitorear o hacer cumplir los derechos de propiedad intelectual."}
                      {language === "pt" && "3.2. Ao utilizar o Sita Minter, você reconhece que os Criadores não revisam, aprovam ou endossam quaisquer tokens criados através da dApp, nem podem monitorar ou fazer cumprir direitos de propriedade intelectual."}
                      {language === "fr" && "3.2. En utilisant Sita Minter, vous reconnaissez que les Créateurs ne vérifient pas, n'approuvent pas ou n'endossent pas les jetons créés via la dApp, et qu'ils ne peuvent pas surveiller ou faire respecter les droits de propriété intellectuelle."}
                      {language === "it" && "3.2. Utilizzando Sita Minter, riconosci che i Creatori non revisionano, approvano o supportano alcun token creato attraverso la dApp, né possono monitorare o far rispettare i diritti di proprietà intellettuale."}
                    </p>
                    <p>
                      {language === "en" && "3.3. If you believe a token minted through Sita Minter infringes upon your intellectual property rights, you must address the issue directly with the User who minted it. The decentralized structure of the Nervos Network prevents the Creators from intervening in such matters."}
                      {language === "zh" && "3.3. 如果您认为通过 Sita Minter 铸造的代币侵犯了您的知识产权，您必须直接与铸造该代币的用户解决问题。Nervos Network 的去中心化结构使创建者无法干预此类事务。"}
                      {language === "es" && "3.3. Si cree que un token acuñado a través de Sita Minter infringe sus derechos de propiedad intelectual, debe abordar el problema directamente con el Usuario que lo acuñó. La estructura descentralizada de la Red Nervos impide que los Creadores intervengan en tales asuntos."}
                      {language === "pt" && "3.3. Se você acredita que um token cunhado através do Sita Minter infringe seus direitos de propriedade intelectual, deve abordar o problema diretamente com o Utilizador que o cunhou. A estrutura descentralizada da Nervos Network impede que os Criadores intervenham em tais assuntos."}
                      {language === "fr" && "3.3. Si vous pensez qu'un jeton émis via Sita Minter porte atteinte à vos droits de propriété intellectuelle, vous devez traiter directement le problème avec l'Utilisateur qui l'a émis. La structure décentralisée du réseau Nervos empêche les Créateurs d'intervenir dans ces affaires."}
                      {language === "it" && "3.3. Se ritieni che un token coniato tramite Sita Minter violi i tuoi diritti di proprietà intellettuale, devi affrontare il problema direttamente con l'Utente che lo ha coniato. La struttura decentralizzata della rete Nervos impedisce ai Creatori di intervenire in tali questioni."}
                    </p>
                  </div>
                </section>

                {/* No Warranties */}
                <section>
                  <h5 className={`font-semibold ${accentTextGradient}`}>
                    4. {translations[language as keyof typeof translations]?.noWarranties || translations.en.noWarranties}
                  </h5>
                  <div className="pl-2 mt-2 space-y-2">
                    <p>
                      {language === "en" && "4.1. Sita Minter is provided \"as is\" and \"as available,\" without warranties of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement."}
                      {language === "zh" && "4.1. Sita Minter 按「原样」和「可用性」提供，不提供任何明示或暗示的保证，包括但不限于适销性、特定用途的适用性或不侵权。"}
                      {language === "es" && "4.1. Sita Minter se proporciona \"tal cual\" y \"según disponibilidad\", sin garantías de ningún tipo, explícitas o implícitas, incluidas, entre otras, la comerciabilidad, la idoneidad para un propósito particular o la no infracción."}
                      {language === "pt" && "4.1. O Sita Minter é fornecido \"como está\" e \"conforme disponível\", sem garantias de qualquer tipo, expressas ou implícitas, incluindo, mas não limitado a, comercialização, adequação a um propósito específico ou não violação."}
                      {language === "fr" && "4.1. Sita Minter est fourni \"tel quel\" et \"selon disponibilité\", sans garanties d'aucune sorte, explicites ou implicites, y compris, mais sans s'y limiter, la qualité marchande, l'adéquation à un usage particulier ou la non-contrefaçon."}
                      {language === "it" && "4.1. Sita Minter è fornito \"così com'è\" e \"come disponibile\", senza garanzie di alcun tipo, esplicite o implicite, incluse ma non limitate a commerciabilità, idoneità per uno scopo particolare o non violazione."}
                    </p>
                    <p>
                      {language === "en" && "4.2. The Creators do not guarantee that Sita Minter will be free of errors, secure, or uninterrupted. The Nervos Network may experience delays, forks, or other issues outside our control."}
                      {language === "zh" && "4.2. 创建者不保证 Sita Minter 没有错误、安全或不中断。Nervos Network 可能会遇到我们无法控制的延迟、分叉或其他问题。"}
                      {language === "es" && "4.2. Los Creadores no garantizan que Sita Minter esté libre de errores, sea seguro o ininterrumpido. La Red Nervos puede experimentar retrasos, bifurcaciones u otros problemas fuera de nuestro control."}
                      {language === "pt" && "4.2. Os Criadores não garantem que o Sita Minter estará livre de erros, seguro ou ininterrupto. A Nervos Network pode experimentar atrasos, bifurcações ou outros problemas fora do nosso controle."}
                      {language === "fr" && "4.2. Les Créateurs ne garantissent pas que Sita Minter sera exempt d'erreurs, sécurisé ou ininterrompu. Le réseau Nervos peut subir des retards, des fourches ou d'autres problèmes hors de notre contrôle."}
                      {language === "it" && "4.2. I Creatori non garantiscono che Sita Minter sarà privo di errori, sicuro o ininterrotto. La rete Nervos potrebbe subire ritardi, fork o altri problemi al di fuori del nostro controllo."}
                    </p>
                  </div>
                </section>

                {/* Limitation of Liability */}
                <section>
                  <h5 className={`font-semibold ${accentTextGradient}`}>
                    5. {translations[language as keyof typeof translations]?.limitationOfLiability || translations.en.limitationOfLiability}
                  </h5>
                  <div className="pl-2 mt-2 space-y-2">
                    <p>
                      {language === "en" && "5.1. To the fullest extent permitted by law, the Creators shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of Sita Minter, including but not limited to:"}
                      {language === "zh" && "5.1. 在法律允许的最大范围内，创建者不对因您使用 Sita Minter 而产生的任何直接、间接、偶然、后果性或惩罚性损害负责，包括但不限于:"}
                      {language === "es" && "5.1. En la medida máxima permitida por la ley, los Creadores no serán responsables de ningún daño directo, indirecto, incidental, consecuente o punitivo que surja de su uso de Sita Minter, incluidos, entre otros:"}
                      {language === "pt" && "5.1. Na extensão máxima permitida por lei, os Criadores não serão responsáveis por quaisquer danos diretos, indiretos, incidentais, consequentes ou punitivos decorrentes do seu uso do Sita Minter, incluindo, mas não limitado a:"}
                      {language === "fr" && "5.1. Dans toute la mesure permise par la loi, les Créateurs ne seront pas responsables des dommages directs, indirects, accessoires, consécutifs ou punitifs résultant de votre utilisation de Sita Minter, y compris, mais sans s'y limiter:"}
                      {language === "it" && "5.1. Nella massima misura consentita dalla legge, i Creatori non saranno responsabili per qualsiasi danno diretto, indiretto, incidentale, consequenziale o punitivo derivante dall'uso di Sita Minter, inclusi ma non limitati a:"}
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        {language === "en" && "Financial losses from token value changes"}
                        {language === "zh" && "代币价值变化导致的财务损失"}
                        {language === "es" && "Pérdidas financieras por cambios en el valor del token"}
                        {language === "pt" && "Perdas financeiras devido a mudanças no valor do token"}
                        {language === "fr" && "Pertes financières dues aux variations de la valeur des jetons"}
                        {language === "it" && "Perdite finanziarie da cambiamenti di valore del token"}
                      </li>
                      <li>
                        {language === "en" && "Unauthorized access to your wallet or private keys"}
                        {language === "zh" && "未经授权访问您的钱包或私钥"}
                        {language === "es" && "Acceso no autorizado a su billetera o claves privadas"}
                        {language === "pt" && "Acesso não autorizado à sua carteira ou chaves privadas"}
                        {language === "fr" && "Accès non autorisé à votre portefeuille ou clés privées"}
                        {language === "it" && "Accesso non autorizzato al tuo portafoglio o chiavi private"}
                      </li>
                      <li>
                        {language === "en" && "Legal claims related to your minted tokens (e.g., intellectual property disputes)"}
                        {language === "zh" && "与您铸造的代币相关的法律索赔（例如，知识产权纠纷）"}
                        {language === "es" && "Reclamaciones legales relacionadas con sus tokens acuñados (por ejemplo, disputas de propiedad intelectual)"}
                        {language === "pt" && "Reclamações legais relacionadas aos seus tokens cunhados (por exemplo, disputas de propriedade intelectual)"}
                        {language === "fr" && "Réclamations juridiques liées à vos jetons émis (par exemple, litiges de propriété intellectuelle)"}
                        {language === "it" && "Rivendicazioni legali relative ai token coniati (ad esempio, controversie sulla proprietà intellettuale)"}
                      </li>
                      <li>
                        {language === "en" && "Technical failures of the Nervos Network or Sita Minter"}
                        {language === "zh" && "Nervos Network 或 Sita Minter 的技术故障"}
                        {language === "es" && "Fallos técnicos de la Red Nervos o Sita Minter"}
                        {language === "pt" && "Falhas técnicas da Nervos Network ou Sita Minter"}
                        {language === "fr" && "Défaillances techniques du réseau Nervos ou de Sita Minter"}
                        {language === "it" && "Guasti tecnici della rete Nervos o di Sita Minter"}
                      </li>
                    </ul>
                    <p>
                      {language === "en" && "5.2. The Creators bear no responsibility for how Users or third parties utilize, trade, or distribute tokens minted through Sita Minter."}
                      {language === "zh" && "5.2. 创建者对用户或第三方如何利用、交易或分发通过 Sita Minter 铸造的代币不承担任何责任。"}
                      {language === "es" && "5.2. Los Creadores no tienen ninguna responsabilidad por la forma en que los Usuarios o terceros utilizan, comercian o distribuyen los tokens acuñados a través de Sita Minter."}
                      {language === "pt" && "5.2. Os Criadores não assumem qualquer responsabilidade pela forma como os Utilizadores ou terceiros utilizam, negociam ou distribuem tokens cunhados através do Sita Minter."}
                      {language === "fr" && "5.2. Les Créateurs n'assument aucune responsabilité quant à la façon dont les Utilisateurs ou les tiers utilisent, échangent ou distribuent les jetons émis via Sita Minter."}
                      {language === "it" && "5.2. I Creatori non hanno alcuna responsabilità per come gli Utenti o terze parti utilizzano, scambiano o distribuiscono i token coniati tramite Sita Minter."}
                    </p>
                  </div>
                </section>

                {/* Decentralized Governance */}
                <section>
                  <h5 className={`font-semibold ${accentTextGradient}`}>
                    6. {translations[language as keyof typeof translations]?.decentralizedGovernance || translations.en.decentralizedGovernance}
                  </h5>
                  <div className="pl-2 mt-2 space-y-2">
                    <p>
                      {language === "en" && "6.1. Sita Minter operates via smart contracts on the Nervos Network. These contracts are autonomous and execute according to their programmed logic. The Creators do not hold custody over minted tokens or control User actions post-minting."}
                      {language === "zh" && "6.1. Sita Minter 通过 Nervos Network 上的智能合约运行。这些合约是自主的，并按照其程序逻辑执行。创建者不持有已铸造代币的托管权，也不控制用户在铸造后的行动。"}
                      {language === "es" && "6.1. Sita Minter opera a través de contratos inteligentes en la Red Nervos. Estos contratos son autónomos y se ejecutan según su lógica programada. Los Creadores no tienen custodia sobre los tokens acuñados ni controlan las acciones del Usuario después de la acuñación."}
                      {language === "pt" && "6.1. O Sita Minter opera via contratos inteligentes na Nervos Network. Estes contratos são autônomos e executam de acordo com sua lógica programada. Os Criadores não têm custódia sobre tokens cunhados ou controlam ações do Utilizador após a cunhagem."}
                      {language === "fr" && "6.1. Sita Minter fonctionne via des contrats intelligents sur le réseau Nervos. Ces contrats sont autonomes et s'exécutent selon leur logique programmée. Les Créateurs ne détiennent pas la garde des jetons émis ou ne contrôlent pas les actions de l'Utilisateur après l'émission."}
                      {language === "it" && "6.1. Sita Minter opera tramite smart contract sulla rete Nervos. Questi contratti sono autonomi e vengono eseguiti secondo la loro logica programmata. I Creatori non hanno la custodia dei token coniati o controllano le azioni dell'Utente dopo la coniazione."}
                    </p>
                    <p>
                      {language === "en" && "6.2. Updates or modifications to Sita Minter's code, if any, will be proposed and implemented through a decentralized governance process, subject to community participation where supported by the Nervos Network ecosystem."}
                      {language === "zh" && "6.2. 如有任何对 Sita Minter 代码的更新或修改，将通过去中心化治理流程提出和实施，并在 Nervos Network 生态系统支持的情况下接受社区参与。"}
                      {language === "es" && "6.2. Las actualizaciones o modificaciones al código de Sita Minter, si las hubiera, serán propuestas e implementadas a través de un proceso de gobernanza descentralizada, sujeto a la participación de la comunidad donde sea apoyado por el ecosistema de la Red Nervos."}
                      {language === "pt" && "6.2. Atualizações ou modificações no código do Sita Minter, se houver, serão propostas e implementadas através de um processo de governança descentralizada, sujeito à participação da comunidade onde for apoiado pelo ecossistema da Nervos Network."}
                      {language === "fr" && "6.2. Les mises à jour ou modifications du code de Sita Minter, le cas échéant, seront proposées et mises en œuvre par le biais d'un processus de gouvernance décentralisé, sous réserve de la participation de la communauté lorsqu'elle est soutenue par l'écosystème du réseau Nervos."}
                      {language === "it" && "6.2. Aggiornamenti o modifiche al codice di Sita Minter, se presenti, saranno proposti e implementati attraverso un processo di governance decentralizzato, soggetto alla partecipazione della comunità dove supportato dall'ecosistema della rete Nervos."}
                    </p>
                  </div>
                </section>

                {/* Prohibited Activities */}
                <section>
                  <h5 className={`font-semibold ${accentTextGradient}`}>
                    8. {translations[language as keyof typeof translations]?.prohibitedActivities || translations.en.prohibitedActivities}
                  </h5>
                  <div className="pl-2 mt-2 space-y-2">
                    <p>
                      {language === "en" && "8.1. You agree not to use Sita Minter for unlawful or prohibited purposes, including but not limited to:"}
                      {language === "zh" && "8.1. 您同意不将 Sita Minter 用于非法或禁止的目的，包括但不限于："}
                      {language === "es" && "8.1. Usted acepta no utilizar Sita Minter para fines ilícitos o prohibidos, incluidos, entre otros:"}
                      {language === "pt" && "8.1. Você concorda em não usar o Sita Minter para fins ilegais ou proibidos, incluindo, mas não se limitando a:"}
                      {language === "fr" && "8.1. Vous acceptez de ne pas utiliser Sita Minter à des fins illégales ou interdites, notamment :"}
                      {language === "it" && "8.1. Accetti di non utilizzare Sita Minter per scopi illegali o proibiti, inclusi ma non limitati a:"}
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        {language === "en" && "Minting tokens that violate intellectual property rights;"}
                        {language === "zh" && "铸造侵犯知识产权的代币；"}
                        {language === "es" && "Acuñar tokens que violen derechos de propiedad intelectual;"}
                        {language === "pt" && "Cunhar tokens que violem direitos de propriedade intelectual;"}
                        {language === "fr" && "Émission de jetons qui violent les droits de propriété intellectuelle;"}
                        {language === "it" && "Coniare token che violano i diritti di proprietà intellettuale;"}
                      </li>
                      <li>
                        {language === "en" && "Engaging in fraudulent or deceptive practices;"}
                        {language === "zh" && "从事欺诈或欺骗性行为；"}
                        {language === "es" && "Participar en prácticas fraudulentas o engañosas;"}
                        {language === "pt" && "Envolver-se em práticas fraudulentas ou enganosas;"}
                        {language === "fr" && "Se livrer à des pratiques frauduleuses ou trompeuses;"}
                        {language === "it" && "Impegnarsi in pratiche fraudolente o ingannevoli;"}
                      </li>
                      <li>
                        {language === "en" && "Attempting to exploit or compromise Sita Minter or the Nervos Network."}
                        {language === "zh" && "试图利用或损害 Sita Minter 或 Nervos Network。"}
                        {language === "es" && "Intentar explotar o comprometer Sita Minter o la Red Nervos."}
                        {language === "pt" && "Tentar explorar ou comprometer o Sita Minter ou a Nervos Network."}
                        {language === "fr" && "Tenter d'exploiter ou de compromettre Sita Minter ou le réseau Nervos."}
                        {language === "it" && "Tentare di sfruttare o compromettere Sita Minter o la rete Nervos."}
                      </li>
                    </ul>
                    <p>
                      {language === "en" && "8.2. While the Creators cannot enforce these restrictions due to decentralization, Users engaging in such activities may face legal consequences from authorities or affected parties."}
                      {language === "zh" && "8.2. 虽然由于去中心化，创建者无法强制执行这些限制，但从事此类活动的用户可能会面临来自当局或受影响方的法律后果。"}
                      {language === "es" && "8.2. Si bien los Creadores no pueden hacer cumplir estas restricciones debido a la descentralización, los Usuarios que participen en tales actividades pueden enfrentar consecuencias legales de las autoridades o partes afectadas."}
                      {language === "pt" && "8.2. Embora os Criadores não possam impor essas restrições devido à descentralização, os Utilizadores que se envolvam em tais atividades podem enfrentar consequências legais de autoridades ou partes afetadas."}
                      {language === "fr" && "8.2. Bien que les Créateurs ne puissent pas faire respecter ces restrictions en raison de la décentralisation, les Utilisateurs qui se livrent à de telles activités peuvent faire face à des conséquences juridiques de la part des autorités ou des parties concernées."}
                      {language === "it" && "8.2. Sebbene i Creatori non possano far rispettare queste restrizioni a causa della decentralizzazione, gli Utenti che si impegnano in tali attività potrebbero affrontare conseguenze legali da parte delle autorità o delle parti interessate."}
                    </p>
                  </div>
                </section>

                {/* Indemnification */}
                <section>
                  <h5 className={`font-semibold ${accentTextGradient}`}>
                    9. {translations[language as keyof typeof translations]?.indemnification || translations.en.indemnification}
                  </h5>
                  <div className="pl-2 mt-2 space-y-2">
                    <p>
                      {language === "en" && "9.1. You agree to indemnify and hold harmless the Creators, contributors, and any affiliates from claims, losses, or damages (including legal fees) arising from your use of Sita Minter or the tokens you mint, including claims related to intellectual property or regulatory violations."}
                      {language === "zh" && "9.1. 您同意赔偿并使创建者、贡献者和任何附属机构免受因您使用 Sita Minter 或您铸造的代币而产生的索赔、损失或损害（包括法律费用），包括与知识产权或监管违规相关的索赔。"}
                      {language === "es" && "9.1. Usted acepta indemnizar y eximir de responsabilidad a los Creadores, colaboradores y cualquier afiliado de reclamaciones, pérdidas o daños (incluidos los honorarios legales) que surjan de su uso de Sita Minter o los tokens que acuñe, incluidas las reclamaciones relacionadas con la propiedad intelectual o violaciones regulatorias."}
                      {language === "pt" && "9.1. Você concorda em indenizar e isentar os Criadores, colaboradores e quaisquer afiliados de reclamações, perdas ou danos (incluindo honorários advocatícios) decorrentes do seu uso do Sita Minter ou dos tokens que você cunha, incluindo reclamações relacionadas a violações de propriedade intelectual ou regulatórias."}
                      {language === "fr" && "9.1. Vous acceptez d'indemniser et de dégager de toute responsabilité les Créateurs, les contributeurs et tout affilié contre les réclamations, pertes ou dommages (y compris les frais juridiques) résultant de votre utilisation de Sita Minter ou des jetons que vous émettez, y compris les réclamations liées à des violations de propriété intellectuelle ou réglementaires."}
                      {language === "it" && "9.1. Accetti di indennizzare e tenere indenni i Creatori, i collaboratori e qualsiasi affiliato da reclami, perdite o danni (compresi gli onorari legali) derivanti dal tuo utilizzo di Sita Minter o dai token che crei, inclusi i reclami relativi a violazioni di proprietà intellettuale o normative."}
                    </p>
                  </div>
                </section>

                {/* Termination */}
                <section>
                  <h5 className={`font-semibold ${accentTextGradient}`}>
                    10. {translations[language as keyof typeof translations]?.termination || translations.en.termination}
                  </h5>
                  <div className="pl-2 mt-2 space-y-2">
                    <p>
                      {language === "en" && "10.1. As a decentralized application, Sita Minter cannot be \"terminated\" by the Creators. However, the Creators may cease support for the interface or codebase at their discretion without prior notice."}
                      {language === "zh" && "10.1. 作为一个去中心化应用程序，Sita Minter 不能被创建者\"终止\"。但是，创建者可以自行决定停止对界面或代码库的支持，无需事先通知。"}
                      {language === "es" && "10.1. Como aplicación descentralizada, Sita Minter no puede ser \"terminada\" por los Creadores. Sin embargo, los Creadores pueden cesar el soporte para la interfaz o el código base a su discreción sin previo aviso."}
                      {language === "pt" && "10.1. Como um aplicativo descentralizado, o Sita Minter não pode ser \"encerrado\" pelos Criadores. No entanto, os Criadores podem cessar o suporte à interface ou à base de código a seu critério, sem aviso prévio."}
                      {language === "fr" && "10.1. En tant qu'application décentralisée, Sita Minter ne peut pas être \"résilié\" par les Créateurs. Cependant, les Créateurs peuvent cesser le support de l'interface ou du code à leur discrétion sans préavis."}
                      {language === "it" && "10.1. In quanto applicazione decentralizzata, Sita Minter non può essere \"terminato\" dai Creatori. Tuttavia, i Creatori possono cessare il supporto per l'interfaccia o il codice base a loro discrezione senza preavviso."}
                    </p>
                    <p>
                      {language === "en" && "10.2. Your ability to access Sita Minter may be affected by external factors, such as changes to the Nervos Network or your technical setup, over which the Creators have no control."}
                      {language === "zh" && "10.2. 您访问 Sita Minter 的能力可能会受到外部因素的影响，例如对 Nervos Network 的更改或您的技术设置，创建者对此没有控制权。"}
                      {language === "es" && "10.2. Su capacidad para acceder a Sita Minter puede verse afectada por factores externos, como cambios en la Red Nervos o su configuración técnica, sobre los cuales los Creadores no tienen control."}
                      {language === "pt" && "10.2. Sua capacidade de acessar o Sita Minter pode ser afetada por fatores externos, como mudanças na Nervos Network ou em sua configuração técnica, sobre os quais os Criadores não têm controle."}
                      {language === "fr" && "10.2. Votre capacité à accéder à Sita Minter peut être affectée par des facteurs externes, tels que des modifications du réseau Nervos ou de votre configuration technique, sur lesquels les Créateurs n'ont aucun contrôle."}
                      {language === "it" && "10.2. La tua capacità di accedere a Sita Minter potrebbe essere influenzata da fattori esterni, come modifiche alla rete Nervos o alla tua configurazione tecnica, sui quali i Creatori non hanno alcun controllo."}
                    </p>
                  </div>
                </section>

                {/* Governing Law and Jurisdiction */}
                <section>
                  <h5 className={`font-semibold ${accentTextGradient}`}>
                    11. {translations[language as keyof typeof translations]?.governingLaw || translations.en.governingLaw}
                  </h5>
                  <div className="pl-2 mt-2 space-y-2">
                    <p>
                      {language === "en" && "11.1. These T&Cs align with the principles of decentralization and the operational framework of the Nervos Network. Due to the global nature of blockchain technology, no single jurisdiction exclusively governs Sita Minter."}
                      {language === "zh" && "11.1. 这些条款与条件符合去中心化原则和 Nervos Network 的运营框架。由于区块链技术的全球性质，没有单一司法管辖区专门管辖 Sita Minter。"}
                      {language === "es" && "11.1. Estos T&C se alinean con los principios de descentralización y el marco operativo de la Red Nervos. Debido a la naturaleza global de la tecnología blockchain, ninguna jurisdicción única gobierna exclusivamente Sita Minter."}
                      {language === "pt" && "11.1. Estes T&C estão alinhados com os princípios de descentralização e o quadro operacional da Nervos Network. Devido à natureza global da tecnologia blockchain, nenhuma jurisdição exclusiva governa exclusivamente o Sita Minter."}
                      {language === "fr" && "11.1. Ces CGU s'alignent sur les principes de décentralisation et le cadre opérationnel du réseau Nervos. En raison de la nature mondiale de la technologie blockchain, aucune juridiction unique ne régit exclusivement Sita Minter."}
                      {language === "it" && "11.1. Questi T&C si allineano con i principi di decentralizzazione e il quadro operativo della rete Nervos. A causa della natura globale della tecnologia blockchain, nessuna giurisdizione singola governa esclusivamente Sita Minter."}
                    </p>
                    <p>
                      {language === "en" && "11.2. Disputes arising from your use of Sita Minter must be resolved independently by you, as the Creators do not participate in dispute resolution."}
                      {language === "zh" && "11.2. 因您使用 Sita Minter 而产生的争议必须由您独立解决，因为创建者不参与争议解决。"}
                      {language === "es" && "11.2. Las disputas que surjan de su uso de Sita Minter deben ser resueltas independientemente por usted, ya que los Creadores no participan en la resolución de disputas."}
                      {language === "pt" && "11.2. As disputas decorrentes do seu uso do Sita Minter devem ser resolvidas independentemente por você, pois os Criadores não participam da resolução de disputas."}
                      {language === "fr" && "11.2. Les litiges découlant de votre utilisation de Sita Minter doivent être résolus indépendamment par vous, car les Créateurs ne participent pas à la résolution des litiges."}
                      {language === "it" && "11.2. Le controversie derivanti dall'uso di Sita Minter devono essere risolte in modo indipendente da te, poiché i Creatori non partecipano alla risoluzione delle controversie."}
                    </p>
                  </div>
                </section>

                {/* Amendments */}
                <section>
                  <h5 className={`font-semibold ${accentTextGradient}`}>
                    12. {translations[language as keyof typeof translations]?.amendments || translations.en.amendments}
                  </h5>
                  <div className="pl-2 mt-2 space-y-2">
                    <p>
                      {language === "en" && "12.1. The Creators may revise these T&Cs at any time by posting an updated version. Your continued use of Sita Minter after such changes signifies acceptance of the revised terms."}
                      {language === "zh" && "12.1. 创建者可随时通过发布更新版本来修改这些条款和条件。在此类更改后继续使用 Sita Minter 表示接受修订后的条款。"}
                      {language === "es" && "12.1. Los Creadores pueden revisar estos T&C en cualquier momento publicando una versión actualizada. Su uso continuado de Sita Minter después de dichos cambios significa la aceptación de los términos revisados."}
                      {language === "pt" && "12.1. Os Criadores podem revisar estes T&C a qualquer momento, publicando uma versão atualizada. Seu uso continuado do Sita Minter após tais alterações significa aceitação dos termos revisados."}
                      {language === "fr" && "12.1. Les Créateurs peuvent réviser ces CGU à tout moment en publiant une version mise à jour. Votre utilisation continue de Sita Minter après de tels changements signifie l'acceptation des termes révisés."}
                      {language === "it" && "12.1. I Creatori possono rivedere questi T&C in qualsiasi momento pubblicando una versione aggiornata. Il tuo uso continuato di Sita Minter dopo tali modifiche significa l'accettazione dei termini rivisti."}
                    </p>
                  </div>
                </section>

                {/* Contact */}
                <section>
                  <h5 className={`font-semibold ${accentTextGradient}`}>
                    13. {translations[language as keyof typeof translations]?.contact || translations.en.contact}
                  </h5>
                  <div className="pl-2 mt-2 space-y-2">
                    <p>
                      {language === "en" && (
                        <>
                          13.1. For inquiries or feedback, please engage with the community via{" "}
                          <a 
                            href="https://t.me/telmotalks/781" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                          >
                            Telegram
                          </a>.
                        </>
                      )}
                      {language === "zh" && (
                        <>
                          13.1. 如有疑问或反馈，请通过{" "}
                          <a 
                            href="https://t.me/telmotalks/781" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                          >
                            Telegram
                          </a>
                          {" "}与社区互动。
                        </>
                      )}
                      {language === "es" && (
                        <>
                          13.1. Para consultas o comentarios, interactúe con la comunidad a través de{" "}
                          <a 
                            href="https://t.me/telmotalks/781" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                          >
                            Telegram
                          </a>.
                        </>
                      )}
                      {language === "pt" && (
                        <>
                          13.1. Para perguntas ou feedback, por favor, interaja com a comunidade via{" "}
                          <a 
                            href="https://t.me/telmotalks/781" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                          >
                            Telegram
                          </a>.
                        </>
                      )}
                      {language === "fr" && (
                        <>
                          13.1. Pour toute demande ou commentaire, veuillez interagir avec la communauté via{" "}
                          <a 
                            href="https://t.me/telmotalks/781" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                          >
                            Telegram
                          </a>.
                        </>
                      )}
                      {language === "it" && (
                        <>
                          13.1. Per domande o feedback, interagisci con la comunità tramite{" "}
                          <a 
                            href="https://t.me/telmotalks/781" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                          >
                            Telegram
                          </a>.
                        </>
                      )}
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            className={`w-full ${network === "mainnet" ? "bg-gradient-to-r from-orange-600 to-red-600" : "bg-gradient-to-r from-purple-600 to-indigo-600"} hover:opacity-90 text-white transition`}
            onClick={() => onOpenChange(false)}
          >
            {understandText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}