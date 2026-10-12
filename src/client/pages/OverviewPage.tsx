import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { fetchConversations, fetchTools } from '../api.ts';
import { Conversation, ToolExecutionEvent } from '../../types/index.ts';

export const OverviewPage: React.FC = () => {
  const { selectedBusiness, setSelectedBusiness, openTakeoverModal, setCurrentRoute, setActiveConversationId, showToast, searchQuery } = useApp();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [toolExecutions, setToolExecutions] = useState<ToolExecutionEvent[]>([]);
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('All Agent States');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, [selectedBusiness, channelFilter, statusFilter, searchQuery]);

  const loadData = async () => {
    try {
      const convData = await fetchConversations({
        businessId: selectedBusiness,
        channel: channelFilter,
        status: statusFilter,
        search: searchQuery
      });
      if (convData?.conversations) {
        setConversations(convData.conversations);
      }

      const toolsData = await fetchTools();
      if (toolsData?.recentExecutions) {
        setToolExecutions(toolsData.recentExecutions as ToolExecutionEvent[]);
      }
    } catch (err) {
      console.error('Error loading overview data:', err);
    }
  };

  const handleSync = () => {
    setIsSyncing(true);
    showToast('Syncing real-time telemetry buffer across 4 business nodes...', 'info');
    setTimeout(() => {
      loadData();
      setIsSyncing(false);
      showToast('Real-time telemetry synchronized with zero anomalies.', 'success');
    }, 800);
  };

  const handleExport = () => {
    showToast('Telemetry report exported (JSON/CSV bundle prepared).', 'success');
  };

  const handleInspect = (convId: string) => {
    setActiveConversationId(convId);
    setCurrentRoute('conversations');
  };

  return (
    <div className="flex flex-col w-full pb-space-xl">
      {/* Command Header & Operational Telemetry Strip */}
      <section className="p-space-lg bg-surface-container-lowest border-b border-surface-container-high/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-space-sm">
              <span className="font-display text-headline-lg text-on-surface tracking-tight">Good morning, Elena</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary font-telemetry-badge text-telemetry-badge uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-tertiary animate-pulse"></span>
                System Status: Nominal
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
              Monitor real-time conversations, autonomous AI actions, and cross-entity customer operations across your 4 business portfolios.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-space-sm flex-wrap">
            <button
              onClick={handleSync}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md transition-colors shadow-sm"
            >
              <span className={`material-symbols-outlined text-[16px] text-primary ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
              <span>Sync Real-Time</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Export Telemetry</span>
            </button>
            <button
              onClick={() => setCurrentRoute('settings')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-primary text-on-primary font-headline-sm text-headline-sm hover:bg-primary-fixed-dim transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">security</span>
              <span>Agent Override Controls</span>
            </button>
          </div>
        </div>
      </section>

      {/* 5-Card Operational KPI Bar */}
      <section className="p-space-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
        {/* Metric 1: Active Conversations */}
        <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between shadow-sm border border-surface-container-high/40">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-sm text-label-sm uppercase text-outline">Active Conversations</span>
            <span className="inline-flex items-center font-telemetry-mono text-telemetry-mono text-tertiary bg-surface-container-highest px-1.5 py-0.5 rounded">
              +12.4%
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-space-sm">
            <span className="font-display text-display text-on-surface leading-none">1,428</span>
            <span className="font-telemetry-badge text-telemetry-badge text-on-surface-variant">live stream</span>
          </div>
          <div className="w-full h-7 mb-space-sm flex items-center">
            <svg className="w-full h-full text-primary" fill="none" preserveAspectRatio="none" viewBox="0 0 100 24">
              <path d="M0 18 Q 15 20, 25 12 T 50 14 T 75 6 T 100 2" stroke="currentColor" strokeLinecap="round" strokeWidth="2"></path>
              <path d="M0 18 Q 15 20, 25 12 T 50 14 T 75 6 T 100 2 L 100 24 L 0 24 Z" fill="currentColor" fillOpacity="0.08"></path>
            </svg>
          </div>
          <div className="flex flex-col gap-1">
            <div className="w-full h-1.5 rounded bg-surface-container-highest flex overflow-hidden">
              <div className="bg-tertiary-container" style={{ width: '43.4%' }} title="WhatsApp 620"></div>
              <div className="bg-primary" style={{ width: '33.6%' }} title="Web 480"></div>
              <div className="bg-secondary" style={{ width: '14.7%' }} title="Voice 210"></div>
              <div className="bg-on-surface-variant" style={{ width: '8.3%' }} title="Mobile 118"></div>
            </div>
            <div className="flex justify-between items-center font-telemetry-badge text-telemetry-badge text-outline text-[9px]">
              <span>WA: 620</span>
              <span>Web: 480</span>
              <span>Voice: 210</span>
              <span>App: 118</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Autonomous AI Resolved */}
        <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between shadow-sm border border-surface-container-high/40">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-sm text-label-sm uppercase text-outline">Autonomous Resolved</span>
            <span className="inline-flex items-center font-telemetry-mono text-telemetry-mono text-tertiary bg-surface-container-highest px-1.5 py-0.5 rounded">
              +2.1%
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-space-sm">
            <span className="font-display text-display text-on-surface leading-none">88.4%</span>
            <span className="font-telemetry-badge text-telemetry-badge text-tertiary uppercase">Target 85%</span>
          </div>
          <div className="flex items-center gap-space-sm mb-space-sm">
            <div className="flex-1 bg-surface-container-highest h-2 rounded overflow-hidden">
              <div className="bg-tertiary h-full rounded" style={{ width: '88.4%' }}></div>
            </div>
            <span className="font-telemetry-mono text-telemetry-mono text-tertiary">88.4%</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
            <strong className="text-on-surface font-headline-sm">1,262</strong> without human touch
          </p>
        </div>

        {/* Metric 3: Active Escalations */}
        <div
          onClick={() => setCurrentRoute('escalations')}
          className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between shadow-sm border border-surface-container-high/40 cursor-pointer hover:border-error/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-sm text-label-sm uppercase text-outline">Active Escalations</span>
            <span className="inline-flex items-center font-telemetry-badge text-telemetry-badge bg-error-container text-on-error px-1.5 py-0.5 rounded uppercase">
              Live Action
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-space-sm">
            <span className="font-display text-display text-error leading-none">7 Urgent</span>
          </div>
          <div className="flex items-center gap-space-xs mb-space-sm">
            <span className="px-2 py-0.5 rounded bg-error-container/40 text-error font-telemetry-badge text-telemetry-badge">
              4 High Sev
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-telemetry-badge text-telemetry-badge">
              3 Medium
            </span>
          </div>
          <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
            <span>Average Queue Wait</span>
            <span className="font-telemetry-mono text-telemetry-mono text-on-surface font-semibold">42s</span>
          </div>
        </div>

        {/* Metric 4: Pending Tool Calls */}
        <div
          onClick={() => setCurrentRoute('tasks')}
          className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between shadow-sm border border-surface-container-high/40 cursor-pointer hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-sm text-label-sm uppercase text-outline">Pending Tool Calls</span>
            <span className="inline-flex items-center font-telemetry-badge text-telemetry-badge text-primary bg-surface-container-highest px-1.5 py-0.5 rounded">
              fx:active
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-space-sm">
            <span className="font-display text-display text-on-surface leading-none">24</span>
            <span className="font-telemetry-badge text-telemetry-badge text-on-surface-variant">In-flight APIs</span>
          </div>
          <div className="flex flex-col gap-1 mb-space-xs">
            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>Quote Pricing Calc</span>
              <span className="font-telemetry-mono text-telemetry-mono text-primary">11</span>
            </div>
            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>KYC Document OCR</span>
              <span className="font-telemetry-mono text-telemetry-mono text-primary">8</span>
            </div>
            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>Carrier Dispatch Sync</span>
              <span className="font-telemetry-mono text-telemetry-mono text-primary">5</span>
            </div>
          </div>
          <div className="w-full h-1 bg-surface-container-highest rounded overflow-hidden">
            <div className="h-full bg-primary animate-pulse" style={{ width: '72%' }}></div>
          </div>
        </div>

        {/* Metric 5: Mean Latency */}
        <div
          onClick={() => setCurrentRoute('voice')}
          className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between shadow-sm border border-surface-container-high/40 cursor-pointer hover:border-tertiary/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-sm text-label-sm uppercase text-outline">Mean Latency</span>
            <span className="inline-flex items-center font-telemetry-mono text-telemetry-mono text-tertiary bg-surface-container-highest px-1.5 py-0.5 rounded">
              -180ms
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-space-sm">
            <span className="font-display text-display text-on-surface leading-none">1.2s</span>
            <span className="font-telemetry-badge text-telemetry-badge text-tertiary uppercase">Optimal</span>
          </div>
          <div className="flex flex-col gap-1 mb-space-xs">
            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>AI Inference Time</span>
              <span className="font-telemetry-mono text-telemetry-mono text-primary">420ms</span>
            </div>
            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>First Human Contact</span>
              <span className="font-telemetry-mono text-telemetry-mono text-on-surface">1m 18s</span>
            </div>
          </div>
          <div className="flex items-center gap-1 font-telemetry-badge text-telemetry-badge text-outline">
            <span className="h-1.5 w-1.5 rounded-full bg-tertiary"></span>
            <span>SIP Voice RT: 184ms jitter free</span>
          </div>
        </div>
      </section>

      {/* Main Grid: 70% Left Operations Feed, 30% Right Telemetry & Escalation Panels */}
      <section className="px-space-lg grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-space-md">
          {/* Panel Header & Filter Strip */}
          <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-md shadow-sm border border-surface-container-high/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-primary animate-ping"></span>
                <span className="font-headline-md text-headline-md text-on-surface tracking-tight">Live Multi-Entity Conversations</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high font-telemetry-mono text-telemetry-mono text-on-surface-variant">
                  {conversations.length} active in view
                </span>
              </div>

              {/* Entity switches */}
              <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded border border-surface-container-high/40">
                <button
                  onClick={() => setSelectedBusiness('ALL')}
                  className={`px-2 py-1 rounded font-label-sm text-label-sm transition-colors ${
                    selectedBusiness === 'ALL' ? 'bg-surface-container-high text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  All Entities
                </button>
                <button
                  onClick={() => setSelectedBusiness('ATONIA_MARKETPLACE')}
                  className={`px-2 py-1 rounded font-label-sm text-label-sm transition-colors ${
                    selectedBusiness === 'ATONIA_MARKETPLACE' ? 'bg-surface-container-high text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Atonia Mkt
                </button>
                <button
                  onClick={() => setSelectedBusiness('ATONIA_INSURANCE')}
                  className={`px-2 py-1 rounded font-label-sm text-label-sm transition-colors ${
                    selectedBusiness === 'ATONIA_INSURANCE' ? 'bg-surface-container-high text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Atonia Ins
                </button>
                <button
                  onClick={() => setSelectedBusiness('EUREKA')}
                  className={`px-2 py-1 rounded font-label-sm text-label-sm transition-colors ${
                    selectedBusiness === 'EUREKA' ? 'bg-surface-container-high text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Eureka
                </button>
                <button
                  onClick={() => setSelectedBusiness('SORPLOS_INSURTECH')}
                  className={`px-2 py-1 rounded font-label-sm text-label-sm transition-colors ${
                    selectedBusiness === 'SORPLOS_INSURTECH' ? 'bg-surface-container-high text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Sorplos
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-space-sm pt-2 border-t border-surface-container-high/30">
              <div className="flex items-center gap-space-xs flex-wrap">
                <span className="font-telemetry-badge text-telemetry-badge uppercase text-outline mr-1">Channel:</span>
                <button
                  onClick={() => setChannelFilter('all')}
                  className={`px-2.5 py-1 rounded font-label-sm text-label-sm transition-colors ${
                    channelFilter === 'all'
                      ? 'bg-primary-container text-on-primary-container font-medium'
                      : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  All Channels
                </button>
                <button
                  onClick={() => setChannelFilter('whatsapp')}
                  className={`px-2.5 py-1 rounded font-label-sm text-label-sm flex items-center gap-1 transition-colors ${
                    channelFilter === 'whatsapp'
                      ? 'bg-primary-container text-on-primary-container font-medium'
                      : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-tertiary"></span> WhatsApp
                </button>
                <button
                  onClick={() => setChannelFilter('web')}
                  className={`px-2.5 py-1 rounded font-label-sm text-label-sm flex items-center gap-1 transition-colors ${
                    channelFilter === 'web'
                      ? 'bg-primary-container text-on-primary-container font-medium'
                      : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary"></span> Web Widget
                </button>
                <button
                  onClick={() => setChannelFilter('voice')}
                  className={`px-2.5 py-1 rounded font-label-sm text-label-sm flex items-center gap-1 transition-colors ${
                    channelFilter === 'voice'
                      ? 'bg-primary-container text-on-primary-container font-medium'
                      : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span> SIP Voice
                </button>
              </div>

              <div className="flex items-center gap-space-xs">
                <span className="font-telemetry-badge text-telemetry-badge uppercase text-outline mr-1">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-surface-container-lowest text-on-surface font-body-sm text-body-sm px-2.5 py-1 rounded focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container-high/40"
                >
                  <option>All Agent States</option>
                  <option value="autonomous_answering">Autonomous Answering</option>
                  <option value="executing_tools">Executing Tool Calls</option>
                  <option value="escalated_to_human">Escalated to Human</option>
                  <option value="human_monitoring">Human Monitoring</option>
                </select>
              </div>
            </div>
          </div>

          {/* Conversations Table Feed */}
          <div className="bg-surface-container-low rounded-lg overflow-x-auto shadow-sm border border-surface-container-high/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest text-outline font-label-sm text-label-sm uppercase tracking-wider border-b border-surface-container-high/30">
                  <th className="py-2.5 px-space-md">Customer</th>
                  <th className="py-2.5 px-space-sm">Entity</th>
                  <th className="py-2.5 px-space-sm">Channel</th>
                  <th className="py-2.5 px-space-sm">Identified Intent</th>
                  <th className="py-2.5 px-space-sm">AI State</th>
                  <th className="py-2.5 px-space-sm">Priority</th>
                  <th className="py-2.5 px-space-sm">Activity</th>
                  <th className="py-2.5 px-space-md text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-highest/30 font-body-sm text-body-sm">
                {conversations.map((row) => {
                  const isCritical = row.priority === 'critical' || row.status === 'escalated_to_human';
                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-surface-container-high/40 transition-colors group ${
                        isCritical ? 'bg-error-container/5' : ''
                      }`}
                    >
                      <td className="py-space-sm px-space-md">
                        <div className="flex items-center gap-space-sm">
                          <div className="relative flex-shrink-0">
                            {row.customerAvatarUrl ? (
                              <img className="w-7 h-7 rounded-full object-cover" src={row.customerAvatarUrl} alt={row.customerName} />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center font-telemetry-mono text-primary text-xs">
                                {row.customerName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="material-symbols-outlined absolute -bottom-1 -right-1 text-primary text-[12px] bg-surface-container-lowest rounded-full">
                              verified
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-headline-sm text-headline-sm text-on-surface truncate">{row.customerName}</span>
                            <span className="font-telemetry-mono text-telemetry-mono text-outline truncate">{row.customerIdentifier}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-space-sm px-space-sm">
                        <span
                          className={`px-2 py-0.5 rounded font-label-sm text-label-sm ${
                            row.businessId === 'SORPLOS_INSURTECH'
                              ? 'bg-secondary-container/30 text-secondary-fixed-dim'
                              : row.businessId === 'EUREKA'
                              ? 'bg-primary-container/20 text-primary-fixed'
                              : row.businessId === 'ATONIA_MARKETPLACE'
                              ? 'bg-surface-bright text-on-surface'
                              : 'bg-tertiary-container/20 text-tertiary'
                          }`}
                        >
                          {row.businessId.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-space-sm px-space-sm">
                        <div className="flex items-center gap-1.5" title={row.channel}>
                          <span
                            className={`material-symbols-outlined text-[16px] ${
                              row.channel === 'whatsapp'
                                ? 'text-tertiary'
                                : row.channel === 'voice'
                                ? 'text-secondary'
                                : 'text-primary'
                            }`}
                          >
                            {row.channel === 'whatsapp' ? 'chat' : row.channel === 'voice' ? 'settings_voice' : 'globe'}
                          </span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant capitalize">{row.channel}</span>
                        </div>
                      </td>

                      <td className="py-space-sm px-space-sm">
                        <span
                          className={`font-headline-sm text-headline-sm truncate block max-w-[150px] ${
                            isCritical ? 'text-error' : 'text-on-surface'
                          }`}
                        >
                          {row.intent}
                        </span>
                        {row.intentDetails && (
                          <span className={`font-telemetry-badge text-telemetry-badge ${isCritical ? 'text-error' : 'text-outline'}`}>
                            {row.intentDetails}
                          </span>
                        )}
                      </td>

                      <td className="py-space-sm px-space-sm">
                        {row.status === 'escalated_to_human' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-error-container text-on-error font-telemetry-badge text-telemetry-badge">
                            <span className="h-1.5 w-1.5 rounded-full bg-error animate-ping"></span>
                            Escalated to Human
                          </span>
                        ) : row.status === 'executing_tools' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-secondary-container/20 text-secondary-fixed-dim font-telemetry-badge text-telemetry-badge">
                            <span className="material-symbols-outlined text-[12px]">code</span>
                            fx:active
                          </span>
                        ) : row.status === 'human_monitoring' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary-container/20 text-primary font-telemetry-badge text-telemetry-badge">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                            Human Monitoring
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary-container/20 text-primary font-telemetry-badge text-telemetry-badge">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                            Autonomous Answering
                          </span>
                        )}
                      </td>

                      <td className="py-space-sm px-space-sm">
                        <span
                          className={`px-1.5 py-0.5 rounded font-telemetry-badge text-telemetry-badge ${
                            row.priority === 'critical'
                              ? 'bg-error-container text-on-error font-semibold'
                              : row.priority === 'high'
                              ? 'bg-surface-container-highest text-primary'
                              : 'bg-surface-container-highest text-on-surface'
                          }`}
                        >
                          {row.priority}
                        </span>
                      </td>

                      <td className="py-space-sm px-space-sm">
                        <span
                          className={`font-telemetry-mono text-telemetry-mono ${
                            isCritical ? 'text-error font-semibold' : 'text-on-surface-variant'
                          }`}
                        >
                          {row.lastActivity}
                        </span>
                      </td>

                      <td className="py-space-sm px-space-md text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleInspect(row.id)}
                            className="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-sm text-label-sm transition-colors"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => openTakeoverModal(row.customerName, row.id)}
                            className={`px-2 py-1 rounded font-label-sm text-label-sm transition-colors ${
                              isCritical
                                ? 'bg-error text-on-error font-semibold hover:bg-error/80'
                                : 'bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface-variant'
                            }`}
                          >
                            Take Over
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Table Footer */}
            <div className="px-space-md py-space-sm bg-surface-container-lowest flex items-center justify-between border-t border-surface-container-high/30">
              <div className="flex items-center gap-space-sm font-telemetry-badge text-telemetry-badge text-outline">
                <span className="h-2 w-2 rounded-full bg-tertiary animate-pulse"></span>
                <span>WebSocket Live Buffer: 48 events/min</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Showing {conversations.length} of 1,428</span>
                <div className="flex items-center gap-1">
                  <button className="p-1 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface-variant disabled:opacity-30" disabled>
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  </button>
                  <button className="p-1 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface">
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cross-Entity Volume Distribution Graphic */}
          <div className="bg-surface-container-low p-space-md rounded-lg shadow-sm border border-surface-container-high/40">
            <div className="flex items-center justify-between mb-space-sm">
              <span className="font-headline-sm text-headline-sm text-on-surface">Entity Load Balancing & Autonomous Ratio</span>
              <span className="font-telemetry-badge text-telemetry-badge text-primary uppercase">Real-Time Telemetry</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-space-sm">
              <div
                onClick={() => setSelectedBusiness('SORPLOS_INSURTECH')}
                className="bg-surface-container-lowest p-space-sm rounded cursor-pointer hover:bg-surface-container transition-colors border border-surface-container-high/30"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-label-sm text-label-sm text-on-surface truncate">Sorplos Insurtech</span>
                  <span className="font-telemetry-mono text-telemetry-mono text-tertiary">91.2%</span>
                </div>
                <div className="w-full bg-surface-container-highest h-1 rounded overflow-hidden">
                  <div className="h-full bg-tertiary" style={{ width: '91.2%' }}></div>
                </div>
                <span className="font-telemetry-badge text-telemetry-badge text-outline mt-1 block">512 Sessions • 2m MTTR</span>
              </div>

              <div
                onClick={() => setSelectedBusiness('EUREKA')}
                className="bg-surface-container-lowest p-space-sm rounded cursor-pointer hover:bg-surface-container transition-colors border border-surface-container-high/30"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-label-sm text-label-sm text-on-surface truncate">Eureka Banking</span>
                  <span className="font-telemetry-mono text-telemetry-mono text-primary">84.7%</span>
                </div>
                <div className="w-full bg-surface-container-highest h-1 rounded overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '84.7%' }}></div>
                </div>
                <span className="font-telemetry-badge text-telemetry-badge text-outline mt-1 block">428 Sessions • 4m MTTR</span>
              </div>

              <div
                onClick={() => setSelectedBusiness('ATONIA_MARKETPLACE')}
                className="bg-surface-container-lowest p-space-sm rounded cursor-pointer hover:bg-surface-container transition-colors border border-surface-container-high/30"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-label-sm text-label-sm text-on-surface truncate">Atonia Marketplace</span>
                  <span className="font-telemetry-mono text-telemetry-mono text-tertiary">93.5%</span>
                </div>
                <div className="w-full bg-surface-container-highest h-1 rounded overflow-hidden">
                  <div className="h-full bg-tertiary" style={{ width: '93.5%' }}></div>
                </div>
                <span className="font-telemetry-badge text-telemetry-badge text-outline mt-1 block">340 Sessions • 1m MTTR</span>
              </div>

              <div
                onClick={() => setSelectedBusiness('ATONIA_INSURANCE')}
                className="bg-surface-container-lowest p-space-sm rounded cursor-pointer hover:bg-surface-container transition-colors border border-surface-container-high/30"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-label-sm text-label-sm text-on-surface truncate">Atonia Insurance</span>
                  <span className="font-telemetry-mono text-telemetry-mono text-secondary">82.1%</span>
                </div>
                <div className="w-full bg-surface-container-highest h-1 rounded overflow-hidden">
                  <div className="h-full bg-secondary" style={{ width: '82.1%' }}></div>
                </div>
                <span className="font-telemetry-badge text-telemetry-badge text-outline mt-1 block">148 Sessions • 5m MTTR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-space-md">
          {/* Card 1: Urgent Human Escalations Queue */}
          <div className="bg-surface-container-low p-space-md rounded-lg shadow-sm border border-surface-container-high/40">
            <div className="flex items-center justify-between mb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-error text-[20px]">warning</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">Urgent Human Escalations</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-error-container text-on-error font-telemetry-mono text-telemetry-mono font-bold">
                3 Active
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
              Action required: Agent confidence threshold dipped below 0.60 or high financial exposure flagged.
            </p>

            {/* Stack of Escalation Items */}
            <div className="flex flex-col gap-space-sm">
              {/* Item 1: Marcus Vance */}
              <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col gap-space-xs hover:bg-surface-container-high transition-colors border border-surface-container-high/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-error animate-ping"></span>
                    <span className="font-headline-sm text-headline-sm text-on-surface">Marcus Vance</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-error-container/40 text-error font-telemetry-badge text-telemetry-badge uppercase font-semibold">Critical</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm text-tertiary">Atonia Insurance</span>
                  <span className="text-outline">•</span>
                  <span className="font-telemetry-mono text-telemetry-mono text-outline">Queue: 48s</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container-low p-1.5 rounded">
                  "Complex liability dispute over flood endorsements and policy boundary caps."
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-label-sm text-label-sm text-error">Assigned: Unassigned</span>
                  <button
                    onClick={() => openTakeoverModal('Marcus Vance', 'conv-marcus-vance')}
                    className="px-3 py-1 rounded bg-error text-on-error font-label-sm text-label-sm font-semibold hover:bg-error/80 transition-colors shadow-sm"
                  >
                    Take Over
                  </button>
                </div>
              </div>

              {/* Item 2: TechLogix Global */}
              <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col gap-space-xs hover:bg-surface-container-high transition-colors border border-surface-container-high/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary"></span>
                    <span className="font-headline-sm text-headline-sm text-on-surface">TechLogix Global</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-primary-container/20 text-primary font-telemetry-badge text-telemetry-badge uppercase font-semibold">High Sev</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Atonia Marketplace</span>
                  <span className="text-outline">•</span>
                  <span className="font-telemetry-mono text-telemetry-mono text-outline">Queue: 1m 12s</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container-low p-1.5 rounded">
                  "High-value wholesale order dispute ($18,400) - broken seals on medical hardware."
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Assigned: Tier-2 Specialist</span>
                  <button
                    onClick={() => {
                      showToast('Assigned to Tier-2 specialist Sarah Jenkins', 'info');
                    }}
                    className="px-3 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-sm text-label-sm transition-colors"
                  >
                    Assign Staff
                  </button>
                </div>
              </div>

              {/* Item 3: Sophia Chen */}
              <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col gap-space-xs hover:bg-surface-container-high transition-colors border border-surface-container-high/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-error animate-ping"></span>
                    <span className="font-headline-sm text-headline-sm text-on-surface">Sophia Chen</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-error-container/40 text-error font-telemetry-badge text-telemetry-badge uppercase font-semibold">Critical</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm text-primary-fixed">Eureka Banking</span>
                  <span className="text-outline">•</span>
                  <span className="font-telemetry-mono text-telemetry-mono text-outline">Queue: 24s</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container-low p-1.5 rounded">
                  "Suspicious transaction flag on joint business corporate checking ($14,250 wire)."
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-label-sm text-label-sm text-error">Assigned: Unassigned</span>
                  <button
                    onClick={() => openTakeoverModal('Sophia Chen', 'conv-sophia-chen')}
                    className="px-3 py-1 rounded bg-error text-on-error font-label-sm text-label-sm font-semibold hover:bg-error/80 transition-colors shadow-sm"
                  >
                    Take Over
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Autonomous Tool Executions live stream */}
          <div className="bg-surface-container-low p-space-md rounded-lg shadow-sm border border-surface-container-high/40 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">bolt</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">Autonomous Tool Executions</span>
              </div>
              <span className="font-telemetry-badge text-telemetry-badge text-tertiary">Real-time Stream</span>
            </div>

            <div className="flex flex-col gap-space-xs overflow-y-auto max-h-[340px] pr-1">
              {toolExecutions.map((ev) => (
                <div
                  key={ev.id}
                  className="p-2 rounded bg-surface-container-lowest hover:bg-surface-container transition-colors flex flex-col gap-1 border border-surface-container-high/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-telemetry-badge text-telemetry-badge text-secondary font-mono">{ev.toolName}</span>
                    <span className="font-telemetry-mono text-telemetry-mono text-outline">{ev.timestamp}</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface leading-tight">{ev.description}</p>
                  <div className="flex items-center justify-between text-outline font-telemetry-badge text-telemetry-badge">
                    <span className="text-secondary-fixed-dim">{ev.businessId.replace('_', ' ')}</span>
                    <span className="text-tertiary">HTTP {ev.statusCode} • {ev.latencyMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
