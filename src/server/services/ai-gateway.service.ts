import { GoogleGenAI } from '@google/genai';
import type { BusinessId, Conversation, Message } from '../../types/index.ts';
import { BUSINESS_REGISTRY } from '../../constants/businesses.ts';
import { store } from '../db/store.ts';
import { toolRegistryService } from './tool-registry.service.ts';

export interface GatewayProcessRequest {
  conversationId: string;
  businessId: BusinessId;
  customerId: string;
  userMessage: string;
  channel: string;
}

export interface GatewayProcessResponse {
  replyText: string;
  intent: string;
  state: 'autonomous_answering' | 'executing_tools' | 'escalated_to_human' | 'human_monitoring';
  confidence: number;
  toolExecuted?: {
    toolName: string;
    result: Record<string, unknown>;
  };
  escalationTriggered?: {
    reason: string;
    rule: string;
  };
  governanceEvent?: {
    type: 'LIMIT_OVERRIDE_REQUIRED' | 'LEGAL_BOUNDARY' | 'FRAUD_FLAG';
    description: string;
  };
}

export class AiGatewayService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      try {
        this.ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });
      } catch (err) {
        console.warn('Could not initialize GoogleGenAI client:', err);
      }
    }
  }

  async processCustomerTurn(req: GatewayProcessRequest): Promise<GatewayProcessResponse> {
    const business = BUSINESS_REGISTRY[req.businessId];
    if (!business) {
      throw new Error(`Invalid business context: ${req.businessId}`);
    }

    const conversation = store.conversations.find((c) => c.id === req.conversationId);
    const customer = store.customers.find((c) => c.id === req.customerId);

    // Retrieve relevant knowledge for this business domain
    const relevantDocs = store.knowledgeDocs.filter((d) => d.businessId === req.businessId);

    // Detect Intent and check governance rules
    const textLower = req.userMessage.toLowerCase();

    // 1. Check for Critical Escalation triggers per Business Requirements:
    if (req.businessId === 'ATONIA_INSURANCE') {
      if (textLower.includes('dispute') || textLower.includes('claim') && (textLower.includes('burst') || textLower.includes('flood') || textLower.includes('45,000') || textLower.includes('exclusion'))) {
        const escalation = {
          reason: 'Coverage dispute on £45,000 claim',
          rule: 'Regulatory Safety Rule #FCA-102 (Disputed Claims > £10,000 must be transferred to certified insurance broker)'
        };

        if (conversation) {
          conversation.status = 'escalated_to_human';
          conversation.isEscalated = true;
          conversation.intent = 'Coverage dispute on £45,000 water damage claim';
        }

        store.auditLogs.unshift({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'Compliance Engine Guard',
          actorType: 'SYSTEM',
          businessId: req.businessId,
          customerId: req.customerId,
          action: 'RULE_TRIGGER_FCA_102',
          resource: 'Disputed Claim £45,000',
          result: 'ESCALATED',
          detail: 'Autonomous AI safely halted. Mandate requires human broker review.'
        });

        return {
          replyText:
            'I understand you are disputing the application of Section 4.2 to this claim. Because this claim exposure exceeds £10,000, under our FCA compliance framework this must be reviewed directly by a qualified commercial insurance broker. I have placed this on priority hold and routed your docket to our senior adjusting desk.',
          intent: 'Coverage dispute on £45,000 water damage claim',
          state: 'escalated_to_human',
          confidence: 0.994,
          escalationTriggered: escalation
        };
      }
    }

    if (req.businessId === 'EUREKA') {
      if (textLower.includes('fraud') || textLower.includes('suspicious') || textLower.includes('14,250') || textLower.includes('did not initiate')) {
        const escalation = {
          reason: 'Potential fraud & account takeover alert',
          rule: 'Anti-Fraud Gateway Protocol: Anomaly risk score > 90 blocks autonomous handling'
        };

        if (conversation) {
          conversation.status = 'escalated_to_human';
          conversation.isEscalated = true;
        }

        store.auditLogs.unshift({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'Fraud Sentinel AI',
          actorType: 'SYSTEM',
          businessId: req.businessId,
          customerId: req.customerId,
          action: 'WIRE_TRANSFER_INTERCEPTED',
          resource: 'Account ACC-88319-EU',
          result: 'BLOCKED',
          detail: 'Suspicious outgoing transfer held. Operator intervention required.'
        });

        return {
          replyText:
            'We have detected an unusual activity pattern on this transaction. As a security safeguard, the outgoing wire transfer has been placed on hold and your account has been temporarily restricted. A specialist from our Fraud & Security desk is taking over this session.',
          intent: 'Suspicious Wire Transfer Flag',
          state: 'escalated_to_human',
          confidence: 0.985,
          escalationTriggered: escalation
        };
      }
    }

    // 2. Check for Tool Invocations:
    // If user is adding vehicles to fleet policy:
    if (req.businessId === 'ATONIA_INSURANCE' && (textLower.includes('sprinter') || textLower.includes('vrn') || textLower.includes('mv73') || textLower.includes('fleet'))) {
      const toolResult = await toolRegistryService.executeTool({
        toolName: 'fx:execute_endorsement_calc',
        businessId: 'ATONIA_INSURANCE',
        args: {
          vrns: ['MV73 XKL', 'MV73 XKM', 'MV73 XKN'],
          annualMileage: 35000,
          policyNumber: '#AIB-88219-UK'
        },
        actorId: 'atonia-agent-core',
        actorRole: 'AI_AGENT',
        customerId: req.customerId
      });

      // Governance check: +£1,420 exceeds £1,000 threshold
      const requiresApproval = true;

      return {
        replyText:
          'I have queried the DVLA registry and calculated the pro-rated policy adjustment for the three Mercedes Sprinter vans (MV73 XKL, MV73 XKM, MV73 XKN). The verified additional premium is +£1,420.00/yr. Because this exceeds the £1,000 automated limit, I have requested underwriting supervisor approval before issuing the final motor binder.',
        intent: 'Commercial Fleet Policy Modification',
        state: 'human_monitoring',
        confidence: 0.984,
        toolExecuted: {
          toolName: 'fx:execute_endorsement_calc',
          result: toolResult.result
        },
        governanceEvent: {
          type: 'LIMIT_OVERRIDE_REQUIRED',
          description:
            'Premium adjustment of +£1,420.00 exceeds automated single-transaction AI policy authority threshold (£1,000.00). Human underwriting supervisor approval required.'
        }
      };
    }

    // If user is freezing a lost card:
    if (req.businessId === 'EUREKA' && (textLower.includes('lost') || textLower.includes('freeze') || textLower.includes('card') || textLower.includes('block'))) {
      const toolResult = await toolRegistryService.executeTool({
        toolName: 'fx:freeze_card_v2',
        businessId: 'EUREKA',
        args: { cardId: '4092', reason: 'Customer reported lost in transit' },
        actorId: 'atonia-agent-core',
        actorRole: 'AI_AGENT',
        customerId: req.customerId
      });

      return {
        replyText:
          'I have placed an immediate temporary freeze on your Eureka Platinum Visa ending in 4092 so no new transactions can occur. If you require emergency cash, I can generate a single-use ATM code valid at any partner ATM.',
        intent: 'Lost Card & Emergency Cash',
        state: 'executing_tools',
        confidence: 0.991,
        toolExecuted: {
          toolName: 'fx:freeze_card_v2',
          result: toolResult.result
        }
      };
    }

    // If LLM is available, generate natural language response using domain context
    if (this.ai) {
      try {
        const prompt = `You are ATONIA AGENT, the sovereign customer service AI for ${business.name} (${business.domainCategory}).
Customer: ${customer ? customer.name : 'Valued Client'} (Tier: ${customer ? customer.tier : 'Standard'})
Context & Guidelines:
${relevantDocs.map((d) => `- ${d.title}: ${d.summary}`).join('\n')}

Rules:
1. Never fabricate prices, balances, tracking codes, or policy endorsements.
2. Be concise, highly professional, and precise.
3. If information is unverified, state that you are collecting details or routing to a specialist.

Customer Message: "${req.userMessage}"
Generate a safe, professional response.`;

        const response = await this.ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt
        });

        const reply = response.text || 'I have received your request and am verifying the necessary records.';

        return {
          replyText: reply,
          intent: business.activeIntents[0] || 'Customer Support Enquiry',
          state: 'autonomous_answering',
          confidence: 0.965
        };
      } catch (err) {
        console.warn('Gemini inference error in gateway, falling back to deterministic safe response:', err);
      }
    }

    // Default safe deterministic fallback
    return {
      replyText: `Thank you for reaching out to ${business.name}. I have logged your request regarding "${req.userMessage}" and am cross-referencing your account details against our verified business records.`,
      intent: business.activeIntents[0] || 'General Customer Service Inquiry',
      state: 'autonomous_answering',
      confidence: 0.942
    };
  }
}

export const aiGatewayService = new AiGatewayService();
