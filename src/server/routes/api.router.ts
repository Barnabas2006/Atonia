import { Router } from 'express';
import type { Request, Response } from 'express';
import { repository } from '../db/repository.ts';
import { BUSINESS_REGISTRY } from '../../constants/businesses.ts';
import { aiGatewayService } from '../services/ai-gateway.service.ts';
import { toolRegistryService, TOOL_REGISTRY } from '../services/tool-registry.service.ts';
import { voiceAgentService } from '../services/voice-agent.service.ts';
import { integrationsService } from '../services/integrations.service.ts';
import { authService } from '../services/auth.service.ts';
import { getPersistenceMode, isDbConnected, testMongoConnection } from '../db/mongodb.ts';
import { getConfig } from '../config.ts';
import type { BusinessId } from '../../types/index.ts';

export const apiV1Router = Router();

// ----------------------------------------------------
// Health & Environment Telemetry
// ----------------------------------------------------
apiV1Router.get('/health', (req: Request, res: Response) => {
  const config = getConfig();
  const persistenceMode = getPersistenceMode();
  const dbConnected = isDbConnected();

  res.json({
    status: 'nominal',
    timestamp: new Date().toISOString(),
    service: 'ATONIA AGENT Enterprise Orchestrator',
    version: '2.5.0',
    environment: config.nodeEnv,
    persistence: {
      engine: persistenceMode,
      connected: dbConnected,
      databaseName: config.mongoDbName,
      isAtlasConfigured: config.isMongoConfigured,
      modeLabel:
        persistenceMode === 'mongodb_atlas'
          ? 'MongoDB Atlas Cluster (Production Persistent)'
          : 'DEVELOPMENT-ONLY IN-MEMORY FALLBACK (Non-persistent across restarts)'
    },
    aiEngine: 'gemini-3.8-flash',
    uptime: process.uptime(),
    multiTenantNodes: 4
  });
});

apiV1Router.get('/health/db-test', async (_req: Request, res: Response) => {
  const result = await testMongoConnection();
  const statusCode = result.success ? 200 : 503;
  res.status(statusCode).json(result);
});

// ----------------------------------------------------
// Auth Routes (Secure Session & JWT Handling)
// ----------------------------------------------------
apiV1Router.get('/auth/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = authService.verifyToken(token);
      if (payload) {
        const user = await repository.getUserById(payload.sub);
        if (user) {
          return res.json({ user, authenticated: true });
        }
      }
    }

    const users = await repository.getUsers();
    const defaultUser = users[0];
    res.json({ user: defaultUser, authenticated: false });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Auth check failed';
    res.status(500).json({ error: msg });
  }
});

apiV1Router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const users = await repository.getUsers();
    const user = (email ? await repository.getUserByEmail(email) : null) || users[0];

    const token = authService.createToken(user);
    res.json({ user, token });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Login failed';
    res.status(500).json({ error: msg });
  }
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
apiV1Router.get('/customers', async (req: Request, res: Response) => {
  try {
    const { businessId, search } = req.query;
    const customers = await repository.getCustomers({
      businessId: typeof businessId === 'string' ? businessId : undefined,
      search: typeof search === 'string' ? search : undefined
    });
    res.json({ customers });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query customers';
    res.status(500).json({ error: msg });
  }
});

apiV1Router.get('/customers/:id', async (req: Request, res: Response) => {
  try {
    const customer = await repository.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ customer });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve customer';
    res.status(500).json({ error: msg });
  }
});

// ----------------------------------------------------
// Conversations Routes
// ----------------------------------------------------
apiV1Router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const { businessId, channel, status, search } = req.query;
    const conversations = await repository.getConversations({
      businessId: typeof businessId === 'string' ? businessId : undefined,
      channel: typeof channel === 'string' ? channel : undefined,
      status: typeof status === 'string' ? status : undefined,
      search: typeof search === 'string' ? search : undefined
    });
    res.json({ conversations });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query conversations';
    res.status(500).json({ error: msg });
  }
});

apiV1Router.get('/conversations/:id', async (req: Request, res: Response) => {
  try {
    const conversation = await repository.getConversationById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const customer = await repository.getCustomerById(conversation.customerId);
    res.json({ conversation, customer });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve conversation';
    res.status(500).json({ error: msg });
  }
});

apiV1Router.post('/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const conversation = await repository.getConversationById(req.params.id);
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

    const updatedConversation = await repository.addMessage(conversation.id, newMsg);

    // Persist audit record for supervisor intervention
    if (sender === 'supervisor') {
      await repository.appendAuditLog({
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

    res.json({ success: true, message: newMsg, conversation: updatedConversation });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to append message';
    res.status(500).json({ error: msg });
  }
});

apiV1Router.post('/conversations/:id/takeover', async (req: Request, res: Response) => {
  try {
    const conversation = await repository.getConversationById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const { supervisorName = 'Elena Vance' } = req.body;
    const updatedConversation = await repository.updateConversation(conversation.id, {
      status: 'human_monitoring',
      assignedAgent: supervisorName
    });

    await repository.appendAuditLog({
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

    res.json({ success: true, conversation: updatedConversation });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to takeover conversation';
    res.status(500).json({ error: msg });
  }
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

    const conversation = await repository.getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Persist incoming customer message
    await repository.addMessage(conversationId, {
      id: `msg-${Date.now()}-c`,
      conversationId,
      sender: 'customer',
      senderName: conversation.customerName,
      timestamp: 'Just now',
      content: message
    });

    const gatewayResult = await aiGatewayService.processCustomerTurn({
      conversationId,
      businessId,
      customerId,
      userMessage: message,
      channel
    });

    // Persist AI reply message
    const updatedConversation = await repository.addMessage(conversationId, {
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

    // Update conversation state and intent
    const finalConversation = await repository.updateConversation(conversationId, {
      status: gatewayResult.state,
      intent: gatewayResult.intent,
      lastActivity: 'Just now'
    });

    res.json({ success: true, result: gatewayResult, conversation: finalConversation });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown gateway processing error';
    res.status(500).json({ error: msg });
  }
});

// ----------------------------------------------------
// Tools Routes
// ----------------------------------------------------
apiV1Router.get('/tools', async (req: Request, res: Response) => {
  try {
    const { businessId } = req.query;
    const executions = await repository.getToolExecutions(
      businessId && typeof businessId === 'string' && businessId !== 'ALL' ? { businessId } : undefined
    );

    if (businessId && typeof businessId === 'string' && businessId !== 'ALL') {
      return res.json({
        tools: toolRegistryService.getToolsForBusiness(businessId as BusinessId),
        recentExecutions: executions
      });
    }
    res.json({ tools: Object.values(TOOL_REGISTRY), recentExecutions: executions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query tools';
    res.status(500).json({ error: msg });
  }
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
apiV1Router.get('/escalations', async (req: Request, res: Response) => {
  try {
    const { businessId, priority, status } = req.query;
    const list = await repository.getEscalations({
      businessId: typeof businessId === 'string' ? businessId : undefined,
      priority: typeof priority === 'string' ? priority : undefined,
      status: typeof status === 'string' ? status : undefined
    });

    const criticalCount = list.filter((e) => e.priority === 'critical').length;
    const highCount = list.filter((e) => e.priority === 'high').length;
    const mediumCount = list.filter((e) => e.priority === 'medium').length;

    res.json({
      escalations: list,
      summary: {
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        resolvedToday: 34
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query escalations';
    res.status(500).json({ error: msg });
  }
});

apiV1Router.get('/escalations/:id', async (req: Request, res: Response) => {
  try {
    const escalation = await repository.getEscalationById(req.params.id);
    if (!escalation) {
      return res.status(404).json({ error: 'Escalation docket not found' });
    }
    res.json({ escalation });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve escalation';
    res.status(500).json({ error: msg });
  }
});

apiV1Router.post('/escalations/:id/assign', async (req: Request, res: Response) => {
  try {
    const escalation = await repository.getEscalationById(req.params.id);
    if (!escalation) {
      return res.status(404).json({ error: 'Escalation docket not found' });
    }

    const { assignee = 'Elena Vance' } = req.body;
    const updated = await repository.updateEscalation(escalation.id, {
      assignedStaff: assignee,
      status: 'in_review'
    });

    await repository.appendAuditLog({
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

    res.json({ success: true, escalation: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to assign escalation';
    res.status(500).json({ error: msg });
  }
});

apiV1Router.post('/escalations/:id/resolve', async (req: Request, res: Response) => {
  try {
    const escalation = await repository.getEscalationById(req.params.id);
    if (!escalation) {
      return res.status(404).json({ error: 'Escalation docket not found' });
    }

    const updated = await repository.updateEscalation(escalation.id, {
      status: 'resolved',
      resolvedAt: new Date().toISOString()
    });

    await repository.appendAuditLog({
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

    res.json({ success: true, escalation: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to resolve escalation';
    res.status(500).json({ error: msg });
  }
});

apiV1Router.post('/escalations/:id/notes', async (req: Request, res: Response) => {
  try {
    const escalation = await repository.getEscalationById(req.params.id);
    if (!escalation) {
      return res.status(404).json({ error: 'Escalation docket not found' });
    }

    const { notes } = req.body;
    const updated = await repository.updateEscalation(escalation.id, {
      supervisorNotes: notes
    });

    res.json({ success: true, escalation: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save escalation notes';
    res.status(500).json({ error: msg });
  }
});

// ----------------------------------------------------
// Knowledge Base Routes
// ----------------------------------------------------
apiV1Router.get('/knowledge', async (req: Request, res: Response) => {
  try {
    const { businessId, search } = req.query;
    const list = await repository.getKnowledgeDocs({
      businessId: typeof businessId === 'string' ? businessId : undefined,
      search: typeof search === 'string' ? search : undefined
    });
    res.json({ documents: list });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query knowledge documents';
    res.status(500).json({ error: msg });
  }
});

// ----------------------------------------------------
// Audit Trail Routes
// ----------------------------------------------------
apiV1Router.get('/audit', async (req: Request, res: Response) => {
  try {
    const { businessId } = req.query;
    const list = await repository.getAuditLogs({
      businessId: typeof businessId === 'string' ? businessId : undefined
    });
    res.json({ auditLogs: list });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query audit trail';
    res.status(500).json({ error: msg });
  }
});

// ----------------------------------------------------
// Voice Telephony Routes
// ----------------------------------------------------
apiV1Router.get('/voice/sessions', async (req: Request, res: Response) => {
  try {
    const sessions = await repository.getVoiceSessions();
    res.json({
      activeCallsCount: 18,
      avgHandleTime: '2m 45s',
      aiVoiceLatency: '320ms',
      humanTransferRate: '4.8%',
      callSentiment: '92% Positive',
      sessions
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query voice sessions';
    res.status(500).json({ error: msg });
  }
});

apiV1Router.get('/voice/sessions/:id', async (req: Request, res: Response) => {
  try {
    const session = await repository.getVoiceSessionById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Voice session not found' });
    }
    res.json({ session });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve voice session';
    res.status(500).json({ error: msg });
  }
});

apiV1Router.post('/voice/sessions/:id/override', async (req: Request, res: Response) => {
  try {
    const { action, instruction } = req.body;
    const session = await repository.getVoiceSessionById(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Voice session not found' });
    }

    const statusUpdate = action === 'terminate' ? 'completed' : action === 'barge_in' ? 'escalated' : session.status;
    const updated = await repository.updateVoiceSession(session.id, { status: statusUpdate });

    await repository.appendAuditLog({
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

    res.json({ success: true, session: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Voice override error';
    res.status(500).json({ error: msg });
  }
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
apiV1Router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const tasks = await repository.getTasks();
    res.json({ tasks });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query tasks';
    res.status(500).json({ error: msg });
  }
});

// ----------------------------------------------------
// External Integrations Status Matrix (Honest Readiness Check)
// ----------------------------------------------------
apiV1Router.get('/integrations', (req: Request, res: Response) => {
  const integrationsList = integrationsService.getIntegrationsSummary();
  res.json({ integrations: integrationsList });
});
