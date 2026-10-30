import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { fetchKnowledge, createKnowledgeDoc, updateKnowledgeDoc, publishKnowledgeDoc, archiveKnowledgeDoc } from '../api.ts';
import { KnowledgeDocument, BusinessId } from '../../types/index.ts';

export const KnowledgePage: React.FC = () => {
  const { selectedBusiness, currentUser, showToast } = useApp();
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'published' | 'drafts' | 'faqs'>('published');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modal state
  const [showEditorModal, setShowEditorModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<{
    id?: string;
    title: string;
    category: string;
    topic: string;
    businessId: BusinessId;
    summary: string;
    content: string;
    isFaq: boolean;
    faqQuestion: string;
    faqAnswer: string;
    isPublic: boolean;
    status: 'draft' | 'published' | 'archived';
    changeSummary: string;
  }>({
    title: '',
    category: 'Operations',
    topic: 'Customer Procedures',
    businessId: 'EUREKA',
    summary: '',
    content: '',
    isFaq: false,
    faqQuestion: '',
    faqAnswer: '',
    isPublic: true,
    status: 'draft',
    changeSummary: 'Initial authoring'
  });

  const loadDocs = async () => {
    setIsLoading(true);
    try {
      const bId = selectedBusiness !== 'ALL' ? selectedBusiness : undefined;
      const statusFilter = activeTab === 'published' ? 'published' : activeTab === 'drafts' ? 'draft' : undefined;
      const data = await fetchKnowledge(bId, searchTerm, statusFilter);
      if (data?.documents) {
        let filtered = data.documents;
        if (activeTab === 'faqs') {
          filtered = filtered.filter((d: KnowledgeDocument) => d.isFaq || d.isPublic);
        }
        setDocs(filtered);
        if (filtered.length > 0) {
          const match = filtered.find((d: KnowledgeDocument) => d.id === selectedDoc?.id);
          setSelectedDoc(match || filtered[0]);
        } else {
          setSelectedDoc(null);
        }
      }
    } catch (err) {
      console.error('Failed to load knowledge documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, [selectedBusiness, searchTerm, activeTab]);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setFormData({
      title: '',
      category: 'General',
      topic: 'Customer Assistance',
      businessId: selectedBusiness !== 'ALL' ? selectedBusiness : 'EUREKA',
      summary: '',
      content: '',
      isFaq: false,
      faqQuestion: '',
      faqAnswer: '',
      isPublic: true,
      status: 'draft',
      changeSummary: 'Initial authoring'
    });
    setShowEditorModal(true);
  };

  const handleOpenEditModal = (doc: KnowledgeDocument) => {
    setIsEditing(true);
    setFormData({
      id: doc.id,
      title: doc.title,
      category: doc.category,
      topic: doc.topic || 'Customer Procedures',
      businessId: doc.businessId,
      summary: doc.summary,
      content: doc.content,
      isFaq: Boolean(doc.isFaq),
      faqQuestion: doc.faqQuestion || doc.title,
      faqAnswer: doc.faqAnswer || doc.content,
      isPublic: Boolean(doc.isPublic),
      status: doc.status,
      changeSummary: ''
    });
    setShowEditorModal(true);
  };

  const handleSaveModal = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('Title and content are required.', 'warning');
      return;
    }

    try {
      if (isEditing && formData.id) {
        await updateKnowledgeDoc(
          formData.id,
          {
            title: formData.title,
            category: formData.category,
            topic: formData.topic,
            summary: formData.summary || formData.title,
            content: formData.content,
            isFaq: formData.isFaq,
            faqQuestion: formData.isFaq ? formData.faqQuestion : undefined,
            faqAnswer: formData.isFaq ? formData.faqAnswer : undefined,
            isPublic: formData.isPublic,
            status: formData.status
          },
          currentUser.name,
          formData.changeSummary || 'Content updated'
        );
        showToast('Knowledge entry updated and revision recorded.', 'success');
      } else {
        await createKnowledgeDoc(
          {
            title: formData.title,
            category: formData.category,
            topic: formData.topic,
            businessId: formData.businessId,
            summary: formData.summary || formData.title,
            content: formData.content,
            isFaq: formData.isFaq,
            faqQuestion: formData.isFaq ? formData.faqQuestion : undefined,
            faqAnswer: formData.isFaq ? formData.faqAnswer : undefined,
            isPublic: formData.isPublic,
            status: formData.status
          },
          currentUser.name
        );
        showToast(
          formData.status === 'published'
            ? 'Knowledge document approved and published.'
            : 'Knowledge draft saved to review queue.',
          'success'
        );
      }
      setShowEditorModal(false);
      loadDocs();
    } catch (err: any) {
      showToast(err.message || 'Failed to save knowledge document.', 'error');
    }
  };

  const handlePublish = async (docId: string) => {
    try {
      await publishKnowledgeDoc(docId, currentUser.name);
      showToast('Knowledge approved and published to active AI Grounding Layer.', 'success');
      loadDocs();
    } catch (err: any) {
      showToast(err.message || 'Failed to publish document.', 'error');
    }
  };

  const handleArchive = async (docId: string) => {
    try {
      await archiveKnowledgeDoc(docId);
      showToast('Document archived from active retrieval.', 'info');
      loadDocs();
    } catch (err: any) {
      showToast(err.message || 'Failed to archive document.', 'error');
    }
  };

  return (
    <div className="flex flex-col w-full p-space-lg max-w-7xl mx-auto space-y-space-md">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-low p-space-md rounded-xl border border-surface-container-high/40 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Knowledge & Grounding Governance</h1>
            <span className="px-2 py-0.5 rounded bg-tertiary-container text-on-tertiary font-telemetry-badge text-telemetry-badge uppercase">
              Tenant Isolated
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            Clear separation between Approved AI Grounding, Review Drafts from conversations, and Public FAQs.
          </p>
        </div>

        <div className="flex items-center gap-space-sm">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-on-surface-variant text-[16px]">search</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface-container-lowest text-on-surface font-body-sm text-body-sm pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container-high/40 w-56"
              placeholder="Filter topics & docs..."
            />
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold flex items-center gap-1.5 hover:bg-primary-fixed-dim transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>New Knowledge</span>
          </button>
        </div>
      </div>

      {/* Tabs Distinction: Approved AI Knowledge vs. Drafts Review vs. Public FAQs */}
      <div className="flex items-center justify-between border-b border-surface-container-high/40 pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('published')}
            className={`px-3 py-1.5 rounded-lg font-label-md text-label-md font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'published'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Approved Knowledge (AI Grounding)</span>
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-3 py-1.5 rounded-lg font-label-md text-label-md font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'drafts'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">rate_review</span>
            <span>Drafts &amp; Suggested Queue</span>
          </button>
          <button
            onClick={() => setActiveTab('faqs')}
            className={`px-3 py-1.5 rounded-lg font-label-md text-label-md font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'faqs'
                ? 'bg-secondary text-on-secondary shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">public</span>
            <span>Public Client FAQs</span>
          </button>
        </div>

        <div className="text-on-surface-variant font-telemetry-mono text-[11px] hidden sm:block">
          {docs.length} Entries in {activeTab.toUpperCase()}
        </div>
      </div>

      {/* Main Content Layout: Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg min-h-[500px]">
        {/* Document Cards List */}
        <div className="lg:col-span-5 flex flex-col gap-space-sm overflow-y-auto max-h-[700px]">
          {isLoading ? (
            <div className="p-8 text-center text-outline font-telemetry-mono">Loading entries...</div>
          ) : docs.length === 0 ? (
            <div className="p-8 text-center bg-surface-container-low rounded-xl border border-surface-container-high/40 text-outline">
              No entries found for this category or filter.
            </div>
          ) : (
            docs.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-space-md rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-surface-container-high border-primary/50 shadow-md ring-1 ring-primary/40'
                      : 'bg-surface-container-low hover:bg-surface-container border-surface-container-high/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-2 py-0.5 rounded bg-surface-container-highest font-label-sm text-label-sm text-primary">
                      {doc.businessId.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {doc.isFaq && (
                        <span className="px-1.5 py-0.2 rounded bg-secondary/20 text-secondary font-telemetry-badge text-[10px]">
                          FAQ
                        </span>
                      )}
                      {doc.isPublic && (
                        <span className="px-1.5 py-0.2 rounded bg-tertiary/20 text-tertiary font-telemetry-badge text-[10px]">
                          PUBLIC
                        </span>
                      )}
                      <span
                        className={`px-1.5 py-0.2 rounded font-telemetry-badge text-[10px] uppercase ${
                          doc.status === 'published'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : doc.status === 'draft'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">{doc.title}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">{doc.summary}</p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-container-high/30 text-outline text-[11px] font-telemetry-mono">
                    <span>Topic: {doc.topic || doc.category}</span>
                    <span>v{doc.version} • {doc.lastUpdated}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Document Full View */}
        <div className="lg:col-span-7 bg-surface-container-low p-space-lg rounded-xl border border-surface-container-high/40 shadow-sm flex flex-col justify-between">
          {selectedDoc ? (
            <div className="flex flex-col gap-space-md">
              <div className="pb-space-sm border-b border-surface-container-high/30">
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-telemetry-badge uppercase font-bold text-xs ${
                        selectedDoc.status === 'published'
                          ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-700'
                          : selectedDoc.status === 'draft'
                          ? 'bg-amber-900/60 text-amber-200 border border-amber-700'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {selectedDoc.status === 'published'
                        ? '● APPROVED FOR AI GROUNDING'
                        : selectedDoc.status === 'draft'
                        ? '▲ DRAFT — AWAITING HUMAN APPROVAL'
                        : 'ARCHIVED'}
                    </span>
                    <span className="font-telemetry-mono text-outline text-xs">v{selectedDoc.version}</span>
                  </div>

                  {/* Actions for Authorized Staff */}
                  <div className="flex items-center gap-1.5">
                    {selectedDoc.status === 'draft' && (
                      <button
                        onClick={() => handlePublish(selectedDoc.id)}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-label-sm text-label-sm font-semibold flex items-center gap-1 transition-colors shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        <span>Approve &amp; Publish</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEditModal(selectedDoc)}
                      className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-sm text-label-sm transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      <span>Edit Entry</span>
                    </button>
                    {selectedDoc.status === 'published' && (
                      <button
                        onClick={() => handleArchive(selectedDoc.id)}
                        className="px-2.5 py-1 rounded bg-surface-container hover:bg-error-container hover:text-on-error text-outline font-label-sm text-label-sm transition-colors"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>

                <h2 className="font-headline-md text-headline-md text-on-surface">{selectedDoc.title}</h2>
                <div className="flex items-center gap-3 text-primary font-label-sm mt-1">
                  <span>Category: {selectedDoc.category}</span>
                  <span>•</span>
                  <span>Topic: {selectedDoc.topic || 'General Operations'}</span>
                  <span>•</span>
                  <span className="text-tertiary">{selectedDoc.businessId.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Document Metadata Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-telemetry-mono bg-surface-container-lowest p-2.5 rounded-lg border border-surface-container-high/30">
                <div>
                  <span className="text-outline block">Author</span>
                  <span className="text-on-surface font-semibold">{selectedDoc.author}</span>
                </div>
                <div>
                  <span className="text-outline block">Public FAQ</span>
                  <span className={selectedDoc.isFaq ? 'text-tertiary' : 'text-outline'}>
                    {selectedDoc.isFaq ? 'Yes (Public)' : 'No (Internal)'}
                  </span>
                </div>
                <div>
                  <span className="text-outline block">Approved By</span>
                  <span className="text-on-surface font-semibold">
                    {selectedDoc.approvedBy || (selectedDoc.status === 'draft' ? 'Pending Review' : 'System Baseline')}
                  </span>
                </div>
                <div>
                  <span className="text-outline block">Source</span>
                  <span className="text-on-surface truncate">
                    {selectedDoc.sourceConversationId ? `Conv: ${selectedDoc.sourceConversationId}` : 'Authorized Manual'}
                  </span>
                </div>
              </div>

              {/* Main Content Body */}
              <div className="bg-surface-container-lowest p-space-md rounded-lg border border-surface-container-high/30 font-body-md text-body-md text-on-surface leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto">
                {selectedDoc.content}
              </div>

              {/* FAQ Preview (if applicable) */}
              {selectedDoc.isFaq && (
                <div className="bg-surface-container p-3 rounded-lg border border-secondary/30">
                  <div className="font-label-sm text-label-sm font-bold text-secondary mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">help</span>
                    <span>Client FAQ Preview</span>
                  </div>
                  <div className="font-semibold text-on-surface text-sm mb-1">
                    Q: {selectedDoc.faqQuestion || selectedDoc.title}
                  </div>
                  <div className="text-on-surface-variant text-xs">
                    A: {selectedDoc.faqAnswer || selectedDoc.summary}
                  </div>
                </div>
              )}

              {/* Revision History Section */}
              {selectedDoc.revisions && selectedDoc.revisions.length > 0 && (
                <div className="mt-2 border-t border-surface-container-high/30 pt-2">
                  <span className="font-label-sm text-label-sm text-on-surface font-semibold mb-1 block">
                    Revision History Audit
                  </span>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedDoc.revisions.map((rev) => (
                      <div
                        key={rev.version}
                        className="p-1.5 rounded bg-surface-container-lowest text-xs font-telemetry-mono flex items-center justify-between border border-surface-container-high/20"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-bold">v{rev.version}</span>
                          <span className="text-on-surface-variant truncate">{rev.changeSummary}</span>
                        </div>
                        <div className="text-outline text-[10px]">
                          {rev.author} • {rev.timestamp}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Re-index & Status Bar */}
              <div className="flex items-center justify-between pt-space-sm border-t border-surface-container-high/30">
                <span className="text-outline text-xs font-telemetry-mono">
                  Atlas Vector Index: {selectedDoc.businessId}_KB_COLLECTION
                </span>
                <button
                  onClick={() => showToast(`Vector embedding re-indexed for ${selectedDoc.title}.`, 'success')}
                  className="px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-sm text-label-sm transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[14px]">sync</span>
                  <span>Re-index Embeddings</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-outline text-center py-20">Select an entry from the list to view or edit.</div>
          )}
        </div>
      </div>

      {/* Authoring & Review Modal */}
      {showEditorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-low border border-surface-container-high rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  {isEditing ? 'edit_note' : 'add_box'}
                </span>
                <h2 className="font-headline-md text-headline-md text-on-surface">
                  {isEditing ? 'Revise Knowledge Entry' : 'Create Knowledge Document'}
                </h2>
              </div>
              <button
                onClick={() => setShowEditorModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Business Tenant</label>
                <select
                  value={formData.businessId}
                  onChange={(e) => setFormData({ ...formData, businessId: e.target.value as BusinessId })}
                  disabled={isEditing}
                  className="w-full bg-surface-container text-on-surface font-body-sm p-2 rounded-lg border border-surface-container-high focus:ring-1 focus:ring-primary"
                >
                  <option value="EUREKA">Eureka Banking</option>
                  <option value="ATONIA_INSURANCE">Atonia Insurance Brokers</option>
                  <option value="SORPLOS">Sorplos Insurtech</option>
                  <option value="MARKETPLACE">Atonia Marketplace</option>
                </select>
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Category</label>
                <input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Card Operations, Underwriting"
                  className="w-full bg-surface-container text-on-surface font-body-sm p-2 rounded-lg border border-surface-container-high focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Title</label>
              <input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Official procedural or guideline title"
                className="w-full bg-surface-container text-on-surface font-body-sm p-2 rounded-lg border border-surface-container-high focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Summary</label>
              <input
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="One sentence synopsis for quick semantic ranking"
                className="w-full bg-surface-container text-on-surface font-body-sm p-2 rounded-lg border border-surface-container-high focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Approved Content / Procedure</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={5}
                placeholder="Comprehensive guidelines, underwriting criteria, or policy steps..."
                className="w-full bg-surface-container text-on-surface font-body-sm p-2.5 rounded-lg border border-surface-container-high focus:ring-1 focus:ring-primary leading-relaxed"
              />
            </div>

            {/* Public FAQ Controls */}
            <div className="p-3 bg-surface-container rounded-xl border border-surface-container-high/40 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface font-semibold">Public Client FAQ</span>
                <input
                  type="checkbox"
                  checked={formData.isFaq}
                  onChange={(e) => setFormData({ ...formData, isFaq: e.target.checked })}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
              </div>
              {formData.isFaq && (
                <div className="space-y-2 pt-2 border-t border-surface-container-high/30">
                  <input
                    value={formData.faqQuestion}
                    onChange={(e) => setFormData({ ...formData, faqQuestion: e.target.value })}
                    placeholder="Customer-facing question (e.g., How do I freeze my card?)"
                    className="w-full bg-surface-container-lowest text-on-surface font-body-sm p-2 rounded-lg border border-surface-container-high"
                  />
                  <textarea
                    value={formData.faqAnswer}
                    onChange={(e) => setFormData({ ...formData, faqAnswer: e.target.value })}
                    rows={2}
                    placeholder="Customer-facing clear answer..."
                    className="w-full bg-surface-container-lowest text-on-surface font-body-sm p-2 rounded-lg border border-surface-container-high"
                  />
                </div>
              )}
            </div>

            {isEditing && (
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Change Summary (Audit Log)</label>
                <input
                  value={formData.changeSummary}
                  onChange={(e) => setFormData({ ...formData, changeSummary: e.target.value })}
                  placeholder="e.g. Updated daily withdrawal limits to £500"
                  className="w-full bg-surface-container text-on-surface font-body-sm p-2 rounded-lg border border-surface-container-high"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-surface-container-high/40">
              <div className="flex items-center gap-2">
                <label className="text-xs text-on-surface-variant">Publication Status:</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="bg-surface-container text-on-surface font-body-sm text-xs p-1.5 rounded border border-surface-container-high"
                >
                  <option value="draft">Draft (Review Queue)</option>
                  <option value="published">Published (Live AI Grounding)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEditorModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveModal}
                  className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-sm font-semibold shadow-md"
                >
                  {isEditing ? 'Save Revision' : 'Save Document'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
