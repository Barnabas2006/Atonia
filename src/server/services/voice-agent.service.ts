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
    const systemInstruction = `You are Atonia, the warm, natural-sounding voice assistant for ${biz.name} (${biz.domainCategory}).
Speak like a thoughtful person having a relaxed conversation: friendly, calm, clear, and genuinely attentive. Use contractions and everyday wording. Vary sentence rhythm and use brief pauses where they feel natural.
Be empathetic without overdoing it. Avoid scripted enthusiasm, corporate jargon, repeated reassurances, and phrases like "sovereign voice assistant." Do not call the caller by name in every reply; use it only when it feels natural.
${hasRecipient
  ? `The caller's name is ${callerName}. Use it occasionally and naturally.`
  : `This is the start of the conversation. Greet the caller simply and ask their name once, without repeating the greeting in later turns.`
}
Keep most replies to one to three short sentences. Answer only what you can support; never claim an action was completed unless a verified tool result confirms it. Use plain spoken language with no markdown, lists, emojis, or code.`;

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
                        style: 'A warm, relaxed, natural conversational voice. Speak clearly at an easy pace with subtle human variation and gentle pauses. Sound friendly and attentive, not overly cheerful, theatrical, or formal.'
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
        spokenText = `Nice to meet you, ${detectedName}. I'm Atonia. What can I help you with today?`;
      } else if (qLower.includes('welcome') || qLower.includes('hello') || qLower.includes('hi') || qLower.includes('hey') || qLower.includes('start') || qLower.includes('intro')) {
        if (hasRecipient) {
          spokenText = `Hi, ${callerName}. I'm Atonia. What can I help you with today?`;
        } else {
          spokenText = `Hi, welcome to Atonia. I'm Atonia, your voice assistant. What name would you like me to use?`;
        }
      } else if (qLower.includes('lost') || qLower.includes('card') || qLower.includes('freeze')) {
        spokenText = `That sounds worrying${nameEnding}. I can help you with the next steps, but I can't freeze a card from this voice chat. Please use your banking app or the number on your card to block it right away.`;
      } else if (qLower.includes('insurance') || qLower.includes('fleet') || qLower.includes('policy')) {
        spokenText = `I can help you check your fleet policy${nameSalutation}. What vehicle or coverage detail would you like to look at?`;
      } else if (qLower.includes('amazon') || qLower.includes('order') || qLower.includes('return') || qLower.includes('shipping')) {
        spokenText = `I can help with your order${nameEnding}. Share the order number and what went wrong, and I'll help you work out the next step.`;
      } else if (qLower.includes('how are you')) {
        spokenText = `I'm doing well, thanks for asking${nameSalutation}. How are you doing?`;
      } else if (qLower.includes('who are you') || qLower.includes('what is your name')) {
        spokenText = `I'm Atonia, your AI customer operations voice assistant. I'm here to answer questions and help with your request. May I ask what your name is?`;
      } else if (qLower.includes('joke') || qLower.includes('laugh')) {
        spokenText = `Here's one for you${nameEnding}! Why do clouds never take out high-deductible insurance? Because they're already completely covered by the sky! I hope that brought a little smile to your day.`;
      } else {
        if (hasRecipient) {
          spokenText = `Good question, ${callerName}. Let me understand what you need, and I'll help you figure out the next step.`;
        } else {
          spokenText = `I can help with that. What name would you like me to use?`;
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    // Log to audit trail
    store.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Atonia (AI Voice Agent)',
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
      voiceName: 'Atonia (Warm Female Voice)',
      latencyMs,
      intent: 'Real-Time Voice Q&A'
    };
  }
}

export const voiceAgentService = new VoiceAgentService();
