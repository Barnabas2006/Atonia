import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { fetchIntegrations } from '../api.ts';
import { ROLE_PERMISSIONS } from '../../constants/rbac.ts';
import { UserRole } from '../../types/index.ts';

export const SettingsPage: React.FC = () => {
  const { currentUser, switchRole, showToast } = useApp();
  const [integrations, setIntegrations] = useState<
    Array<{
      id: string;
      name: string;
      businessId: string;
      status: 'connected' | 'awaiting_credentials';
      latencyMs: number | null;
      lastCheck: string;
    }>
  >([]);

  useEffect(() => {
    fetchIntegrations().then((data) => {
      if (data?.integrations) setIntegrations(data.integrations);
    });
  }, []);

  return (
    <div className="flex flex-col w-full p-space-lg max-w-7xl mx-auto space-y-space-lg">
      <div className="bg-surface-container-low p-space-md rounded-xl border border-surface-container-high/40">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Platform Settings & Governance</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Role-based access control (RBAC), autonomous AI risk boundaries, and verified external system integration matrices.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        {/* RBAC Active Role & Permissions Matrix */}
        <div className="bg-surface-container-low p-space-lg rounded-xl border border-surface-container-high/40 space-y-space-md">
          <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-high/30">
            <div>
              <h2 className="font-headline-md text-on-surface">Role-Based Access Control (RBAC)</h2>
              <p className="font-body-sm text-outline">Manage active permissions and test authorization boundaries</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-primary text-on-primary font-telemetry-badge uppercase">
              Current: {currentUser.role}
            </span>
          </div>

          <div className="space-y-space-sm">
            <span className="font-label-sm uppercase text-outline">Simulate Operator Role:</span>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ROLE_PERMISSIONS) as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => switchRole(r)}
                  className={`p-2 rounded text-left font-body-sm text-body-sm border transition-colors ${
                    currentUser.role === r
                      ? 'bg-primary-container text-on-primary-container font-semibold border-primary'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-surface-container-high/40'
                  }`}
                >
                  <div className="font-medium">{r.replace('_', ' ')}</div>
                  <div className="text-[10px] text-outline font-telemetry-mono">{ROLE_PERMISSIONS[r].length} permissions</div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-space-sm border-t border-surface-container-high/30">
            <span className="font-label-sm uppercase text-outline block mb-2">Active Granted Permissions:</span>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_PERMISSIONS[currentUser.role]?.map((perm) => (
                <span key={perm} className="px-2 py-1 rounded bg-surface-container-highest text-tertiary font-telemetry-mono text-[11px]">
                  ✓ {perm}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Autonomous Risk Thresholds */}
        <div className="bg-surface-container-low p-space-lg rounded-xl border border-surface-container-high/40 space-y-space-md">
          <div className="pb-space-sm border-b border-surface-container-high/30">
            <h2 className="font-headline-md text-on-surface">Autonomous Financial Caps & Guardrails</h2>
            <p className="font-body-sm text-outline">Zero-fabrication thresholds enforced prior to tool dispatch</p>
          </div>

          <div className="space-y-3 font-body-sm">
            <div className="p-3 rounded bg-surface-container-lowest border border-surface-container-high/30 flex justify-between items-center">
              <div>
                <span className="font-headline-sm text-on-surface block">Atonia Insurance</span>
                <span className="text-outline text-xs">Policy limit adjustment / endorsement cap</span>
              </div>
              <span className="font-telemetry-mono text-primary font-bold">£1,000.00</span>
            </div>

            <div className="p-3 rounded bg-surface-container-lowest border border-surface-container-high/30 flex justify-between items-center">
              <div>
                <span className="font-headline-sm text-on-surface block">Eureka Banking</span>
                <span className="text-outline text-xs">Emergency ATM cash withdrawal limit (24h)</span>
              </div>
              <span className="font-telemetry-mono text-primary font-bold">£200.00</span>
            </div>

            <div className="p-3 rounded bg-surface-container-lowest border border-surface-container-high/30 flex justify-between items-center">
              <div>
                <span className="font-headline-sm text-on-surface block">Atonia Marketplace</span>
                <span className="text-outline text-xs">Automated return refund cap</span>
              </div>
              <span className="font-telemetry-mono text-primary font-bold">$500.00</span>
            </div>

            <div className="p-3 rounded bg-surface-container-lowest border border-surface-container-high/30 flex justify-between items-center">
              <div>
                <span className="font-headline-sm text-on-surface block">Sorplos Insurtech</span>
                <span className="text-outline text-xs">Single-policy bind threshold</span>
              </div>
              <span className="font-telemetry-mono text-primary font-bold">£1,500.00</span>
            </div>
          </div>

          <button
            onClick={() => showToast('Threshold parameters locked by security compliance.', 'info')}
            className="w-full py-2 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-headline-sm text-headline-sm transition-colors text-center"
          >
            Update Thresholds (Requires 2-Person Key)
          </button>
        </div>
      </div>

      {/* External Integrations Connectivity Matrix */}
      <div className="bg-surface-container-low p-space-lg rounded-xl border border-surface-container-high/40 shadow-sm space-y-space-md">
        <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-high/30">
          <div>
            <h2 className="font-headline-md text-on-surface">External Integrations & Boundary Status</h2>
            <p className="font-body-sm text-outline">
              Honest status of external provider connections. Services without verified production credentials execute through controlled boundaries.
            </p>
          </div>
          <span className="font-telemetry-badge text-tertiary uppercase">Real Integration Gateways</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-sm">
          {integrations.map((int) => (
            <div
              key={int.id}
              className="p-3 rounded-lg bg-surface-container-lowest border border-surface-container-high/30 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-headline-sm text-sm text-on-surface">{int.name}</span>
                <span
                  className={`px-2 py-0.5 rounded font-telemetry-badge uppercase text-[10px] ${
                    int.status === 'connected' ? 'bg-tertiary-container/30 text-tertiary' : 'bg-primary/20 text-primary'
                  }`}
                >
                  {int.status === 'connected' ? 'Connected' : 'Awaiting Credentials'}
                </span>
              </div>
              <div className="text-[11px] text-outline font-telemetry-mono">{int.businessId.replace('_', ' ')}</div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-surface-container-high/20 text-[10px] font-telemetry-mono text-outline">
                <span>Latency: {int.latencyMs ? `${int.latencyMs}ms` : 'N/A'}</span>
                <span>Checked: {int.lastCheck}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
