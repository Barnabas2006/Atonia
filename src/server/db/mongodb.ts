import { MongoClient } from 'mongodb';
import type { Db, Collection, Document } from 'mongodb';
import { getConfig } from '../config.ts';

export const COLLECTIONS = {
  USERS: 'users',
  CUSTOMERS: 'customers',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  ESCALATIONS: 'escalations',
  AUDIT_LOGS: 'audit_logs',
  TASKS: 'tasks',
  TOOL_EXECUTIONS: 'tool_executions',
  KNOWLEDGE_DOCS: 'knowledge_docs',
  VOICE_SESSIONS: 'voice_sessions'
} as const;

let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let isConnectedStatus = false;
let isConnecting = false;
let connectionPromise: Promise<Db | null> | null = null;

export async function connectMongo(customUri?: string, customDbName?: string): Promise<Db | null> {
  if (dbInstance && isConnectedStatus) {
    return dbInstance;
  }

  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  const config = getConfig();
  const uri = customUri || config.mongoUri;
  const dbName = customDbName || config.mongoDbName || 'atonia_agent';

  if (!uri) {
    isConnectedStatus = false;
    return null;
  }

  isConnecting = true;
  connectionPromise = (async () => {
    try {
      if (!client) {
        client = new MongoClient(uri, {
          maxPoolSize: 20,
          minPoolSize: 2,
          maxIdleTimeMS: 30000,
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
          socketTimeoutMS: 45000
        });

        client.on('close', () => {
          isConnectedStatus = false;
          console.warn('[MONGODB] Connection pool closed.');
        });

        client.on('error', (err) => {
          console.error('[MONGODB] Connection pool error event:', err);
        });

        await client.connect();
      }

      dbInstance = client.db(dbName);
      isConnectedStatus = true;
      console.log(`[MONGODB] Connected to MongoDB Atlas cluster (Database: ${dbName})`);

      // Initialize indexes idempotently
      await initDatabaseIndexes(dbInstance);

      return dbInstance;
    } catch (err) {
      isConnectedStatus = false;
      console.warn(
        `[MONGODB NOTICE] Could not establish connection to MongoDB at ${uri.replace(/:([^:@]+)@/, ':****@')}:`,
        err instanceof Error ? err.message : err
      );
      return null;
    } finally {
      isConnecting = false;
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

export async function initDatabaseIndexes(db: Db): Promise<void> {
  try {
    // 1. Users
    const usersCol = db.collection(COLLECTIONS.USERS);
    await usersCol.createIndex({ id: 1 }, { unique: true });
    await usersCol.createIndex({ email: 1 }, { unique: true });
    await usersCol.createIndex({ role: 1 });

    // 2. Customers
    const custCol = db.collection(COLLECTIONS.CUSTOMERS);
    await custCol.createIndex({ id: 1 }, { unique: true });
    await custCol.createIndex({ businessId: 1 });
    await custCol.createIndex({ businessId: 1, riskLevel: 1 });
    await custCol.createIndex({ name: 1 });

    // 3. Conversations
    const convCol = db.collection(COLLECTIONS.CONVERSATIONS);
    await convCol.createIndex({ id: 1 }, { unique: true });
    await convCol.createIndex({ businessId: 1 });
    await convCol.createIndex({ customerId: 1 });
    await convCol.createIndex({ status: 1 });
    await convCol.createIndex({ channel: 1 });
    await convCol.createIndex({ updatedAt: -1 });

    // 4. Messages
    const msgCol = db.collection(COLLECTIONS.MESSAGES);
    await msgCol.createIndex({ id: 1 }, { unique: true });
    await msgCol.createIndex({ conversationId: 1 });
    await msgCol.createIndex({ createdAt: 1 });

    // 5. Escalations
    const escCol = db.collection(COLLECTIONS.ESCALATIONS);
    await escCol.createIndex({ id: 1 }, { unique: true });
    await escCol.createIndex({ conversationId: 1 });
    await escCol.createIndex({ businessId: 1 });
    await escCol.createIndex({ status: 1 });
    await escCol.createIndex({ priority: 1 });
    await escCol.createIndex({ createdAt: -1 });

    // 6. Audit Logs
    const auditCol = db.collection(COLLECTIONS.AUDIT_LOGS);
    await auditCol.createIndex({ id: 1 }, { unique: true });
    await auditCol.createIndex({ timestamp: -1 });
    await auditCol.createIndex({ businessId: 1 });
    await auditCol.createIndex({ action: 1 });
    await auditCol.createIndex({ actor: 1 });

    // 7. Tasks
    const taskCol = db.collection(COLLECTIONS.TASKS);
    await taskCol.createIndex({ id: 1 }, { unique: true });
    await taskCol.createIndex({ businessId: 1 });
    await taskCol.createIndex({ status: 1 });

    // 8. Tool Executions
    const toolCol = db.collection(COLLECTIONS.TOOL_EXECUTIONS);
    await toolCol.createIndex({ id: 1 }, { unique: true });
    await toolCol.createIndex({ timestamp: -1 });
    await toolCol.createIndex({ businessId: 1 });

    // 9. Knowledge Docs
    const kbCol = db.collection(COLLECTIONS.KNOWLEDGE_DOCS);
    await kbCol.createIndex({ id: 1 }, { unique: true });
    await kbCol.createIndex({ businessId: 1 });

    // 10. Voice Sessions
    const voiceCol = db.collection(COLLECTIONS.VOICE_SESSIONS);
    await voiceCol.createIndex({ id: 1 }, { unique: true });
    await voiceCol.createIndex({ businessId: 1 });

    console.log('[MONGODB] All database collections and indexes initialized.');
  } catch (err) {
    console.error('[MONGODB] Error creating database indexes:', err);
    throw err;
  }
}

export function isDbConnected(): boolean {
  return isConnectedStatus && dbInstance !== null;
}

export function getDb(): Db | null {
  return dbInstance;
}

export function getMongoClient(): MongoClient | null {
  return client;
}

export function getCollection<T extends Document = Document>(name: string): Collection<T> | null {
  if (!dbInstance) return null;
  return dbInstance.collection<T>(name);
}

export function getPersistenceMode(): 'mongodb_atlas' | 'development_memory_fallback' {
  return isDbConnected() ? 'mongodb_atlas' : 'development_memory_fallback';
}

export interface MongoConnectionTestResult {
  success: boolean;
  errorCategory?:
    | 'MISSING_ENVIRONMENT_VARIABLE'
    | 'AUTHENTICATION_FAILED'
    | 'NETWORK_OR_IP_WHITELIST'
    | 'INVALID_URI_FORMAT'
    | 'DATABASE_PERMISSION_DENIED'
    | 'READ_WRITE_VERIFICATION_FAILED'
    | 'UNKNOWN_ERROR';
  errorMessage?: string;
  nextFix?: string;
  database: string;
  writeVerified?: boolean;
  readVerified?: boolean;
  deleteVerified?: boolean;
  latencyMs?: number;
  message?: string;
}

export function maskMongoUri(uri?: string): string {
  if (!uri) return '';
  return uri.replace(/:([^:@]+)@/, ':****@');
}

/**
 * Tests connection to MongoDB Atlas by:
 * 1. Reading MONGODB_URI & MONGODB_DB_NAME from server environment variables
 * 2. Connecting to MongoDB Atlas cluster
 * 3. Selecting the specified database (default: 'atonia_agent')
 * 4. Executing an end-to-end write, read, and delete operation on a probe collection
 * 5. Categorizing errors precisely if any failure occurs
 */
export async function testMongoConnection(
  customUri?: string,
  customDbName?: string
): Promise<MongoConnectionTestResult> {
  const uri = customUri || process.env.MONGODB_URI?.trim();
  const dbName = customDbName || process.env.MONGODB_DB_NAME?.trim() || 'atonia_agent';

  // 1. Check for presence of MONGODB_URI
  if (!uri) {
    return {
      success: false,
      errorCategory: 'MISSING_ENVIRONMENT_VARIABLE',
      errorMessage: 'MONGODB_URI is not set in server-side environment variables.',
      database: dbName,
      nextFix:
        'Set MONGODB_URI in your server environment (or .env file) to your MongoDB Atlas Cluster0 connection string: mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/atonia_agent?retryWrites=true&w=majority'
    };
  }

  // 2. Validate URI scheme
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    return {
      success: false,
      errorCategory: 'INVALID_URI_FORMAT',
      errorMessage: `MONGODB_URI format is invalid. URI must begin with "mongodb://" or "mongodb+srv://".`,
      database: dbName,
      nextFix:
        'Copy the connection string directly from MongoDB Atlas: Database -> Connect -> Drivers (Node.js) -> Format: mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/atonia_agent?retryWrites=true&w=majority'
    };
  }

  const startTime = Date.now();
  let probeClient: MongoClient | null = null;

  try {
    probeClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 15000
    });

    await probeClient.connect();
    const testDb = probeClient.db(dbName);

    // Perform temporary write, read, delete
    const probeCol = testDb.collection('_connection_probe');
    const probeId = `probe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const probeDoc = {
      _id: probeId as unknown as Document['_id'],
      probeTimestamp: new Date().toISOString(),
      purpose: 'ATONIA_AGENT_CONNECTION_VERIFICATION',
      database: dbName
    };

    // 1. Write Operation
    const writeResult = await probeCol.insertOne(probeDoc);
    const writeVerified = Boolean(writeResult.acknowledged && writeResult.insertedId);

    if (!writeVerified) {
      return {
        success: false,
        errorCategory: 'READ_WRITE_VERIFICATION_FAILED',
        errorMessage: 'Write probe operation failed to acknowledge insert into collection.',
        database: dbName,
        writeVerified: false,
        nextFix:
          'Check user database privileges in MongoDB Atlas. Ensure the user has "readWrite" role on the atonia_agent database.'
      };
    }

    // 2. Read Operation
    const readDoc = await probeCol.findOne({ _id: probeId as unknown as Document['_id'] });
    const readVerified = Boolean(readDoc && readDoc.purpose === 'ATONIA_AGENT_CONNECTION_VERIFICATION');

    if (!readVerified) {
      return {
        success: false,
        errorCategory: 'READ_WRITE_VERIFICATION_FAILED',
        errorMessage: 'Read probe operation failed: could not retrieve the inserted verification document.',
        database: dbName,
        writeVerified: true,
        readVerified: false,
        nextFix:
          'Ensure the database user has Read permission on atonia_agent and that readConcern settings permit immediate read.'
      };
    }

    // 3. Delete Operation
    const deleteResult = await probeCol.deleteOne({ _id: probeId as unknown as Document['_id'] });
    const deleteVerified = Boolean(deleteResult.acknowledged && deleteResult.deletedCount === 1);

    if (!deleteVerified) {
      return {
        success: false,
        errorCategory: 'READ_WRITE_VERIFICATION_FAILED',
        errorMessage: 'Delete probe operation failed to clean up the temporary document.',
        database: dbName,
        writeVerified: true,
        readVerified: true,
        deleteVerified: false,
        nextFix:
          'Ensure the database user has Delete / write privileges on the atonia_agent database.'
      };
    }

    const latencyMs = Date.now() - startTime;

    return {
      success: true,
      database: dbName,
      writeVerified: true,
      readVerified: true,
      deleteVerified: true,
      latencyMs,
      message: `Successfully connected to MongoDB Atlas Cluster0 and verified temporary write, read, and delete on "${dbName}" database.`
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorLower = errorMsg.toLowerCase();

    let category: MongoConnectionTestResult['errorCategory'] = 'UNKNOWN_ERROR';
    let fix = 'Inspect the error details and verify your MongoDB Atlas cluster state.';

    if (
      errorLower.includes('bad auth') ||
      errorLower.includes('authentication failed') ||
      errorLower.includes('auth failed') ||
      errorLower.includes('code 18')
    ) {
      category = 'AUTHENTICATION_FAILED';
      fix =
        'Verify your MongoDB Atlas database username and password in MONGODB_URI. If your password contains special characters (e.g., @, #, :, /, ?), URL-encode them (e.g., @ -> %40). In Atlas, confirm the user exists under "Database Access".';
    } else if (
      errorLower.includes('enotfound') ||
      errorLower.includes('querysrv') ||
      errorLower.includes('etimedout') ||
      errorLower.includes('timed out') ||
      errorLower.includes('server selection') ||
      errorLower.includes('econnrefused') ||
      errorLower.includes('could not connect to any servers')
    ) {
      category = 'NETWORK_OR_IP_WHITELIST';
      fix =
        'In MongoDB Atlas, navigate to "Network Access" -> click "Add IP Address" -> choose "Allow Access from Anywhere" (0.0.0.0/0). Atlas blocks incoming connections by default until the IP is added to the Access List.';
    } else if (errorLower.includes('not authorized') || errorLower.includes('unauthorized')) {
      category = 'DATABASE_PERMISSION_DENIED';
      fix =
        'In MongoDB Atlas, go to "Database Access" -> edit your user -> grant the built-in role "Read and write to any database" or custom role "readWrite@atonia_agent".';
    }

    return {
      success: false,
      errorCategory: category,
      errorMessage: maskMongoUri(errorMsg),
      database: dbName,
      writeVerified: false,
      readVerified: false,
      deleteVerified: false,
      nextFix: fix
    };
  } finally {
    if (probeClient) {
      try {
        await probeClient.close();
      } catch {
        // Ignored
      }
    }
  }
}

export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    dbInstance = null;
    isConnectedStatus = false;
    console.log('[MONGODB] MongoDB client connection closed.');
  }
}

