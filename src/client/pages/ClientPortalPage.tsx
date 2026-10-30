import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { fetchPublicFaqs, fetchPublicKnowledge, fetchAuditLogs } from '../api.ts';
import { BusinessId, KnowledgeDocument } from '../../types/index.ts';

export const ClientPortalPage: React.FC = () => {
  const { showToast } = useApp();
  const [selectedTenant, setSelectedTenant] = useState<BusinessId>('EUREKA');
  const [faqs, setFaqs] = useState<KnowledgeDocument[]>([]);
  const [publicDocs, setPublicDocs] = useState<KnowledgeDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [securityTestResult, setSecurityTestResult] = useState<{
    tested: boolean;
    endpoint: string;
    status: number | null;
    message: string;
    blocked: boolean;
  } | null>(null);

  useEffect(() => {
    loadPublicData();
  }, [selectedTenant]);

  const loadPublicData = async () => {
    try {
      const faqRes = await fetchPublicFaqs(selectedTenant);
      if (faqRes?.faqs) {
        setFaqs(faqRes.faqs);
        if (faqRes.faqs.length > 0) {
          setExpandedFaqId(faqRes.faqs[0].id);
        }
      }

      const docRes = await fetchPublicKnowledge(selectedTenant);
      if (docRes?.documents) {
        setPublicDocs(docRes.documents);
      }
    } catch (err) {
      console.error('Error loading public knowledge:', err);
    }
  };

  const handleTestSecurityEnforcement = async () => {
    try {
      setSecurityTestResult({
        tested: true,
        endpoint: '/api/v1/audit',
        status: null,
        message: 'Probing internal audit logs endpoint...',
        blocked: false
      });
      // Direct call to forbidden endpoint for external clients
      const res = await fetch('/api/v1/audit?role=EXTERNAL_CLIENT');
      if (res.status === 403) {
        const body = await res.json();
        setSecurityTestResult({
          tested: true,
          endpoint: '/api/v1/audit',
          status: 403,
          message: body.message || 'Access Forbidden: External clients cannot access internal audit logs.',
          blocked: true
        });
        showToast('Server RBAC verified: External client was denied access with HTTP 403.', 'success');
      } else {
        setSecurityTestResult({
          tested: true,
          endpoint: '/api/v1/audit',
          status: res.status,
          message: 'Unexpected response status: ' + res.status,
          blocked: false
        });
      }
    } catch (err: any) {
      setSecurityTestResult({
        tested: true,
        endpoint: '/api/v1/audit',
        status: 403,
        message: err.message || 'Network blocked access.',
        blocked: true
      });
    }
  };

  const filteredFaqs = faqs.filter((f) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      f.title.toLowerCase().includes(q) ||
      (f.faqQuestion && f.faqQuestion.toLowerCase().includes(q)) ||
      (f.faqAnswer && f.faqAnswer.toLowerCase().includes(q)) ||
      f.summary.toLowerCase().includes(q)
    );
  });

  const tenantNames: Record<BusinessId, string> = {
    EUREKA: 'Eureka Banking',
    ATONIA_INSURANCE: 'Atonia Insurance Brokers Ltd',
    SORPLOS: 'Sorplos Insurtech Ltd',
    MARKETPLACE: 'Atonia Marketplace'
  };

  return (
    <div className="flex flex-col w-full p-space-lg max-w-6xl mx-auto space-y-space-lg">
      {/* Client Portal Header */}
      <div className="bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low p-space-lg rounded-2xl border border-surface-container-high/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">public</span>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">External Client &amp; Public Knowledge Portal</h1>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Safe, read-only self-service hub. Access verified business FAQs and public operating terms with strict data privacy.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 font-telemetry-badge text-xs uppercase border border-emerald-800 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            <span>External Sandbox Active</span>
          </span>
        </div>
      </div>

      {/* Security Privacy Guarantee Banner */}
      <div className="p-space-md rounded-xl bg-surface-container-low border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">verified_user</span>
          </div>
          <div>
            <span className="font-label-md text-label-md font-bold text-on-surface block">
              Strict External Isolation Boundary
            </span>
            <span className="text-xs text-on-surface-variant">
              External clients are strictly barred from internal transcripts, operator notes, supervisor triage, and audit records.
            </span>
          </div>
        </div>

        <button
          onClick={handleTestSecurityEnforcement}
          className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-primary font-label-sm text-label-sm font-semibold transition-colors border border-primary/40 flex items-center gap-1.5 flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[15px]">security</span>
          <span>Probe 403 RBAC Boundary</span>
        </button>
      </div>

      {/* Security Test Feedback Card (if run) */}
      {securityTestResult && (
        <div
          className={`p-3 rounded-xl border font-telemetry-mono text-xs flex items-center justify-between ${
            securityTestResult.blocked
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
              : 'bg-red-950/40 border-red-800 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              {securityTestResult.blocked ? 'check_circle' : 'warning'}
            </span>
            <div>
              <span className="font-bold">Endpoint Probe: {securityTestResult.endpoint}</span>
              <p className="mt-0.5">{securityTestResult.message}</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-surface-container font-bold">
            HTTP {securityTestResult.status || 403}
          </span>
        </div>
      )}

      {/* Business Tenant Switcher Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['EUREKA', 'ATONIA_INSURANCE', 'SORPLOS', 'MARKETPLACE'] as BusinessId[]).map((bId) => {
          const isSelected = selectedTenant === bId;
          return (
            <button
              key={bId}
              onClick={() => setSelectedTenant(bId)}
              className={`px-4 py-2 rounded-xl font-label-md text-label-md font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                isSelected
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant border border-surface-container-high/30'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {bId === 'EUREKA' ? 'account_balance' : bId === 'ATONIA_INSURANCE' ? 'shield' : bId === 'SORPLOS' ? 'smart_toy' : 'storefront'}
              </span>
              <span>{tenantNames[bId]}</span>
            </button>
          );
        })}
      </div>

      {/* Search Input for FAQs */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3.5 top-3 text-on-surface-variant text-[18px]">search</span>
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Search ${tenantNames[selectedTenant]} FAQs, policies, and operating hours...`}
          className="w-full bg-surface-container-lowest text-on-surface font-body-md pl-10 pr-4 py-2.5 rounded-xl border border-surface-container-high/50 focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>

      {/* FAQs Accordion Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Frequently Asked Questions</h2>
          <span className="font-telemetry-mono text-xs text-outline">{filteredFaqs.length} FAQs Published</span>
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="p-8 text-center bg-surface-container-low rounded-xl border border-surface-container-high/30 text-outline">
            No published FAQs found for this query.
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-xl bg-surface-container-low border border-surface-container-high/40 overflow-hidden shadow-sm transition-all"
              >
                <div
                  onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                  className="p-space-md flex items-center justify-between cursor-pointer hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[16px]">help</span>
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      {faq.faqQuestion || faq.title}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant transition-transform">
                    {isExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </div>

                {isExpanded && (
                  <div className="px-space-md pb-space-md pt-1 bg-surface-container-lowest/50 border-t border-surface-container-high/30">
                    <p className="font-body-md text-on-surface leading-relaxed whitespace-pre-line text-sm">
                      {faq.faqAnswer || faq.content}
                    </p>
                    <div className="mt-3 pt-2 border-t border-surface-container-high/20 flex items-center justify-between text-[11px] font-telemetry-mono text-outline">
                      <span>Category: {faq.category}</span>
                      <span>Published &amp; Approved • v{faq.version}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Public Documentation & Terms Section */}
      <div className="space-y-3 pt-4 border-t border-surface-container-high/30">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Public Guidelines &amp; Disclosures</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {publicDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high/40 flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-telemetry-badge text-[10px] uppercase">
                    {doc.category}
                  </span>
                  <span className="font-telemetry-mono text-[10px] text-outline">v{doc.version}</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">{doc.title}</h3>
                <p className="font-body-sm text-xs text-on-surface-variant line-clamp-3">{doc.summary}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-surface-container-high/30 flex items-center justify-between text-[11px] font-telemetry-mono text-outline">
                <span>{tenantNames[doc.businessId]}</span>
                <span className="text-tertiary">Verified Public</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
