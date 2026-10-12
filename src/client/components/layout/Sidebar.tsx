import React, { useState } from 'react';
import { useApp, AppRoute } from '../../context/AppContext.tsx';
import { UserRole } from '../../../types/index.ts';

interface NavItem {
  id: AppRoute;
  label: string;
  icon: string;
  badge?: string | number;
  badgeColor?: string;
  badgeDot?: boolean;
}

export const Sidebar: React.FC = () => {
  const { currentRoute, setCurrentRoute, currentUser, switchRole } = useApp();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: 'grid_view' },
    { id: 'conversations', label: 'Conversations', icon: 'forum', badge: 128 },
    { id: 'escalations', label: 'Escalations', icon: 'priority_high', badge: 7, badgeColor: 'bg-error-container text-on-error font-semibold' },
    { id: 'businesses', label: 'Businesses', icon: 'domain', badgeDot: true },
    { id: 'tasks', label: 'Tasks', icon: 'task_alt' },
    { id: 'voice', label: 'Voice', icon: 'settings_voice', badge: 'SIP/RTP', badgeColor: 'text-tertiary font-telemetry-badge' },
    { id: 'knowledge', label: 'Knowledge', icon: 'menu_book' },
    { id: 'analytics', label: 'Analytics', icon: 'monitoring' },
    { id: 'audit-logs', label: 'Audit Logs', icon: 'verified_user' },
    { id: 'settings', label: 'Settings', icon: 'tune' }
  ];

  const availableRoles: UserRole[] = [
    'OPERATIONS_LEAD',
    'SUPER_ADMIN',
    'UNDERWRITER_SPECIALIST',
    'FRAUD_SPECIALIST',
    'SUPPORT_AGENT',
    'AUDITOR'
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest flex flex-col z-50 shadow-[0_1px_8px_rgba(0,0,0,0.3)] border-r border-surface-container-high/40">
      {/* Brand Header */}
      <div className="h-14 px-space-md flex items-center justify-between bg-surface-container-low/40 border-b border-surface-container-high/30">
        <div className="flex items-center gap-space-sm min-w-0">
          <div className="h-7 w-7 rounded-lg bg-surface-container-high flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight truncate">ATONIA AGENT</span>
            <span className="font-telemetry-badge text-telemetry-badge text-primary uppercase tracking-wider">Enterprise v2.4</span>
          </div>
        </div>
        <button
          className="text-on-surface-variant hover:text-on-surface p-space-xs rounded hover:bg-surface-container transition-colors"
          title="Sidebar layout"
        >
          <span className="material-symbols-outlined text-[18px]">dock_to_left</span>
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-space-xs py-space-sm">
        <div className="px-space-sm pb-space-xs">
          <span className="font-telemetry-badge text-telemetry-badge text-outline uppercase tracking-wider">Mission Control</span>
        </div>

        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentRoute(item.id)}
                className={`flex items-center justify-between px-space-sm py-1.5 rounded-lg transition-colors text-left w-full ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-headline-sm shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-body-sm text-body-sm'
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full font-telemetry-mono text-telemetry-mono ${
                      item.badgeColor || (isActive ? 'bg-primary/20 text-on-primary-container' : 'bg-surface-container-high text-on-surface')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {item.badgeDot && <span className="h-2 w-2 rounded-full bg-tertiary"></span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Profile Footer & RBAC Role Switcher */}
      <div className="p-space-xs bg-surface-container-lowest border-t border-surface-container-high/30 relative">
        <div
          onClick={() => setShowRoleMenu(!showRoleMenu)}
          className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low/70 hover:bg-surface-container-high transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="relative flex-shrink-0">
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
                src={currentUser.avatarUrl}
              />
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-tertiary ring-2 ring-surface-container-lowest"></span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-headline-sm text-on-surface leading-tight truncate">{currentUser.name}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant truncate">{currentUser.title}</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">unfold_more</span>
        </div>

        {/* Role Switcher Menu */}
        {showRoleMenu && (
          <div className="absolute bottom-16 left-2 right-2 p-2 bg-surface-container-low rounded-xl shadow-2xl border border-surface-container-highest z-50 flex flex-col gap-1">
            <div className="px-2 py-1 text-outline font-telemetry-badge uppercase">RBAC Role Simulation</div>
            {availableRoles.map((role) => (
              <button
                key={role}
                onClick={() => {
                  switchRole(role);
                  setShowRoleMenu(false);
                }}
                className={`px-2.5 py-1.5 rounded text-left font-body-sm flex items-center justify-between transition-colors ${
                  currentUser.role === role ? 'bg-primary text-on-primary font-semibold' : 'text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span>{role.replace('_', ' ')}</span>
                {currentUser.role === role && <span className="material-symbols-outlined text-[14px]">check</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
