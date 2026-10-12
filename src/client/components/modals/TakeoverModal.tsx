import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { takeoverConversation } from '../../api.ts';

export const TakeoverModal: React.FC = () => {
  const { takeoverModal, closeTakeoverModal, currentUser, showToast, setCurrentRoute, setActiveConversationId } = useApp();

  if (!takeoverModal.isOpen) return null;

  const handleConfirm = async () => {
    if (takeoverModal.conversationId) {
      try {
        await takeoverConversation(takeoverModal.conversationId, currentUser.name);
        setActiveConversationId(takeoverModal.conversationId);
      } catch (err) {
        console.error('Takeover error:', err);
      }
    }
    showToast(`Control seized. Audio & conversation bridge routed to ${currentUser.name} workstation.`, 'success');
    closeTakeoverModal();
    setCurrentRoute('conversations');
  };

  return (
    <div className="fixed inset-0 bg-surface-container-lowest/80 backdrop-blur-md z-50 flex items-center justify-center p-space-md animate-fade-in">
      <div className="bg-surface-container-low max-w-lg w-full rounded-xl p-space-lg shadow-2xl flex flex-col gap-space-md border border-surface-container-highest">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-error text-[24px]">support_agent</span>
            <span className="font-headline-md text-headline-md text-on-surface">Confirm Session Takeover</span>
          </div>
          <button onClick={closeTakeoverModal} className="text-on-surface-variant hover:text-on-surface p-1 rounded">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="font-body-md text-body-md text-on-surface-variant">
          You are about to intervene and suspend autonomous AI agents for this session. {currentUser.name} will be assigned as active sovereign operator with direct audit trail logging.
        </p>

        <div className="bg-surface-container-lowest p-space-sm rounded border border-surface-container-highest/40 flex flex-col gap-1">
          <div className="flex justify-between font-label-sm text-label-sm text-outline mb-1">
            <span>Target Customer:</span>
            <span className="text-on-surface font-semibold">{takeoverModal.targetCustomer}</span>
          </div>
          <div className="flex justify-between font-label-sm text-label-sm text-outline">
            <span>Action:</span>
            <span className="text-primary font-mono">Halt AI Inference & Bridge Human SIP/Chat</span>
          </div>
          <div className="flex justify-between font-label-sm text-label-sm text-outline">
            <span>Audited Actor:</span>
            <span className="text-on-surface font-mono">{currentUser.name} ({currentUser.role})</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-space-sm pt-space-xs">
          <button
            onClick={closeTakeoverModal}
            className="px-4 py-2 rounded bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-bright transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded bg-error text-on-error font-headline-sm text-headline-sm font-semibold hover:bg-error/90 transition-colors shadow-sm"
          >
            Seize Live Control
          </button>
        </div>
      </div>
    </div>
  );
};
