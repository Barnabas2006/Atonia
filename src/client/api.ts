import {
  BusinessConfig,
  Conversation,
  CustomerContext,
  EscalationRecord,
  ToolDefinition,
  AuditLogEntry,
  KnowledgeDocument,
  TaskRecord,
  VoiceCallSession,
  User,
  BusinessId
} from '../types/index.ts';

const API_BASE = '/api/v1';

export async function fetchMe(): Promise<{ user: User }> {
  const res = await fetch(`${API_BASE}/auth/me`);
  return res.json();
}

export async function fetchBusinesses(): Promise<{ businesses: BusinessConfig[] }> {
  const res = await fetch(`${API_BASE}/businesses`);
  return res.json();
}

export async function fetchConversations(params?: {
  businessId?: string;
  channel?: string;
  status?: string;
  search?: string;
}): Promise<{ conversations: Conversation[] }> {
  const query = new URLSearchParams();
  if (params?.businessId) query.set('businessId', params.businessId);
  if (params?.channel) query.set('channel', params.channel);
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);

  const res = await fetch(`${API_BASE}/conversations?${query.toString()}`);
  return res.json();
}

export async function fetchConversationById(id: string): Promise<{ conversation: Conversation; customer?: CustomerContext }> {
  const res = await fetch(`${API_BASE}/conversations/${id}`);
  return res.json();
}

export async function postConversationMessage(
  id: string,
  content: string,
  sender: 'supervisor' | 'customer' = 'supervisor',
  senderName: string = 'Elena Vance'
): Promise<{ success: boolean; conversation: Conversation }> {
  const res = await fetch(`${API_BASE}/conversations/${id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, sender, senderName })
  });
  return res.json();
}

export async function takeoverConversation(id: string, supervisorName = 'Elena Vance'): Promise<{ success: boolean; conversation: Conversation }> {
  const res = await fetch(`${API_BASE}/conversations/${id}/takeover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ supervisorName })
  });
  return res.json();
}

export async function processAgentMessage(payload: {
  conversationId: string;
  businessId: BusinessId;
  customerId: string;
  message: string;
  channel?: string;
}) {
  const res = await fetch(`${API_BASE}/agent/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function fetchEscalations(params?: {
  businessId?: string;
  priority?: string;
  status?: string;
}): Promise<{ escalations: EscalationRecord[]; summary: { critical: number; high: number; medium: number; resolvedToday: number } }> {
  const query = new URLSearchParams();
  if (params?.businessId) query.set('businessId', params.businessId);
  if (params?.priority) query.set('priority', params.priority);
  if (params?.status) query.set('status', params.status);

  const res = await fetch(`${API_BASE}/escalations?${query.toString()}`);
  return res.json();
}

export async function assignEscalation(id: string, assignee: string): Promise<{ success: boolean; escalation: EscalationRecord }> {
  const res = await fetch(`${API_BASE}/escalations/${id}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignee })
  });
  return res.json();
}

export async function resolveEscalation(id: string): Promise<{ success: boolean; escalation: EscalationRecord }> {
  const res = await fetch(`${API_BASE}/escalations/${id}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

export async function saveEscalationNotes(id: string, notes: string): Promise<{ success: boolean; escalation: EscalationRecord }> {
  const res = await fetch(`${API_BASE}/escalations/${id}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes })
  });
  return res.json();
}

export async function fetchTools(businessId?: string): Promise<{ tools: ToolDefinition[]; recentExecutions: unknown[] }> {
  const url = businessId ? `${API_BASE}/tools?businessId=${businessId}` : `${API_BASE}/tools`;
  const res = await fetch(url);
  return res.json();
}

export async function executeTool(payload: {
  toolName: string;
  businessId: BusinessId;
  args?: Record<string, unknown>;
  customerId?: string;
}) {
  const res = await fetch(`${API_BASE}/tools/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function fetchKnowledge(businessId?: string, search?: string): Promise<{ documents: KnowledgeDocument[] }> {
  const query = new URLSearchParams();
  if (businessId) query.set('businessId', businessId);
  if (search) query.set('search', search);

  const res = await fetch(`${API_BASE}/knowledge?${query.toString()}`);
  return res.json();
}

export async function fetchAuditLogs(businessId?: string): Promise<{ auditLogs: AuditLogEntry[] }> {
  const url = businessId && businessId !== 'ALL' ? `${API_BASE}/audit?businessId=${businessId}` : `${API_BASE}/audit`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchVoiceSessions(): Promise<{
  activeCallsCount: number;
  avgHandleTime: string;
  aiVoiceLatency: string;
  humanTransferRate: string;
  callSentiment: string;
  sessions: VoiceCallSession[];
}> {
  const res = await fetch(`${API_BASE}/voice/sessions`);
  return res.json();
}

export async function sendVoiceOverride(id: string, action: string, instruction?: string) {
  const res = await fetch(`${API_BASE}/voice/sessions/${id}/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, instruction })
  });
  return res.json();
}

export async function talkToVoiceAgent(payload: {
  question: string;
  businessId?: string;
  callerName?: string;
  history?: Array<{ speaker: 'user' | 'agent'; text: string }>;
}): Promise<{
  success: boolean;
  text: string;
  audioBase64?: string;
  mimeType?: string;
  voiceName: string;
  latencyMs: number;
  intent: string;
}> {
  const res = await fetch(`${API_BASE}/voice/talk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function fetchTasks(): Promise<{ tasks: TaskRecord[] }> {
  const res = await fetch(`${API_BASE}/tasks`);
  return res.json();
}

export async function fetchIntegrations(): Promise<{
  integrations: Array<{
    id: string;
    name: string;
    businessId: string;
    status: 'connected' | 'awaiting_credentials' | 'not_configured' | 'configured' | 'error';
    latencyMs: number | null;
    lastCheck: string;
  }>;
}> {
  const res = await fetch(`${API_BASE}/integrations`);
  return res.json();
}
