import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { BusinessId } from '../../../types/index.ts';

export const Header: React.FC = () => {
  const { selectedBusiness, setSelectedBusiness, searchQuery, setSearchQuery, currentUser, showToast, setCurrentRoute } = useApp();
  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const businessOptions: Array<{ id: BusinessId | 'ALL'; label: string; code: string }> = [
    { id: 'ALL', label: 'All Businesses (4)', code: 'Multi-tenant' },
    { id: 'ATONIA_MARKETPLACE', label: 'Atonia Marketplace', code: 'Retail' },
    { id: 'ATONIA_INSURANCE', label: 'Atonia Insurance', code: 'Insurtech Brokerage' },
    { id: 'EUREKA', label: 'Eureka Banking', code: 'Banking' },
    { id: 'SORPLOS_INSURTECH', label: 'Sorplos Insurtech', code: 'Aggregator' }
  ];

  const quickPills: Array<{ id: BusinessId; label: string }> = [
    { id: 'ATONIA_MARKETPLACE', label: 'Atonia Mkt' },
    { id: 'ATONIA_INSURANCE', label: 'Atonia Ins' },
    { id: 'EUREKA', label: 'Eureka Bank' },
    { id: 'SORPLOS_INSURTECH', label: 'Sorplos' }
  ];

  const currentLabel = businessOptions.find((b) => b.id === selectedBusiness)?.label || 'All Businesses (4)';

  return (
    <header className="fixed top-0 left-64 right-0 h-14 bg-surface/90 backdrop-blur-xl z-40 shadow-[0_1px_8px_rgba(0,0,0,0.2)] border-b border-surface-container-high/40">
      <div className="w-full h-14 px-space-md flex items-center justify-between gap-space-md">
        {/* Left: Tenant Switcher */}
        <div className="flex items-center gap-space-md flex-shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowTenantMenu(!showTenantMenu)}
              className="flex items-center gap-space-sm px-space-sm py-1.5 rounded bg-surface-container-low hover:bg-surface-container-high transition-colors text-left"
            >
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              <span className="font-headline-sm text-headline-sm text-on-surface">{currentLabel}</span>
              <span className="font-telemetry-badge text-telemetry-badge px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant uppercase">
                {selectedBusiness === 'ALL' ? 'Multi-tenant' : 'Selected'}
              </span>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">arrow_drop_down</span>
            </button>

            {/* Tenant Dropdown */}
            {showTenantMenu && (
              <div className="absolute top-10 left-0 w-64 bg-surface-container-low border border-surface-container-highest rounded-lg shadow-2xl py-1 z-50">
                {businessOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSelectedBusiness(opt.id);
                      setShowTenantMenu(false);
                      showToast(`Tenant context switched to ${opt.label}`, 'info');
                    }}
                    className={`w-full px-3 py-2 text-left font-body-sm flex items-center justify-between hover:bg-surface-container transition-colors ${
                      selectedBusiness === opt.id ? 'bg-primary-container/20 text-primary font-semibold' : 'text-on-surface'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[10px] uppercase font-telemetry-badge text-outline">{opt.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Switch Pills */}
          <div className="hidden xl:flex items-center gap-1.5 px-space-xs">
            {quickPills.map((pill) => (
              <button
                key={pill.id}
                onClick={() => {
                  setSelectedBusiness(selectedBusiness === pill.id ? 'ALL' : pill.id);
                  showToast(`Switched filter: ${pill.label}`, 'info');
                }}
                className={`px-2 py-0.5 rounded font-label-sm text-label-sm transition-colors ${
                  selectedBusiness === pill.id
                    ? 'bg-primary text-on-primary font-semibold'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Search Box */}
        <div className="flex-1 max-w-xl mx-space-sm">
          <div className="relative flex items-center w-full">
            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px] pointer-events-none">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-lowest text-on-surface font-body-sm text-body-sm pl-9 pr-14 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-outline-variant border border-surface-container-high/40"
              placeholder="Search conversations, customers, claims, policies, intents..."
              type="text"
            />
            <kbd className="absolute right-2.5 px-1.5 py-0.5 rounded bg-surface-container-high font-telemetry-mono text-telemetry-mono text-on-surface-variant select-none">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Operational Status & Notifications */}
        <div className="flex items-center gap-space-sm flex-shrink-0">
          {/* Quick Real-Time Voice Agent Trigger */}
          <button
            onClick={() => {
              setCurrentRoute('voice');
              showToast('Connecting to Aria (Warm Female Voice Agent)...', 'success');
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-primary/20 via-tertiary/20 to-primary/20 hover:from-primary/30 hover:to-tertiary/30 border border-primary/40 text-on-surface font-label-sm text-label-sm transition-all shadow-sm group"
            title="Open Live Voice Call with Aria"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
            </span>
            <span className="material-symbols-outlined text-[16px] text-tertiary group-hover:scale-110 transition-transform">
              record_voice_over
            </span>
            <span className="font-semibold text-primary">Live Voice (Aria)</span>
          </button>

          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container-low border border-surface-container-high/40">
            <span className="h-1.5 w-1.5 rounded-full bg-tertiary"></span>
            <span className="font-telemetry-badge text-telemetry-badge text-on-surface-variant uppercase">AI Engine: Operational</span>
            <span className="font-telemetry-mono text-telemetry-mono text-tertiary">42ms</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container-low border border-surface-container-high/40">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping"></span>
            <span className="font-telemetry-badge text-telemetry-badge text-primary uppercase">WS Connected</span>
          </div>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-error"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-10 w-80 bg-surface-container-low rounded-xl shadow-2xl border border-surface-container-highest p-3 z-50 flex flex-col gap-2">
                <div className="flex items-center justify-between pb-1 border-b border-surface-container-highest">
                  <span className="font-headline-sm text-headline-sm text-on-surface">Urgent Alerts</span>
                  <span className="font-telemetry-badge text-telemetry-badge text-error uppercase">3 Active</span>
                </div>
                <div className="flex flex-col gap-2 text-body-sm">
                  <div className="p-2 rounded bg-surface-container-lowest border-l-2 border-error">
                    <span className="font-semibold text-error text-[11px] block uppercase">Compliance Boundary Trigger</span>
                    <span className="text-on-surface">Marcus Vance claim (£45,000) exceeded autonomous cap.</span>
                  </div>
                  <div className="p-2 rounded bg-surface-container-lowest border-l-2 border-primary">
                    <span className="font-semibold text-primary text-[11px] block uppercase">Limit Override Granted</span>
                    <span className="text-on-surface">David Sterling 3 Sprinter vans endorsed (+£1,420).</span>
                  </div>
                  <div className="p-2 rounded bg-surface-container-lowest border-l-2 border-error">
                    <span className="font-semibold text-error text-[11px] block uppercase">Fraud Sentinel Halt</span>
                    <span className="text-on-surface">Sophia Chen $14,250 wire transfer intercepted.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <div className="relative flex items-center pl-space-xs">
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-surface-container-highest"
              src={currentUser.avatarUrl}
            />
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-tertiary ring-1 ring-surface"></span>
          </div>
        </div>
      </div>
    </header>
  );
};
