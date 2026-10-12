import { getConfig } from '../config.ts';
import type { BusinessId } from '../../types/index.ts';

export type IntegrationStatus = 'not_configured' | 'configured' | 'connected' | 'error';

export interface IntegrationDescriptor {
  id: string;
  name: string;
  businessId: BusinessId | 'SHARED';
  provider: string;
  requiredEnvKeys: string[];
  status: IntegrationStatus;
  latencyMs: number | null;
  lastCheck: string;
  description: string;
}

export class IntegrationsService {
  getIntegrationsSummary(): IntegrationDescriptor[] {
    const config = getConfig();
    const env = config.integrations;

    const list: Array<Omit<IntegrationDescriptor, 'status' | 'latencyMs' | 'lastCheck'>> = [
      {
        id: 'int-dvla',
        name: 'DVLA Registry API',
        businessId: 'ATONIA_INSURANCE',
        provider: 'DVLA UK Vehicle Registry',
        requiredEnvKeys: ['DVLA_REGISTRY_API_KEY'],
        description: 'Official UK Vehicle Registration Lookup & MOT validation gateway'
      },
      {
        id: 'int-underwriting-core',
        name: 'Underwriting Core v4',
        businessId: 'ATONIA_INSURANCE',
        provider: 'Lloyds Syndicate 402 Actuarial Gateway',
        requiredEnvKeys: ['UNDERWRITING_CORE_ENDPOINT'],
        description: 'Real-time pro-rated endorsement calculation and binding matrix'
      },
      {
        id: 'int-acturis',
        name: 'Acturis BMS API',
        businessId: 'ATONIA_INSURANCE',
        provider: 'Acturis Broker Management System',
        requiredEnvKeys: ['ACTURIS_BMS_API_KEY'],
        description: 'Broker policy document synchronization and schedule archive'
      },
      {
        id: 'int-openbanking',
        name: 'OpenBanking API',
        businessId: 'EUREKA',
        provider: 'UK Open Banking Directory',
        requiredEnvKeys: ['OPENBANKING_CLIENT_ID', 'OPENBANKING_CLIENT_SECRET'],
        description: 'Authorized AISP/PISP real-time ledger balance and statement inquiry'
      },
      {
        id: 'int-fraud-sentinel',
        name: 'Fraud Sentinel AI',
        businessId: 'EUREKA',
        provider: 'Fraud Sentinel Gateway',
        requiredEnvKeys: ['FRAUD_SENTINEL_GATEWAY_KEY'],
        description: 'Biometric telemetry, device fingerprinting, and wire risk scoring'
      },
      {
        id: 'int-plaid',
        name: 'Plaid Gateway',
        businessId: 'EUREKA',
        provider: 'Plaid Financial Services',
        requiredEnvKeys: ['PLAID_CLIENT_ID', 'PLAID_SECRET'],
        description: 'Linked multi-bank account aggregation and balance verification'
      },
      {
        id: 'int-shipstation',
        name: 'ShipStation Sync',
        businessId: 'ATONIA_MARKETPLACE',
        provider: 'ShipStation API',
        requiredEnvKeys: ['SHIPSTATION_API_KEY'],
        description: 'Multi-carrier freight label dispatch, tracking, and RMA return syncing'
      },
      {
        id: 'int-amazon-sp',
        name: 'Amazon SP-API',
        businessId: 'ATONIA_MARKETPLACE',
        provider: 'Amazon Selling Partner API',
        requiredEnvKeys: ['AMAZON_SP_API_CLIENT_ID', 'AMAZON_SP_API_CLIENT_SECRET'],
        description: 'Direct Amazon B2B orders and FBA fulfillment tracking lookup'
      },
      {
        id: 'int-carrier-aggregator',
        name: 'Carrier Aggregator (14)',
        businessId: 'SORPLOS_INSURTECH',
        provider: 'Sorplos Syndicated Core',
        requiredEnvKeys: ['CARRIER_AGGREGATOR_SECRET'],
        description: 'Multi-carrier unaltered quote aggregation gateway'
      },
      {
        id: 'int-nin-bvn',
        name: 'National Identity Verification (NIN/BVN)',
        businessId: 'SORPLOS_INSURTECH',
        provider: 'National Identity Registry Gateway',
        requiredEnvKeys: ['NIN_BVN_VERIFY_ENDPOINT'],
        description: 'Automated biometric and identity registry verification check'
      },
      {
        id: 'int-stripe',
        name: 'Stripe Corporate Billing',
        businessId: 'SHARED',
        provider: 'Stripe Payments',
        requiredEnvKeys: ['STRIPE_SECRET_KEY'],
        description: 'Corporate premium invoicing and transaction settlement'
      },
      {
        id: 'int-sip-trunk',
        name: 'Telephony SIP Trunk',
        businessId: 'SHARED',
        provider: 'SIP Telephony Switch',
        requiredEnvKeys: ['SIP_TRUNK_URI', 'SIP_AUTH_USER', 'SIP_AUTH_PASSWORD'],
        description: 'Carrier-grade inbound/outbound PCM voice stream gateway'
      }
    ];

    return list.map((item) => {
      // Verify if all required keys are populated
      const allKeysPresent = item.requiredEnvKeys.every((key) => {
        const val = process.env[key];
        return val && val.trim().length > 0;
      });

      // Status resolution rule:
      // - not_configured: missing required credentials
      // - configured: credentials exist in env, awaiting verified live check in Phase 2
      // - connected: only when a verified live check has completed successfully
      // - error: when an integration encountered a communication failure
      const status: IntegrationStatus = allKeysPresent ? 'configured' : 'not_configured';

      return {
        ...item,
        status,
        latencyMs: null, // Honest: no live connection check has run during Phase 1
        lastCheck: allKeysPresent ? 'Credentials Configured (Check Pending)' : 'Awaiting Credentials'
      };
    });
  }

  isIntegrationConfigured(idOrProvider: string): boolean {
    const integrations = this.getIntegrationsSummary();
    const target = integrations.find(
      (i) => i.id === idOrProvider || i.name.toLowerCase().includes(idOrProvider.toLowerCase())
    );
    return target ? target.status === 'configured' || target.status === 'connected' : false;
  }
}

export const integrationsService = new IntegrationsService();
