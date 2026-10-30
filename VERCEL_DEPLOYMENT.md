# Vercel Production Deployment Guide — ATONIA AGENT

This document provides complete instructions for deploying the **ATONIA AGENT** multi-tenant autonomous AI customer-service operations platform to **Vercel**.

---

## 1. Architecture Overview on Vercel

The application is structured for unified deployment on Vercel:
- **Frontend SPA**: React 19 + TypeScript + Tailwind CSS, built by Vite into the static `dist/` directory.
- **Serverless Backend API**: Express.js REST API exported from `/api/index.ts`, handling all `/api/v1/*` requests.
- **Database Persistence**: MongoDB Atlas cluster with cached connection pooling across warm serverless function invocations.
- **AI & Voice Gateway**: Server-side Google Gemini Flash / Gemini TTS (`gemini-3.8-flash-lite-tts`) with browser Web Speech synthesis/recognition fallback.

---

## 2. Required Environment Variables

Configure the following environment variables in your Vercel Project Settings (**Project Settings** ➔ **Environment Variables**):

| Variable Name | Required? | Example / Value | Description |
|:---|:---:|:---|:---|
| `MONGODB_URI` | **Yes (Prod)** | `mongodb+srv://admin:PASS@cluster.atonia.mongodb.net/?retryWrites=true&w=majority` | Connection string to MongoDB Atlas. If omitted, app operates in development in-memory fallback mode. |
| `MONGODB_DB_NAME` | **Yes** | `atonia_agent` | The target database name for tenants, conversations, messages, knowledge, and audit records. |
| `SESSION_SECRET` | **Yes** | `8f2b7a9c3d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a` | Cryptographic secret for signing session state and cookies (min 32 characters). |
| `JWT_SECRET` | **Yes** | `9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b` | Cryptographic secret for signing HMAC JWT operator tokens (min 32 characters). |
| `GEMINI_API_KEY` | **Yes** | `AIzaSy...` | Server-side Gemini API key used by the AI Gateway and Voice Agent service. |
| `NODE_ENV` | **Yes** | `production` | Enforces production runtime guards and strict validation. |

### Optional Tenant Integration Variables

These enable live third-party connectivity for specific business tenants. If unset, the platform safely flags them as `not_configured` in governance telemetry without crashing:
- `AMAZON_SP_API_CLIENT_ID` & `AMAZON_SP_API_CLIENT_SECRET`: Amazon Seller Central integration.
- `SHIPSTATION_API_KEY`: Logistics order tracking.
- `ACTURIS_BMS_API_KEY`: Insurance broker management system.
- `DVLA_REGISTRY_API_KEY`: UK vehicle registration lookup.
- `OPENBANKING_CLIENT_ID` & `OPENBANKING_CLIENT_SECRET`: UK Open Banking API.
- `PLAID_CLIENT_ID`: US/UK account linking.

---

## 3. Serverless Database Connection Optimization

Because Vercel executes serverless functions on AWS Lambda / Google Cloud runtimes, database connections must be preserved across invocations to avoid exhausting MongoDB connection pools.

`src/server/db/mongodb.ts` implements connection caching:
```ts
// Cached client and db instance reused across warm invocations:
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
```
MongoDB client options are configured with serverless best practices:
- `maxPoolSize: 10`
- `minPoolSize: 1`
- `maxIdleTimeMS: 30000`
- `serverSelectionTimeoutMS: 5000`

---

## 4. Pre-Deployment Verification

Before triggering a production build or push to main, run the verification test suites:

```bash
# 1. Type check and lint validation
npm run lint

# 2. Build verification (compiles Vite SPA to dist/)
npm run build

# 3. Comprehensive platform test suite
npx tsx tests/full-platform-verification.ts
```

---

## 5. Deployment Steps via Vercel CLI

```bash
# 1. Install Vercel CLI (if not already installed)
npm install -g vercel

# 2. Link your repository
vercel link

# 3. Add production environment variables
vercel env add MONGODB_URI
vercel env add MONGODB_DB_NAME
vercel env add SESSION_SECRET
vercel env add JWT_SECRET
vercel env add GEMINI_API_KEY

# 4. Deploy to Production
vercel --prod
```

---

## 6. Post-Deployment Verification Probe

After deployment finishes, verify that MongoDB Atlas is connected and active:

1. Send a request to the live database probe:
   ```bash
   curl -s https://<your-vercel-domain>.vercel.app/api/v1/health/db-test
   ```
2. Expected response when `MONGODB_URI` is correctly configured:
   ```json
   {
     "success": true,
     "status": "CONNECTED",
     "persistenceMode": "MONGODB_ATLAS",
     "database": "atonia_agent",
     "probeDetails": {
       "writeSuccess": true,
       "readSuccess": true,
       "deleteSuccess": true,
       "probeLatencyMs": 42
     }
   }
   ```
3. If `MONGODB_URI` is missing or invalid, the probe explicitly returns:
   ```json
   {
     "success": false,
     "status": "MISSING_ENVIRONMENT_VARIABLE",
     "persistenceMode": "DEVELOPMENT_IN_MEMORY",
     "error": "MONGODB_URI is not set."
   }
   ```
   No false claims of persistence will ever be emitted.
