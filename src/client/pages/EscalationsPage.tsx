import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { fetchEscalations, assignEscalation, resolveEscalation, saveEscalationNotes } from '../api.ts';
import { EscalationRecord } from '../../types/index.ts';

export const EscalationsPage: React.FC = () => {
  const { selectedBusiness, setSelectedBusiness, activeEscalationId, setActiveEscalationId, openTakeoverModal, currentUser, showToast } = useApp();
  const [escalations, setEscalations] = useState<EscalationRecord[]>([]);
  const [activeItem, setActiveItem] = useState<EscalationRecord | null>(null);
  const [overrideNote, setOverrideNote] = useState<string>('');
  const [tenantFilter, setTenantFilter] = useState<string>('all');

  useEffect(() => {
    loadEscalations();
  }, [selectedBusiness, tenantFilter]);

  useEffect(() => {
    if (escalations.length > 0) {
      const found = escalations.find((e) => e.id === activeEscalationId) || escalations[0];
      setActiveItem(found);
      setOverrideNote(found.supervisorNotes || '');
    }
  }, [escalations, activeEscalationId]);

  const loadEscalations = async () => {
    try {
      const data = await fetchEscalations({
        businessId: selectedBusiness !== 'ALL' ? selectedBusiness : undefined
      });
      if (data?.escalations) {
        setEscalations(data.escalations);
      }
    } catch (err) {
      console.error('Failed to load escalations:', err);
    }
  };

  const handleAssignToMe = async (escId: string) => {
    try {
      const res = await assignEscalation(escId, currentUser.name);
      if (res?.escalation) {
        showToast(`Docket assigned to ${currentUser.name}.`, 'success');
        loadEscalations();
      }
    } catch (err) {
      console.error('Assign error:', err);
    }
  };

  const handleResolve = async (escId: string) => {
    try {
      const res = await resolveEscalation(escId);
      if (res?.escalation) {
        showToast(`Escalation docket ${escId} resolved.`, 'success');
        loadEscalations();
      }
    } catch (err) {
      console.error('Resolve error:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!activeItem) return;
    try {
      await saveEscalationNotes(activeItem.id, overrideNote);
      showToast('Supervisor regulatory memo saved to immutable audit docket.', 'success');
    } catch (err) {
      console.error('Note save error:', err);
    }
  };

  const handleTransferToLegal = () => {
    showToast('Docket transferred to Legal & Compliance review team.', 'info');
  };

  return (
    <div className="flex flex-col w-full pb-space-xl">
      {/* Command Strip / Header Panel */}
      <div className="w-full bg-surface-container-lowest px-space-lg py-space-md border-b border-surface-container-high/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-space-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-error animate-ping"></div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Escalation & Intervention Center</h1>
              <span className="px-2 py-0.5 rounded bg-surface-container font-telemetry-badge text-telemetry-badge text-primary uppercase">
                Active Intercept Tier-1
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
              High-priority customer conversations requiring human judgment, legal compliance checks, or direct supervisor intervention.
            </p>
          </div>

          {/* Telemetry Counter Badges */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center gap-2 px-space-sm py-1.5 rounded-lg bg-surface-container-low shadow-sm border border-surface-container-high/30">
              <span className="w-2 h-2 rounded-full bg-error"></span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Critical</span>
              <span className="font-telemetry-mono text-telemetry-mono text-error font-semibold">3</span>
            </div>
            <div className="flex items-center gap-2 px-space-sm py-1.5 rounded-lg bg-surface-container-low shadow-sm border border-surface-container-high/30">
              <span className="w-2 h-2 rounded-full bg-error/70"></span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">High</span>
              <span className="font-telemetry-mono text-telemetry-mono text-on-surface font-semibold">4</span>
            </div>
            <div className="flex items-center gap-2 px-space-sm py-1.5 rounded-lg bg-surface-container-low shadow-sm border border-surface-container-high/30">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Medium</span>
              <span className="font-telemetry-mono text-telemetry-mono text-on-surface font-semibold">8</span>
            </div>
            <div className="flex items-center gap-2 px-space-sm py-1.5 rounded-lg bg-surface-container-low shadow-sm border border-surface-container-high/30">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Resolved Today</span>
              <span className="font-telemetry-mono text-telemetry-mono text-tertiary font-semibold">34</span>
            </div>
          </div>
        </div>

        {/* Filter Pipeline Controls */}
        <div className="mt-space-md pt-space-sm flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-low/50 px-space-md py-2 rounded-lg border border-surface-container-high/30">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-label-sm text-label-sm text-outline mr-1 uppercase">Tenant:</span>
            <button
              onClick={() => {
                setTenantFilter('all');
                setSelectedBusiness('ALL');
              }}
              className={`px-2.5 py-1 rounded font-label-sm text-label-sm transition-colors ${
                tenantFilter === 'all' ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All (15)
            </button>
            <button
              onClick={() => {
                setTenantFilter('ATONIA_MARKETPLACE');
                setSelectedBusiness('ATONIA_MARKETPLACE');
              }}
              className={`px-2.5 py-1 rounded font-label-sm text-label-sm transition-colors ${
                tenantFilter === 'ATONIA_MARKETPLACE' ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Marketplace
            </button>
            <button
              onClick={() => {
                setTenantFilter('ATONIA_INSURANCE');
                setSelectedBusiness('ATONIA_INSURANCE');
              }}
              className={`px-2.5 py-1 rounded font-label-sm text-label-sm transition-colors ${
                tenantFilter === 'ATONIA_INSURANCE' ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Insurance
            </button>
            <button
              onClick={() => {
                setTenantFilter('EUREKA');
                setSelectedBusiness('EUREKA');
              }}
              className={`px-2.5 py-1 rounded font-label-sm text-label-sm transition-colors ${
                tenantFilter === 'EUREKA' ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Eureka Bank
            </button>
            <button
              onClick={() => {
                setTenantFilter('SORPLOS_INSURTECH');
                setSelectedBusiness('SORPLOS_INSURTECH');
              }}
              className={`px-2.5 py-1 rounded font-label-sm text-label-sm transition-colors ${
                tenantFilter === 'SORPLOS_INSURTECH' ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Sorplos
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>Reason: All Rules</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>Wait Time: Desc</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-gutter px-space-lg py-space-md">
        {/* Left Column (8 cols): Cases Table */}
        <div className="xl:col-span-8 flex flex-col gap-space-md">
          {/* Risk Matrix Visualizer Bar */}
          <div className="w-full bg-surface-container-lowest p-space-md rounded-xl shadow-md flex flex-col md:flex-row items-center justify-between gap-space-md border border-surface-container-high/30">
            <div className="flex items-center gap-space-md min-w-0">
              <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-surface-container-high">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                  <path className="text-surface-variant" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                  <path className="text-error" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="82, 100" strokeLinecap="round" strokeWidth="3"></path>
                </svg>
                <span className="absolute font-telemetry-mono text-telemetry-badge text-on-surface font-bold">82%</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline-sm text-headline-sm text-on-surface">Queue Risk Index</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">SLA Breach Horizon: 2 cases within 90s threshold. Legal risk weighting active.</span>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="flex flex-col items-end">
                <span className="font-telemetry-badge text-telemetry-badge text-outline uppercase">Active Model Fallbacks</span>
                <span className="font-telemetry-mono text-telemetry-mono text-tertiary">Deterministic Boundary v4</span>
              </div>
              <button
                onClick={loadEscalations}
                className="px-space-md py-1.5 bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-sm text-label-sm rounded transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Sync Engine</span>
              </button>
            </div>
          </div>

          {/* Cases List */}
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-md overflow-hidden flex flex-col border border-surface-container-high/30">
            <div className="px-space-md py-2.5 bg-surface-container-low flex items-center justify-between border-b border-surface-container-high/30">
              <span className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                <span>Escalated Sessions Requiring Intercept</span>
                <span className="font-telemetry-mono text-telemetry-mono text-outline font-normal">({escalations.length} critical/high pending)</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-error animate-pulse"></span>
                <span className="font-telemetry-badge text-telemetry-badge text-error uppercase">Human Intervention Enforced</span>
              </div>
            </div>

            <div className="flex flex-col divide-y divide-surface-container-high/30">
              {escalations.map((esc) => {
                const isSelected = activeItem?.id === esc.id;
                return (
                  <div
                    key={esc.id}
                    onClick={() => setActiveEscalationId(esc.id)}
                    className={`relative p-space-md transition-all cursor-pointer shadow-sm group ${
                      isSelected ? 'bg-surface-container/70' : 'bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        esc.priority === 'critical' ? 'bg-error' : 'bg-error/70'
                      }`}
                    ></div>

                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`px-2 py-0.5 rounded font-telemetry-badge text-telemetry-badge uppercase font-bold tracking-wider ${
                              esc.priority === 'critical' ? 'bg-error-container text-on-error' : 'bg-surface-container-high text-error'
                            }`}
                          >
                            {esc.priority}
                          </span>
                          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">{esc.customerName}</span>
                          <span className="px-2 py-0.5 rounded bg-tertiary/10 text-tertiary font-label-sm text-label-sm">
                            {esc.businessId.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-space-sm">
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-error font-telemetry-mono text-telemetry-mono">
                            <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
                            <span>Wait: {esc.queueWaitTime}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">
                            {esc.assignedStaff || 'Unassigned'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 pl-1">
                        <div className="flex items-center gap-2">
                          <span className="font-headline-sm text-body-lg text-primary font-medium">{esc.reason}</span>
                          {esc.clauseExclusion && (
                            <span className="px-1.5 py-0.2 rounded bg-surface-container-high font-telemetry-badge text-telemetry-badge text-outline">
                              {esc.clauseExclusion}
                            </span>
                          )}
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{esc.aiSummary}</p>
                      </div>

                      <div className="mt-1 pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-surface-container-high/30">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-telemetry-badge text-telemetry-badge">
                            Escalated at 99% rule match
                          </span>
                          <span className="font-telemetry-badge text-telemetry-badge text-outline">
                            Exposure: {esc.exposureAmount || 'High'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {!esc.assignedStaff && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAssignToMe(esc.id);
                              }}
                              className="px-3 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-sm text-label-sm transition-colors"
                            >
                              Assign Staff
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openTakeoverModal(esc.customerName, esc.conversationId);
                            }}
                            className="px-3 py-1 rounded bg-primary text-on-primary hover:bg-primary-fixed-dim font-label-sm text-label-sm font-semibold transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
                            <span>Take Over Immediately</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Case Inspection Drawer */}
        <div className="xl:col-span-4 flex flex-col gap-space-md">
          {activeItem ? (
            <div className="w-full bg-surface-container-lowest p-space-md rounded-xl shadow-md flex flex-col gap-space-md border border-surface-container-high/30">
              <div className="flex items-center justify-between pb-space-sm bg-surface-container-low/40 p-space-sm rounded-lg border border-surface-container-high/30">
                <div className="flex items-center gap-space-sm">
                  <span className="p-1 rounded bg-tertiary/10 text-tertiary material-symbols-outlined text-[20px]">policy</span>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Inspect Docket</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface">{activeItem.customerName}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-tertiary/10 text-tertiary font-label-sm text-label-sm">
                  {activeItem.businessId.replace('_', ' ')}
                </span>
              </div>

              {/* Safeguard Metrics Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1 border border-surface-container-high/30">
                  <span className="font-label-sm text-label-sm text-outline">Reason</span>
                  <span className="font-body-sm text-body-sm text-on-surface font-semibold truncate">{activeItem.reason}</span>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1 border border-surface-container-high/30">
                  <span className="font-label-sm text-label-sm text-outline">Risk Level</span>
                  <span className="font-body-sm text-body-sm text-error font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    <span>High / Legal Risk</span>
                  </span>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1 border border-surface-container-high/30">
                  <span className="font-label-sm text-label-sm text-outline">Sentiment</span>
                  <span className="font-body-sm text-body-sm text-on-surface font-medium flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-error"></span>
                    <span>{activeItem.sentiment}</span>
                  </span>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1 border border-surface-container-high/30">
                  <span className="font-label-sm text-label-sm text-outline">Claim Exposure</span>
                  <span className="font-telemetry-mono text-telemetry-mono text-primary font-bold">{activeItem.exposureAmount || 'N/A'}</span>
                </div>
              </div>

              {/* Supervisor Interventions Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <span className="font-telemetry-badge text-telemetry-badge text-outline uppercase tracking-wider">Supervisor Interventions</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openTakeoverModal(activeItem.customerName, activeItem.conversationId)}
                    className="px-3 py-2 rounded bg-primary text-on-primary hover:bg-primary-fixed-dim font-label-sm text-label-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">call</span>
                    <span>Accept Conversation</span>
                  </button>
                  <button
                    onClick={handleTransferToLegal}
                    className="px-3 py-2 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">gavel</span>
                    <span>Transfer to Legal</span>
                  </button>
                  <button
                    onClick={() => showToast('Customer callback request staged to telephone dialer.', 'info')}
                    className="px-3 py-2 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">ring_volume</span>
                    <span>Request Call Back</span>
                  </button>
                  <button
                    onClick={() => handleResolve(activeItem.id)}
                    className="px-3 py-2 rounded bg-tertiary-container text-on-tertiary-container hover:bg-tertiary-container/80 font-label-sm text-label-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Mark as Resolved</span>
                  </button>
                </div>
              </div>

              {/* AI Safety Audit Timeline */}
              <div className="flex flex-col gap-space-sm pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-headline-sm text-on-surface">AI Safety Audit Timeline</span>
                  <span className="font-telemetry-mono text-telemetry-mono text-tertiary">Realtime Hook</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Deterministic rule validation tracing why model yielded control to human supervisor:
                </p>

                <div className="relative pl-6 flex flex-col gap-3 py-1">
                  <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-surface-container-high"></div>
                  {activeItem.safetyAuditTimeline.map((item, idx) => (
                    <div key={idx} className="relative flex flex-col gap-0.5">
                      <div
                        className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-surface-container-lowest ${
                          item.type === 'SAFETY_RULE'
                            ? 'bg-error'
                            : item.type === 'HALT_ROUTED'
                            ? 'bg-tertiary'
                            : 'bg-primary'
                        }`}
                      ></div>
                      <div className="flex items-center gap-2">
                        <span className="font-telemetry-mono text-telemetry-badge text-outline">{item.timestamp}</span>
                        <span
                          className={`font-label-sm text-label-sm font-medium ${
                            item.type === 'SAFETY_RULE' ? 'text-error font-semibold' : 'text-on-surface'
                          }`}
                        >
                          {item.title}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{item.detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Telemetry Safeguard Box */}
              <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between border border-surface-container-high/30">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">security</span>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface">Auto-Halt Compliance Engine</span>
                    <span className="font-telemetry-badge text-telemetry-badge text-outline uppercase">
                      Active Lock: Zero Hallucination Guard
                    </span>
                  </div>
                </div>
                <span className="font-telemetry-mono text-telemetry-mono text-tertiary">Verified</span>
              </div>
            </div>
          ) : (
            <div className="p-space-lg bg-surface-container-lowest rounded-xl text-center text-outline">
              Select an escalation docket from the list to view compliance trace.
            </div>
          )}

          {/* Supervisor Override Memo Composer */}
          <div className="w-full bg-surface-container-lowest p-space-md rounded-xl shadow-md flex flex-col gap-3 border border-surface-container-high/30">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-headline-sm text-on-surface">Supervisor Override Notes</span>
              <span className="font-telemetry-badge text-telemetry-badge text-outline">ENC: AES-256</span>
            </div>
            <textarea
              value={overrideNote}
              onChange={(e) => setOverrideNote(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface font-body-sm text-body-sm p-space-sm rounded focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-outline resize-none border border-surface-container-high/40"
              placeholder="Document regulatory reason or specific settlement instructions prior to taking live call..."
              rows={3}
            />
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline">Attached to Docket #{activeItem?.id || 'ESC-401'}</span>
              <button
                onClick={handleSaveNotes}
                className="px-3 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-sm text-label-sm transition-colors"
              >
                Save Memo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
