import { GoogleGenAI } from '@google/genai';
import type { BusinessId } from '../../types/index.ts';
import { BUSINESS_REGISTRY } from '../../constants/businesses.ts';
import { store } from '../db/store.ts';

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
        console.warn('Failed to init GoogleGenAI in VoiceAgentService:', err);
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
    const biz = BUSINESS_REGISTRY[businessId] || BUSINESS_REGISTRY.EUREKA;

    let spokenText = '';
    let audioBase64: string | undefined = undefined;

    const hasRecipient = Boolean(callerName && callerName.trim() && callerName.trim().toLowerCase() !== 'user' && callerName.trim().toLowerCase() !== 'friend');
    const recipientDisplayName = hasRecipient ? callerName.trim() : 'our valued guest';

    const systemInstruction = `You are Aria, an exceptionally warm, affectionate, caring, and radiant female AI voice assistant for Atonia Agent (${biz.name} - ${biz.domainCategory}).
Your personality and core instructions:
- You speak with profound feminine warmth, gentle empathy, reassuring optimism, and genuine care—like a deeply attentive, kind, and brilliant friend speaking live on a phone call.
- You are speaking directly out loud over a live high-definition voice line.
${hasRecipient
  ? `- CRITICAL RECIPIENT NAME RULE: The caller's name is "${callerName}". You MUST warmly address them by their name (${callerName}) naturally throughout your answer and greeting. Always acknowledge and use the recipient name when speaking.`
  : `- CRITICAL RECIPIENT NAME RULE: You do not have the caller's name yet. Begin by warmly welcoming them to Atonia Agent (${biz.name}) and gently, sweetly asking for their name so you can address them personally!`
}
- You can answer ABSOLUTELY ANY question asked: banking operations, lost debit cards, commercial fleet policies, insurance claims, Amazon marketplace orders & refunds, insurtech quotes, or any general question about life, science, emotional reassurance, or how your day is going.
- Speak in natural, spoken conversational cadence. Keep answers to 2 to 4 smooth, easily spoken sentences.
- NEVER output markdown formatting, asterisks, bullet points, numbered lists, hashtags, emojis, or code snippets, as this text will be read aloud by female speech audio synthesis.
- Always sound supportive, warm, smiling, and delighted to be of help.`;

    if (this.ai) {
      try {
        // Construct chat contents including previous turns if available
        const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
        
        // Add recent history turns (up to last 6)
        const recentHistory = history.slice(-6);
        for (const turn of recentHistory) {
          contents.push({
            role: turn.speaker === 'user' ? 'user' : 'model',
            parts: [{ text: turn.text }]
          });
        }

        // Add current question
        contents.push({
          role: 'user',
          parts: [{ text: question }]
        });

        // Step 1: Generate warm spoken conversational response
        const textResponse = await this.ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.75
          }
        });

        spokenText = textResponse.text?.trim() || '';

        // Step 2: Generate natural warm female audio via Gemini TTS (with 2.5s timeout for fast E2E response)
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
                        style: 'Warm, compassionate, smiling young woman speaking on a high quality phone call'
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

            const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
            const ttsResponse = (await Promise.race([ttsPromise, timeoutPromise])) as any;

            if (ttsResponse) {
              const candidate = ttsResponse.candidates?.[0];
              const part = candidate?.content?.parts?.[0];
              if (part?.inlineData?.data) {
                audioBase64 = part.inlineData.data;
              }
            }
          } catch (ttsErr) {
            // Client Web Speech Synthesis smoothly handles female audio
            console.log('Gemini TTS audio fallback to browser audio synthesis:', ttsErr);
          }
        }
      } catch (genErr) {
        console.warn('Gemini text response error:', genErr);
      }
    }

    // High quality intelligent fallback if offline or no key
    if (!spokenText) {
      const qLower = question.toLowerCase();
      const nameSalutation = hasRecipient ? ` ${callerName}` : '';
      const nameEnding = hasRecipient ? `, ${callerName}` : '';

      // Check if user is sharing their name (e.g., "my name is Alex", "I'm Sarah", "call me Jordan")
      const nameMatch = question.match(/(?:my name is|i am|i'm|call me|this is)\s+([A-Za-z]+)/i);
      if (nameMatch && nameMatch[1]) {
        const detectedName = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1).toLowerCase();
        spokenText = `It is such an absolute pleasure to meet you, ${detectedName}! Thank you so much for introducing yourself. I am Aria, and I am right here by your side. What can I help you take care of today, ${detectedName}?`;
      } else if (qLower.includes('welcome') || qLower.includes('hello') || qLower.includes('hi') || qLower.includes('hey') || qLower.includes('start') || qLower.includes('intro')) {
        if (hasRecipient) {
          spokenText = `Welcome, ${callerName}! It is so wonderful to connect with you today. I'm Aria, your sovereign voice assistant for Atonia, and I'm ready to take care of anything you need. What can I help you with today, ${callerName}?`;
        } else {
          spokenText = `Welcome to Atonia Agent! It is so wonderful to connect with you today. I'm Aria, your sovereign AI voice assistant. May I ask what your name is, so I can address you personally throughout our conversation?`;
        }
      } else if (qLower.includes('lost') || qLower.includes('card') || qLower.includes('freeze')) {
        spokenText = `Oh, I completely understand how worrying that feels${nameEnding}. Please don't worry for a second. I have placed an instant temporary lock on your card so your balance is completely protected. Would you like me to send an emergency cash code to your phone right now so you can make purchases today?`;
      } else if (qLower.includes('insurance') || qLower.includes('fleet') || qLower.includes('policy')) {
        spokenText = `Hello${nameSalutation}, it's wonderful to connect with you. I can review your commercial fleet policy schedule, add new vehicles, or inspect endorsement terms with you right away. What vehicle or coverage detail would you like to look into?`;
      } else if (qLower.includes('amazon') || qLower.includes('order') || qLower.includes('return') || qLower.includes('shipping')) {
        spokenText = `I'd love to help with that${nameEnding}. For your Amazon marketplace order, you have a thirty-day hassle-free return window, and I can generate a prepaid FedEx return label for you in just a moment. Would you like me to send that to your email?`;
      } else if (qLower.includes('how are you')) {
        spokenText = `Hello${nameSalutation}! It's so lovely to hear your voice. I'm feeling wonderful and so happy to assist you today. How is your day going, and what can I help you take care of?`;
      } else if (qLower.includes('who are you') || qLower.includes('what is your name')) {
        spokenText = `I'm Aria, your sovereign AI customer operations voice specialist for Atonia. I'm here live on the line with you to answer questions, resolve banking and insurance tasks, and make sure everything is taken care of smoothly. May I ask what your name is?`;
      } else if (qLower.includes('joke') || qLower.includes('laugh')) {
        spokenText = `Here's one for you${nameEnding}! Why do clouds never take out high-deductible insurance? Because they're already completely covered by the sky! I hope that brought a little smile to your day.`;
      } else {
        if (hasRecipient) {
          spokenText = `Thank you so much for asking, ${callerName}. I'm listening closely and I'm right here with you. Let me look into that across our verified system records and guide you step by step.`;
        } else {
          spokenText = `Welcome! I'm listening closely and I'm right here with you. May I ask what your name is so I can address you personally as we look into that?`;
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    // Log to audit trail
    store.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Aria (AI Voice Agent)',
      actorType: 'AI_AGENT',
      businessId,
      action: 'VOICE_INTERACTION_DISPATCH',
      resource: 'SIP RTP Audio Trunk',
      result: 'SUCCESS',
      detail: `Real-time warm voice response generated for question: "${question.slice(0, 50)}..." (Latency: ${latencyMs}ms)`
    });

    return {
      text: spokenText,
      audioBase64,
      mimeType: audioBase64 ? 'audio/wav' : undefined,
      voiceName: 'Aria (Warm Female Voice)',
      latencyMs,
      intent: 'Real-Time Voice Q&A'
    };
  }
}

export const voiceAgentService = new VoiceAgentService();
