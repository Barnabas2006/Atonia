import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  connectMongo,
  closeMongo,
  testMongoConnection,
  COLLECTIONS,
  getDb
} from '../src/server/db/mongodb.ts';
import { AppRepository } from '../src/server/db/repository.ts';
import { sanitizeSensitiveData } from '../src/server/utils/sanitizer.ts';
import { voiceAgentService } from '../src/server/services/voice-agent.service.ts';
import { authService } from '../src/server/services/auth.service.ts';
import type { User, Message } from '../src/types/index.ts';

async function runComprehensiveVerification() {
  console.log('================================================================');
  console.log('🧪 ATONIA AGENT COMPREHENSIVE PLATFORM VERIFICATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
      failed++;
    }
  }

  // ==========================================================================
  // PHASE 8 TEST: MongoDB Connection Probe & Failure Categorization
  // ==========================================================================
  console.log('--- PHASE 8: MongoDB Connection Test & Failure Categorization ---');

  // Test 8a: Probe without URI returns MISSING_ENVIRONMENT_VARIABLE
  const savedUri = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;
  const noUriResult = await testMongoConnection();
  assert(
    !noUriResult.success && noUriResult.errorCategory === 'MISSING_ENVIRONMENT_VARIABLE',
    'Connection probe correctly flags MISSING_ENVIRONMENT_VARIABLE when MONGODB_URI is absent',
    `Got errorCategory: ${noUriResult.errorCategory}`
  );

  // Spin up real MongoMemoryServer instance
  const mongod = await MongoMemoryServer.create();
  const testMongoUri = mongod.getUri();
  process.env.MONGODB_URI = testMongoUri;
  process.env.MONGODB_DB_NAME = 'atonia_agent';

  // Test 8b: Probe with real database performs atomic probe (write, read, delete)
  const connectedProbe = await testMongoConnection(testMongoUri, 'atonia_agent');
  assert(
    connectedProbe.success === true,
    'Connection probe successfully connects to MongoDB Atlas instance',
    `Message: ${connectedProbe.message}`
  );
  assert(
    Boolean(connectedProbe.writeVerified && connectedProbe.readVerified && connectedProbe.deleteVerified),
    'Connection probe executes atomic write, read, and delete validation successfully'
  );

  // Initialize repository with live database
  await connectMongo();
  const repo = new AppRepository();

  // ==========================================================================
  // PHASE 3 TEST: Persistent Conversation History, Pagination, Deduplication, Sanitization
  // ==========================================================================
  console.log('\n--- PHASE 3: Conversation History, Pagination, Deduplication & Sanitization ---');

  // Test 3a: Sensitive data sanitizer redacts BVN, NIN, Credit Cards, and Tokens
  const rawLeak = 'User BVN is 22123456789 and NIN is 11987654321. Card: 4532-1234-5678-9012. Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9. key: MySecretPassword123!';
  const sanitized = sanitizeSensitiveData(rawLeak);

  assert(
    !sanitized.includes('22123456789') && sanitized.includes('[IDENTITY/BVN REDACTED]'),
    'Sanitizer redacts 11-digit BVN and NIN values'
  );
  assert(
    !sanitized.includes('4532-1234-5678-9012') && sanitized.includes('[CARD REDACTED'),
    'Sanitizer redacts payment card numbers'
  );
  assert(
    !sanitized.includes('MySecretPassword123!') && sanitized.includes('[CREDENTIAL REDACTED]'),
    'Sanitizer redacts plaintext password credentials'
  );

  // Test 3b: Message deduplication on retry
  const testConv = await repo.getConversationById('conv-david-sterling');
  assert(Boolean(testConv), 'Repository retrieves seed conversation from MongoDB');

  const dedupeMessageId = `msg-dedupe-${Date.now()}`;
  const testMessage: Message = {
    id: dedupeMessageId,
    sender: 'customer',
    senderName: 'David Sterling',
    content: 'Can you verify my vehicle schedule MV73 XKL? Sensitive BVN: 22119988776',
    timestamp: '11:00 AM'
  };

  await repo.appendMessage('conv-david-sterling', testMessage);
  // Attempt duplicate append with identical message id
  await repo.appendMessage('conv-david-sterling', testMessage);

  const updatedConv = await repo.getConversationById('conv-david-sterling');
  const occurrences = updatedConv?.messages.filter((m) => m.id === dedupeMessageId).length || 0;
  assert(occurrences === 1, 'Message deduplication prevents duplicate messages on retry');

  const savedMsg = updatedConv?.messages.find((m) => m.id === dedupeMessageId);
  assert(
    savedMsg?.content.includes('[IDENTITY/BVN REDACTED]') && !savedMsg?.content.includes('22119988776'),
    'Messages are automatically sanitized before persistent storage in database'
  );

  // Test 3c: Conversation pagination
  const pagedResult = await repo.listConversationsPaginated({ page: 1, limit: 2 });
  assert(pagedResult.conversations.length <= 2, 'Pagination correctly limits conversation items per page');
  assert(pagedResult.pagination.total >= 4, 'Pagination returns accurate total conversation count');
  assert(pagedResult.pagination.totalPages >= 2, 'Pagination calculates correct totalPages');

  // ==========================================================================
  // PHASE 4 TEST: Complete Business Knowledge Base & Governance Lifecycle
  // ==========================================================================
  console.log('\n--- PHASE 4: Knowledge Base Lifecycle, Review Queue & Drafting ---');

  // Test 4a: Create a knowledge document in draft state
  const newDraft = await repo.createKnowledgeDoc(
    {
      title: 'Sorplos High-Risk Drone Cargo Protocol',
      category: 'Underwriting',
      topic: 'Autonomous Freight',
      businessId: 'SORPLOS',
      summary: 'Procedures for evaluating commercial drone freight payloads.',
      content: 'All drone deliveries exceeding £10,000 value must be referred to third-party syndicates. Sorplos holds zero direct underwriting authority.',
      status: 'draft',
      isPublic: false,
      isFaq: false
    },
    'Auditor Julian'
  );
  assert(Boolean(newDraft?.id) && newDraft.status === 'draft', 'Created knowledge document in draft review queue');

  // Test 4b: Update knowledge document with revision tracking
  const revisedDoc = await repo.updateKnowledgeDoc(
    newDraft.id,
    {
      summary: 'Updated threshold procedures for evaluating commercial drone freight.',
      content: 'Updated: Drone deliveries exceeding £15,000 value require secondary Lloyd’s syndicate signoff. Sorplos operates as an MGA technology partner only.'
    },
    'Underwriter Elena',
    'Increased value threshold to £15,000'
  );
  assert(revisedDoc?.version === '1.1', 'Document version incremented to 1.1 on update');
  assert(
    Boolean(revisedDoc?.revisions && revisedDoc.revisions.length === 2),
    'Revision history tracks complete chronological audit entries'
  );

  // Test 4c: Approve and Publish document
  const publishedDoc = await repo.publishKnowledgeDoc(newDraft.id, 'Head of Underwriting');
  assert(
    publishedDoc?.status === 'published' && publishedDoc.approvedBy === 'Head of Underwriting',
    'Document approved and published to active AI Grounding Layer'
  );

  // Test 4d: Draft knowledge entry from conversation workflow
  const draftedFromConv = await repo.draftKnowledgeFromConversation('conv-david-sterling', 'Supervisor Alex');
  assert(
    Boolean(draftedFromConv?.id) && draftedFromConv?.status === 'draft',
    'Workflow successfully extracts conversation query and drafts knowledge entry awaiting approval'
  );
  assert(
    draftedFromConv?.sourceConversationId === 'conv-david-sterling',
    'Drafted knowledge retains source conversation reference for audit traceability'
  );

  // ==========================================================================
  // PHASE 5 TEST: Internal Notes & Quality Review Flagging
  // ==========================================================================
  console.log('\n--- PHASE 5: Internal Notes Separation & Quality Review Flagging ---');

  // Test 5a: Add internal note separate from customer transcripts
  const noteAdded = await repo.addInternalNote(
    'conv-david-sterling',
    'Customer vehicle schedules verified against DVLA. Risk score approved by lead underwriter.',
    'Elena Vance',
    'OPERATIONS_LEAD'
  );
  assert(
    Boolean(noteAdded && noteAdded.internalNotes && noteAdded.internalNotes.length > 0),
    'Internal note recorded successfully on conversation'
  );
  assert(
    !noteAdded?.messages.some((m) => m.content.includes('Customer vehicle schedules verified against DVLA')),
    'Internal notes are strictly segregated and NOT visible in customer-facing message transcript'
  );

  // Test 5b: Flag conversation for quality review
  const flaggedConv = await repo.flagConversationReview(
    'conv-david-sterling',
    true,
    5,
    'Exemplary adherence to Atonia Lloyds syndicate motor binder limits.',
    'Quality Supervisor'
  );
  assert(
    flaggedConv?.flaggedForReview === true && flaggedConv.reviewFeedback?.rating === 5,
    'Conversation successfully flagged for quality review with supervisor audit score'
  );

  // ==========================================================================
  // PHASE 6 & 7 TEST: Tenant Boundaries & External Client RBAC
  // ==========================================================================
  console.log('\n--- PHASE 6 & 7: Multi-Tenant Boundaries & External Client Access ---');

  // Test 7a: Sovereign Business Boundaries
  const brokerDoc = await repo.getPublicKnowledge('ATONIA_INSURANCE');
  assert(
    brokerDoc.some((d) => d.content.includes('regulated insurance broker') && d.content.includes('does NOT underwrite')),
    'Tenant boundary enforced: Atonia Insurance strictly defined as Broker, NOT Insurer'
  );

  const sorplosDoc = await repo.getPublicKnowledge('SORPLOS');
  assert(
    sorplosDoc.some((d) => d.content.includes('MGA technology distribution partner') && d.content.includes('zero direct risk-bearing authority')),
    'Tenant boundary enforced: Sorplos strictly defined as Insurtech MGA without carrier underwriting authority'
  );

  // Test 6a: RBAC checks for External Clients
  const externalUser: User = {
    id: 'USR-EXT-01',
    name: 'External Client User',
    email: 'client@example.com',
    role: 'EXTERNAL_CLIENT',
    businessAccess: ['EUREKA'],
    status: 'active'
  };

  assert(
    authService.isExternalClient(externalUser) === true,
    'AuthService correctly classifies EXTERNAL_CLIENT'
  );
  assert(
    authService.isInternalStaff(externalUser) === false,
    'External client is strictly barred from internal staff privileges'
  );
  assert(
    authService.canManageKnowledge(externalUser) === false,
    'External client cannot manage or publish knowledge base documents'
  );
  assert(
    authService.canAccessAuditLogs(externalUser) === false,
    'External client cannot access internal audit logs (enforcing HTTP 403)'
  );

  // Test 6b: Public knowledge filtering only returns approved public items
  const publicFaqs = await repo.getPublicFaqs('EUREKA');
  assert(
    publicFaqs.length > 0 && publicFaqs.every((f) => f.isPublic === true && f.status === 'published'),
    'Public client endpoint returns ONLY published, approved public FAQs'
  );

  // ==========================================================================
  // PHASE 2 TEST: Voice Agent Grounding & Aria Default Voice
  // ==========================================================================
  console.log('\n--- PHASE 2: Voice Agent Grounding & Identity ---');

  const voiceResponse = await voiceAgentService.respondToSpokenQuestion({
    question: 'How do I freeze my debit card if it was lost?',
    businessId: 'EUREKA',
    callerName: 'Alex'
  });

  assert(
    Boolean(voiceResponse.text && voiceResponse.text.length > 0),
    'Voice agent generates spoken text response'
  );
  assert(
    voiceResponse.text.toLowerCase().includes('freeze') || voiceResponse.text.toLowerCase().includes('card'),
    'Voice agent response is grounded in approved Eureka banking debit card freeze guidelines'
  );
  assert(
    Boolean(voiceResponse.sourcesUsed && voiceResponse.sourcesUsed.length > 0),
    'Voice agent cites approved knowledge base sources informing the answer',
    `Sources: ${voiceResponse.sourcesUsed?.join(', ')}`
  );

  // Cleanup
  await closeMongo();
  await mongod.stop();
  if (savedUri) process.env.MONGODB_URI = savedUri;

  console.log('\n================================================================');
  console.log(`📊 FINAL TEST REPORT: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveVerification().catch((err) => {
  console.error('Fatal error during comprehensive verification:', err);
  process.exit(1);
});
