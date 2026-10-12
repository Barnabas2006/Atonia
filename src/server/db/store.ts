import type {
  User,
  Conversation,
  CustomerContext,
  EscalationRecord,
  ToolExecutionEvent,
  AuditLogEntry,
  KnowledgeDocument,
  TaskRecord,
  VoiceCallSession
} from '../../types/index.ts';
import {
  repository,
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_CONVERSATIONS,
  INITIAL_ESCALATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_TASKS,
  INITIAL_TOOL_EXECUTIONS,
  INITIAL_KNOWLEDGE_DOCS,
  INITIAL_VOICE_SESSIONS
} from './repository.ts';

export class DataStore {
  // Direct synchronous access mirrors initial domain state for synchronous fallbacks
  users: User[] = INITIAL_USERS;
  customers: CustomerContext[] = INITIAL_CUSTOMERS;
  conversations: Conversation[] = INITIAL_CONVERSATIONS;
  escalations: EscalationRecord[] = INITIAL_ESCALATIONS;
  auditLogs: AuditLogEntry[] = INITIAL_AUDIT_LOGS;
  tasks: TaskRecord[] = INITIAL_TASKS;
  toolExecutions: ToolExecutionEvent[] = INITIAL_TOOL_EXECUTIONS;
  knowledgeDocs: KnowledgeDocument[] = INITIAL_KNOWLEDGE_DOCS;
  voiceSessions: VoiceCallSession[] = INITIAL_VOICE_SESSIONS;

  // Repository reference for database persistence
  repo = repository;
}

export const store = new DataStore();
export { repository };
