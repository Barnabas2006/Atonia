import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { fetchKnowledge } from '../api.ts';
import { KnowledgeDocument } from '../../types/index.ts';

export const KnowledgePage: React.FC = () => {
  const { selectedBusiness, showToast } = useApp();
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchKnowledge(selectedBusiness !== 'ALL' ? selectedBusiness : undefined, searchTerm).then((data) => {
      if (data?.documents) {
        setDocs(data.documents);
        if (!selectedDoc && data.documents.length > 0) {
          setSelectedDoc(data.documents[0]);
        }
      }
    });
  }, [selectedBusiness, searchTerm]);

  return (
    <div className="flex flex-col w-full p-space-lg max-w-7xl mx-auto space-y-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-low p-space-md rounded-xl border border-surface-container-high/40">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Federated Knowledge & Compliance Layer</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Business guidelines, underwriting manuals, banking KYC procedures, and return policies indexed for AI retrieval.
          </p>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-2.5 top-2 text-on-surface-variant text-[16px]">search</span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-surface-container-lowest text-on-surface font-body-sm text-body-sm pl-8 pr-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container-high/40 w-64"
            placeholder="Search knowledge..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Document Cards List */}
        <div className="lg:col-span-6 flex flex-col gap-space-sm">
          {docs.map((doc) => {
            const isSelected = selectedDoc?.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`p-space-md rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-surface-container-high border-primary/50 shadow-md'
                    : 'bg-surface-container-low hover:bg-surface-container border-surface-container-high/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest font-label-sm text-label-sm text-primary">
                    {doc.businessId.replace('_', ' ')}
                  </span>
                  <span className="font-telemetry-mono text-outline text-[11px]">{doc.version}</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">{doc.title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">{doc.summary}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-container-high/30 text-outline text-[11px] font-telemetry-mono">
                  <span>Category: {doc.category}</span>
                  <span>Updated: {doc.lastUpdated}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Document Full View */}
        <div className="lg:col-span-6 bg-surface-container-low p-space-lg rounded-xl border border-surface-container-high/40 shadow-sm flex flex-col">
          {selectedDoc ? (
            <div className="flex flex-col gap-space-md">
              <div className="pb-space-sm border-b border-surface-container-high/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-telemetry-badge uppercase text-tertiary">{selectedDoc.status}</span>
                  <span className="font-telemetry-mono text-outline text-xs">Author: {selectedDoc.author}</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface">{selectedDoc.title}</h2>
                <div className="text-primary font-label-sm mt-1">{selectedDoc.category} • {selectedDoc.businessId.replace('_', ' ')}</div>
              </div>

              <div className="bg-surface-container-lowest p-space-md rounded-lg border border-surface-container-high/30 font-body-md text-body-md text-on-surface leading-relaxed whitespace-pre-line">
                {selectedDoc.content}
              </div>

              <div className="flex items-center justify-between pt-space-sm">
                <span className="text-outline text-xs font-telemetry-mono">Document Hash: SHA256-VECT-9941</span>
                <button
                  onClick={() => showToast('Vector embedding re-indexed across MongoDB cluster.', 'success')}
                  className="px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-sm text-label-sm transition-colors"
                >
                  Re-index Embeddings
                </button>
              </div>
            </div>
          ) : (
            <div className="text-outline text-center py-20">Select a knowledge document to inspect contents.</div>
          )}
        </div>
      </div>
    </div>
  );
};
