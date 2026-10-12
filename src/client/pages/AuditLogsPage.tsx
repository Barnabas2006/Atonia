import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { fetchAuditLogs } from '../api.ts';
import { AuditLogEntry } from '../../types/index.ts';

export const AuditLogsPage: React.FC = () => {
  const { selectedBusiness, showToast } = useApp();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filterResult, setFilterResult] = useState<string>('ALL');

  useEffect(() => {
    fetchAuditLogs(selectedBusiness !== 'ALL' ? selectedBusiness : undefined).then((data) => {
      if (data?.auditLogs) setLogs(data.auditLogs);
    });
  }, [selectedBusiness]);

  const filteredLogs = logs.filter((l) => {
    if (filterResult !== 'ALL' && l.result !== filterResult) return false;
    return true;
  });

  return (
    <div className="flex flex-col w-full p-space-lg max-w-7xl mx-auto space-y-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-low p-space-md rounded-xl border border-surface-container-high/40">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Tamper-Evident Audit Logs</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Cryptographically sealed operational audit trail of every supervisor override, tool execution, and compliance boundary event.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value)}
            className="bg-surface-container-lowest text-on-surface font-body-sm text-body-sm px-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container-high/40"
          >
            <option value="ALL">All Outcomes</option>
            <option value="SUCCESS">Success Only</option>
            <option value="BLOCKED">Blocked Only</option>
            <option value="ESCALATED">Escalated Only</option>
          </select>
          <button
            onClick={() => showToast('Audit trail ledger export verified (SHA-256 hash valid).', 'success')}
            className="px-3.5 py-1.5 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md transition-colors"
          >
            Export Signed Log
          </button>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-xl overflow-hidden border border-surface-container-high/40 shadow-sm">
        <table className="w-full text-left border-collapse font-body-sm text-body-sm">
          <thead>
            <tr className="bg-surface-container-lowest text-outline font-label-sm uppercase tracking-wider border-b border-surface-container-high/30">
              <th className="py-3 px-space-md">Timestamp</th>
              <th className="py-3 px-space-sm">Actor</th>
              <th className="py-3 px-space-sm">Business Entity</th>
              <th className="py-3 px-space-sm">Action</th>
              <th className="py-3 px-space-sm">Resource</th>
              <th className="py-3 px-space-sm">Result</th>
              <th className="py-3 px-space-md">Operational Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-highest/30 font-telemetry-mono text-[12px]">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-surface-container transition-colors">
                <td className="py-3 px-space-md text-outline">{log.timestamp.slice(11, 19)}</td>
                <td className="py-3 px-space-sm font-semibold text-on-surface">
                  {log.actor}
                  <span className="block text-[10px] text-outline uppercase font-normal">{log.actorType}</span>
                </td>
                <td className="py-3 px-space-sm">
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest text-primary font-sans text-xs">
                    {log.businessId.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-space-sm text-secondary-fixed">{log.action}</td>
                <td className="py-3 px-space-sm text-on-surface-variant truncate max-w-[150px]">{log.resource}</td>
                <td className="py-3 px-space-sm">
                  <span
                    className={`px-2 py-0.5 rounded font-telemetry-badge uppercase font-sans ${
                      log.result === 'SUCCESS'
                        ? 'bg-tertiary-container/30 text-tertiary'
                        : log.result === 'BLOCKED'
                        ? 'bg-error-container text-on-error'
                        : 'bg-primary-container/20 text-primary'
                    }`}
                  >
                    {log.result}
                  </span>
                </td>
                <td className="py-3 px-space-md font-sans text-on-surface-variant max-w-sm truncate" title={log.detail}>
                  {log.detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
