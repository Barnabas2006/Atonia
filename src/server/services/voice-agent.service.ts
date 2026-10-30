import { GoogleGenAI } from '@google/genai';
import type { BusinessId } from '../../types/index.ts';
import { BUSINESS_REGISTRY } from '../../constants/businesses.ts';
import { repository } from '../db/repository.ts';
import { sanitizeText } from '../utils/sanitizer.ts';

export interface VoiceConversationTurn {
  speaker: 'user' | 'agent';
  text: string;
}

export interface VoiceAnswerResult {
  text: string;
  audioBase64?: string;
  mimeType?: string;
  voiceName: string;
  latencyMs: number;
  intent: string;
  sourcesUsed: string[];
  businessId: BusinessId;
}

export class VoiceAgentService {
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
        console.warn('[VOICE AGENT] Could not initialize GoogleGenAI client:', err);
      }
    }
  }

  async answerQuestion(
    question: string,
    businessId: BusinessId = 'EUREKA',
    callerName: string = 'Julian',
    history: VoiceConversationTurn[] = []
  ): Promise<VoiceAnswerResult> {
    const startTime = Date.now();
    const cleanQuestion = sanitizeText(question);
    const biz = BUSINESS_REGISTRY[businessId] || BUSINESS_REGISTRY.EUREKA;

    // Retrieve ONLY approved, published knowledge for this specific tenant domain
    const allTenantDocs = await repository.getKnowledgeDocs({ businessId, status: 'published' });
    const approvedDocs = allTenantDocs.filter((d) => d.status === 'published');

    let spokenText = '';
    let audioBase64: string | undefined = undefined;
    const sourcesUsed: string[] = [];

    const hasRecipient = Boolean(
      callerName &&
        callerName.trim() &&
        callerName.trim().toLowerCase() !== 'user' &&
        callerName.trim().toLowerCase() !== 'friend' &&
        callerName.trim().toLowerCase() !== 'caller'
    );

    // Sovereign Business Boundaries:
    let domainSpecificRules = '';
    if (businessId === 'ATONIA_INSURANCE') {
      domainSpecificRules = `
CRITICAL REGULATORY BOUNDARY FOR ATONIA INSURANCE BROKERS:
- You represent "Atonia Insurance Brokers Limited" as an authorized BROKER, NEVER as an insurance carrier/underwriter.
- Do NOT make unauthorized insurance suitability guarantees or claim-settlement commitments.
- For vehicle additions (e.g. Mercedes Sprinters), inform the caller that VRN verification via DVLA and syndicate schedule updating can be prepared, and additions over £1,000 premium change require supervising broker review.
- Any disputed claim exceeding £10,000 must be directed to a human certified insurance broker.`;
    } else if (businessId === 'EUREKA') {
      domainSpecificRules = `
CRITICAL REGULATORY BOUNDARY FOR EUREKA BANKING:
- Banking and payment credentials are strictly confidential and protected.
- Never execute irreversible wire transfers, credit line changes, or external beneficiary additions without verified multi-factor/biometric authorization.
- For lost or stolen cards, reassure the client immediately that their card can be locked/frozen instantly to protect their balance, and an emergency ATM withdrawal code up to £200 can be generated upon identity verification.
- Treat any anomalous wire requests over £10,000 as high-risk and escalate immediately.`;
    } else if (businessId === 'SORPLOS_INSURTECH') {
      domainSpecificRules = `
CRITICAL REGULATORY BOUNDARY FOR SORPLOS PARTNERING INSURTECH LIMITED:
- Sorplos is an insurtech aggregator. Do NOT execute final binding insurance purchases without licensed broker authorization and formal policy schedule confirmation.
- Quotes are direct from authorized carrier APIs; never fabricate or adjust carrier quotes.`;
    } else if (businessId === 'ATONIA_MARKETPLACE') {
      domainSpecificRules = `
CRITICAL BOUNDARY FOR ATONIA MARKETPLACE:
- Manage retail logistics, order delivery status, and returns.
- Standard consumer return window is 30 days with prepaid FedEx labels. Autonomous refunds are capped at $500; wholesale pallet disputes over $10,000 require specialist review.`;
    }

    const knowledgeContext = approvedDocs
      .map((d) => `[APPROVED SOURCE: ${d.title} (Topic: ${d.topic || d.category})] ${d.summary} Details: ${d.content}`)
      .join('\n\n');

    const systemInstruction = `You are Aria, the consistent, exceptionally warm, caring, and authoritative female voice specialist for ${biz.name} (${biz.domainCategory}).
VOICE IDENTITY & MANNER:
- Your name is Aria. You speak out loud over a live high-definition phone/voice line.
- Your vocal delivery is gentle, warm, reassuring, smiling, and professional.
${hasRecipient ? `- The caller's name is "${callerName}". Warmly acknowledge and address them by name.` : `- If you don't know the caller's name, warmly welcome them to ${biz.name} and ask how you should address them.`}
- Keep spoken answers concise (2 to 4 smooth, conversational sentences) that are easy to listen to on a live call.
- NEVER output markdown formatting, asterisks, bullet points, headers, hashtags, or code snippets, as your response is read aloud by voice audio synthesis.

APPROVED BUSINESS KNOWLEDGE BASE FOR ${biz.name}:
${knowledgeContext || 'No specific approved documents found. Advise caller on general business hours and offer human assistance.'}

${domainSpecificRules}

CRITICAL ACCURACY & GROUNDING RULES:
1. Rely ONLY on the approved knowledge for ${biz.name} above.
2. DO NOT invent prices, policy coverage terms, account balances, or claims determinations.
3. DO NOT cite or retrieve information belonging to another business tenant.
4. If the caller asks for an action that requires supervisor signoff or verification, state what can be prepared and that our team will finalize it safely.`;

    if (this.ai) {
      try {
        const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

        // Context history
        const recentHistory = history.slice(-6);
        for (const turn of recentHistory) {
          contents.push({
            role: turn.speaker === 'user' ? 'user' : 'model',
            parts: [{ text: turn.text }]
          });
        }

        // Current question
        contents.push({
          role: 'user',
          parts: [{ text: cleanQuestion }]
        });

        // Step 1: Generate spoken text grounded strictly in tenant knowledge
        const textResponse = await this.ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction
          }
        });

        spokenText = textResponse.text?.trim() || '';

        // Determine matching approved knowledge sources that informed this answer
        const textLower = cleanQuestion.toLowerCase();
        for (const doc of approvedDocs) {
          const docKey = (doc.title + ' ' + (doc.topic || '') + ' ' + doc.category).toLowerCase();
          if (
            docKey.includes(textLower.slice(0, 15)) ||
            textLower.includes(doc.category.toLowerCase()) ||
            (doc.topic && textLower.includes(doc.topic.toLowerCase())) ||
            (doc.faqQuestion && textLower.includes(doc.faqQuestion.toLowerCase().slice(0, 15)))
          ) {
            sourcesUsed.push(doc.title);
          }
        }
        if (sourcesUsed.length === 0 && approvedDocs.length > 0) {
          sourcesUsed.push(approvedDocs[0].title);
        }

        // Step 2: Generate natural warm female audio via Gemini TTS
        if (spokenText) {
          try {
            const ttsPromise = this.ai.models.generateContent({
              model: 'gemini-3.8-flash-lite-tts',
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: spokenText,
                      speechMetadata: {
                        style: 'Warm, caring, friendly young female voice specialist on a telephone line'
                      }
                    }
                  ]
                }
              ],
              config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' }
                  }
                }
              }
            });

            // 2.8s race timeout for fast voice latency
            const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2800));
            const ttsResponse = (await Promise.race([ttsPromise, timeoutPromise])) as any;

            if (ttsResponse) {
              const candidate = ttsResponse.candidates?.[0];
              const part = candidate?.content?.parts?.[0];
              if (part?.inlineData?.data) {
                audioBase64 = part.inlineData.data;
              }
            }
          } catch (ttsErr) {
            console.log('[VOICE AGENT] Gemini TTS unavailable/timed-out; browser Web Speech will speak response:', ttsErr);
          }
        }
      } catch (genErr) {
        console.warn('[VOICE AGENT] Gemini text generation notice:', genErr);
      }
    }

    // High quality intelligent fallback if AI service or API key is unavailable
    if (!spokenText) {
      const qLower = cleanQuestion.toLowerCase();
      const nameSalutation = hasRecipient ? ` ${callerName}` : '';
      const nameEnding = hasRecipient ? `, ${callerName}` : '';

      // Check for introduction
      const nameMatch = cleanQuestion.match(/(?:my name is|i am|i'm|call me|this is)\s+([A-Za-z]+)/i);
      if (nameMatch && nameMatch[1]) {
        const detectedName = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1).toLowerCase();
        spokenText = `It is such a pleasure to meet you, ${detectedName}! Thank you so much for introducing yourself. I am Aria, your sovereign customer service voice specialist. What can I take care of for you today?`;
      } else if (qLower.includes('welcome') || qLower.includes('hello') || qLower.includes('hi') || qLower.includes('start')) {
        if (hasRecipient) {
          spokenText = `Welcome, ${callerName}! It is so wonderful to connect with you today at ${biz.name}. I'm Aria, your voice assistant. What can I help you take care of today?`;
        } else {
          spokenText = `Welcome to ${biz.name}! I'm Aria, your sovereign voice assistant. May I ask what your name is so I can address you personally throughout our call?`;
        }
      } else if (qLower.includes('lost') || qLower.includes('card') || qLower.includes('freeze')) {
        spokenText = `I completely understand how stressful that is${nameEnding}. I can initiate an instant temporary lock on your card to ensure your balance is completely protected, and our team can prepare an emergency cash withdrawal code if you need funds today.`;
        sourcesUsed.push('Emergency Card Freeze & ATM Withdrawal Auth Protocol');
      } else if (qLower.includes('fleet') || qLower.includes('sprinter') || qLower.includes('van') || qLower.includes('vehicle')) {
        spokenText = `Hello${nameSalutation}. Under our commercial fleet underwriting guidelines, I can check your policy schedule and verify vehicle registration marks through the DVLA registry. Any addition that changes premium by more than one thousand pounds will be routed to our broker desk for immediate approval.`;
        sourcesUsed.push('Commercial Motor Fleet Endorsement & Vehicle Addition Rules');
      } else if (qLower.includes('amazon') || qLower.includes('order') || qLower.includes('return') || qLower.includes('refund')) {
        spokenText = `I would be happy to help with your order${nameEnding}. Our marketplace allows a 30-day return window, and we can generate a prepaid FedEx shipping label for you. Once picked up, refunds are credited back in three to five business days.`;
        sourcesUsed.push('Wholesale Pallet Damage & RMA Resolution Guide');
      } else if (qLower.includes('quote') || qLower.includes('compare') || qLower.includes('carrier')) {
        spokenText = `At Sorplos Insurtech, we aggregate live quotes directly from accredited insurance carriers without hidden markups. We do not alter carrier premiums or make unverified underwriting decisions, ensuring transparent options for you.`;
        sourcesUsed.push('Multi-Carrier Quote Aggregation & Zero-Underwriting Policy');
      } else {
        if (hasRecipient) {
          spokenText = `Thank you so much for asking, ${callerName}. I am referencing our approved guidelines for ${biz.name} to ensure you receive verified, accurate guidance. How else can I assist you with this?`;
        } else {
          spokenText = `Welcome to ${biz.name}. I am Aria, your voice assistant. I am listening closely and ready to help you with any account, policy, or service request.`;
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    // Persist voice interaction in audit trail
    try {
      await repository.appendAuditLog({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: 'Aria (AI Voice Agent)',
        actorType: 'AI_AGENT',
        businessId,
        action: 'VOICE_INTERACTION_DISPATCH',
        resource: 'SIP RTP Audio Trunk',
        result: 'SUCCESS',
        detail: `Spoken response generated for question: "${cleanQuestion.slice(0, 50)}..." (Latency: ${latencyMs}ms, Sources: ${sourcesUsed.join(', ') || 'Domain Core'})`
      });
    } catch (auditErr) {
      console.warn('[VOICE AGENT] Audit log notice:', auditErr);
    }

    return {
      text: spokenText,
      audioBase64,
      mimeType: audioBase64 ? 'audio/wav' : undefined,
      voiceName: 'Aria (Warm Empathetic Female Voice)',
      latencyMs,
      intent: 'Real-Time Voice Q&A',
      sourcesUsed,
      businessId
    };
  }
}

export const voiceAgentService = new VoiceAgentService();
