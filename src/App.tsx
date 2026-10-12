import React from 'react';
import { AppProvider, useApp } from './client/context/AppContext.tsx';
import { Sidebar } from './client/components/layout/Sidebar.tsx';
import { Header } from './client/components/layout/Header.tsx';
import { TakeoverModal } from './client/components/modals/TakeoverModal.tsx';
import { OverviewPage } from './client/pages/OverviewPage.tsx';
import { ConversationsPage } from './client/pages/ConversationsPage.tsx';
import { EscalationsPage } from './client/pages/EscalationsPage.tsx';
import { BusinessesPage } from './client/pages/BusinessesPage.tsx';
import { VoicePage } from './client/pages/VoicePage.tsx';
import { TasksPage } from './client/pages/TasksPage.tsx';
import { KnowledgePage } from './client/pages/KnowledgePage.tsx';
import { AnalyticsPage } from './client/pages/AnalyticsPage.tsx';
import { AuditLogsPage } from './client/pages/AuditLogsPage.tsx';
import { SettingsPage } from './client/pages/SettingsPage.tsx';

const AppContent: React.FC = () => {
  const { currentRoute, toast } = useApp();

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased">
      {/* Toast Alert Notification */}
      {toast && (
        <div className="fixed top-16 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-2.5 rounded-lg shadow-2xl border text-sm font-medium flex items-center gap-2 ${
              toast.type === 'error'
                ? 'bg-error-container text-on-error border-error'
                : toast.type === 'success'
                ? 'bg-tertiary-container text-on-tertiary border-tertiary'
                : toast.type === 'warning'
                ? 'bg-amber-900/90 text-amber-200 border-amber-600'
                : 'bg-surface-container-high text-on-surface border-surface-container-highest'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {toast.type === 'error' ? 'error' : toast.type === 'success' ? 'check_circle' : 'info'}
            </span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Global Takeover Intercept Modal */}
      <TakeoverModal />

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Viewport Content Area */}
      <div className="pl-64">
        {/* Header Bar */}
        <Header />

        {/* Dynamic Route Viewport */}
        <main className="relative w-full pt-14 bg-surface min-h-screen">
          {currentRoute === 'overview' && <OverviewPage />}
          {currentRoute === 'conversations' && <ConversationsPage />}
          {currentRoute === 'escalations' && <EscalationsPage />}
          {currentRoute === 'businesses' && <BusinessesPage />}
          {currentRoute === 'voice' && <VoicePage />}
          {currentRoute === 'tasks' && <TasksPage />}
          {currentRoute === 'knowledge' && <KnowledgePage />}
          {currentRoute === 'analytics' && <AnalyticsPage />}
          {currentRoute === 'audit-logs' && <AuditLogsPage />}
          {currentRoute === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
