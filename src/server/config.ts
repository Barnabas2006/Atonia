import dotenv from 'dotenv';

dotenv.config();

export interface ServerConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  mongoUri?: string;
  mongoDbName: string;
  sessionSecret: string;
  jwtSecret: string;
  isMongoConfigured: boolean;

  // External Integration Credentials (Readiness)
  integrations: {
    amazonSpApiClientId?: string;
    amazonSpApiClientSecret?: string;
    shipstationApiKey?: string;
    acturisBmsApiKey?: string;
    dvlaRegistryApiKey?: string;
    underwritingCoreEndpoint?: string;
    openBankingClientId?: string;
    openBankingClientSecret?: string;
    plaidClientId?: string;
    plaidSecret?: string;
    fraudSentinelGatewayKey?: string;
    carrierAggregatorSecret?: string;
    stripeSecretKey?: string;
    ninBvnVerifyEndpoint?: string;
    sipTrunkUri?: string;
    sipAuthUser?: string;
    sipAuthPassword?: string;
  };
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

let cachedConfig: ServerConfig | null = null;

export function loadAndValidateConfig(): ServerConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';

  let port = 3000;
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed) && parsed > 0) {
      port = parsed;
    }
  } else if (process.env.APP_PORT) {
    port = parseInt(process.env.APP_PORT, 10);
  }

  const mongoUri = process.env.MONGODB_URI?.trim();
  const mongoDbName = process.env.MONGODB_DB_NAME?.trim() || 'atonia_agent';

  const sessionSecret = process.env.SESSION_SECRET?.trim() || '';
  const jwtSecret = process.env.JWT_SECRET?.trim() || '';

  const isProduction = nodeEnv === 'production';

  // Strict validation in production mode
  if (isProduction) {
    const missingKeys: string[] = [];
    if (!mongoUri) missingKeys.push('MONGODB_URI');
    if (!sessionSecret) missingKeys.push('SESSION_SECRET');
    if (!jwtSecret) missingKeys.push('JWT_SECRET');

    if (missingKeys.length > 0) {
      throw new ConfigurationError(
        `[CRITICAL CONFIGURATION ERROR] Production environment requires the following environment variables to be set: ${missingKeys.join(
          ', '
        )}. Application startup halted to prevent insecure operation.`
      );
    }
  } else {
    // Development / Test mode: issue loud warnings if critical persistence/secrets are missing
    if (!mongoUri) {
      console.warn(
        '\x1b[33m%s\x1b[0m',
        '[ATONIA CONFIG WARNING] MONGODB_URI is not set. Operating in [DEVELOPMENT-ONLY IN-MEMORY FALLBACK] mode. Changes will NOT persist across server restarts. Set MONGODB_URI in your .env file to enable MongoDB Atlas persistence.'
      );
    }
    if (!sessionSecret) {
      console.warn(
        '\x1b[33m%s\x1b[0m',
        '[ATONIA CONFIG WARNING] SESSION_SECRET is not set. Utilizing development-only ephemeral fallback session key. Set SESSION_SECRET in production.'
      );
    }
    if (!jwtSecret) {
      console.warn(
        '\x1b[33m%s\x1b[0m',
        '[ATONIA CONFIG WARNING] JWT_SECRET is not set. Utilizing development-only ephemeral fallback token key. Set JWT_SECRET in production.'
      );
    }
  }

  const effectiveSessionSecret = sessionSecret || 'dev-ephemeral-session-secret-atonia-insecure';
  const effectiveJwtSecret = jwtSecret || 'dev-ephemeral-jwt-secret-atonia-insecure';

  const config: ServerConfig = {
    port,
    nodeEnv,
    mongoUri: mongoUri || undefined,
    mongoDbName,
    sessionSecret: effectiveSessionSecret,
    jwtSecret: effectiveJwtSecret,
    isMongoConfigured: Boolean(mongoUri),
    integrations: {
      amazonSpApiClientId: process.env.AMAZON_SP_API_CLIENT_ID?.trim() || undefined,
      amazonSpApiClientSecret: process.env.AMAZON_SP_API_CLIENT_SECRET?.trim() || undefined,
      shipstationApiKey: process.env.SHIPSTATION_API_KEY?.trim() || undefined,
      acturisBmsApiKey: process.env.ACTURIS_BMS_API_KEY?.trim() || undefined,
      dvlaRegistryApiKey: process.env.DVLA_REGISTRY_API_KEY?.trim() || undefined,
      underwritingCoreEndpoint: process.env.UNDERWRITING_CORE_ENDPOINT?.trim() || undefined,
      openBankingClientId: process.env.OPENBANKING_CLIENT_ID?.trim() || undefined,
      openBankingClientSecret: process.env.OPENBANKING_CLIENT_SECRET?.trim() || undefined,
      plaidClientId: process.env.PLAID_CLIENT_ID?.trim() || undefined,
      plaidSecret: process.env.PLAID_SECRET?.trim() || undefined,
      fraudSentinelGatewayKey: process.env.FRAUD_SENTINEL_GATEWAY_KEY?.trim() || undefined,
      carrierAggregatorSecret: process.env.CARRIER_AGGREGATOR_SECRET?.trim() || undefined,
      stripeSecretKey: process.env.STRIPE_SECRET_KEY?.trim() || undefined,
      ninBvnVerifyEndpoint: process.env.NIN_BVN_VERIFY_ENDPOINT?.trim() || undefined,
      sipTrunkUri: process.env.SIP_TRUNK_URI?.trim() || undefined,
      sipAuthUser: process.env.SIP_AUTH_USER?.trim() || undefined,
      sipAuthPassword: process.env.SIP_AUTH_PASSWORD?.trim() || undefined
    }
  };

  cachedConfig = config;
  return config;
}

export function getConfig(): ServerConfig {
  if (!cachedConfig) {
    return loadAndValidateConfig();
  }
  return cachedConfig;
}
