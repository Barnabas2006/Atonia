import type { BusinessConfig, BusinessId } from '../types/index.ts';

export const BUSINESS_REGISTRY: Record<BusinessId, BusinessConfig> = {
  ATONIA_MARKETPLACE: {
    id: 'ATONIA_MARKETPLACE',
    code: 'ATONIA_MKT',
    name: 'ATONIA MARKETPLACE',
    legalEntity: 'Atonia Commercial Brands Group Ltd',
    domainCategory: 'Retail',
    status: 'online',
    uptime: '99.98%',
    activeLiveSessions: 482,
    openTasks: 14,
    autonomousResolutionRate: 91.2,
    meanHandleTime: '1m 12s',
    description:
      'Global retail logistics, multi-region customer service routing, return authorization automation, and real-time inventory-synchronized order inquiries.',
    supportedChannels: ['web', 'mobile_app', 'voice', 'email'],
    integrations: [
      { name: 'Amazon SP-API', type: 'Marketplace Feed', status: 'awaiting_credentials', latencyMs: 310 },
      { name: 'ShipStation Sync', type: 'Fulfillment & Logistics', status: 'connected', latencyMs: 140 },
      { name: 'Zendesk Orders', type: 'Ticketing Core', status: 'connected', latencyMs: 195 },
      { name: 'Inventory DB', type: 'Warehouse ERP', status: 'connected', latencyMs: 45 }
    ],
    activeIntents: [
      'Damaged item return',
      'Order delay tracking',
      'Bulk discount inquiry',
      'Invoice request',
      'Product compatibility inquiry',
      'Usage instructions'
    ],
    autonomousLimits: {
      maxFinancialThreshold: 500, // In GBP/USD
      requiresHumanUnderwriting: false,
      requiresFraudVerification: false
    }
  },

  ATONIA_INSURANCE: {
    id: 'ATONIA_INSURANCE',
    code: 'ATONIA_INS',
    name: 'ATONIA INSURANCE',
    legalEntity: 'Atonia Insurance Brokers Limited',
    domainCategory: 'Insurtech Brokerage',
    status: 'online',
    uptime: '100%',
    activeLiveSessions: 318,
    openTasks: 28,
    autonomousResolutionRate: 78.4,
    meanHandleTime: '5m 04s',
    description:
      'Underwriting triage, automated First Notice of Loss (FNOL) claims processing, real-time mid-term policy endorsements, and compliant renewal quoting.',
    supportedChannels: ['whatsapp', 'web', 'voice', 'email'],
    integrations: [
      { name: 'Acturis BMS API', type: 'Broker Management System', status: 'awaiting_credentials', latencyMs: 420 },
      { name: 'DVLA Registry', type: 'Vehicle Records Hub', status: 'connected', latencyMs: 28 },
      { name: 'Underwriting Core', type: 'Syndicate Pricing Engine', status: 'connected', latencyMs: 110 },
      { name: 'LexisNexis Risk', type: 'Anti-Fraud Verification', status: 'connected', latencyMs: 215 }
    ],
    activeIntents: [
      'Commercial Fleet Endorsement',
      'Home insurance renewal',
      'FNOL claim intake',
      'Certificate issue',
      'Coverage boundary dispute',
      'Missing document intake'
    ],
    autonomousLimits: {
      maxFinancialThreshold: 1000, // Premium changes over £1000 require human underwriter
      requiresHumanUnderwriting: true,
      requiresFraudVerification: true
    }
  },

  EUREKA: {
    id: 'EUREKA',
    code: 'EUREKA_BANK',
    name: 'EUREKA',
    legalEntity: 'Eureka Capital Digital Banking Ltd',
    domainCategory: 'Banking',
    status: 'online',
    uptime: '99.99%',
    activeLiveSessions: 412,
    openTasks: 9,
    autonomousResolutionRate: 94.6,
    meanHandleTime: '3m 50s',
    description:
      'Account balance inquiries, suspicious transaction verification, biometric card limit modifications, and cryptographic KYC authentication handoffs.',
    supportedChannels: ['web', 'mobile_app', 'voice'],
    integrations: [
      { name: 'OpenBanking API', type: 'Core Banking Protocol', status: 'connected', latencyMs: 65 },
      { name: 'Plaid Gateway', type: 'Account Aggregation', status: 'connected', latencyMs: 120 },
      { name: 'Fraud Sentinel AI', type: 'Risk Gate & Anomaly Detection', status: 'connected', latencyMs: 38 },
      { name: 'Card Processor Engine', type: 'Card Network Switch', status: 'awaiting_credentials', latencyMs: 85 }
    ],
    activeIntents: [
      'Wire transfer authentication',
      'Direct debit cancellation',
      'Card limit adjustment',
      'KYC identity refresh',
      'Lost card freeze',
      'Account balance check'
    ],
    autonomousLimits: {
      maxFinancialThreshold: 200, // Withdrawals/transfers > £200 require strict step-up approval
      requiresHumanUnderwriting: false,
      requiresFraudVerification: true
    }
  },

  SORPLOS_INSURTECH: {
    id: 'SORPLOS_INSURTECH',
    code: 'SORPLOS',
    name: 'SORPLOS INSURTECH',
    legalEntity: 'Sorplos Insurance Aggregation & Quoting Limited',
    domainCategory: 'Aggregator',
    status: 'online',
    uptime: '99.95%',
    activeLiveSessions: 216,
    openTasks: 18,
    autonomousResolutionRate: 84.1,
    meanHandleTime: '2m 15s',
    description:
      'Real-time multi-carrier quotation indexing, automated customer document OCR verification, dynamic price comparison matrices, and instant policy bind.',
    supportedChannels: ['whatsapp', 'web', 'voice'],
    integrations: [
      { name: 'Carrier Aggregator (14)', type: 'Multi-Insurer Hub', status: 'connected', latencyMs: 320 },
      { name: 'OCR Document Engine', type: 'NIN/BVN & Passport OCR', status: 'connected', latencyMs: 180 },
      { name: 'Stripe Billing', type: 'Premium Payment Gateway', status: 'connected', latencyMs: 95 },
      { name: 'Credit Reference API', type: 'Bureau Risk Scorer', status: 'awaiting_credentials', latencyMs: 240 }
    ],
    activeIntents: [
      'Instant health policy comparison',
      'Telematics quote calculation',
      'Policy bind execution',
      'Multi-vehicle quote',
      'Claims FNOL intake',
      'NIN/BVN verification'
    ],
    autonomousLimits: {
      maxFinancialThreshold: 1500,
      requiresHumanUnderwriting: false,
      requiresFraudVerification: true
    }
  }
};
