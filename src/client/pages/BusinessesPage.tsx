import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { BUSINESS_REGISTRY } from '../../constants/businesses.ts';
import { BusinessId } from '../../types/index.ts';

export const BusinessesPage: React.FC = () => {
  const { setSelectedBusiness, setCurrentRoute, showToast } = useApp();

  const handleEnterWorkspace = (id: BusinessId) => {
    setSelectedBusiness(id);
    setCurrentRoute('conversations');
    showToast(`Entered ${BUSINESS_REGISTRY[id].name} Workspace`, 'info');
  };

  const handleConfigureRules = (id: BusinessId) => {
    setSelectedBusiness(id);
    setCurrentRoute('settings');
    showToast(`Configuring autonomous parameters for ${BUSINESS_REGISTRY[id].name}`, 'info');
  };

  return (
    <div className="flex flex-col w-full pb-space-xl">
      <div className="p-space-lg max-w-7xl mx-auto w-full space-y-space-xl">
        {/* Executive Command Context Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md bg-surface-container-low p-space-lg rounded-xl shadow-sm border border-surface-container-high/40">
          <div className="space-y-space-xs max-w-3xl">
            <div className="flex items-center gap-space-xs">
              <span className="font-telemetry-badge text-telemetry-badge px-2 py-0.5 rounded bg-surface-container-high text-primary tracking-widest uppercase">
                Multi-Tenant Fleet Command
              </span>
              <span className="font-telemetry-mono text-telemetry-mono text-outline">v2.4.9 // SOVEREIGN_ORCHESTRATOR</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Business Management & Operating Units</h1>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Control autonomous AI runtime configurations, safety guardrails, operational pipelines, and real-time customer workload distribution across your 4 federated business entities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm">
            <div className="flex items-center gap-1.5 px-space-sm py-1.5 rounded-lg bg-surface-container-lowest text-on-surface-variant border border-surface-container-high/30">
              <span className="h-2 w-2 rounded-full bg-tertiary"></span>
              <span className="font-label-sm text-label-sm text-on-surface">All Statuses Active</span>
              <span className="material-symbols-outlined text-[16px] text-outline">expand_more</span>
            </div>
            <button
              onClick={() => showToast('Entities sorted by active concurrency load.', 'info')}
              className="flex items-center gap-space-xs px-space-sm py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">swap_vert</span>
              <span className="font-label-sm text-label-sm">Sort by Workload</span>
            </button>
            <button
              onClick={() => showToast('New enterprise entity creation flow initialized.', 'info')}
              className="flex items-center gap-space-xs px-space-md py-1.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary-container font-headline-sm text-headline-sm transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Add New Entity</span>
            </button>
          </div>
        </div>

        {/* Macro Telemetry Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
          <div className="bg-surface-container-low p-space-md rounded-xl space-y-space-xs border border-surface-container-high/30">
            <div className="flex items-center justify-between text-outline">
              <span className="font-telemetry-badge text-telemetry-badge uppercase">Total Concurrency</span>
              <span className="material-symbols-outlined text-[16px] text-primary">multiline_chart</span>
            </div>
            <div className="flex items-baseline gap-space-xs">
              <span className="font-display text-display text-on-surface">1,428</span>
              <span className="font-telemetry-mono text-telemetry-mono text-tertiary">+12.4%</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Synchronous conversational sessions</p>
          </div>

          <div className="bg-surface-container-low p-space-md rounded-xl space-y-space-xs border border-surface-container-high/30">
            <div className="flex items-center justify-between text-outline">
              <span className="font-telemetry-badge text-telemetry-badge uppercase">Pending Escalations</span>
              <span className="material-symbols-outlined text-[16px] text-error">notification_important</span>
            </div>
            <div className="flex items-baseline gap-space-xs">
              <span className="font-display text-display text-on-surface">69</span>
              <span className="font-telemetry-mono text-telemetry-mono text-on-surface-variant">Across 4 nodes</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Tasks requiring human oversight</p>
          </div>

          <div className="bg-surface-container-low p-space-md rounded-xl space-y-space-xs border border-surface-container-high/30">
            <div className="flex items-center justify-between text-outline">
              <span className="font-telemetry-badge text-telemetry-badge uppercase">Fleet Resolution</span>
              <span className="material-symbols-outlined text-[16px] text-tertiary">verified</span>
            </div>
            <div className="flex items-baseline gap-space-xs">
              <span className="font-display text-display text-on-surface">87.1%</span>
              <span className="font-telemetry-mono text-telemetry-mono text-tertiary">Nominal</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Autonomous resolution SLA</p>
          </div>

          <div className="bg-surface-container-low p-space-md rounded-xl space-y-space-xs border border-surface-container-high/30">
            <div className="flex items-center justify-between text-outline">
              <span className="font-telemetry-badge text-telemetry-badge uppercase">Global Latency P95</span>
              <span className="material-symbols-outlined text-[16px] text-secondary">speed</span>
            </div>
            <div className="flex items-baseline gap-space-xs">
              <span className="font-display text-display text-on-surface">328ms</span>
              <span className="font-telemetry-mono text-telemetry-mono text-primary">SIP/RTP</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Streaming inference + guardrail pass</p>
          </div>
        </div>

        {/* The 4 Enterprise Grid Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
          {Object.values(BUSINESS_REGISTRY).map((biz) => {
            const isRetail = biz.id === 'ATONIA_MARKETPLACE';
            const isInsurance = biz.id === 'ATONIA_INSURANCE';
            const isBanking = biz.id === 'EUREKA';

            return (
              <div
                key={biz.id}
                className="group bg-surface-container-low hover:bg-surface-container transition-all duration-300 rounded-xl p-space-lg flex flex-col justify-between shadow-sm relative overflow-hidden border border-surface-container-high/40"
              >
                <div className="space-y-space-md">
                  {/* Card Header & Badges */}
                  <div className="flex items-start justify-between gap-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div
                        className={`h-10 w-10 rounded-lg bg-surface-container-highest flex items-center justify-center shadow-inner ${
                          isRetail
                            ? 'text-primary'
                            : isInsurance
                            ? 'text-tertiary'
                            : isBanking
                            ? 'text-secondary'
                            : 'text-primary-container'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[24px]">
                          {isRetail ? 'storefront' : isInsurance ? 'shield' : isBanking ? 'account_balance' : 'hub'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-space-xs">
                          <h2 className="font-headline-md text-headline-md text-on-surface">{biz.name}</h2>
                          <span className="font-telemetry-badge text-telemetry-badge px-1.5 py-0.5 rounded bg-surface-container-highest uppercase text-primary">
                            {biz.domainCategory}
                          </span>
                        </div>
                        <p className="font-label-sm text-label-sm text-outline">{biz.legalEntity}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container-lowest border border-surface-container-high/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-tertiary animate-pulse"></span>
                      <span className="font-telemetry-badge text-telemetry-badge text-tertiary uppercase">ONLINE {biz.uptime}</span>
                    </div>
                  </div>

                  <p className="font-body-sm text-body-sm text-on-surface-variant">{biz.description}</p>

                  {/* Live Metrics Strip */}
                  <div className="grid grid-cols-4 gap-space-xs bg-surface-container-lowest p-space-sm rounded-lg border border-surface-container-high/30">
                    <div className="flex flex-col">
                      <span className="font-telemetry-badge text-telemetry-badge text-outline uppercase">Active Live</span>
                      <span className="font-headline-sm text-headline-sm text-primary font-telemetry-mono">{biz.activeLiveSessions}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-telemetry-badge text-telemetry-badge text-outline uppercase">Open Tasks</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-telemetry-mono">{biz.openTasks}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-telemetry-badge text-telemetry-badge text-outline uppercase">Uptime</span>
                      <span className="font-headline-sm text-headline-sm text-tertiary font-telemetry-mono">{biz.uptime}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-telemetry-badge text-telemetry-badge text-outline uppercase">Resolution</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-telemetry-mono">{biz.autonomousResolutionRate}%</span>
                    </div>
                  </div>

                  {/* Connected Services */}
                  <div className="space-y-space-xs">
                    <span className="font-telemetry-badge text-telemetry-badge text-outline uppercase">Live Integration Matrix</span>
                    <div className="flex flex-wrap gap-1.5">
                      {biz.integrations.map((int) => (
                        <div key={int.name} className="flex items-center gap-1 px-2 py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm border border-surface-container-high/30">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              int.status === 'connected' ? 'bg-tertiary' : 'bg-primary'
                            }`}
                          ></span>
                          <span>{int.name}</span>
                          {int.status === 'awaiting_credentials' && (
                            <span className="text-[9px] font-telemetry-badge text-outline">(Pending)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Intent Classifications */}
                  <div className="space-y-space-xs">
                    <span className="font-telemetry-badge text-telemetry-badge text-outline uppercase">Top Active Dispatch Intents</span>
                    <div className="flex flex-wrap gap-1">
                      {biz.activeIntents.map((intent) => (
                        <span key={intent} className="px-2 py-0.5 rounded bg-surface-container-highest font-telemetry-mono text-telemetry-mono text-on-surface-variant">
                          {intent}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Bench */}
                <div className="flex items-center gap-space-sm mt-space-md pt-space-sm border-t border-surface-container-high/30">
                  <button
                    onClick={() => handleEnterWorkspace(biz.id)}
                    className="flex-1 flex items-center justify-center gap-space-xs py-2 px-space-md rounded bg-primary text-on-primary font-headline-sm text-headline-sm hover:bg-primary-fixed transition-colors shadow-sm"
                  >
                    <span>Enter Business Workspace</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                  <button
                    onClick={() => handleConfigureRules(biz.id)}
                    className="p-2 rounded bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors border border-surface-container-high/30"
                    title="Configure AI Model & Rules"
                  >
                    <span className="material-symbols-outlined text-[18px]">tune</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Infrastructure Telemetry Deck */}
        <div className="bg-surface-container-low rounded-xl p-space-lg space-y-space-md shadow-sm border border-surface-container-high/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <div className="h-8 w-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">terminal</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Cross-Entity Infrastructure Telemetry</h3>
                <p className="font-label-sm text-label-sm text-outline">Real-time status of foundational vector clusters, foundational models, and regulatory sentinels</p>
              </div>
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="h-2 w-2 rounded-full bg-tertiary"></span>
              <span className="font-telemetry-badge text-telemetry-badge text-tertiary uppercase">HEALTHY // ZERO AUDIT ANOMALIES</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
            <div className="bg-surface-container-lowest p-space-md rounded-lg flex items-start gap-space-sm border border-surface-container-high/30">
              <div className="p-2 rounded bg-surface-container-high text-primary flex-shrink-0">
                <span className="material-symbols-outlined text-[18px]">psychology</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-telemetry-badge text-telemetry-badge text-outline uppercase truncate">Global AI Inference Core</span>
                <span className="font-headline-sm text-headline-sm text-on-surface truncate">Gemini 3.8 Flash</span>
                <span className="font-telemetry-mono text-telemetry-mono text-primary truncate">Fine-Tuned Agent v3.2</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-space-md rounded-lg flex items-start gap-space-sm border border-surface-container-high/30">
              <div className="p-2 rounded bg-surface-container-high text-tertiary flex-shrink-0">
                <span className="material-symbols-outlined text-[18px]">dataset</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-telemetry-badge text-telemetry-badge text-outline uppercase truncate">MongoDB Vector Cluster</span>
                <span className="font-headline-sm text-headline-sm text-on-surface truncate">1.2M Embeddings</span>
                <span className="font-telemetry-mono text-telemetry-mono text-tertiary truncate">99.99% Vector Uptime</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-space-md rounded-lg flex items-start gap-space-sm border border-surface-container-high/30">
              <div className="p-2 rounded bg-surface-container-high text-secondary flex-shrink-0">
                <span className="material-symbols-outlined text-[18px]">gavel</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-telemetry-badge text-telemetry-badge text-outline uppercase truncate">Sentinel Safety Layer</span>
                <span className="font-headline-sm text-headline-sm text-on-surface truncate">0 Violations</span>
                <span className="font-telemetry-mono text-telemetry-mono text-secondary truncate">Active Guardrails in 24h</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-space-md rounded-lg flex items-start gap-space-sm border border-surface-container-high/30">
              <div className="p-2 rounded bg-surface-container-high text-primary flex-shrink-0">
                <span className="material-symbols-outlined text-[18px]">lock</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-telemetry-badge text-telemetry-badge text-outline uppercase truncate">Sovereign Data Residency</span>
                <span className="font-headline-sm text-headline-sm text-on-surface truncate">UK &amp; EU GDPR</span>
                <span className="font-telemetry-mono text-telemetry-mono text-outline truncate">London (eu-west-2) Secured</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
