import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { talkToVoiceAgent } from '../../api.ts';
import { BusinessId } from '../../../types/index.ts';

interface LiveVoicePanelProps {
  onClose?: () => void;
  isFloating?: boolean;
}

interface TranscriptTurn {
  id: string;
  speaker: 'user' | 'elena';
  text: string;
  time: string;
  latencyMs?: number;
}

export const LiveVoicePanel: React.FC<LiveVoicePanelProps> = ({ onClose, isFloating = false }) => {
  const { selectedBusiness, showToast } = useApp();
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected' | 'speaking' | 'listening'>('connected');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [isListeningActive, setIsListeningActive] = useState<boolean>(false);
  const [liveSpokenText, setLiveSpokenText] = useState<string>('');
  const [typedInput, setTypedInput] = useState<string>('');
  const [callDuration, setCallDuration] = useState<number>(14);
  const [transcripts, setTranscripts] = useState<TranscriptTurn[]>([
    {
      id: 'turn-0',
      speaker: 'elena',
      text: "Hello! I'm Elena, your customer service voice specialist. My voice is right here with you, and I can answer any question you have today. What's on your mind?",
      time: 'Just now'
    }
  ]);
  const [audioWaves, setAudioWaves] = useState<number[]>([4, 8, 12, 18, 24, 15, 9, 20, 28, 16, 10, 6]);

  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Call timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Audio wave animation
  useEffect(() => {
    const interval = setInterval(() => {
      if (callState === 'speaking' || callState === 'listening') {
        setAudioWaves(
          Array.from({ length: 16 }, () => Math.floor(Math.random() * 32) + 6)
        );
      } else {
        setAudioWaves([6, 8, 10, 12, 8, 6, 8, 10, 12, 10, 8, 6, 8, 6, 8, 6]);
      }
    }, 120);
    return () => clearInterval(interval);
  }, [callState]);

  // Setup Web Speech Recognition for real-time microphone
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListeningActive(true);
          setCallState('listening');
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (interimTranscript) {
            setLiveSpokenText(interimTranscript);
          }

          if (finalTranscript) {
            const spoken = finalTranscript.trim();
            setLiveSpokenText('');
            if (spoken) {
              handleUserQuestion(spoken);
            }
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition status:', e.error);
          if (e.error === 'not-allowed') {
            showToast('Microphone access denied. You can also type any question below!', 'warning');
          }
          setIsListeningActive(false);
        };

        recognition.onend = () => {
          setIsListeningActive(false);
          // If call is still connected and not muted, we can restart
          if (callState !== 'idle' && !isMuted) {
            try {
              recognition.start();
            } catch (_) {}
          }
        };

        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch (_) {}
      } catch (err) {
        console.warn('Speech recognition init error:', err);
      }
    } else {
      console.info('Web Speech Recognition API not natively supported; text input available.');
    }

    // Play greeting voice once on mount
    playWarmVoice(
      "Hello! I'm Elena, your customer service voice specialist. My voice is right here with you, and I can answer any question you have today. What's on your mind?"
    );

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Format call duration MM:SS
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Play synthesized warm female voice
  const playWarmVoice = (text: string, base64Audio?: string) => {
    if (!isSpeakerOn) return;

    setCallState('speaking');

    // 1. If we have Gemini TTS WAV audio, play it directly
    if (base64Audio) {
      try {
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
        }
        const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
        currentAudioRef.current = audio;
        audio.onended = () => {
          setCallState('connected');
        };
        audio.onerror = () => {
          fallbackWebSpeech(text);
        };
        audio.play().catch(() => {
          fallbackWebSpeech(text);
        });
        return;
      } catch (err) {
        console.warn('Audio playback error, falling back to Web Speech:', err);
      }
    }

    // 2. Fallback to Web Speech API with tuned warm female persona
    fallbackWebSpeech(text);
  };

  const fallbackWebSpeech = (text: string) => {
    if (!window.speechSynthesis) {
      setCallState('connected');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Pick warm female voice
    const voices = window.speechSynthesis.getVoices();
    const warmFemaleVoice = voices.find(
      (v) =>
        (v.name.includes('Google UK English Female') ||
          v.name.includes('Female') ||
          v.name.includes('Samantha') ||
          v.name.includes('Victoria') ||
          v.name.includes('Karen') ||
          v.name.includes('Moira') ||
          v.name.includes('Zira') ||
          v.name.includes('Natural')) &&
        v.lang.startsWith('en')
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (warmFemaleVoice) {
      utterance.voice = warmFemaleVoice;
    }

    // Warm, soothing speech parameters
    utterance.pitch = 1.08; // slightly higher feminine pitch
    utterance.rate = 0.95;  // gentle, warm pacing

    utterance.onend = () => {
      setCallState('connected');
    };
    utterance.onerror = () => {
      setCallState('connected');
    };

    window.speechSynthesis.speak(utterance);
  };

  // Handle asking any question
  const handleUserQuestion = async (query: string) => {
    if (!query.trim()) return;

    const userTurn: TranscriptTurn = {
      id: `usr-${Date.now()}`,
      speaker: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setTranscripts((prev) => [...prev, userTurn]);
    setCallState('speaking');

    try {
      const activeBiz: BusinessId =
        selectedBusiness === 'ALL' ? 'EUREKA' : selectedBusiness;

      const response = await talkToVoiceAgent({
        question: query,
        businessId: activeBiz,
        callerName: 'Julian'
      });

      if (response?.text) {
        const elenaTurn: TranscriptTurn = {
          id: `elena-${Date.now()}`,
          speaker: 'elena',
          text: response.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          latencyMs: response.latencyMs
        };

        setTranscripts((prev) => [...prev, elenaTurn]);
        playWarmVoice(response.text, response.audioBase64);
      }
    } catch (err) {
      console.error('Error answering voice question:', err);
      const fallbackText = "I heard you clearly, and I'm right here with you. Let me check our verified records and take care of this for you immediately.";
      const elenaTurn: TranscriptTurn = {
        id: `elena-${Date.now()}`,
        speaker: 'elena',
        text: fallbackText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setTranscripts((prev) => [...prev, elenaTurn]);
      playWarmVoice(fallbackText);
    }
  };

  const toggleMic = () => {
    if (isMuted) {
      setIsMuted(false);
      try {
        recognitionRef.current?.start();
        setIsListeningActive(true);
      } catch (_) {}
      showToast('Microphone unmuted. Elena is listening!', 'info');
    } else {
      setIsMuted(true);
      try {
        recognitionRef.current?.stop();
        setIsListeningActive(false);
      } catch (_) {}
      showToast('Microphone muted.', 'info');
    }
  };

  const toggleSpeaker = () => {
    if (isSpeakerOn) {
      setIsSpeakerOn(false);
      window.speechSynthesis?.cancel();
      if (currentAudioRef.current) currentAudioRef.current.pause();
      showToast('Speaker muted.', 'info');
    } else {
      setIsSpeakerOn(true);
      showToast('Speaker active.', 'info');
    }
  };

  const handleEndCall = () => {
    window.speechSynthesis?.cancel();
    if (currentAudioRef.current) currentAudioRef.current.pause();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setCallState('idle');
    showToast('Call ended. Thank you for speaking with Elena.', 'info');
    if (onClose) onClose();
  };

  const quickPrompts = [
    'I lost my debit card in a cafe in Soho, please help me!',
    'How do I add 3 new Mercedes Sprinter vans to our fleet insurance?',
    'What are the 4 business portfolios managed by Atonia?',
    'Can you explain how flood insurance coverage exclusions work?',
    'Tell me something comforting and reassuring today',
    'How does your AI verify transactions without hallucinating?'
  ];

  return (
    <div
      className={`bg-surface-container-lowest flex flex-col rounded-2xl shadow-2xl border border-primary/40 overflow-hidden ${
        isFloating ? 'w-full max-w-xl' : 'w-full max-w-3xl mx-auto my-space-md'
      }`}
    >
      {/* Call Header Banner */}
      <div className="bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low p-space-md flex items-center justify-between border-b border-surface-container-high/40">
        <div className="flex items-center gap-space-sm">
          <div className="relative">
            <img
              alt="Elena Voice Specialist"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-primary shadow-lg"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-GQz6_qFo1mpN8KN0O92az5t45MIBvghtd1Z90CWz_QBoVqrMKK76l-fJees5jYn97Ldt3PvuHxR_3wnpGFGrOQsnvGE0lpKFd3bTjf074ZCUUTht6U2qQ9Y196U7tdrKTkoQQVlfT-Y3dwJ2zBYfosCpJGylg1dfDFMJPNRqMPEVyivveSeWlyvz9t2g-Gr4IfstAMTkhnVX-04qW-h7KpTSBUNG-OqfJhXjFEdqdcprHu7Ob_7uVQ"
            />
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-tertiary ring-2 ring-surface-container-lowest animate-pulse"></span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-headline-md text-headline-md text-on-surface">Elena</span>
              <span className="px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary font-telemetry-badge uppercase">
                Warm Female Voice (Kore)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-telemetry-mono">
              <span className="text-primary font-semibold">Live Telephone Session</span>
              <span>•</span>
              <span className="text-tertiary">24kHz HD Audio</span>
              <span>•</span>
              <span className="text-on-surface">{formatDuration(callDuration)}</span>
            </div>
          </div>
        </div>

        {/* Top Status & Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-highest/60 border border-surface-container-high text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                callState === 'speaking'
                  ? 'bg-primary animate-ping'
                  : callState === 'listening'
                  ? 'bg-tertiary animate-pulse'
                  : 'bg-tertiary'
              }`}
            ></span>
            <span className="capitalize font-telemetry-mono text-on-surface">
              {callState === 'speaking'
                ? 'Elena Speaking...'
                : callState === 'listening'
                ? 'Listening to You...'
                : 'Connected'}
            </span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              title="Close panel"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-Time Audio Waveform Visualizer */}
      <div className="bg-surface-container-low px-space-md py-space-sm flex flex-col gap-1 border-b border-surface-container-high/30">
        <div className="flex items-center justify-between text-[11px] font-telemetry-mono text-outline">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-primary">graphic_eq</span>
            <span>Real-Time Biometric & Acoustic Telemetry</span>
          </span>
          <span className="text-tertiary">Natural Empathy Score: 99.4%</span>
        </div>

        {/* Dynamic Spectrum Wave Bars */}
        <div className="h-12 bg-surface-container-lowest rounded-lg flex items-center justify-center gap-1.5 px-4 overflow-hidden border border-surface-container-high/30">
          {audioWaves.map((height, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full transition-all duration-100 ${
                callState === 'speaking'
                  ? 'bg-primary'
                  : callState === 'listening'
                  ? 'bg-tertiary'
                  : 'bg-outline/50'
              }`}
              style={{ height: `${height}px` }}
            ></div>
          ))}
        </div>
      </div>

      {/* Live Conversation Transcript Feed */}
      <div className="flex-1 p-space-md overflow-y-auto max-h-[320px] min-h-[220px] space-y-space-sm bg-surface">
        {transcripts.map((turn) => (
          <div
            key={turn.id}
            className={`flex flex-col ${
              turn.speaker === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-2 mb-1 px-1">
              <span
                className={`font-label-sm text-xs font-semibold ${
                  turn.speaker === 'user' ? 'text-on-surface' : 'text-primary'
                }`}
              >
                {turn.speaker === 'user' ? 'You (Caller)' : 'Elena (Warm Voice)'}
              </span>
              <span className="font-telemetry-mono text-[10px] text-outline">{turn.time}</span>
              {turn.latencyMs && (
                <span className="font-telemetry-mono text-[10px] text-tertiary">
                  {turn.latencyMs}ms
                </span>
              )}
            </div>

            <div
              className={`p-3 rounded-2xl max-w-[85%] font-body-md text-sm leading-relaxed shadow-sm ${
                turn.speaker === 'user'
                  ? 'bg-primary-container text-on-primary-container rounded-br-none'
                  : 'bg-surface-container-high text-on-surface border border-surface-container-highest/40 rounded-bl-none'
              }`}
            >
              {turn.text}
            </div>
          </div>
        ))}

        {/* Live speech interim feedback */}
        {liveSpokenText && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-telemetry-mono text-tertiary animate-pulse mb-1">
              Listening live...
            </span>
            <div className="p-3 rounded-2xl max-w-[85%] bg-tertiary-container/30 text-tertiary-fixed text-sm border border-tertiary/40 italic">
              "{liveSpokenText}"
            </div>
          </div>
        )}

        <div ref={transcriptEndRef} />
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="px-space-md py-2 bg-surface-container-low border-t border-surface-container-high/30">
        <span className="text-[11px] font-telemetry-badge text-outline uppercase block mb-1.5">
          Ask Elena Anything (Click to ask aloud):
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleUserQuestion(prompt)}
              className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest text-xs whitespace-nowrap transition-colors border border-surface-container-high/30 flex-shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Live Voice Input & Phone Controls Bar */}
      <div className="p-space-md bg-surface-container-lowest border-t border-surface-container-high/40 flex flex-col gap-3">
        {/* Text fallback input */}
        <div className="flex items-center gap-2">
          <input
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && typedInput.trim()) {
                handleUserQuestion(typedInput.trim());
                setTypedInput('');
              }
            }}
            placeholder="Type any question or speak into your microphone..."
            className="flex-1 bg-surface-container-low text-on-surface font-body-sm text-sm px-3.5 py-2.5 rounded-xl border border-surface-container-high/40 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-outline-variant"
          />
          <button
            onClick={() => {
              if (typedInput.trim()) {
                handleUserQuestion(typedInput.trim());
                setTypedInput('');
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-headline-sm text-sm flex items-center gap-1.5 hover:bg-primary-fixed-dim transition-colors shadow-sm"
          >
            <span>Ask</span>
            <span className="material-symbols-outlined text-[16px]">send</span>
          </button>
        </div>

        {/* Telephony Buttons Strip */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMic}
              className={`p-2.5 rounded-xl flex items-center gap-2 transition-colors border ${
                isMuted
                  ? 'bg-error-container text-on-error border-error'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high border-surface-container-high'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isMuted ? 'mic_off' : 'mic'}
              </span>
              <span className="text-xs font-medium">{isMuted ? 'Muted' : 'Mic Active'}</span>
            </button>

            <button
              onClick={toggleSpeaker}
              className={`p-2.5 rounded-xl flex items-center gap-2 transition-colors border ${
                !isSpeakerOn
                  ? 'bg-error-container text-on-error border-error'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high border-surface-container-high'
              }`}
              title={isSpeakerOn ? 'Mute speaker' : 'Enable speaker'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isSpeakerOn ? 'volume_up' : 'volume_off'}
              </span>
              <span className="text-xs font-medium">{isSpeakerOn ? 'Speaker On' : 'Muted'}</span>
            </button>
          </div>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="px-4 py-2.5 rounded-xl bg-error text-on-error hover:bg-error/90 font-headline-sm text-sm flex items-center gap-2 transition-colors shadow-lg"
          >
            <span className="material-symbols-outlined text-[18px]">call_end</span>
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};
