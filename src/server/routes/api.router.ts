import { Router } from 'express';
import type { Request, Response } from 'express';
import { store } from '../db/store.ts';
import { BUSINESS_REGISTRY } from '../../constants/businesses.ts';
import { aiGatewayService } from '../services/ai-gateway.service.ts';
import { toolRegistryService, TOOL_REGISTRY } from '../services/tool-registry.service.ts';
import { voiceAgentService } from '../services/voice-agent.service.ts';
import type { BusinessId } from '../../types/index.ts';

export const apiV1Router = Router();

// ----------------------------------------------------
// Health & Environment Telemetry
// ----------------------------------------------------
apiV1Router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'nominal',
    timestamp: new Date().toISOString(),
    service: 'ATONIA AGENT Enterprise Orchestrator',
    version: '2.4.9',
    aiEngine: 'gemini-3.8-flash',
    uptime: process.uptime(),
    multiTenantNodes: 4
  });
});

// ----------------------------------------------------
// Auth Routes
// ----------------------------------------------------
apiV1Router.get('/auth/me', (req: Request, res: Response) => {
  const currentUser = store.users[0]; // Elena Vance by default
  res.json({ user: currentUser });
});

apiV1Router.post('/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  const user = store.users.find((u) => u.email === email) || store.users[0];
  res.json({ user, token: 'mock-session-token-v2' });
});

// ----------------------------------------------------
// Business Registry Routes
// ----------------------------------------------------
apiV1Router.get('/businesses', (req: Request, res: Response) => {
  res.json({ businesses: Object.values(BUSINESS_REGISTRY) });
});

apiV1Router.get('/businesses/:id', (req: Request, res: Response) => {
  const business = BUSINESS_REGISTRY[req.params.id as BusinessId];
  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }
  res.json({ business });
});

// ----------------------------------------------------
// Customers Context Routes
// ----------------------------------------------------
apiV1Router.get('/customers', (req: Request, res: Response) => {
  const { businessId, search } = req.query;
  let results = store.customers;

  if (businessId && businessId !== 'ALL') {
    results = results.filter((c) => c.businessId === businessId);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    results = results.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.accountNumber && c.accountNumber.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
    );
  }

  res.json({ customers: results });
});

apiV1Router.get('/customers/:id', (req: Request, res: Response) => {
  const customer = store.customers.find((c) => c.id === req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  res.json({ customer });
});

// ----------------------------------------------------
// Conversations Routes
// ----------------------------------------------------
apiV1Router.get('/conversations', (req: Request, res: Response) => {
  const { businessId, channel, status, search } = req.query;
  let list = store.conversations;

  if (businessId && businessId !== 'ALL') {
    list = list.filter((c) => c.businessId === businessId);
  }

  if (channel && channel !== 'all') {
    list = list.filter((c) => c.channel === channel);
  }

  if (status && status !== 'All Agent States') {
    list = list.filter((c) => c.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        c.intent.toLowerCase().includes(q) ||
        c.customerIdentifier.toLowerCase().includes(q)
    );
  }

  res.json({ conversations: list });
});

apiV1Router.get('/conversations/:id', (req: Request, res: Response) => {
  const conversation = store.conversations.find((c) => c.id === req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const customer = store.customers.find((c) => c.id === conversation.customerId);
  res.json({ conversation, customer });
});

apiV1Router.post('/conversations/:id/messages', (req: Request, res: Response) => {
  const conversation = store.conversations.find((c) => c.id === req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const { content, sender = 'supervisor', senderName = 'Elena Vance' } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  const newMsg = {
    id: `msg-${Date.now()}`,
    conversationId: conversation.id,
    sender,
    senderName,
    timestamp: 'Just now',
    content
  };

  conversation.messages.push(newMsg);
  conversation.lastActivity = 'Just now';

  // Audit supervisor intervention
  if (sender === 'supervisor') {
    store.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: senderName,
      actorType: 'SUPERVISOR',
      businessId: conversation.businessId,
      customerId: conversation.customerId,
      action: 'SUPERVISOR_MESSAGE_DISPATCH',
      resource: `Conversation ${conversation.id}`,
      result: 'SUCCESS',
      detail: `Manual message sent by ${senderName} to ${conversation.customerName}.`
    });
  }

  res.json({ success: true, message: newMsg, conversation });
});

apiV1Router.post('/conversations/:id/takeover', (req: Request, res: Response) => {
  const conversation = store.conversations.find((c) => c.id === req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const { supervisorName = 'Elena Vance' } = req.body;
  conversation.status = 'human_monitoring';
  conversation.assignedAgent = supervisorName;

  store.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: supervisorName,
    actorType: 'SUPERVISOR',
    businessId: conversation.businessId,
    customerId: conversation.customerId,
    action: 'SESSION_CONTROL_SEIZED',
    resource: `Conversation ${conversation.id}`,
    result: 'SUCCESS',
    detail: `Autonomous AI halted. Operator ${supervisorName} seized direct sovereign control.`
  });

  res.json({ success: true, conversation });
});

// ----------------------------------------------------
// AI Gateway Customer Turn Processor
// ----------------------------------------------------
apiV1Router.post('/agent/process', async (req: Request, res: Response) => {
  try {
    const { conversationId, businessId, customerId, message, channel = 'web' } = req.body;

    if (!conversationId || !businessId || !message) {
      return res.status(400).json({ error: 'conversationId, businessId, and message are required' });
    }

    const conversation = store.conversations.find((c) => c.id === conversationId);
    if (conversation) {
      // Append customer message
      conversation.messages.push({
        id: `msg-${Date.now()}-c`,
        conversationId,
        sender: 'customer',
        senderName: conversation.customerName,
        timestamp: 'Just now',
        content: message
      });
    }

    const gatewayResult = await aiGatewayService.processCustomerTurn({
      conversationId,
      businessId,
      customerId,
      userMessage: message,
      channel
    });

    if (conversation) {
      conversation.status = gatewayResult.state;
      conversation.intent = gatewayResult.intent;
      conversation.lastActivity = 'Just now';

      // Append AI response
      conversation.messages.push({
        id: `msg-${Date.now()}-a`,
        conversationId,
        sender: 'agent',
        senderName: 'Autonomous Agent',
        timestamp: 'Just now',
        content: gatewayResult.replyText,
        aiMetadata: {
          model: 'gemini-3.8-flash',
          latencyMs: 320,
          tokens: 42,
          confidence: gatewayResult.confidence
        },
        governanceEvent: gatewayResult.governanceEvent
      });
    }

    res.json({ success: true, result: gatewayResult, conversation });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown gateway processing error';
    res.status(500).json({ error: msg });
  }
});

// ----------------------------------------------------
// Tools Routes
// ----------------------------------------------------
apiV1Router.get('/tools', (req: Request, res: Response) => {
  const { businessId } = req.query;
  if (businessId && typeof businessId === 'string' && businessId !== 'ALL') {
    return res.json({ tools: toolRegistryService.getToolsForBusiness(businessId as BusinessId) });
  }
  res.json({ tools: Object.values(TOOL_REGISTRY), recentExecutions: store.toolExecutions });
});

apiV1Router.post('/tools/execute', async (req: Request, res: Response) => {
  try {
    const { toolName, businessId, args = {}, customerId, actorRole = 'OPERATIONS_LEAD', actorId = 'Elena Vance' } = req.body;

    const result = await toolRegistryService.executeTool({
      toolName,
      businessId,
      args,
      actorId,
      actorRole,
      customerId
    });

    res.json({ success: true, result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Tool execution error';
    res.status(400).json({ error: msg });
  }
});

// ----------------------------------------------------
// Escalation Center Routes
// ----------------------------------------------------
apiV1Router.get('/escalations', (req: Request, res: Response) => {
  const { businessId, priority, status } = req.query;
  let list = store.escalations;

  if (businessId && businessId !== 'ALL') {
    list = list.filter((e) => e.businessId === businessId);
  }

  if (priority && priority !== 'all') {
    list = list.filter((e) => e.priority === priority);
  }

  if (status && status !== 'all') {
    list = list.filter((e) => e.status === status);
  }

  res.json({ escalations: list, summary: { critical: 3, high: 4, medium: 8, resolvedToday: 34 } });
});

apiV1Router.get('/escalations/:id', (req: Request, res: Response) => {
  const escalation = store.escalations.find((e) => e.id === req.params.id);
  if (!escalation) {
    return res.status(404).json({ error: 'Escalation docket not found' });
  }
  res.json({ escalation });
});

apiV1Router.post('/escalations/:id/assign', (req: Request, res: Response) => {
  const escalation = store.escalations.find((e) => e.id === req.params.id);
  if (!escalation) {
    return res.status(404).json({ error: 'Escalation docket not found' });
  }

  const { assignee = 'Elena Vance' } = req.body;
  escalation.assignedStaff = assignee;
  escalation.status = 'in_review';

  store.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: assignee,
    actorType: 'SUPERVISOR',
    businessId: escalation.businessId,
    customerId: escalation.customerId,
    action: 'ESCALATION_ASSIGNED',
    resource: `Docket ${escalation.id}`,
    result: 'SUCCESS',
    detail: `Escalation assigned to ${assignee}. Status set to in_review.`
  });

  res.json({ success: true, escalation });
});

apiV1Router.post('/escalations/:id/resolve', (req: Request, res: Response) => {
  const escalation = store.escalations.find((e) => e.id === req.params.id);
  if (!escalation) {
    return res.status(404).json({ error: 'Escalation docket not found' });
  }

  escalation.status = 'resolved';
  escalation.resolvedAt = new Date().toISOString();

  store.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: 'Elena Vance',
    actorType: 'SUPERVISOR',
    businessId: escalation.businessId,
    customerId: escalation.customerId,
    action: 'ESCALATION_RESOLVED',
    resource: `Docket ${escalation.id}`,
    result: 'SUCCESS',
    detail: `Escalation docket ${escalation.id} resolved by Elena Vance.`
  });

  res.json({ success: true, escalation });
});

apiV1Router.post('/escalations/:id/notes', (req: Request, res: Response) => {
  const escalation = store.escalations.find((e) => e.id === req.params.id);
  if (!escalation) {
    return res.status(404).json({ error: 'Escalation docket not found' });
  }

  const { notes } = req.body;
  escalation.supervisorNotes = notes;

  res.json({ success: true, escalation });
});

// ----------------------------------------------------
// Knowledge Base Routes
// ----------------------------------------------------
apiV1Router.get('/knowledge', (req: Request, res: Response) => {
  const { businessId, search } = req.query;
  let list = store.knowledgeDocs;

  if (businessId && businessId !== 'ALL') {
    list = list.filter((d) => d.businessId === businessId);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter((d) => d.title.toLowerCase().includes(q) || d.summary.toLowerCase().includes(q));
  }

  res.json({ documents: list });
});

// ----------------------------------------------------
// Audit Trail Routes
// ----------------------------------------------------
apiV1Router.get('/audit', (req: Request, res: Response) => {
  const { businessId } = req.query;
  let list = store.auditLogs;

  if (businessId && businessId !== 'ALL') {
    list = list.filter((a) => a.businessId === businessId);
  }

  res.json({ auditLogs: list });
});

// ----------------------------------------------------
// Voice Telephony Routes
// ----------------------------------------------------
apiV1Router.get('/voice/sessions', (req: Request, res: Response) => {
  res.json({
    activeCallsCount: 18,
    avgHandleTime: '2m 45s',
    aiVoiceLatency: '320ms',
    humanTransferRate: '4.8%',
    callSentiment: '92% Positive',
    sessions: store.voiceSessions
  });
});

apiV1Router.get('/voice/sessions/:id', (req: Request, res: Response) => {
  const session = store.voiceSessions.find((s) => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Voice session not found' });
  }
  res.json({ session });
});

apiV1Router.post('/voice/sessions/:id/override', (req: Request, res: Response) => {
  const { action, instruction } = req.body; // 'barge_in', 'whisper', 'terminate'
  const session = store.voiceSessions.find((s) => s.id === req.params.id);

  if (!session) {
    return res.status(404).json({ error: 'Voice session not found' });
  }

  if (action === 'terminate') {
    session.status = 'completed';
  } else if (action === 'barge_in') {
    session.status = 'escalated';
  }

  store.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: 'Elena Vance',
    actorType: 'SUPERVISOR',
    businessId: session.businessId,
    action: `VOICE_${action.toUpperCase()}`,
    resource: `Call Session ${session.id}`,
    result: 'SUCCESS',
    detail: `Supervisor executed ${action}: ${instruction || 'Direct operator override on SIP audio trunk'}.`
  });

  res.json({ success: true, session });
});

apiV1Router.post('/voice/talk', async (req: Request, res: Response) => {
  try {
    const { question, businessId = 'EUREKA', callerName = 'Julian', history = [] } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    const answer = await voiceAgentService.answerQuestion(
      question,
      businessId as BusinessId,
      callerName,
      history
    );
    res.json({ success: true, ...answer });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Voice processing error';
    res.status(500).json({ error: msg });
  }
});

// ----------------------------------------------------
// Tasks Routes
// ----------------------------------------------------
apiV1Router.get('/tasks', (req: Request, res: Response) => {
  res.json({ tasks: store.tasks });
});

// ----------------------------------------------------
// External Integrations Status Matrix
// ----------------------------------------------------
apiV1Router.get('/integrations', (req: Request, res: Response) => {
  const integrationsList = [
    { id: 'int-1', name: 'DVLA Registry API', businessId: 'ATONIA_INSURANCE', status: 'connected', latencyMs: 28, lastCheck: '24s ago' },
    { id: 'int-2', name: 'Underwriting Core v4', businessId: 'ATONIA_INSURANCE', status: 'connected', latencyMs: 110, lastCheck: '12s ago' },
    { id: 'int-3', name: 'Acturis BMS API', businessId: 'ATONIA_INSURANCE', status: 'awaiting_credentials', latencyMs: null, lastCheck: 'Pending' },
    { id: 'int-4', name: 'OpenBanking API', businessId: 'EUREKA', status: 'connected', latencyMs: 65, lastCheck: '45s ago' },
    { id: 'int-5', name: 'Fraud Sentinel AI', businessId: 'EUREKA', status: 'connected', latencyMs: 38, lastCheck: '5s ago' },
    { id: 'int-6', name: 'Plaid Gateway', businessId: 'EUREKA', status: 'connected', latencyMs: 120, lastCheck: '1m ago' },
    { id: 'int-7', name: 'Card Processor Engine', businessId: 'EUREKA', status: 'awaiting_credentials', latencyMs: null, lastCheck: 'Pending' },
    { id: 'int-8', name: 'ShipStation Sync', businessId: 'ATONIA_MARKETPLACE', status: 'connected', latencyMs: 140, lastCheck: '30s ago' },
    { id: 'int-9', name: 'Amazon SP-API', businessId: 'ATONIA_MARKETPLACE', status: 'awaiting_credentials', latencyMs: null, lastCheck: 'Pending' },
    { id: 'int-10', name: 'Carrier Aggregator (14)', businessId: 'SORPLOS_INSURTECH', status: 'connected', latencyMs: 320, lastCheck: '15s ago' },
    { id: 'int-11', name: 'OCR Document Engine', businessId: 'SORPLOS_INSURTECH', status: 'connected', latencyMs: 180, lastCheck: '50s ago' },
    { id: 'int-12', name: 'Stripe Corporate Billing', businessId: 'SHARED', status: 'connected', latencyMs: 95, lastCheck: '1m ago' }
  ];

  res.json({ integrations: integrationsList });
});
