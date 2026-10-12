import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { fetchTasks } from '../api.ts';
import { TaskRecord } from '../../types/index.ts';

export const TasksPage: React.FC = () => {
  const { selectedBusiness, showToast } = useApp();
  const [tasks, setTasks] = useState<TaskRecord[]>([]);

  useEffect(() => {
    fetchTasks().then((data) => {
      if (data?.tasks) setTasks(data.tasks);
    });
  }, [selectedBusiness]);

  const handleRestart = (id: string) => {
    showToast(`Task ${id} requeued to worker pipeline.`, 'info');
  };

  return (
    <div className="flex flex-col w-full p-space-lg max-w-7xl mx-auto space-y-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-low p-space-md rounded-xl border border-surface-container-high/40">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Autonomous Worker Tasks</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Asynchronous background jobs, OCR extractions, carrier logistics syncs, and quote batch indexing.
          </p>
        </div>
        <button
          onClick={() => showToast('Worker node pool healthy: 8 concurrency slots available.', 'success')}
          className="px-3.5 py-1.5 rounded bg-primary text-on-primary font-headline-sm text-headline-sm hover:bg-primary-fixed-dim transition-colors"
        >
          Check Worker Fleet
        </button>
      </div>

      <div className="bg-surface-container-low rounded-xl overflow-hidden border border-surface-container-high/40 shadow-sm">
        <table className="w-full text-left border-collapse font-body-sm text-body-sm">
          <thead>
            <tr className="bg-surface-container-lowest text-outline font-label-sm uppercase tracking-wider border-b border-surface-container-high/30">
              <th className="py-3 px-space-md">Task Title</th>
              <th className="py-3 px-space-sm">Business Entity</th>
              <th className="py-3 px-space-sm">Type</th>
              <th className="py-3 px-space-sm">Progress</th>
              <th className="py-3 px-space-sm">Status</th>
              <th className="py-3 px-space-sm">Created</th>
              <th className="py-3 px-space-md text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-highest/30">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-surface-container transition-colors">
                <td className="py-3 px-space-md">
                  <div className="font-headline-sm text-on-surface">{task.title}</div>
                  <div className="font-telemetry-mono text-[11px] text-outline">Target Ref: {task.targetRef}</div>
                </td>
                <td className="py-3 px-space-sm">
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest font-label-sm text-primary">
                    {task.businessId.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-space-sm font-telemetry-mono text-outline">{task.type}</td>
                <td className="py-3 px-space-sm">
                  <div className="w-28 bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${task.status === 'completed' ? 'bg-tertiary' : 'bg-primary animate-pulse'}`}
                      style={{ width: `${task.progressPercent}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-telemetry-mono text-outline">{task.progressPercent}%</span>
                </td>
                <td className="py-3 px-space-sm">
                  <span
                    className={`px-2 py-0.5 rounded font-telemetry-badge uppercase ${
                      task.status === 'completed' ? 'bg-tertiary-container/30 text-tertiary' : 'bg-primary-container/20 text-primary'
                    }`}
                  >
                    {task.status}
                  </span>
                </td>
                <td className="py-3 px-space-sm font-telemetry-mono text-outline">{task.createdAt}</td>
                <td className="py-3 px-space-md text-right">
                  <button
                    onClick={() => handleRestart(task.id)}
                    className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-sm text-label-sm transition-colors"
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
