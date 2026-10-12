import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { fetchVoiceSessions, sendVoiceOverride } from '../api.ts';
import { VoiceCallSession } from '../../types/index.ts';
import { RealLifeVoicePanel } from '../components/voice/RealLifeVoicePanel.tsx';

export const VoicePage: React.FC = () => {
  const { showToast, selectedBusiness } = useApp();
  const [activeVoiceTab, setActiveVoiceTab] = useState<'interactive' | 'supervisor'>('interactive');
  const [sessions, setSessions] = useState<VoiceCallSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<VoiceCallSession | null>(null);
  const [overrideInput, setOverrideInput] = useState<string>('');
  const [callFilter, setCallFilter] = useState<'inbound' | 'outbound' | 'escalated'>('inbound');

  useEffect(() => {
    loadVoice();
  }, []);

  const loadVoice = async () => {
    try {
      const data = await fetchVoiceSessions();
      if (data?.sessions) {
        setSessions(data.sessions);
        setSelectedSession(data.sessions[0]);
      }
    } catch (err) {
      console.error('Failed to load voice sessions:', err);
    }
  };

  const handleOverrideAction = async (action: string) => {
    if (!selectedSession) return;
    try {
      await sendVoiceOverride(selectedSession.id, action, overrideInput);
      showToast(`Voice action [${action.toUpperCase()}] executed on active RTP stream.`, 'success');
      loadVoice();
      setOverrideInput('');
    } catch (err) {
      console.error('Voice action error:', err);
    }
  };

  return (
    <div className="flex flex-col w-full pb-space-xl">
      {/* Telephony Overview & Mode Selector Bar */}
      <div className="px-space-md py-space-md bg-surface-container-lowest border-b border-surface-container-high/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-md">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-tertiary"></span>
              </span>
              <span className="font-telemetry-badge text-telemetry-badge text-tertiary uppercase tracking-widest font-semibold">
                REAL-TIME VOICE AGENT ACTIVE // ARIA (WARM FEMALE VOICE)
              </span>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-telemetry-mono text-telemetry-mono">
                GEMINI 3.8 &amp; WEB SPEECH SYNTHESIS
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Voice Agent Studio &amp; Telephony Ops</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-3xl">
              Talk directly to Aria, our sovereign female voice AI with warm empathetic tone, or monitor the multi-tenant SIP telephony trunk fleet with supervisor intervention.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-xl border border-surface-container-high/40 self-start lg:self-auto">
            <button
              onClick={() => setActiveVoiceTab('interactive')}
              className={`px-4 py-2 rounded-lg font-label-md text-label-md flex items-center gap-2 transition-all ${
                activeVoiceTab === 'interactive'
                  ? 'bg-primary text-on-primary font-bold shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">record_voice_over</span>
              <span>Live Voice Agent (Aria)</span>
              <span className="px-1.5 py-0.2 rounded-full bg-tertiary text-on-tertiary text-[10px] uppercase font-bold animate-pulse">
                Live
              </span>
            </button>
            <button
              onClick={() => setActiveVoiceTab('supervisor')}
              className={`px-4 py-2 rounded-lg font-label-md text-label-md flex items-center gap-2 transition-all ${
                activeVoiceTab === 'supervisor'
                  ? 'bg-primary text-on-primary font-bold shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">hub</span>
              <span>SIP Trunk Fleet &amp; Supervisor</span>
            </button>
          </div>
        </div>

        {/* Telephony Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-space-sm pt-space-xs">
          <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col justify-between border border-surface-container-high/30">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Active Live Calls</span>
              <span className="material-symbols-outlined text-[16px] text-primary">phone_in_talk</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-headline-lg text-headline-lg text-on-surface">18</span>
              <span className="font-telemetry-mono text-telemetry-mono text-tertiary flex items-center">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 3 SIP
              </span>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: '72%' }}></div>
            </div>
          </div>

          <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col justify-between border border-surface-container-high/30">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Avg Handle Time</span>
              <span className="material-symbols-outlined text-[16px] text-secondary">timer</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-headline-lg text-headline-lg text-on-surface">2m 45s</span>
              <span className="font-telemetry-mono text-telemetry-mono text-tertiary flex items-center">
                <span className="material-symbols-outlined text-[14px]">arrow_downward</span> 14s
              </span>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-secondary-container h-full rounded-full" style={{ width: '48%' }}></div>
            </div>
          </div>

          <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col justify-between border border-surface-container-high/30">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider">AI Voice Latency</span>
              <span className="material-symbols-outlined text-[16px] text-tertiary">speed</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-headline-lg text-headline-lg text-primary">240ms</span>
              <span className="font-telemetry-badge text-telemetry-badge text-tertiary bg-surface-container-high px-1.5 py-0.5 rounded">
                E2E RTP
              </span>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-tertiary h-full rounded-full" style={{ width: '35%' }}></div>
            </div>
          </div>

          <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col justify-between border border-surface-container-high/30">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Voice Warmth Index</span>
              <span className="material-symbols-outlined text-[16px] text-tertiary">favorite</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-headline-lg text-headline-lg text-tertiary">98.4%</span>
              <span className="font-telemetry-badge text-telemetry-badge text-tertiary uppercase">Max Caring</span>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-tertiary h-full rounded-full" style={{ width: '98%' }}></div>
            </div>
          </div>

          <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col justify-between col-span-2 md:col-span-1 border border-surface-container-high/30">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Call Sentiment</span>
              <span className="material-symbols-outlined text-[16px] text-tertiary">sentiment_satisfied</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-headline-lg text-headline-lg text-tertiary">96%</span>
              <span className="font-telemetry-badge text-telemetry-badge text-on-surface-variant uppercase">Positive</span>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-tertiary h-full rounded-full" style={{ width: '96%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Mode View: Interactive Live Voice Agent vs Supervisor Fleet */}
      {activeVoiceTab === 'interactive' ? (
        <div className="p-space-md grid grid-cols-1 lg:grid-cols-12 gap-space-md">
          {/* Main Voice Panel (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col">
            <RealLifeVoicePanel
              initialBusinessId={selectedBusiness === 'ALL' ? 'EUREKA' : selectedBusiness}
              callerName=""
            />
          </div>

          {/* Side Telemetry & Features Info (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-space-md">
            {/* Voice Persona Card */}
            <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high/40 flex flex-col gap-space-sm shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/50 flex-shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
                    alt="Aria Voice Agent"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface">Aria // Voice Specialist</span>
                  <span className="font-body-sm text-body-sm text-tertiary font-medium">
                    Warm, Caring &amp; Ultra-Empathetic
                  </span>
                </div>
              </div>

              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                Aria is tuned with high feminine warmth, natural conversational pauses, and deep contextual knowledge across all 4 Atonia operational domains.
              </p>

              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-surface-container-high/30">
                <div className="p-2 rounded bg-surface-container-lowest">
                  <span className="font-label-sm text-[11px] text-outline block">Vocal Tone</span>
                  <span className="font-label-md text-label-md font-semibold text-primary">Gentle &amp; Reassuring</span>
                </div>
                <div className="p-2 rounded bg-surface-container-lowest">
                  <span className="font-label-sm text-[11px] text-outline block">Response Time</span>
                  <span className="font-telemetry-mono text-telemetry-mono font-bold text-tertiary">&lt; 300ms RTP</span>
                </div>
                <div className="p-2 rounded bg-surface-container-lowest">
                  <span className="font-label-sm text-[11px] text-outline block">Speech-to-Text</span>
                  <span className="font-label-md text-label-md font-semibold text-on-surface">Web Speech API</span>
                </div>
                <div className="p-2 rounded bg-surface-container-lowest">
                  <span className="font-label-sm text-[11px] text-outline block">Text-to-Speech</span>
                  <span className="font-label-md text-label-md font-semibold text-on-surface">Warm Pitch Synth</span>
                </div>
              </div>
            </div>

            {/* Real-Time Questions Guide */}
            <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high/40 flex flex-col gap-space-sm shadow-md">
              <div className="flex items-center justify-between">
                <span className="font-headline-sm text-headline-sm text-on-surface">What You Can Ask</span>
                <span className="material-symbols-outlined text-[18px] text-primary">auto_awesome</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                You can ask Aria literally <strong>any question</strong> aloud or typed. Here are domains she handles natively:
              </p>
              <div className="flex flex-col gap-2 mt-1">
                <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-surface-container-high/30 flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">account_balance</span>
                  <div className="flex flex-col text-body-sm">
                    <strong className="text-on-surface">Eureka Banking</strong>
                    <span className="text-on-surface-variant">Card freeze, emergency cash code, balance verification, wire intercepts.</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-surface-container-high/30 flex items-start gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px] mt-0.5">directions_car</span>
                  <div className="flex flex-col text-body-sm">
                    <strong className="text-on-surface">Atonia Insurance</strong>
                    <span className="text-on-surface-variant">Fleet endorsements, DVLA lookup, vehicle addition, policy schedules.</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-surface-container-high/30 flex items-start gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[18px] mt-0.5">shopping_cart</span>
                  <div className="flex flex-col text-body-sm">
                    <strong className="text-on-surface">Atonia Marketplace</strong>
                    <span className="text-on-surface-variant">Amazon order status, FedEx return labels, replacement guidance.</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-surface-container-high/30 flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">favorite</span>
                  <div className="flex flex-col text-body-sm">
                    <strong className="text-on-surface">Life, Warmth &amp; Chit-chat</strong>
                    <span className="text-on-surface-variant">Ask how she is, tell her about your day, ask for advice, or request a lighthearted joke.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance & Audio Security */}
            <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high/40 flex flex-col gap-2 shadow-md">
              <div className="flex items-center gap-2 text-tertiary font-label-md text-label-md font-semibold">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>FCA Voice Adjudication &amp; Privacy</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Every voice interaction is logged to the tamper-evident audit repository. Financial transactions require single-use biometric verification tokens.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Supervisor Telephony Fleet View */
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-14rem)] bg-surface">
          {/* Left Column (4 cols) */}
          <div className="lg:col-span-4 xl:col-span-4 bg-surface-container-lowest flex flex-col p-space-md gap-space-md border-r border-surface-container-high/30">
            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-headline-sm text-headline-sm text-on-surface">Live Calls Queue</span>
                  <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container font-telemetry-mono text-telemetry-mono font-bold">
                    {sessions.length} Active
                  </span>
                </div>
                <button onClick={loadVoice} className="text-on-surface-variant hover:text-on-surface p-1 rounded hover:bg-surface-container">
                  <span className="material-symbols-outlined text-[18px]">sync</span>
                </button>
              </div>

              <div className="flex gap-1.5 p-1 bg-surface-container-low rounded-lg text-on-surface-variant font-label-sm text-label-sm border border-surface-container-high/30">
                <button
                  onClick={() => setCallFilter('inbound')}
                  className={`flex-1 py-1 rounded text-center transition-colors ${
                    callFilter === 'inbound' ? 'bg-surface-container-high text-on-surface font-semibold' : 'hover:bg-surface-container'
                  }`}
                >
                  Inbound (12)
                </button>
                <button
                  onClick={() => setCallFilter('outbound')}
                  className={`flex-1 py-1 rounded text-center transition-colors ${
                    callFilter === 'outbound' ? 'bg-surface-container-high text-on-surface font-semibold' : 'hover:bg-surface-container'
                  }`}
                >
                  Outbound (6)
                </button>
                <button
                  onClick={() => setCallFilter('escalated')}
                  className={`flex-1 py-1 rounded text-center transition-colors ${
                    callFilter === 'escalated' ? 'bg-surface-container-high text-on-surface font-semibold' : 'hover:bg-surface-container'
                  }`}
                >
                  Escalated (1)
                </button>
              </div>
            </div>

            {/* Session Cards */}
            <div className="flex flex-col gap-space-sm flex-1 overflow-y-auto pr-0.5">
              {sessions.map((sess) => {
                const isSelected = selectedSession?.id === sess.id;
                return (
                  <div
                    key={sess.id}
                    onClick={() => setSelectedSession(sess)}
                    className={`p-space-sm rounded-lg relative overflow-hidden transition-all shadow-md cursor-pointer border ${
                      isSelected
                        ? 'bg-surface-container-high border-primary/50'
                        : 'bg-surface-container hover:bg-surface-container-high border-surface-container-high/30'
                    }`}
                  >
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>}
                    <div className="flex items-start justify-between gap-2 pl-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative">
                          <img className="w-9 h-9 rounded-full object-cover" src={sess.callerAvatarUrl} alt={sess.callerName} />
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-surface-container-lowest text-[10px]">graphic_eq</span>
                          </span>
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-headline-sm text-headline-sm text-on-surface truncate">{sess.callerName}</span>
                            {isSelected && (
                              <span className="px-1.5 py-0.2 rounded bg-primary/20 text-primary font-telemetry-badge text-telemetry-badge uppercase">
                                Selected
                              </span>
                            )}
                          </div>
                          <span className="font-telemetry-mono text-telemetry-mono text-on-surface-variant truncate">{sess.callerPhone}</span>
                        </div>
                      </div>
                      <span className="font-telemetry-mono text-telemetry-mono text-primary font-bold px-2 py-0.5 rounded bg-surface-container-lowest">
                        {sess.duration}
                      </span>
                    </div>

                    <div className="mt-space-sm pl-2 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-on-surface-variant">
                        <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-secondary-fixed font-label-sm text-label-sm">
                          {sess.businessId.replace('_', ' ')}
                        </span>
                        <span className="font-telemetry-badge text-telemetry-badge text-on-surface-variant uppercase">SIP / WebRTC Core</span>
                      </div>
                      <div className="p-2 rounded bg-surface-container-lowest flex items-center justify-between border border-surface-container-high/30">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                          <span className="font-label-sm text-label-sm text-on-surface truncate">Intent: {sess.intent}</span>
                        </div>
                        <div className="flex items-center gap-0.5 h-3.5">
                          <div className="w-0.5 bg-primary h-3 animate-pulse"></div>
                          <div className="w-0.5 bg-primary h-1.5"></div>
                          <div className="w-0.5 bg-primary h-3.5 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column (8 cols): Deep-Dive & Telemetry */}
          <div className="lg:col-span-8 xl:col-span-8 flex flex-col bg-surface">
            {selectedSession && (
              <>
                {/* Top Control Bar */}
                <div className="p-space-md bg-surface-container-low flex flex-col gap-space-md border-b border-surface-container-high/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                    <div className="flex items-center gap-space-md">
                      <div className="relative">
                        <img className="w-12 h-12 rounded-lg object-cover" src={selectedSession.callerAvatarUrl} alt={selectedSession.callerName} />
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary"></span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-headline-md text-headline-md text-on-surface">{selectedSession.callerName}</span>
                          <span className="px-2 py-0.5 rounded bg-tertiary/15 text-tertiary font-telemetry-badge text-telemetry-badge flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-[12px]">verified</span> Biometrics Passed ({selectedSession.biometricScore}%)
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
                          <span className="font-telemetry-mono text-telemetry-mono">{selectedSession.callerPhone}</span>
                          <span>•</span>
                          <span className="text-primary font-semibold">{selectedSession.businessId.replace('_', ' ')}</span>
                          <span>•</span>
                          <span className="font-telemetry-badge text-telemetry-badge text-outline">{selectedSession.accountRef}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container-lowest border border-surface-container-high/30">
                          <span className="h-2 w-2 rounded-full bg-error animate-ping"></span>
                          <span className="font-telemetry-badge text-telemetry-badge text-error uppercase font-bold tracking-wider">Live Streaming</span>
                        </div>
                        <span className="font-telemetry-mono text-telemetry-mono text-primary font-semibold mt-1">Duration: {selectedSession.duration}</span>
                      </div>
                    </div>
                  </div>

                  {/* Operator Actions */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                    <button
                      onClick={() => handleOverrideAction('barge_in')}
                      className="px-3 py-2 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md flex items-center justify-center gap-2 transition-all border border-surface-container-high/30"
                    >
                      <span className="material-symbols-outlined text-[18px] text-primary">mic_off</span>
                      <span>Mute AI / Barge-in</span>
                    </button>
                    <button
                      onClick={() => handleOverrideAction('whisper')}
                      className="px-3 py-2 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md flex items-center justify-center gap-2 transition-all border border-surface-container-high/30"
                    >
                      <span className="material-symbols-outlined text-[18px] text-tertiary">record_voice_over</span>
                      <span>Whisper to AI</span>
                    </button>
                    <button
                      onClick={() => handleOverrideAction('transfer')}
                      className="px-3 py-2 rounded bg-surface-container-high hover:bg-surface-bright text-secondary-fixed font-label-md text-label-md flex items-center justify-center gap-2 transition-all border border-surface-container-high/30"
                    >
                      <span className="material-symbols-outlined text-[18px]">forward_to_inbox</span>
                      <span>Transfer to Specialist</span>
                    </button>
                    <button
                      onClick={() => handleOverrideAction('terminate')}
                      className="px-3 py-2 rounded bg-error-container text-on-error hover:bg-error font-label-md text-label-md font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">call_end</span>
                      <span>Terminate Call</span>
                    </button>
                  </div>
                </div>

                {/* Real-Time Telemetry Bar */}
                <div className="p-space-sm bg-surface-container flex flex-wrap items-center justify-between gap-space-sm border-b border-surface-container-high/30">
                  <div className="flex items-center gap-space-md flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-sm text-label-sm text-outline">STT Engine:</span>
                      <span className="font-telemetry-mono text-telemetry-mono text-on-surface px-1.5 py-0.5 rounded bg-surface-container-lowest border border-surface-container-high/30">
                        {selectedSession.sttEngine}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-sm text-label-sm text-outline">TTS Model:</span>
                      <span className="font-telemetry-mono text-telemetry-mono text-on-surface px-1.5 py-0.5 rounded bg-surface-container-lowest border border-surface-container-high/30">
                        {selectedSession.ttsModel}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-sm text-label-sm text-outline">RTP Latency:</span>
                      <span className="font-telemetry-mono text-telemetry-mono text-tertiary font-bold">{selectedSession.latencyMs}ms</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-md">
                    <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                      <span className="material-symbols-outlined text-[15px] text-tertiary">sentiment_very_satisfied</span>
                      <span>Sentiment: <strong className="text-tertiary">{selectedSession.sentiment}</strong></span>
                    </div>
                    <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                      <span className="material-symbols-outlined text-[15px] text-primary">security</span>
                      <span className="text-on-surface">Compliance: Zero Flags</span>
                    </div>
                  </div>
                </div>

                {/* Transcript Stream */}
                <div className="flex-1 p-space-md flex flex-col gap-space-md overflow-y-auto bg-surface">
                  <div className="flex items-center justify-center my-1">
                    <span className="px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-telemetry-badge text-telemetry-badge uppercase tracking-wider border border-surface-container-high/30">
                      Call Connected via TLS SIP Trunk
                    </span>
                  </div>

                  {selectedSession.transcripts.map((t, idx) => {
                    const isCaller = t.speaker === 'caller';
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-space-sm max-w-2xl ${
                          isCaller ? '' : 'self-end flex-row-reverse'
                        }`}
                      >
                        <div className="flex-shrink-0 mt-1">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center ${
                              isCaller ? 'bg-surface-container-high text-on-surface' : 'bg-primary-container text-on-primary-container'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">{isCaller ? 'person' : 'smart_toy'}</span>
                          </div>
                        </div>
                        <div className={`flex flex-col gap-1 min-w-0 ${isCaller ? '' : 'items-end'}`}>
                          <div className="flex items-center gap-2">
                            <span className={`font-label-md text-label-md font-semibold ${isCaller ? 'text-on-surface' : 'text-primary'}`}>
                              {t.speakerName}
                            </span>
                            <span className="font-telemetry-mono text-telemetry-mono text-outline">{t.time}</span>
                          </div>
                          <div
                            className={`p-space-sm rounded-lg font-body-md text-body-md shadow-sm border border-surface-container-high/30 ${
                              isCaller ? 'bg-surface-container-low text-on-surface' : 'bg-surface-container-high text-on-surface'
                            }`}
                          >
                            "{t.text}"
                          </div>
                          {t.ttsMeta && (
                            <span className="font-telemetry-badge text-telemetry-badge text-on-surface-variant">{t.ttsMeta}</span>
                          )}
                          {t.toolCallTriggered && (
                            <div className="p-2 rounded bg-surface-container-lowest text-tertiary font-telemetry-mono text-xs border border-tertiary/30">
                              CONFIRMED EXECUTION: {t.toolCallTriggered}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Intervention Input Strip */}
                <div className="p-space-sm bg-surface-container-low flex flex-col sm:flex-row items-center gap-space-sm border-t border-surface-container-high/40">
                  <div className="relative flex-1 w-full">
                    <input
                      value={overrideInput}
                      onChange={(e) => setOverrideInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleOverrideAction('whisper');
                      }}
                      className="w-full bg-surface-container-lowest text-on-surface font-body-sm text-body-sm px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-outline border border-surface-container-high/40"
                      placeholder="Type prompt instruction or supervisor override whisper to AI model..."
                      type="text"
                    />
                    <span className="absolute right-2 top-2 font-telemetry-mono text-telemetry-mono text-outline select-none">
                      Press Enter to Whisper
                    </span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleOverrideAction('force_tool')}
                      className="px-3 py-2 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md flex items-center gap-1.5 transition-colors border border-surface-container-high/30"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">play_arrow</span>
                      <span>Force Tool Run</span>
                    </button>
                    <button
                      onClick={() => handleOverrideAction('barge_in')}
                      className="px-3 py-2 rounded bg-primary-container text-on-primary-container hover:bg-primary font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">mic</span>
                      <span>Take Over Call Now</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
