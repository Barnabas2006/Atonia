import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { fetchConversations, fetchConversationById, postConversationMessage, processAgentMessage, takeoverConversation } from '../api.ts';
import { Conversation, CustomerContext } from '../../types/index.ts';

export const ConversationsPage: React.FC = () => {
  const { activeConversationId, setActiveConversationId, selectedBusiness, currentUser, showToast } = useApp();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<CustomerContext | null>(null);
  const [activeTab, setActiveTab] = useState<'policy' | 'claims' | 'apis' | 'audit'>('policy');
  const [inputText, setInputText] = useState<string>('');
  const [filterSegment, setFilterSegment] = useState<'all' | 'ai_active' | 'escalated' | 'needs_approval'>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    loadList();
  }, [selectedBusiness]);

  useEffect(() => {
    if (activeConversationId) {
      loadDetail(activeConversationId);
    }
  }, [activeConversationId]);

  const loadList = async () => {
    try {
      const data = await fetchConversations({ businessId: selectedBusiness });
      if (data?.conversations) {
        setConversations(data.conversations);
        if (!activeConversationId && data.conversations.length > 0) {
          setActiveConversationId(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations list:', err);
    }
  };

  const loadDetail = async (id: string) => {
    try {
      const data = await fetchConversationById(id);
      if (data?.conversation) {
        setActiveConv(data.conversation);
        setActiveCustomer(data.customer || null);
      }
    } catch (err) {
      console.error('Failed to load conversation details:', err);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !activeConv) return;
    const text = inputText.trim();
    setInputText('');
    setIsProcessing(true);

    try {
      // If supervisor mode, post as supervisor
      if (activeConv.status === 'human_monitoring' || activeConv.status === 'escalated_to_human') {
        const res = await postConversationMessage(activeConv.id, text, 'supervisor', currentUser.name);
        if (res?.conversation) {
          setActiveConv(res.conversation);
        }
        showToast('Supervisor message dispatched to customer channel.', 'success');
      } else {
        // Send through AI Gateway
        const res = await processAgentMessage({
          conversationId: activeConv.id,
          businessId: activeConv.businessId,
          customerId: activeConv.customerId,
          message: text,
          channel: activeConv.channel
        });
        if (res?.conversation) {
          setActiveConv(res.conversation);
        }
      }
    } catch (err) {
      console.error('Message send error:', err);
      showToast('Error communicating with session pipeline.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTakeover = async () => {
    if (!activeConv) return;
    try {
      const res = await takeoverConversation(activeConv.id, currentUser.name);
      if (res?.conversation) {
        setActiveConv(res.conversation);
      }
      showToast(`Control seized. Conversation routed to ${currentUser.name} workstation.`, 'success');
    } catch (err) {
      console.error('Takeover failed:', err);
    }
  };

  const insertSuggestion = () => {
    if (activeConv?.activeSuggestion) {
      setInputText(activeConv.activeSuggestion);
    } else {
      setInputText('Your revised Certificate of Motor Insurance has been issued. Vehicles are covered from midnight tonight.');
    }
  };

  const handleIssueEndorsement = () => {
    showToast('Fleet Endorsement schedule verified & bound to syndicate ledger.', 'success');
  };

  const handleDownloadPDF = () => {
    showToast('Generating official Lloyd’s Syndicate Motor Binder PDF...', 'info');
  };

  // Filtered queue items
  const filteredConversations = conversations.filter((c) => {
    if (filterSegment === 'ai_active' && c.status !== 'autonomous_answering' && c.status !== 'executing_tools') return false;
    if (filterSegment === 'escalated' && !c.isEscalated && c.status !== 'escalated_to_human') return false;
    if (filterSegment === 'needs_approval' && c.status !== 'human_monitoring') return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return c.customerName.toLowerCase().includes(q) || c.intent.toLowerCase().includes(q) || c.customerIdentifier.includes(q);
    }
    return true;
  });

  return (
    <div className="w-full h-[calc(100vh-3.5rem)] flex overflow-hidden">
      {/* PANE 1: Live Queue & Triage (Fixed 300px) */}
      <aside className="w-[300px] flex-shrink-0 bg-surface-container-lowest flex flex-col h-full border-r border-surface-container-high/40 shadow-lg z-20">
        {/* Sub-header & Segment Selectors */}
        <div className="p-space-sm bg-surface-container-low flex flex-col gap-space-sm border-b border-surface-container-high/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-sm text-headline-sm text-on-surface">Live Triage</span>
              <span className="px-1.5 py-0.5 rounded bg-surface-container text-tertiary font-telemetry-mono text-telemetry-mono">
                {conversations.length} Live
              </span>
            </div>
            <button onClick={loadList} className="p-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors" title="Reload queue">
              <span className="material-symbols-outlined text-[16px]">sync</span>
            </button>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              onClick={() => setFilterSegment('all')}
              className={`px-2 py-1 rounded font-telemetry-badge text-telemetry-badge uppercase whitespace-nowrap transition-colors ${
                filterSegment === 'all' ? 'bg-primary text-on-primary font-semibold shadow-sm' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All ({conversations.length})
            </button>
            <button
              onClick={() => setFilterSegment('ai_active')}
              className={`px-2 py-1 rounded font-telemetry-badge text-telemetry-badge uppercase whitespace-nowrap transition-colors ${
                filterSegment === 'ai_active' ? 'bg-primary text-on-primary font-semibold shadow-sm' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              AI Active
            </button>
            <button
              onClick={() => setFilterSegment('escalated')}
              className={`px-2 py-1 rounded font-telemetry-badge text-telemetry-badge uppercase whitespace-nowrap flex items-center gap-1 transition-colors ${
                filterSegment === 'escalated' ? 'bg-error text-on-error font-semibold' : 'bg-error-container text-on-error'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-error animate-ping"></span> Escalated
            </button>
            <button
              onClick={() => setFilterSegment('needs_approval')}
              className={`px-2 py-1 rounded font-telemetry-badge text-telemetry-badge uppercase whitespace-nowrap transition-colors ${
                filterSegment === 'needs_approval' ? 'bg-primary text-on-primary font-semibold shadow-sm' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Approval
            </button>
          </div>
        </div>

        {/* Search Field */}
        <div className="px-space-sm py-2 bg-surface-container-lowest border-b border-surface-container-high/30">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-2.5 text-on-surface-variant text-[15px] pointer-events-none">filter_list</span>
            <input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface font-body-sm text-body-sm pl-8 pr-3 py-1 rounded placeholder:text-outline-variant focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container-high/40"
              placeholder="Filter by policy, client, intent..."
              type="text"
            />
          </div>
        </div>

        {/* Queue Conversation Cards List */}
        <div className="flex-1 overflow-y-auto px-space-xs py-space-xs space-y-1.5">
          {filteredConversations.map((c) => {
            const isSelected = activeConv?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setActiveConversationId(c.id)}
                className={`p-space-sm rounded-lg relative cursor-pointer group transition-all border ${
                  isSelected
                    ? 'bg-surface-container-high border-primary/50 shadow-md'
                    : 'bg-surface-container-low hover:bg-surface-container border-surface-container-high/30'
                }`}
              >
                {isSelected && <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r"></div>}
                <div className="flex items-start justify-between gap-space-xs mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-headline-sm text-headline-sm text-on-surface truncate">{c.customerName}</span>
                    <span className="material-symbols-outlined text-primary text-[14px]">verified</span>
                  </div>
                  <span className="font-telemetry-mono text-telemetry-mono text-on-surface-variant flex-shrink-0">{c.lastActivity}</span>
                </div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="px-1.5 py-0.2 rounded bg-tertiary-container/30 text-tertiary-fixed font-telemetry-badge text-telemetry-badge uppercase">
                    {c.businessId.replace('_', ' ')}
                  </span>
                  <span className="text-on-surface-variant font-telemetry-mono text-telemetry-mono flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[13px] text-tertiary">chat</span> {c.channel}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1 mb-2">{c.intent}</p>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-telemetry-badge text-telemetry-badge flex items-center gap-1 uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                    {c.status.replace(/_/g, ' ')}
                  </span>
                  {c.isEscalated && (
                    <span className="px-1.5 py-0.5 rounded-full bg-error text-on-error font-telemetry-badge text-telemetry-badge font-semibold">
                      Alert
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Queue Telemetry Footer */}
        <div className="p-space-xs bg-surface-container-low flex items-center justify-between text-on-surface-variant font-telemetry-mono text-telemetry-mono border-t border-surface-container-high/30">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-tertiary"></span> Auto-Sync (1s)
          </span>
          <span>Node: UK-LON-04</span>
        </div>
      </aside>

      {/* PANE 2: Fluid Center Chat & Tool Execution Canvas */}
      <section className="flex-1 flex flex-col h-full bg-surface min-w-0 shadow-inner relative">
        {/* Workspace Header */}
        <header className="h-14 px-space-md bg-surface-container-low/80 backdrop-blur-md flex items-center justify-between flex-shrink-0 z-10 shadow-sm border-b border-surface-container-high/40">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="relative flex-shrink-0">
              {activeConv?.customerAvatarUrl ? (
                <img className="w-9 h-9 rounded-full object-cover" src={activeConv.customerAvatarUrl} alt={activeConv.customerName} />
              ) : (
                <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center font-headline-sm text-headline-sm text-primary">
                  {activeConv?.customerName.slice(0, 2).toUpperCase() || 'CU'}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-tertiary ring-2 ring-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined text-[8px] text-on-tertiary">done</span>
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-headline-sm text-on-surface truncate">{activeConv?.customerName || 'No Conversation Selected'}</span>
                <span className="px-1.5 py-0.2 rounded bg-tertiary-container/30 text-tertiary-fixed font-telemetry-badge text-telemetry-badge uppercase flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[11px]">verified</span> Verified VIP
                </span>
                <span className="font-telemetry-mono text-telemetry-mono text-on-surface-variant hidden sm:inline">{activeConv?.customerIdentifier}</span>
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm truncate">
                <span className="text-tertiary font-label-sm text-label-sm uppercase flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[13px]">chat</span> {activeConv?.channel}
                </span>
                <span>•</span>
                <span className="truncate">{activeConv?.businessId.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded bg-surface-container-high shadow-sm border border-surface-container-highest/40">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-telemetry-badge text-telemetry-badge text-on-surface uppercase tracking-wide">AI Operating with Supervisor Oversight</span>
            <span className="px-1.5 py-0.2 rounded bg-surface-container-lowest font-telemetry-mono text-telemetry-mono text-tertiary">98.4% Acc</span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleTakeover}
              className="px-3 py-1.5 rounded bg-error-container text-on-error font-headline-sm text-headline-sm flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">front_hand</span>
              <span className="hidden sm:inline">Take Over Session</span>
            </button>
          </div>
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-space-md space-y-4" id="chat-stream">
          {activeConv?.messages.map((m) => {
            if (m.sender === 'system') {
              return (
                <div key={m.id} className="flex items-center justify-center my-2">
                  <div className="flex items-center gap-2 px-3 py-1 rounded bg-surface-container-low text-on-surface-variant font-telemetry-mono text-telemetry-mono shadow-sm border border-surface-container-high/30">
                    <span className="material-symbols-outlined text-primary text-[14px]">bolt</span>
                    <span>{m.content}</span>
                    <span className="text-outline">{m.timestamp}</span>
                  </div>
                </div>
              );
            }

            if (m.sender === 'customer') {
              return (
                <div key={m.id} className="flex flex-col items-start max-w-2xl">
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="font-headline-sm text-headline-sm text-on-surface">{m.senderName}</span>
                    <span className="font-telemetry-mono text-telemetry-mono text-on-surface-variant">{m.timestamp}</span>
                  </div>
                  <div className="p-space-md rounded-xl bg-surface-container-high text-on-surface font-body-md text-body-md shadow-md border border-surface-container-highest/40 whitespace-pre-line">
                    {m.content}
                  </div>
                </div>
              );
            }

            if (m.sender === 'supervisor') {
              return (
                <div key={m.id} className="flex flex-col items-end max-w-2xl ml-auto">
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="px-2 py-0.2 rounded bg-tertiary-container text-on-tertiary font-telemetry-badge text-telemetry-badge uppercase font-semibold">
                      Human Supervisor ({m.senderName})
                    </span>
                    <span className="font-telemetry-mono text-telemetry-mono text-on-surface-variant">{m.timestamp}</span>
                  </div>
                  <div className="p-space-md rounded-xl bg-surface-container text-on-surface font-body-md text-body-md shadow-md border border-surface-container-highest/40">
                    {m.content}
                  </div>
                </div>
              );
            }

            // AI Agent
            return (
              <div key={m.id} className="flex flex-col items-end max-w-2xl ml-auto">
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="px-1.5 py-0.2 rounded bg-primary-container text-on-primary-container font-telemetry-badge text-telemetry-badge uppercase">
                    Autonomous Agent
                  </span>
                  <span className="font-telemetry-mono text-telemetry-mono text-on-surface-variant">{m.timestamp}</span>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md shadow-md border border-surface-container-high/40">
                  {m.content}
                </div>

                {/* Optional Tool Result Attachment */}
                {m.parts?.map((p, idx) => {
                  if (p.toolResult) {
                    return (
                      <div key={idx} className="w-full my-2 p-3 rounded-lg bg-surface-container-lowest border border-secondary/30 text-left">
                        <div className="flex justify-between items-center text-xs font-telemetry-mono mb-1">
                          <span className="text-secondary font-bold">{p.toolResult.name}</span>
                          <span className="text-tertiary">Verified via {p.toolResult.sourceApi}</span>
                        </div>
                        <pre className="text-[11px] font-telemetry-mono text-on-surface bg-surface-container-high/50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(p.toolResult.result, null, 2)}
                        </pre>
                      </div>
                    );
                  }
                  return null;
                })}

                {/* Optional Governance Trigger Alert */}
                {m.governanceEvent && (
                  <div className="w-full my-2 p-3 rounded-lg bg-surface-container-low border-l-4 border-primary text-left">
                    <div className="flex justify-between items-center text-xs font-semibold text-primary mb-1">
                      <span>{m.governanceEvent.type.replace('_', ' ')}</span>
                      <span className="font-telemetry-badge text-[10px] text-outline">Governance Trigger</span>
                    </div>
                    <p className="text-xs text-on-surface-variant">{m.governanceEvent.description}</p>
                  </div>
                )}

                {m.aiMetadata && (
                  <div className="flex items-center gap-2 mt-1 px-1 font-telemetry-mono text-telemetry-mono text-outline text-[11px]">
                    <span>Model: {m.aiMetadata.model} • {m.aiMetadata.latencyMs}ms latency</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Suggestion Bar */}
        <div className="px-space-md py-2 bg-surface-container-low shadow-sm flex items-center justify-between gap-space-sm border-t border-surface-container-high/30">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-1.5 py-0.5 rounded bg-primary-container text-on-primary-container font-telemetry-badge text-telemetry-badge uppercase flex items-center gap-1 flex-shrink-0">
              <span className="material-symbols-outlined text-[12px]">auto_awesome</span> Suggestion
            </span>
            <p className="font-body-sm text-body-sm text-on-surface truncate italic">
              "{activeConv?.activeSuggestion || 'Your revised Certificate of Motor Insurance has been issued. Vehicles are covered from midnight tonight.'}"
            </p>
          </div>
          <button
            onClick={insertSuggestion}
            className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-primary font-label-sm text-label-sm transition-colors flex items-center gap-1 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[14px]">add_circle</span> Insert Draft
          </button>
        </div>

        {/* Bottom Input Toolbar */}
        <div className="p-space-md bg-surface-container-lowest flex flex-col gap-2 flex-shrink-0 border-t border-surface-container-high/40">
          <div className="flex items-center gap-2">
            <button className="p-2 rounded bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors" title="Attach file">
              <span className="material-symbols-outlined text-[18px]">attach_file</span>
            </button>
            <button className="p-2 rounded bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors" title="Voice mic">
              <span className="material-symbols-outlined text-[18px]">mic</span>
            </button>
            <div className="flex-1 relative">
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md pl-3 pr-10 py-2 rounded focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-outline-variant border border-surface-container-high/40"
                placeholder={
                  activeConv?.status === 'human_monitoring'
                    ? 'Operator intervention mode: Type reply directly to customer...'
                    : 'Type prompt instruction or customer inquiry to process via AI Gateway...'
                }
                type="text"
                disabled={isProcessing}
              />
              <span className="absolute right-2.5 top-2.5 font-telemetry-mono text-telemetry-mono text-outline">Enter ↵</span>
            </div>
            <button
              onClick={handleSend}
              disabled={isProcessing}
              className="px-4 py-2 rounded bg-primary text-on-primary font-headline-sm text-headline-sm flex items-center gap-1.5 hover:bg-primary-fixed-dim transition-colors shadow-sm disabled:opacity-50"
            >
              <span>{isProcessing ? 'Processing...' : 'Send'}</span>
              <span className="material-symbols-outlined text-[16px]">send</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-on-surface-variant font-telemetry-mono text-telemetry-mono px-1 text-[11px]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.2 rounded bg-surface-container-high text-on-surface">Alt+H</kbd> Human Takeover</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.2 rounded bg-surface-container-high text-on-surface">Alt+A</kbd> Auto-Approve</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Autonomous Auto-send: Enabled</span>
            </div>
          </div>
        </div>
      </section>

      {/* PANE 3: Dynamic Business & Customer Context Panel (Fixed 360px) */}
      <aside className="w-[360px] flex-shrink-0 bg-surface-container-lowest flex flex-col h-full shadow-2xl z-20 overflow-hidden border-l border-surface-container-high/40">
        {/* Client Header */}
        <div className="p-space-md bg-surface-container-low flex flex-col gap-2 border-b border-surface-container-high/30">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded bg-tertiary-container/30 text-tertiary-fixed font-telemetry-badge text-telemetry-badge uppercase font-semibold">
              {activeCustomer?.tier || 'Enterprise Account'}
            </span>
            <span className="font-telemetry-mono text-telemetry-mono text-on-surface-variant">ID: {activeCustomer?.id || 'CUST-88192'}</span>
          </div>
          <div className="flex items-center gap-space-sm mt-1">
            {activeCustomer?.avatarUrl ? (
              <img className="w-12 h-12 rounded-full object-cover shadow-md flex-shrink-0" src={activeCustomer.avatarUrl} alt={activeCustomer.name} />
            ) : (
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-primary">
                {activeCustomer?.name.slice(0, 2).toUpperCase() || 'CU'}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-headline-md text-headline-md text-on-surface truncate">{activeCustomer?.name || 'Customer Profile'}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                {activeConv?.businessId === 'ATONIA_INSURANCE'
                  ? 'Managing Director • Sterling Logistics Ltd'
                  : activeConv?.businessId === 'EUREKA'
                  ? 'Corporate Treasury • Executive Account'
                  : 'Commercial Partner Client'}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="px-1.5 py-0.2 rounded bg-surface-container font-telemetry-badge text-telemetry-badge text-tertiary uppercase">
                  Risk: {activeCustomer?.riskLevel || 'Minimal'} ({activeCustomer?.riskScore || 9.4})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Entity Tabs Navigation */}
        <div className="flex items-center bg-surface-container px-space-xs pt-1 border-b border-surface-container-high/40">
          <button
            onClick={() => setActiveTab('policy')}
            className={`px-3 py-2 font-headline-sm text-headline-sm transition-colors whitespace-nowrap ${
              activeTab === 'policy' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Policy & Fleet
          </button>
          <button
            onClick={() => setActiveTab('claims')}
            className={`px-3 py-2 font-headline-sm text-headline-sm transition-colors whitespace-nowrap ${
              activeTab === 'claims' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Claims (1)
          </button>
          <button
            onClick={() => setActiveTab('apis')}
            className={`px-3 py-2 font-headline-sm text-headline-sm transition-colors whitespace-nowrap ${
              activeTab === 'apis' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Integrations
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-2 font-headline-sm text-headline-sm transition-colors whitespace-nowrap ${
              activeTab === 'audit' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Audit
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-space-md space-y-space-md">
          {activeTab === 'policy' && (
            <div className="space-y-space-md">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-surface-container-low shadow-sm border border-surface-container-high/30">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase block mb-1">Active Premium</span>
                  <span className="font-headline-md text-headline-md text-on-surface font-bold">
                    £28,640<span className="text-body-sm font-normal text-on-surface-variant">/yr</span>
                  </span>
                  <span className="font-telemetry-mono text-telemetry-mono text-tertiary block mt-0.5">+£1,420 pending</span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-container-low shadow-sm border border-surface-container-high/30">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase block mb-1">Fleet Roster</span>
                  <span className="font-headline-md text-headline-md text-on-surface font-bold">
                    14 <span className="text-headline-sm text-tertiary font-normal">(+3 today)</span>
                  </span>
                  <span className="font-telemetry-mono text-telemetry-mono text-on-surface-variant block mt-0.5">Commercial Goods</span>
                </div>
              </div>

              {/* Policy Specifications */}
              <div className="p-space-sm rounded-lg bg-surface-container-low space-y-2 shadow-sm border border-surface-container-high/30">
                <div className="flex items-center justify-between pb-1.5 border-b border-surface-container-high/30">
                  <span className="font-headline-sm text-headline-sm text-on-surface">Policy Schedule</span>
                  <span className="font-telemetry-mono text-telemetry-mono text-primary font-semibold">#AIB-88219-UK</span>
                </div>
                <div className="flex justify-between items-center text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Underwriter:</span>
                  <span className="text-on-surface font-medium">Atonia Lloyds Syndicate 402</span>
                </div>
                <div className="flex justify-between items-center text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Coverage Class:</span>
                  <span className="text-on-surface font-medium">Comprehensive Any Driver &gt; 21</span>
                </div>
                <div className="flex justify-between items-center text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Effective Window:</span>
                  <span className="text-on-surface font-medium">01 Dec 2024 – 30 Nov 2025</span>
                </div>
                <div className="flex justify-between items-center text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Deductible / Excess:</span>
                  <span className="text-on-surface font-medium">£250 (Waived for Tier 1)</span>
                </div>
              </div>

              {/* Staged Vehicles */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Endorsed Vehicles (3)</span>
                  <span className="font-telemetry-badge text-telemetry-badge text-tertiary uppercase">Staged to Binder</span>
                </div>
                {['MV73 XKL', 'MV73 XKM', 'MV73 XKN'].map((vrn) => (
                  <div key={vrn} className="p-2 rounded bg-surface-container-low flex items-center justify-between text-body-sm font-body-sm border border-surface-container-high/30">
                    <div>
                      <span className="font-telemetry-mono text-on-surface font-bold">{vrn}</span>
                      <span className="text-outline block text-[11px]">2023 Mercedes Sprinter 315</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-tertiary-container/30 text-tertiary-fixed font-telemetry-badge text-telemetry-badge">Ready</span>
                  </div>
                ))}
              </div>

              {/* Fleet Telematics Health */}
              <div className="p-space-sm rounded-lg bg-surface-container-low border border-surface-container-high/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Fleet Telematics Health</span>
                  <span className="font-telemetry-mono text-telemetry-mono text-tertiary">96.8 Score</span>
                </div>
                <div className="h-12 w-full flex items-end gap-1.5 pb-1">
                  {[65, 85, 92, 98, 78, 88, 94, 100, 70, 91, 89, 95, 95, 95].map((val, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 rounded-t transition-all ${val > 90 ? 'bg-tertiary' : 'bg-surface-container-high'}`}
                      style={{ height: `${val}%` }}
                      title={`Unit ${idx + 1}: ${val}%`}
                    ></div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] font-telemetry-mono text-outline">
                  <span>Fleet Unit 01</span>
                  <span>17 Active Units</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'claims' && (
            <div className="space-y-space-sm">
              <div className="p-space-sm rounded-lg bg-surface-container-low shadow-sm border border-surface-container-high/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-headline-sm text-headline-sm text-on-surface">Claim #CLM-2023-881</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-tertiary font-telemetry-badge text-telemetry-badge uppercase">Settled</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">Minor bumper impact in warehouse yard. Third party repairs settled promptly.</p>
                <div className="flex justify-between items-center text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Settlement Amount:</span>
                  <span className="font-telemetry-mono text-on-surface font-semibold">£820.00</span>
                </div>
                <div className="flex justify-between items-center text-body-sm font-body-sm mt-1">
                  <span className="text-on-surface-variant">Closed Date:</span>
                  <span className="font-telemetry-mono text-outline">14 Oct 2023</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'apis' && (
            <div className="space-y-space-sm">
              <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between border border-surface-container-high/30">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-tertiary"></span>
                  <div>
                    <span className="font-headline-sm text-headline-sm text-on-surface block">DVLA Vehicle Registry API</span>
                    <span className="font-telemetry-mono text-telemetry-mono text-outline">Latency: 28ms • Valid</span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-surface-container font-telemetry-badge text-telemetry-badge text-tertiary uppercase">Connected</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between border border-surface-container-high/30">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-tertiary"></span>
                  <div>
                    <span className="font-headline-sm text-headline-sm text-on-surface block">Underwriting Core v4</span>
                    <span className="font-telemetry-mono text-telemetry-mono text-outline">Pricing Matrix 2025.2</span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-surface-container font-telemetry-badge text-telemetry-badge text-tertiary uppercase">Operational</span>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-space-sm font-telemetry-mono text-telemetry-mono text-xs">
              <div className="p-2 rounded bg-surface-container-low text-on-surface-variant border border-surface-container-high/30">
                <div className="flex justify-between text-outline text-[10px]">
                  <span>10:16:42 AM</span>
                  <span>AUTH_GRANT</span>
                </div>
                <p className="text-on-surface text-[11px] mt-0.5">Underwriter Elena Vance approved limit bypass (+£1,420).</p>
              </div>
              <div className="p-2 rounded bg-surface-container-low text-on-surface-variant border border-surface-container-high/30">
                <div className="flex justify-between text-outline text-[10px]">
                  <span>10:15:19 AM</span>
                  <span>TOOL_DVLA_QUERY</span>
                </div>
                <p className="text-on-surface text-[11px] mt-0.5">VRN queries verified against UK Gov vehicle licensing hub.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Policy Actions */}
        <div className="p-space-sm bg-surface-container-low flex items-center gap-2 flex-shrink-0 border-t border-surface-container-high/30">
          <button
            onClick={handleDownloadPDF}
            className="flex-1 py-1.5 rounded bg-surface-container-high text-on-surface font-headline-sm text-headline-sm hover:bg-surface-bright transition-colors flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span> Binder PDF
          </button>
          <button
            onClick={handleIssueEndorsement}
            className="flex-1 py-1.5 rounded bg-primary text-on-primary font-headline-sm text-headline-sm hover:bg-primary-fixed-dim transition-colors flex items-center justify-center gap-1 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">task_alt</span> Issue Endorsement
          </button>
        </div>
      </aside>
    </div>
  );
};
