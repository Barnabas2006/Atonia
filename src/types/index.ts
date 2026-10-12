export type BusinessId =
  | 'ATONIA_MARKETPLACE'
  | 'ATONIA_INSURANCE'
  | 'EUREKA'
  | 'SORPLOS_INSURTECH';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'OPERATIONS_LEAD'
  | 'UNDERWRITER_SPECIALIST'
  | 'FRAUD_SPECIALIST'
  | 'SUPPORT_AGENT'
  | 'AUDITOR';

export type ChannelType = 'whatsapp' | 'web' | 'voice' | 'mobile_app' | 'email';

export type ConversationStatus =
  | 'autonomous_answering'
  | 'executing_tools'
  | 'collecting_info'
  | 'human_monitoring'
  | 'escalated_to_human'
  | 'resolved'
  | 'closed';

export type PriorityLevel = 'critical' | 'high' | 'normal' | 'low';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  businessAccess: BusinessId[] | 'ALL';
  avatarUrl: string;
  title: string;
  status: 'active' | 'busy' | 'offline';
  assignedQueueCount?: number;
}

export interface BusinessConfig {
  id: BusinessId;
  code: string;
  name: string;
  legalEntity: string;
  domainCategory: 'Retail' | 'Insurtech Brokerage' | 'Banking' | 'Aggregator';
  status: 'online' | 'degraded' | 'maintenance';
  uptime: string;
  activeLiveSessions: number;
  openTasks: number;
  autonomousResolutionRate: number;
  meanHandleTime: string;
  description: string;
  supportedChannels: ChannelType[];
  integrations: Array<{
    name: string;
    type: string;
    status: 'connected' | 'awaiting_credentials' | 'simulated_boundary' | 'not_configured' | 'configured' | 'error';
    latencyMs?: number;
  }>;
  activeIntents: string[];
  autonomousLimits: {
    maxFinancialThreshold: number;
    requiresHumanUnderwriting: boolean;
    requiresFraudVerification: boolean;
  };
}

export interface CustomerContext {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  accountNumber?: string;
  businessId: BusinessId;
  tier: 'VIP Tier 1' | 'Prime' | 'Standard' | 'Restricted';
  riskScore: number; // 0 - 100
  riskLevel: 'Minimal' | 'Moderate' | 'High' | 'Critical';
  avatarUrl?: string;
  
  // Eureka Banking Specific
  bankingDetails?: {
    iban: string;
    checkingBalance: number;
    accountStatus: 'active' | 'frozen' | 'flagged';
    lastMfaVerification?: string;
    connectedBanks: string[];
  };

  // Sorplos Insurtech Specific
  insurtechDetails?: {
    kycStatus: 'verified' | 'pending' | 'rejected';
    activeQuotes: number;
    activePolicies: string[];
    telematicsScore?: number;
  };

  // Atonia Marketplace Specific
  marketplaceDetails?: {
    recentOrders: Array<{
      orderId: string;
      date: string;
      amount: number;
      status: string;
      sku: string;
      hasRma: boolean;
    }>;
    totalSpend: number;
    returnRate: number;
  };

  // Atonia Insurance Brokers Specific
  brokerageDetails?: {
    policyNumber: string;
    coverageClass: string;
    underwriter: string;
    annualPremium: number;
    pendingEndorsementAmount?: number;
    fleetCount?: number;
    fleetUnits?: Array<{
      vrn: string;
      model: string;
      status: 'Ready' | 'Active' | 'Inspected';
      annualMileage: number;
    }>;
    claimsCount: number;
    ncdYears: number;
  };
}

export interface MessagePart {
  text?: string;
  toolCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  toolResult?: {
    name: string;
    result: Record<string, unknown>;
    verified: boolean;
    sourceApi: string;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'customer' | 'agent' | 'supervisor' | 'system';
  senderName: string;
  timestamp: string;
  content: string;
  parts?: MessagePart[];
  aiMetadata?: {
    model: string;
    latencyMs: number;
    tokens: number;
    confidence: number;
    ruleMatches?: string[];
  };
  governanceEvent?: {
    type: 'LIMIT_OVERRIDE_REQUIRED' | 'LEGAL_BOUNDARY' | 'FRAUD_FLAG';
    description: string;
    authorizedBy?: string;
    authorizedAt?: string;
  };
}

export interface Conversation {
  id: string;
  businessId: BusinessId;
  customerId: string;
  customerName: string;
  customerIdentifier: string; // phone or account#
  customerAvatarUrl?: string;
  channel: ChannelType;
  intent: string;
  intentDetails?: string;
  status: ConversationStatus;
  priority: PriorityLevel;
  lastActivity: string;
  assignedAgent?: string;
  isEscalated: boolean;
  slaBreachCountdownSeconds?: number;
  messages: Message[];
  activeSuggestion?: string;
}

export interface EscalationRecord {
  id: string;
  conversationId: string;
  customerId: string;
  customerName: string;
  businessId: BusinessId;
  reason: string;
  clauseExclusion?: string;
  priority: 'critical' | 'high' | 'medium';
  sentiment: string;
  exposureAmount?: string;
  queueWaitTime: string;
  aiSummary: string;
  requiredAction: string;
  assignedStaff: string | null;
  status: 'pending' | 'in_review' | 'resolved' | 'transferred_to_legal';
  createdAt: string;
  resolvedAt?: string;
  safetyAuditTimeline: Array<{
    timestamp: string;
    type: 'INTENT' | 'KB_QUERY' | 'SAFETY_RULE' | 'HALT_ROUTED';
    title: string;
    detail: string;
  }>;
  supervisorNotes?: string;
}

export interface ToolDefinition {
  name: string;
  businessId: BusinessId | 'SHARED';
  description: string;
  parametersSchema: Record<string, unknown>;
  requiredPermissions: string[];
  requiresHumanConfirmation: boolean;
  isExternalIntegrationLive: boolean;
  externalProvider: string;
}

export interface ToolExecutionEvent {
  id: string;
  toolName: string;
  businessId: BusinessId;
  timestamp: string;
  latencyMs: number;
  statusCode: number;
  statusText: string;
  description: string;
  actor: 'AI_AGENT' | 'HUMAN_SUPERVISOR' | 'SYSTEM';
  actorId: string;
  verified: boolean;
}

export interface KnowledgeDocument {
  id: string;
  businessId: BusinessId;
  title: string;
  category: string;
  summary: string;
  content: string;
  version: string;
  status: 'published' | 'draft' | 'archived';
  lastUpdated: string;
  author: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorType: 'SUPERVISOR' | 'AI_AGENT' | 'SYSTEM' | 'UNDERWRITER';
  businessId: BusinessId;
  customerId?: string;
  action: string;
  tool?: string;
  resource: string;
  result: 'SUCCESS' | 'BLOCKED' | 'FAILED' | 'ESCALATED';
  detail: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

export interface TaskRecord {
  id: string;
  businessId: BusinessId;
  title: string;
  type: 'OCR_KYC' | 'CARRIER_SYNC' | 'QUOTE_CALC' | 'UNDERWRITING_AUDIT' | 'WIRE_CHECK';
  status: 'running' | 'completed' | 'failed' | 'needs_approval';
  progressPercent: number;
  createdAt: string;
  completedAt?: string;
  targetRef: string;
}

export interface VoiceCallSession {
  id: string;
  businessId: BusinessId;
  callerName: string;
  callerPhone: string;
  callerAvatarUrl: string;
  accountRef: string;
  intent: string;
  duration: string;
  latencyMs: number;
  sttEngine: string;
  ttsModel: string;
  sentiment: string;
  complianceFlags: number;
  voiceAuthStatus: 'Passed' | 'Pending' | 'Failed';
  biometricScore: number;
  status: 'streaming' | 'completed' | 'escalated';
  transcripts: Array<{
    time: string;
    speaker: 'caller' | 'agent';
    speakerName: string;
    text: string;
    toolCallTriggered?: string;
    ttsMeta?: string;
  }>;
}
