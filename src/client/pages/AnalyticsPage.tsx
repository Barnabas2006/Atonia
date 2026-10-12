import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { BUSINESS_REGISTRY } from '../../constants/businesses.ts';

export const AnalyticsPage: React.FC = () => {
  const { showToast } = useApp();

  return (
    <div className="flex flex-col w-full p-space-lg max-w-7xl mx-auto space-y-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-low p-space-md rounded-xl border border-surface-container-high/40">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Autonomous Performance & Telemetry</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Cross-entity operational analytics, autonomous resolution SLAs, deflection ratios, and channel workloads.
          </p>
        </div>
        <button
          onClick={() => showToast('Analytics export downloaded (CSV format).', 'success')}
          className="px-3.5 py-1.5 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md transition-colors"
        >
          Export Report
        </button>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        <div className="bg-surface-container-low p-space-md rounded-xl border border-surface-container-high/30">
          <span className="font-label-sm uppercase text-outline">Autonomous Resolution SLA</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-display text-tertiary">88.4%</span>
            <span className="font-telemetry-mono text-xs text-outline">Target 85%</span>
          </div>
          <p className="font-body-sm text-on-surface-variant mt-2">1,262 sessions resolved without human intervention today.</p>
        </div>

        <div className="bg-surface-container-low p-space-md rounded-xl border border-surface-container-high/30">
          <span className="font-label-sm uppercase text-outline">Mean Time to Human Intercept</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-display text-primary">42s</span>
            <span className="font-telemetry-mono text-xs text-tertiary">-18s vs SLA</span>
          </div>
          <p className="font-body-sm text-on-surface-variant mt-2">Sovereign supervisor takeover latency from trigger event.</p>
        </div>

        <div className="bg-surface-container-low p-space-md rounded-xl border border-surface-container-high/30">
          <span className="font-label-sm uppercase text-outline">Zero-Hallucination Compliance</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-display text-on-surface">100%</span>
            <span className="font-telemetry-badge text-tertiary uppercase">Zero Breaches</span>
          </div>
          <p className="font-body-sm text-on-surface-variant mt-2">All prices, balances, and binding policies strictly verified by tools.</p>
        </div>
      </div>

      {/* Channel Breakdown */}
      <div className="bg-surface-container-low p-space-lg rounded-xl border border-surface-container-high/40 shadow-sm">
        <h2 className="font-headline-sm text-headline-sm text-on-surface mb-space-md">Channel Concurrency & Workload Distribution</h2>
        <div className="space-y-space-md">
          <div>
            <div className="flex justify-between text-body-sm mb-1">
              <span className="text-on-surface">WhatsApp Business API</span>
              <span className="font-telemetry-mono text-tertiary">620 Sessions (43.4%)</span>
            </div>
            <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
              <div className="bg-tertiary h-full rounded-full" style={{ width: '43.4%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-body-sm mb-1">
              <span className="text-on-surface">Web Customer Widget</span>
              <span className="font-telemetry-mono text-primary">480 Sessions (33.6%)</span>
            </div>
            <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: '33.6%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-body-sm mb-1">
              <span className="text-on-surface">SIP / WebRTC Telephony</span>
              <span className="font-telemetry-mono text-secondary">210 Sessions (14.7%)</span>
            </div>
            <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
              <div className="bg-secondary h-full rounded-full" style={{ width: '14.7%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-body-sm mb-1">
              <span className="text-on-surface">Mobile SDK / App</span>
              <span className="font-telemetry-mono text-outline">118 Sessions (8.3%)</span>
            </div>
            <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
              <div className="bg-on-surface-variant h-full rounded-full" style={{ width: '8.3%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
