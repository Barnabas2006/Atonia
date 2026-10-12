import React, { createContext, useContext, useState, useEffect } from 'react';
import { BusinessId, User, UserRole } from '../../types/index.ts';
import { fetchMe } from '../api.ts';

export type AppRoute =
  | 'overview'
  | 'conversations'
  | 'escalations'
  | 'businesses'
  | 'tasks'
  | 'voice'
  | 'knowledge'
  | 'analytics'
  | 'audit-logs'
  | 'settings';

interface AppContextType {
  currentRoute: AppRoute;
  setCurrentRoute: (route: AppRoute) => void;
  selectedBusiness: BusinessId | 'ALL';
  setSelectedBusiness: (b: BusinessId | 'ALL') => void;
  currentUser: User;
  setCurrentUser: (u: User) => void;
  switchRole: (role: UserRole) => void;
  takeoverModal: {
    isOpen: boolean;
    targetCustomer: string;
    conversationId?: string;
  };
  openTakeoverModal: (customerName: string, conversationId?: string) => void;
  closeTakeoverModal: () => void;
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  activeEscalationId: string;
  setActiveEscalationId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  toast: { message: string; type: 'info' | 'success' | 'warning' | 'error' } | null;
  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

const defaultUser: User = {
  id: 'USR-EV-802',
  name: 'Elena Vance',
  email: 'elena.vance@atonia-agent.internal',
  role: 'OPERATIONS_LEAD',
  businessAccess: 'ALL',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD-GQz6_qFo1mpN8KN0O92az5t45MIBvghtd1Z90CWz_QBoVqrMKK76l-fJees5jYn97Ldt3PvuHxR_3wnpGFGrOQsnvGE0lpKFd3bTjf074ZCUUTht6U2qQ9Y196U7tdrKTkoQQVlfT-Y3dwJ2zBYfosCpJGylg1dfDFMJPNRqMPEVyivveSeWlyvz9t2g-Gr4IfstAMTkhnVX-04qW-h7KpTSBUNG-OqfJhXjFEdqdcprHu7Ob_7uVQ',
  title: 'Head of Operations',
  status: 'active'
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('overview');
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessId | 'ALL'>('ALL');
  const [currentUser, setCurrentUser] = useState<User>(defaultUser);
  const [activeConversationId, setActiveConversationId] = useState<string>('conv-david-sterling');
  const [activeEscalationId, setActiveEscalationId] = useState<string>('ESC-401');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);

  const [takeoverModal, setTakeoverModal] = useState<{
    isOpen: boolean;
    targetCustomer: string;
    conversationId?: string;
  }>({
    isOpen: false,
    targetCustomer: 'Sophia Chen'
  });

  useEffect(() => {
    fetchMe()
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  const switchRole = (role: UserRole) => {
    setCurrentUser((prev) => ({
      ...prev,
      role
    }));
    showToast(`Role switched to ${role} for RBAC testing`, 'info');
  };

  const openTakeoverModal = (customerName: string, conversationId?: string) => {
    setTakeoverModal({
      isOpen: true,
      targetCustomer: customerName,
      conversationId
    });
  };

  const closeTakeoverModal = () => {
    setTakeoverModal((prev) => ({ ...prev, isOpen: false }));
  };

  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  return (
    <AppContext.Provider
      value={{
        currentRoute,
        setCurrentRoute,
        selectedBusiness,
        setSelectedBusiness,
        currentUser,
        setCurrentUser,
        switchRole,
        takeoverModal,
        openTakeoverModal,
        closeTakeoverModal,
        activeConversationId,
        setActiveConversationId,
        activeEscalationId,
        setActiveEscalationId,
        searchQuery,
        setSearchQuery,
        toast,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
