import type { UserRole } from '../types/index.ts';

export type Permission =
  | 'can_view_all_businesses'
  | 'can_takeover_session'
  | 'can_approve_override'
  | 'can_execute_tools'
  | 'can_manage_knowledge'
  | 'can_view_audit_logs'
  | 'can_manage_settings'
  | 'can_access_voice'
  | 'can_perform_underwriting'
  | 'can_view_sensitive_banking'
  | 'can_resolve_escalations';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    'can_view_all_businesses',
    'can_takeover_session',
    'can_approve_override',
    'can_execute_tools',
    'can_manage_knowledge',
    'can_view_audit_logs',
    'can_manage_settings',
    'can_access_voice',
    'can_perform_underwriting',
    'can_view_sensitive_banking',
    'can_resolve_escalations'
  ],
  OPERATIONS_LEAD: [
    'can_view_all_businesses',
    'can_takeover_session',
    'can_approve_override',
    'can_execute_tools',
    'can_manage_knowledge',
    'can_view_audit_logs',
    'can_manage_settings',
    'can_access_voice',
    'can_resolve_escalations'
  ],
  UNDERWRITER_SPECIALIST: [
    'can_takeover_session',
    'can_approve_override',
    'can_execute_tools',
    'can_perform_underwriting',
    'can_resolve_escalations',
    'can_view_audit_logs'
  ],
  FRAUD_SPECIALIST: [
    'can_takeover_session',
    'can_approve_override',
    'can_execute_tools',
    'can_view_sensitive_banking',
    'can_resolve_escalations',
    'can_view_audit_logs'
  ],
  SUPPORT_AGENT: [
    'can_takeover_session',
    'can_execute_tools',
    'can_access_voice'
  ],
  AUDITOR: [
    'can_view_all_businesses',
    'can_view_audit_logs'
  ]
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
