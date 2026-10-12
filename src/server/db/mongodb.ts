import { MongoClient } from 'mongodb';
import type { Db, Collection, Document } from 'mongodb';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let isConnectedStatus = false;

export async function connectMongo(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return null;
  }

  try {
    if (!client) {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 2000,
        connectTimeoutMS: 2000
      });
      await client.connect();
      dbInstance = client.db(process.env.MONGODB_DB_NAME || 'atonia_agent');
      isConnectedStatus = true;
      console.log('Successfully connected to MongoDB cluster');
    }
    return dbInstance;
  } catch (err) {
    console.warn('MongoDB connection unavailable. Operating in persistent in-memory repository mode.');
    isConnectedStatus = false;
    return null;
  }
}

export function isDbConnected(): boolean {
  return isConnectedStatus;
}

export function getDb(): Db | null {
  return dbInstance;
}

export function getCollection<T extends Document = Document>(name: string): Collection<T> | null {
  if (!dbInstance) return null;
  return dbInstance.collection<T>(name);
}
