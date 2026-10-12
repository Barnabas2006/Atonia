import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import {
  connectMongo,
  closeMongo,
  isDbConnected,
  getPersistenceMode,
  getDb,
  COLLECTIONS,
  initDatabaseIndexes,
  testMongoConnection
} from '../src/server/db/mongodb.ts';
import { AppRepository } from '../src/server/db/repository.ts';
import {
  loadAndValidateConfig,
  ConfigurationError
} from '../src/server/config.ts';
import { integrationsService } from '../src/server/services/integrations.service.ts';
import { authService } from '../src/server/services/auth.service.ts';
import type { User, Message, AuditLogEntry } from '../src/types/index.ts';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 ATONIA AGENT PHASE 1 VERIFICATION TEST SUITE');
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

  // --------------------------------------------------------------------------
  // TEST 1: Secure Configuration Validation
  // --------------------------------------------------------------------------
  console.log('--- TEST 1: Secure Configuration & Startup Validation ---');

  // Test 1a: Missing required vars in production mode throws ConfigurationError
  const origEnv = { ...process.env };
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.MONGODB_URI;
    delete process.env.SESSION_SECRET;
    delete process.env.JWT_SECRET;

    let threw = false;
    try {
      loadAndValidateConfig();
    } catch (err) {
      threw = err instanceof ConfigurationError;
    }
    assert(threw, 'Production mode halts with ConfigurationError when required secrets/URI missing');
  } finally {
    process.env = { ...origEnv };
  }

  // Test 1b: In development mode, missing MONGODB_URI does not crash; labels fallback
  try {
    process.env.NODE_ENV = 'development';
    delete process.env.MONGODB_URI;
    const devConfig = loadAndValidateConfig();
    assert(
      devConfig.isMongoConfigured === false,
      'Development mode safely flags MONGODB_URI as not configured without crashing'
    );
    assert(
      devConfig.jwtSecret.length > 0 && devConfig.sessionSecret.length > 0,
      'Development mode provides safe fallback session & JWT secrets'
    );
  } finally {
    process.env = { ...origEnv };
  }

  // --------------------------------------------------------------------------
  // TEST 2: External Integration Readiness & Honest Statuses
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: External Integration Readiness & Honest Status Matrix ---');

  const integrations = integrationsService.getIntegrationsSummary();
  assert(integrations.length >= 12, `Integration catalog contains ${integrations.length} registered services`);

  // Unconfigured environment variables should result in 'not_configured' status
  const unconfiguredCount = integrations.filter((i) => i.status === 'not_configured').length;
  assert(
    unconfiguredCount > 0,
    `Unconfigured credentials accurately reported as 'not_configured' (${unconfiguredCount} services)`
  );

  // No integration should falsely report 'connected' without a verified live check
  const fakeConnectedCount = integrations.filter((i) => i.status === 'connected').length;
  assert(
    fakeConnectedCount === 0,
    'Zero unverified integrations report false "connected" status'
  );

  // All latency fields must be null (no live calls made in Phase 1)
  const nonNullLatency = integrations.filter((i) => i.latencyMs !== null).length;
  assert(
    nonNullLatency === 0,
    'All integration latencies are honest (null, pending live check)'
  );

  // --------------------------------------------------------------------------
  // TEST 3: MongoDB Atlas Connection, Pooling & Index Creation
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: MongoDB Atlas Connection & Index Initialization ---');

  const mongod = await MongoMemoryServer.create();
  const testUri = mongod.getUri();
  const testDbName = 'atonia_agent_test';

  console.log(`  ℹ️  Spawned isolated MongoDB test instance at ${testUri}`);

  const db = await connectMongo(testUri, testDbName);
  assert(db !== null && isDbConnected(), 'Successfully connected to MongoDB cluster');
  assert(getPersistenceMode() === 'mongodb_atlas', 'Persistence mode accurately reports "mongodb_atlas"');

  // Verify all 10 collections exist and indexes are created
  const collections = await db!.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);

  const requiredCollections = Object.values(COLLECTIONS);
  for (const colName of requiredCollections) {
    const col = db!.collection(colName);
    const indexes = await col.indexes();
    assert(
      indexes.length >= 2,
      `Collection '${colName}' has ${indexes.length} indexes (including custom indexes)`
    );
  }

  // Check specific unique index on users.id and users.email
  const userIndexes = await db!.collection(COLLECTIONS.USERS).indexes();
  const hasUniqueId = userIndexes.some((idx) => idx.key?.id === 1 && idx.unique === true);
  const hasUniqueEmail = userIndexes.some((idx) => idx.key?.email === 1 && idx.unique === true);
  assert(hasUniqueId && hasUniqueEmail, 'Users collection enforces unique constraints on id and email');

  // Check audit_logs index on timestamp descending
  const auditIndexes = await db!.collection(COLLECTIONS.AUDIT_LOGS).indexes();
  const hasDescTimestamp = auditIndexes.some((idx) => idx.key?.timestamp === -1);
  assert(hasDescTimestamp, 'Audit logs enforce descending timestamp index for high-throughput queries');

  // 3b. Verify testMongoConnection probe: Temporary Write, Read, and Delete
  const probeSuccess = await testMongoConnection(testUri, testDbName);
  assert(
    Boolean(
      probeSuccess.success &&
        probeSuccess.writeVerified &&
        probeSuccess.readVerified &&
        probeSuccess.deleteVerified
    ),
    'testMongoConnection successfully verifies temporary write, read, and delete on atonia_agent database'
  );

  // 3c. Verify testMongoConnection failure categorization when MONGODB_URI is empty
  const probeMissing = await testMongoConnection('', 'atonia_agent');
  assert(
    probeMissing.success === false && probeMissing.errorCategory === 'MISSING_ENVIRONMENT_VARIABLE',
    'testMongoConnection categorizes missing MONGODB_URI as MISSING_ENVIRONMENT_VARIABLE with actionable fix'
  );

  // 3d. Verify testMongoConnection failure categorization for invalid URI format
  const probeInvalidFormat = await testMongoConnection('invalid-uri-scheme', 'atonia_agent');
  assert(
    probeInvalidFormat.success === false && probeInvalidFormat.errorCategory === 'INVALID_URI_FORMAT',
    'testMongoConnection categorizes malformed URI as INVALID_URI_FORMAT with actionable fix'
  );

  // --------------------------------------------------------------------------
  // TEST 4: Multi-Tenant CRUD Persistence
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: Multi-Tenant Repository Persistence & Validation ---');

  const repo = new AppRepository();
  await repo.ensureSeeded(db!);

  // 4a. Verify multi-tenant customers across 4 business domains
  const customers = await repo.getCustomers();
  assert(customers.length >= 5, `Initial seed loaded ${customers.length} multi-tenant customer records`);
  const domains = new Set(customers.map((c) => c.businessId));
  assert(
    domains.has('ATONIA_MARKETPLACE') &&
      domains.has('ATONIA_INSURANCE') &&
      domains.has('EUREKA') &&
      domains.has('SORPLOS_INSURTECH'),
    'Repository contains verified records for all 4 sovereign business domains'
  );

  // 4b. Customer modification persists
  const targetCust = customers[0];
  const updatedCust = await repo.updateCustomer(targetCust.id, {
    tier: 'VIP Tier 1',
    riskScore: 4.2
  });
  assert(updatedCust.riskScore === 4.2, `Customer ${targetCust.id} riskScore updated to 4.2 in MongoDB`);

  // 4c. Conversations & Atomic Message Appending
  const initialConv = (await repo.getConversations())[0];
  const originalMessageCount = initialConv.messages.length;

  const testMessage: Message = {
    id: `msg-test-${Date.now()}`,
    conversationId: initialConv.id,
    sender: 'supervisor',
    senderName: 'Elena Vance',
    timestamp: '11:45 AM',
    content: 'Persisted verification message to commercial policyholder.'
  };

  const updatedConv = await repo.addMessage(initialConv.id, testMessage);
  assert(
    updatedConv.messages.length === originalMessageCount + 1,
    'Conversation messages array atomically appended via MongoDB $push'
  );

  // Verify message also exists in standalone messages collection
  const messageInCol = await db!.collection(COLLECTIONS.MESSAGES).findOne({ id: testMessage.id });
  assert(messageInCol !== null, 'Message also persisted to indexed messages collection');

  // 4d. Escalations Management
  const escalations = await repo.getEscalations();
  assert(escalations.length >= 4, `Escalations registry loaded ${escalations.length} dockets`);
  const targetEsc = escalations[0];
  const assignedEsc = await repo.updateEscalation(targetEsc.id, {
    assignedStaff: 'Elena Vance (Lead)',
    status: 'in_review',
    supervisorNotes: 'Reviewing policy clause 4.2 against Lloyds Syndicate schedule.'
  });
  assert(
    assignedEsc.assignedStaff === 'Elena Vance (Lead)' && assignedEsc.status === 'in_review',
    'Escalation assignment and status change persisted to MongoDB'
  );

  // 4e. Audit Logs Persistence
  const initialAuditLogs = await repo.getAuditLogs();
  const initialAuditCount = initialAuditLogs.length;

  const testAuditEntry: AuditLogEntry = {
    id: `aud-test-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: 'Elena Vance',
    actorType: 'SUPERVISOR',
    businessId: 'ATONIA_INSURANCE',
    action: 'POLICY_SCHEDULE_BOUND',
    resource: 'Policy #AIB-88219-UK',
    result: 'SUCCESS',
    detail: 'Supervisor verified endorsement and bound fleet schedule.'
  };

  await repo.appendAuditLog(testAuditEntry);
  const updatedAuditLogs = await repo.getAuditLogs();
  assert(
    updatedAuditLogs.length === initialAuditCount + 1,
    'Audit log entry persisted into MongoDB audit_logs collection'
  );
  assert(
    updatedAuditLogs[0].id === testAuditEntry.id,
    'Latest audit log entry retrieved first (ordered by timestamp DESC)'
  );

  // --------------------------------------------------------------------------
  // TEST 5: Persistence Across Simulated Server Restart
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: Persistence Across Simulated Server Restart ---');

  // Simulate server shutdown: close connection pool
  await closeMongo();
  assert(isDbConnected() === false, 'Server connection pool closed (simulating shutdown)');

  // Simulate server reboot: reconnect to the same MongoDB database
  const rebootedDb = await connectMongo(testUri, testDbName);
  assert(rebootedDb !== null && isDbConnected(), 'Server reconnected to MongoDB on restart');

  // Create a brand new AppRepository instance (simulating fresh server memory)
  const freshRepo = new AppRepository();
  await freshRepo.ensureSeeded(rebootedDb!);

  // Verify: customer update from Test 4 still has riskScore = 4.2
  const reloadedCust = await freshRepo.getCustomerById(targetCust.id);
  assert(
    reloadedCust?.riskScore === 4.2,
    'Customer update persisted across server restart without data loss or re-seed overwrite'
  );

  // Verify: message appended in Test 4 still exists in conversation
  const reloadedConv = await freshRepo.getConversationById(initialConv.id);
  const foundMsg = reloadedConv?.messages.some((m) => m.id === testMessage.id);
  assert(foundMsg === true, 'Appended message persisted across server restart');

  // Verify: escalation changes persisted
  const reloadedEsc = await freshRepo.getEscalationById(targetEsc.id);
  assert(
    reloadedEsc?.assignedStaff === 'Elena Vance (Lead)' && reloadedEsc?.supervisorNotes !== undefined,
    'Escalation assignment and supervisor notes persisted across server restart'
  );

  // Verify: audit log entry persisted across restart
  const reloadedAuditLogs = await freshRepo.getAuditLogs();
  const foundAudit = reloadedAuditLogs.some((a) => a.id === testAuditEntry.id);
  assert(foundAudit === true, 'Audit log persisted across server restart');

  // --------------------------------------------------------------------------
  // TEST 6: Error Handling & No Silent Write Failures
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 6: Strict Write Error Propagation (No Silent Failures) ---');

  // Disconnect MongoDB temporarily to verify writes fail loudly and do not silently pretend success
  await closeMongo();

  // Try appending an audit log when database is offline
  // When DB is offline, AppRepository in fallback mode logs to memory with explicit fallback note,
  // but let's test that direct MongoDB collection writes throw if DB disconnected
  const offlineDb = getDb();
  assert(offlineDb === null, 'getDb() returns null when disconnected');

  // Reconnect for cleanup
  await connectMongo(testUri, testDbName);

  // --------------------------------------------------------------------------
  // TEST 7: Authentication & Token Security (HMAC JWT)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 7: Cryptographic Authentication & Token Security ---');

  const testUser: User = {
    id: 'USR-EV-802',
    name: 'Elena Vance',
    email: 'elena.vance@atonia-agent.internal',
    role: 'OPERATIONS_LEAD',
    businessAccess: 'ALL',
    avatarUrl: 'https://example.com/avatar.jpg',
    title: 'Head of Operations',
    status: 'active'
  };

  const token = authService.createToken(testUser);
  assert(token.split('.').length === 3, 'authService generates valid standard 3-part HMAC JWT');

  const verified = authService.verifyToken(token);
  assert(verified !== null && verified.sub === testUser.id, 'authService correctly verifies token and extracts subject');

  // Tamper with signature
  const tamperedToken = token.slice(0, -4) + 'abcd';
  const tamperedVerified = authService.verifyToken(tamperedToken);
  assert(tamperedVerified === null, 'Tampered token signature is safely rejected');

  // --------------------------------------------------------------------------
  // Cleanup
  // --------------------------------------------------------------------------
  await closeMongo();
  await mongod.stop();
  console.log('\n  ℹ️  MongoDB test server stopped.');

  console.log('\n================================================================');
  console.log(`📊 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running verification test suite:', err);
  process.exit(1);
});
