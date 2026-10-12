import type { Db, Document } from 'mongodb';
import type {
  User,
  Conversation,
  Message,
  CustomerContext,
  EscalationRecord,
  ToolExecutionEvent,
  AuditLogEntry,
  KnowledgeDocument,
  TaskRecord,
  VoiceCallSession,
  BusinessId
} from '../../types/index.ts';
import { getDb, isDbConnected, COLLECTIONS, getPersistenceMode } from './mongodb.ts';

// Initial Seed Data for the 4 sovereign business domains
export const INITIAL_USERS: User[] = [
  {
    id: 'USR-EV-802',
    name: 'Elena Vance',
    email: 'elena.vance@atonia-agent.internal',
    role: 'OPERATIONS_LEAD',
    businessAccess: 'ALL',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD-GQz6_qFo1mpN8KN0O92az5t45MIBvghtd1Z90CWz_QBoVqrMKK76l-fJees5jYn97Ldt3PvuHxR_3wnpGFGrOQsnvGE0lpKFd3bTjf074ZCUUTht6U2qQ9Y196U7tdrKTkoQQVlfT-Y3dwJ2zBYfosCpJGylg1dfDFMJPNRqMPEVyivveSeWlyvz9t2g-Gr4IfstAMTkhnVX-04qW-h7KpTSBUNG-OqfJhXjFEdqdcprHu7Ob_7uVQ',
    title: 'Head of Operations',
    status: 'active',
    assignedQueueCount: 3
  },
  {
    id: 'USR-MH-401',
    name: 'Mark Hughes',
    email: 'mark.hughes@atonia-agent.internal',
    role: 'FRAUD_SPECIALIST',
    businessAccess: ['EUREKA'],
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC-0PLe38AoWATwS6PDtNQb19jxg3u8nROWtNfNrAygB1OcS3rWR38EgQi2GWhwzCpOEZURkGg50mbyq8wneC5tq2xJqheUUcrTSzhvy7ZBAwQfH7EXuEaQ5i5iVaTYF6yyQeMRwHUwuDf01Jv7b1O01Ebb8c_C1lESWBuKrVHV0gf-HZcTQNBkE9_Fk1JrMzYqrLC_zSc3_xCygjE3nh3yuZ6_V5CaU2NwjLLqkpwQRFM00lkA0Z9MVg',
    title: 'Lead Fraud Investigator',
    status: 'active',
    assignedQueueCount: 2
  },
  {
    id: 'USR-SJ-505',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@atonia-agent.internal',
    role: 'UNDERWRITER_SPECIALIST',
    businessAccess: ['ATONIA_INSURANCE', 'SORPLOS_INSURTECH'],
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDD9ouu7hMZ1S1sKAwIH9IRt7_jtZ11hK0Zwnmtoegb_dfTBOtyX_4M5-JzEfdyDpEDwWZk20f-feUgebBq181sGL4S2CfBqjeM5vbTpdFeWQgF-tbxQD1Yj0X4eWoNYxlaaZcY9KVdEAE9YiAhnXGJ2mbCI1KA8I2zULoemcoExbs2VxgQCPRCXWF5b4BOeIfea6ZQyDXAE0kcvI45FD8G38LWqKlKIWdWEannr4FZRHRJtFHvUdvbEg',
    title: 'Senior Underwriting Broker',
    status: 'active',
    assignedQueueCount: 4
  }
];

export const INITIAL_CUSTOMERS: CustomerContext[] = [
  {
    id: 'CUST-88192',
    name: 'David Sterling',
    phone: '+44 7911 123456',
    email: 'd.sterling@sterlinglogistics.co.uk',
    businessId: 'ATONIA_INSURANCE',
    tier: 'VIP Tier 1',
    riskScore: 9.4,
    riskLevel: 'Minimal',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB3Aoh6lrXPrrTXEs1L87KF75oHCjh-KhkhFpSw-SnSz_7ytpGZRx4uzuKND2zheESNEaofjInEGBnbe7ESeUCk0zF9VS9uH7LtmnnR_Z72HyTtK0yqSSR6AS6Xp4Z_s5rMNu4hv7pMcJ8d5fu1mg_h82aDO4HYmA2Qnuo5-mxS6H4shZMb2mKBccnTJae0b5EmWEBg4ecw_0iEzRVmW9U_8C--4KRSYmAuLHN4RabjLggbz2e69AF2Tg',
    brokerageDetails: {
      policyNumber: '#AIB-88219-UK',
      coverageClass: 'Comprehensive Any Driver > 21',
      underwriter: 'Atonia Lloyds Syndicate 402',
      annualPremium: 28640,
      pendingEndorsementAmount: 1420,
      fleetCount: 14,
      fleetUnits: [
        { vrn: 'MV73 XKL', model: '2023 Mercedes Sprinter 315', status: 'Ready', annualMileage: 35000 },
        { vrn: 'MV73 XKM', model: '2023 Mercedes Sprinter 315', status: 'Ready', annualMileage: 35000 },
        { vrn: 'MV73 XKN', model: '2023 Mercedes Sprinter 315', status: 'Ready', annualMileage: 35000 }
      ],
      claimsCount: 1,
      ncdYears: 5
    }
  },
  {
    id: 'CUST-88319',
    name: 'Sophia Chen',
    accountNumber: 'ACC-88319-EU',
    businessId: 'EUREKA',
    tier: 'Prime',
    riskScore: 94,
    riskLevel: 'Critical',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC5CIqK4AxFPUqEjYyHyZ-IrSJkZ5VUSz1CIXH5R0uxkXngkvJz1y8yb25CVxTNpoFL8sy3YYZs3ibkbcL7yP7b8TzKo9xEGTAX3uSqEgURGRMoaCubD_F5WWcNJyOXjte55Nezgt2Pto1BiikWeLkiq2XOj-SIR_fU_k6W9j2WdJtYZruMvoTBWAPyKMgFpc33VoCFil7RDn_KEHog-KLCyhlRoh5-ZY8P2ZPm8W2KOmalTxpv2zlA9A',
    bankingDetails: {
      iban: 'GB82EUKB88319200481234',
      checkingBalance: 124500,
      accountStatus: 'flagged',
      lastMfaVerification: '2026-10-02T12:10:00Z',
      connectedBanks: ['HSBC UK', 'Revolut Business']
    }
  },
  {
    id: 'CUST-44102',
    name: 'Marcus Vance',
    accountNumber: 'POL-882419-GB',
    businessId: 'ATONIA_INSURANCE',
    tier: 'Standard',
    riskScore: 82,
    riskLevel: 'High',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBV7CxlJGRJCvU5pwv89qPxwg9UMgZOLE9-YLwZqSWjJMjfsiIQ2HBAUAcqbPDp0PaY8cs_pQtZCMnl-1TMRDUhhmkMmvXiq3X8XaUdBUIaLNHDmihbApW8SrKCopiXh46BCexRiic2kbjmicX8mRUshilIaiDrBqQTZguTOWhmaO-0P52lGRI7Mz3zBSvm5f9uh8AU2w4pihLs7OD7Wzpa1sjnYKIdAW36gbHm2mIfrTQ823PabW0r7g',
    brokerageDetails: {
      policyNumber: 'POL-882419-GB',
      coverageClass: 'Commercial Property & Flood Endorsement',
      underwriter: 'Atonia Lloyds Syndicate 402',
      annualPremium: 14200,
      claimsCount: 2,
      ncdYears: 2
    }
  },
  {
    id: 'CUST-79112',
    name: 'Kavita Sharma',
    phone: '+44 7911 204918',
    businessId: 'SORPLOS_INSURTECH',
    tier: 'Prime',
    riskScore: 22,
    riskLevel: 'Minimal',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC-0PLe38AoWATwS6PDtNQb19jxg3u8nROWtNfNrAygB1OcS3rWR38EgQi2GWhwzCpOEZURkGg50mbyq8wneC5tq2xJqheUUcrTSzhvy7ZBAwQfH7EXuEaQ5i5iVaTYF6yyQeMRwHUwuDf01Jv7b1O01Ebb8c_C1lESWBuKrVHV0gf-HZcTQNBkE9_Fk1JrMzYqrLC_zSc3_xCygjE3nh3yuZ6_V5CaU2NwjLLqkpwQRFM00lkA0Z9MVg',
    insurtechDetails: {
      kycStatus: 'verified',
      activeQuotes: 3,
      activePolicies: ['SORP-FL-99120'],
      telematicsScore: 94.2
    }
  },
  {
    id: 'CUST-99410',
    name: 'TechLogix Logistics',
    accountNumber: 'PO-99410-NA',
    businessId: 'ATONIA_MARKETPLACE',
    tier: 'VIP Tier 1',
    riskScore: 45,
    riskLevel: 'Moderate',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBjNFyHUgdQuPKqLteFBbTu6sDOWT2omi75Fgpr7mj7DmGq8IDFh24Cbhp2clVtPiCl8AnhWKtzGRI64m1lSFR-HBIrzxlY9kh3afdEiU6IVmy5v9Itwv166-FwX18U-ese1CEl6jINgVWDMKxWgsHagTkDIUEwOgHVnZyr4nz5rRbIDVdbVuptKUMS23HoQ5F_2oVWG3H1dfwCxNgXMhWwuCL1ZzoY-58Y7OMRsQzVeqrFXMpUc_9MWw',
    marketplaceDetails: {
      recentOrders: [
        {
          orderId: 'ORD-55018-COMM',
          date: '2026-09-28',
          amount: 34000,
          status: 'Delivered - Damaged Dispute',
          sku: 'SKU-99214',
          hasRma: true
        }
      ],
      totalSpend: 248000,
      returnRate: 0.04
    }
  }
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-david-sterling',
    businessId: 'ATONIA_INSURANCE',
    customerId: 'CUST-88192',
    customerName: 'David Sterling',
    customerIdentifier: '+44 7911 123456',
    customerAvatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB3Aoh6lrXPrrTXEs1L87KF75oHCjh-KhkhFpSw-SnSz_7ytpGZRx4uzuKND2zheESNEaofjInEGBnbe7ESeUCk0zF9VS9uH7LtmnnR_Z72HyTtK0yqSSR6AS6Xp4Z_s5rMNu4hv7pMcJ8d5fu1mg_h82aDO4HYmA2Qnuo5-mxS6H4shZMb2mKBccnTJae0b5EmWEBg4ecw_0iEzRVmW9U_8C--4KRSYmAuLHN4RabjLggbz2e69AF2Tg',
    channel: 'whatsapp',
    intent: 'Motor Fleet Endorsement (#AIB-88219-UK)',
    intentDetails: 'Commercial Fleet Policy Modification',
    status: 'human_monitoring',
    priority: 'normal',
    lastActivity: '1m ago',
    assignedAgent: 'Elena Vance',
    isEscalated: false,
    activeSuggestion: 'Your revised Certificate of Motor Insurance has been issued. Vehicles are covered from midnight tonight.',
    messages: [
      {
        id: 'msg-1',
        conversationId: 'conv-david-sterling',
        sender: 'system',
        senderName: 'System Gate',
        timestamp: '10:14 AM',
        content: 'Customer session initiated via WhatsApp Business • AI intent: Commercial Fleet Policy Modification (98.4%)'
      },
      {
        id: 'msg-2',
        conversationId: 'conv-david-sterling',
        sender: 'customer',
        senderName: 'David Sterling',
        timestamp: '10:14 AM',
        content:
          'Hello, we just acquired 3 new Mercedes Sprinter vans for our delivery operations in Manchester. We need them added to our existing commercial fleet policy #AIB-88219-UK immediately before they deploy tomorrow morning.'
      },
      {
        id: 'msg-3',
        conversationId: 'conv-david-sterling',
        sender: 'agent',
        senderName: 'Autonomous Agent',
        timestamp: '10:14 AM',
        content:
          'Good morning David. I can certainly help add those three new Mercedes Sprinter vans to your active commercial fleet policy (#AIB-88219-UK). To ensure immediate coverage and update the policy schedule, I will need the vehicle registration marks (VRNs), estimated annual mileage for each, and primary driver details.',
        aiMetadata: {
          model: 'atonia-claude-3-5',
          latencyMs: 312,
          tokens: 48,
          confidence: 0.984
        }
      },
      {
        id: 'msg-4',
        conversationId: 'conv-david-sterling',
        sender: 'customer',
        senderName: 'David Sterling',
        timestamp: '10:15 AM',
        content:
          'Sure. The registrations are:\n1) MV73 XKL\n2) MV73 XKM\n3) MV73 XKN\nEach will run approx 35,000 miles/year. Primary drivers are registered under our existing fleet pool drivers license list.'
      },
      {
        id: 'msg-5',
        conversationId: 'conv-david-sterling',
        sender: 'agent',
        senderName: 'DVLA Registry & Underwriting Core',
        timestamp: '10:15 AM',
        content: 'Tool executed: fx:execute_endorsement_calc. Vehicles verified with DVLA. Pro-rated quote calculated: +£1,420.00.',
        parts: [
          {
            toolResult: {
              name: 'fx:execute_endorsement_calc',
              verified: true,
              sourceApi: 'DVLA Registry Hub (28ms) + Underwriting Core v4',
              result: {
                vrns: ['MV73 XKL', 'MV73 XKM', 'MV73 XKN'],
                additionalPremium: 1420.0,
                currency: 'GBP',
                status: 'VERIFIED'
              }
            }
          }
        ]
      },
      {
        id: 'msg-6',
        conversationId: 'conv-david-sterling',
        sender: 'supervisor',
        senderName: 'Elena Vance',
        timestamp: '10:17 AM',
        content:
          'Hi David, I have reviewed the pro-rated addition for the 3 Sprinters and approved the fleet endorsement with zero deductible waiver applied per your corporate tier.'
      }
    ]
  },
  {
    id: 'conv-sophia-chen',
    businessId: 'EUREKA',
    customerId: 'CUST-88319',
    customerName: 'Sophia Chen',
    customerIdentifier: 'ACC-88319-EU',
    customerAvatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC5CIqK4AxFPUqEjYyHyZ-IrSJkZ5VUSz1CIXH5R0uxkXngkvJz1y8yb25CVxTNpoFL8sy3YYZs3ibkbcL7yP7b8TzKo9xEGTAX3uSqEgURGRMoaCubD_F5WWcNJyOXjte55Nezgt2Pto1BiikWeLkiq2XOj-SIR_fU_k6W9j2WdJtYZruMvoTBWAPyKMgFpc33VoCFil7RDn_KEHog-KLCyhlRoh5-ZY8P2ZPm8W2KOmalTxpv2zlA9A',
    channel: 'web',
    intent: 'Chargeback Inquiry',
    intentDetails: 'Amount: $14,250.00 wire dispute',
    status: 'escalated_to_human',
    priority: 'critical',
    lastActivity: '24s ago',
    assignedAgent: 'Unassigned',
    isEscalated: true,
    messages: [
      {
        id: 'sc-1',
        conversationId: 'conv-sophia-chen',
        sender: 'customer',
        senderName: 'Sophia Chen',
        timestamp: '12:02 PM',
        content: 'There is a suspicious pending wire of $14,250 on our corporate checking account that we did not initiate!'
      },
      {
        id: 'sc-2',
        conversationId: 'conv-sophia-chen',
        sender: 'system',
        senderName: 'Fraud Sentinel AI',
        timestamp: '12:02 PM',
        content: 'Device mismatch detected (IP: Sofia, BG vs Registered: London, UK). Wire intercepted and account placed on hold.'
      }
    ]
  },
  {
    id: 'conv-kavita-sharma',
    businessId: 'SORPLOS_INSURTECH',
    customerId: 'CUST-79112',
    customerName: 'Kavita Sharma',
    customerIdentifier: '+44 7911 204918',
    customerAvatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC-0PLe38AoWATwS6PDtNQb19jxg3u8nROWtNfNrAygB1OcS3rWR38EgQi2GWhwzCpOEZURkGg50mbyq8wneC5tq2xJqheUUcrTSzhvy7ZBAwQfH7EXuEaQ5i5iVaTYF6yyQeMRwHUwuDf01Jv7b1O01Ebb8c_C1lESWBuKrVHV0gf-HZcTQNBkE9_Fk1JrMzYqrLC_zSc3_xCygjE3nh3yuZ6_V5CaU2NwjLLqkpwQRFM00lkA0Z9MVg',
    channel: 'whatsapp',
    intent: 'Commercial Fleet Quote',
    intentDetails: '18 Heavy Vehicles',
    status: 'autonomous_answering',
    priority: 'normal',
    lastActivity: '12s ago',
    assignedAgent: 'AI Autonomous Engine',
    isEscalated: false,
    messages: [
      {
        id: 'ks-1',
        conversationId: 'conv-kavita-sharma',
        sender: 'customer',
        senderName: 'Kavita Sharma',
        timestamp: '12:08 PM',
        content: 'We need comparative rates for 18 commercial HGVs operating in East Midlands.'
      },
      {
        id: 'ks-2',
        conversationId: 'conv-kavita-sharma',
        sender: 'agent',
        senderName: 'Sorplos Aggregator AI',
        timestamp: '12:09 PM',
        content:
          'I can aggregate binding quotes from 14 approved syndicates right away. Are all drivers hold Category C+E licenses with zero points in the last 3 years?'
      }
    ]
  },
  {
    id: 'conv-techlogix',
    businessId: 'ATONIA_MARKETPLACE',
    customerId: 'CUST-99410',
    customerName: 'TechLogix Global',
    customerIdentifier: 'PO-99410-NA',
    customerAvatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBjNFyHUgdQuPKqLteFBbTu6sDOWT2omi75Fgpr7mj7DmGq8IDFh24Cbhp2clVtPiCl8AnhWKtzGRI64m1lSFR-HBIrzxlY9kh3afdEiU6IVmy5v9Itwv166-FwX18U-ese1CEl6jINgVWDMKxWgsHagTkDIUEwOgHVnZyr4nz5rRbIDVdbVuptKUMS23HoQ5F_2oVWG3H1dfwCxNgXMhWwuCL1ZzoY-58Y7OMRsQzVeqrFXMpUc_9MWw',
    channel: 'voice',
    intent: 'Damaged Shipment Repl.',
    intentDetails: 'SKU-99214 • Pallet 4',
    status: 'executing_tools',
    priority: 'high',
    lastActivity: '45s ago',
    assignedAgent: 'AI Autonomous Engine',
    isEscalated: false,
    messages: [
      {
        id: 'tl-1',
        conversationId: 'conv-techlogix',
        sender: 'customer',
        senderName: 'TechLogix Global',
        timestamp: '12:12 PM',
        content: 'Pallet 4 arrived with broken seal and punctured outer casing. We cannot accept this lot.'
      },
      {
        id: 'tl-2',
        conversationId: 'conv-techlogix',
        sender: 'agent',
        senderName: 'Atonia Marketplace AI',
        timestamp: '12:13 PM',
        content:
          'I am retrieving the bill of lading and generating a FedEx freight return dispatch label. A replacement allocation is being verified in warehouse Hub 2.'
      }
    ]
  },
  {
    id: 'conv-marcus-vance',
    businessId: 'ATONIA_INSURANCE',
    customerId: 'CUST-44102',
    customerName: 'Marcus Vance',
    customerIdentifier: 'POL-882419-GB',
    customerAvatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBV7CxlJGRJCvU5pwv89qPxwg9UMgZOLE9-YLwZqSWjJMjfsiIQ2HBAUAcqbPDp0PaY8cs_pQtZCMnl-1TMRDUhhmkMmvXiq3X8XaUdBUIaLNHDmihbApW8SrKCopiXh46BCexRiic2kbjmicX8mRUshilIaiDrBqQTZguTOWhmaO-0P52lGRI7Mz3zBSvm5f9uh8AU2w4pihLs7OD7Wzpa1sjnYKIdAW36gbHm2mIfrTQ823PabW0r7g',
    channel: 'whatsapp',
    intent: 'Coverage dispute on £45,000 water damage claim',
    intentDetails: 'Section 4.2 Exclusion Clause Dispute',
    status: 'escalated_to_human',
    priority: 'critical',
    lastActivity: '1m ago',
    assignedAgent: 'Unassigned',
    isEscalated: true,
    messages: [
      {
        id: 'mv-1',
        conversationId: 'conv-marcus-vance',
        sender: 'customer',
        senderName: 'Marcus Vance',
        timestamp: '10:09 AM',
        content:
          'Your automated system is saying Section 4.2 excludes our burst water pipe claim of £45,000. That pipe burst occurred during unseasonal frost. I demand a qualified broker review this!'
      },
      {
        id: 'mv-2',
        conversationId: 'conv-marcus-vance',
        sender: 'system',
        senderName: 'Compliance Guard #FCA-102',
        timestamp: '10:10 AM',
        content:
          'Disputed Claims > £10,000 must be transferred to certified insurance broker. Autonomous AI safely halted.'
      }
    ]
  }
];

export const INITIAL_ESCALATIONS: EscalationRecord[] = [
  {
    id: 'ESC-401',
    conversationId: 'conv-marcus-vance',
    customerId: 'CUST-44102',
    customerName: 'Marcus Vance',
    businessId: 'ATONIA_INSURANCE',
    reason: 'Exclusion Clause Dispute',
    clauseExclusion: 'Section 4.2 Exclusion',
    priority: 'critical',
    sentiment: 'Frustrated / Urgent',
    exposureAmount: '£45,000.00',
    queueWaitTime: '04m 12s',
    aiSummary:
      'Policyholder disputes exclusion clause 4.2; AI reached legal boundary threshold; customer requested human senior adjuster.',
    requiredAction: 'Transfer to qualified commercial insurance broker and review flood endorsement caps.',
    assignedStaff: null,
    status: 'pending',
    createdAt: '2026-10-02T10:10:00Z',
    safetyAuditTimeline: [
      {
        timestamp: '10:10:08',
        type: 'INTENT',
        title: 'Intent Recognized',
        detail: 'Classified as Claim Appeal (99.4% confidence score)'
      },
      {
        timestamp: '10:10:14',
        type: 'KB_QUERY',
        title: 'Vector Knowledge Base Queried',
        detail: 'Retrieved Policy Section 4.2 (Wear & Tear exclusions)'
      },
      {
        timestamp: '10:10:20',
        type: 'SAFETY_RULE',
        title: 'Regulatory Safety Rule #FCA-102 Triggered',
        detail: 'Disputed Claims > £10,000 must be transferred to certified insurance broker.'
      },
      {
        timestamp: '10:10:22',
        type: 'HALT_ROUTED',
        title: 'Conversation Safely Paused',
        detail: 'Synthesized hold message delivered. Routing queued to Human Desk.'
      }
    ]
  },
  {
    id: 'ESC-402',
    conversationId: 'conv-sophia-chen',
    customerId: 'CUST-88319',
    customerName: 'Elena Rostova (Sophia Chen Corporate)',
    businessId: 'EUREKA',
    reason: 'Potential fraud & account takeover alert',
    clauseExclusion: 'Halted: Wire £8,500',
    priority: 'critical',
    sentiment: 'Alarmed',
    exposureAmount: '£8,500.00',
    queueWaitTime: '01m 45s',
    aiSummary:
      'Unusual IP pattern + device mismatch on £8,500 outgoing wire request; AI halted execution per anti-fraud protocol.',
    requiredAction: 'Verify customer via biometric step-up call and inspect gateway IP risk scoring.',
    assignedStaff: 'Mark Hughes (Fraud Lead)',
    status: 'in_review',
    createdAt: '2026-10-02T10:12:00Z',
    safetyAuditTimeline: [
      {
        timestamp: '10:12:01',
        type: 'INTENT',
        title: 'High-Value Outgoing Wire',
        detail: 'Transfer initiation of £8,500 to offshore beneficiary'
      },
      {
        timestamp: '10:12:05',
        type: 'SAFETY_RULE',
        title: 'Device Risk Score: 94/100',
        detail: 'Wire intercepted at gateway. Anti-fraud lock engaged.'
      }
    ]
  },
  {
    id: 'ESC-403',
    conversationId: 'conv-omnicorp',
    customerId: 'CUST-99410',
    customerName: 'OmniCorp Logistics',
    businessId: 'ATONIA_MARKETPLACE',
    reason: 'Late wholesale container delivery ($34,000)',
    clauseExclusion: 'Carrier Breach',
    priority: 'high',
    sentiment: 'Impatient',
    exposureAmount: '$34,000.00',
    queueWaitTime: '08m 30s',
    aiSummary:
      'Supplier delay exceeded 7 days; SLA breach triggered automatic refund request exceeding auto-threshold ($10,000).',
    requiredAction: 'Authorize replacement shipment release or process partial freight credit.',
    assignedStaff: 'Sarah Jenkins',
    status: 'pending',
    createdAt: '2026-10-02T10:05:00Z',
    safetyAuditTimeline: [
      {
        timestamp: '10:05:12',
        type: 'SAFETY_RULE',
        title: 'Refund Cap Exceeded $10,000',
        detail: 'Autonomous refund boundary capped at $500. Human approval strictly required.'
      }
    ]
  },
  {
    id: 'ESC-404',
    conversationId: 'conv-tariq',
    customerId: 'CUST-79112',
    customerName: 'Tariq Al-Mansoor',
    businessId: 'SORPLOS_INSURTECH',
    reason: 'Pre-existing medical condition disclosure',
    clauseExclusion: 'Underwriting Referral',
    priority: 'high',
    sentiment: 'Inquiring',
    exposureAmount: 'Policy Bind Gate',
    queueWaitTime: '12m 00s',
    aiSummary:
      'Automated underwriting engine could not calculate risk loading for rare cardiac condition; needs manual underwriting referral.',
    requiredAction: 'Refer medical disclosure to syndicate chief medical officer for actuarial loading.',
    assignedStaff: null,
    status: 'pending',
    createdAt: '2026-10-02T10:01:00Z',
    safetyAuditTimeline: [
      {
        timestamp: '10:01:40',
        type: 'SAFETY_RULE',
        title: 'Model Uncertainty > 35%',
        detail: 'AI prevented from altering insurer quote. Escalated per Insurance Core rule.'
      }
    ]
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-1',
    timestamp: '2026-10-02T10:16:42Z',
    actor: 'Elena Vance (EV-802)',
    actorType: 'SUPERVISOR',
    businessId: 'ATONIA_INSURANCE',
    customerId: 'CUST-88192',
    action: 'POLICY_LIMIT_OVERRIDE_APPROVED',
    tool: 'fx:execute_endorsement_calc',
    resource: 'Policy #AIB-88219-UK',
    result: 'SUCCESS',
    detail: 'Supervisor Elena Vance approved policy limit bypass for 3 Mercedes Sprinters (+£1,420/yr).',
    ipAddress: '10.0.4.12'
  },
  {
    id: 'aud-2',
    timestamp: '2026-10-02T10:15:19Z',
    actor: 'Atonia Autonomous Agent',
    actorType: 'AI_AGENT',
    businessId: 'ATONIA_INSURANCE',
    customerId: 'CUST-88192',
    action: 'DVLA_REGISTRY_QUERY',
    tool: 'fx:execute_endorsement_calc',
    resource: 'VRN Registry: MV73 XKL, MV73 XKM, MV73 XKN',
    result: 'SUCCESS',
    detail: 'Vehicle specifications verified against UK Driver and Vehicle Licensing Agency.',
    ipAddress: 'internal-cluster'
  },
  {
    id: 'aud-3',
    timestamp: '2026-10-02T10:12:05Z',
    actor: 'Fraud Sentinel AI',
    actorType: 'SYSTEM',
    businessId: 'EUREKA',
    customerId: 'CUST-88319',
    action: 'WIRE_TRANSFER_INTERCEPTED',
    resource: 'Account ACC-88319-EU',
    result: 'BLOCKED',
    detail: 'Outbound wire of $14,250 blocked due to IP anomaly and risk score 94.',
    ipAddress: '194.26.29.11'
  },
  {
    id: 'aud-4',
    timestamp: '2026-10-02T10:10:20Z',
    actor: 'Compliance Engine Guard',
    actorType: 'SYSTEM',
    businessId: 'ATONIA_INSURANCE',
    customerId: 'CUST-44102',
    action: 'RULE_TRIGGER_FCA_102',
    resource: 'Claim #45,000 Flood Dispute',
    result: 'ESCALATED',
    detail: 'Automated claim handling halted. Regulatory mandate requires certified broker intervention.',
    ipAddress: 'internal-cluster'
  }
];

export const INITIAL_KNOWLEDGE_DOCS: KnowledgeDocument[] = [
  {
    id: 'kb-ins-01',
    businessId: 'ATONIA_INSURANCE',
    title: 'Commercial Motor Fleet Endorsement & Vehicle Addition Rules',
    category: 'Underwriting Guidelines',
    summary: 'Procedures for pro-rating vehicle additions to Lloyd’s Syndicate Commercial Policies.',
    content:
      'All additions of commercial light goods vehicles (LGVs) such as Mercedes Sprinters under 3.5t require valid VRN lookup via DVLA, driver verification against the approved pool, and automatic pro-rated calculation. Premium adjustments over £1,000 must be reviewed by a Level 2 broker.',
    version: 'v4.2.1',
    status: 'published',
    lastUpdated: '2026-09-15',
    author: 'Compliance Dept'
  },
  {
    id: 'kb-euk-01',
    businessId: 'EUREKA',
    title: 'Emergency Card Freeze & ATM Withdrawal Auth Protocol',
    category: 'Banking Security',
    summary: 'Biometric verification protocols for lost/stolen cards and emergency cash tokens.',
    content:
      'When a customer reports a lost or stolen payment card, the AI Agent must execute fx:freeze_card_v2 immediately. If emergency cash is requested, customer voice or cryptographic token must verify with minimum 95% confidence. Emergency cash limit is capped at £200 per 24 hours.',
    version: 'v3.1.0',
    status: 'published',
    lastUpdated: '2026-09-20',
    author: 'Security Officer'
  },
  {
    id: 'kb-mkt-01',
    businessId: 'ATONIA_MARKETPLACE',
    title: 'Wholesale Pallet Damage & RMA Resolution Guide',
    category: 'Retail Logistics',
    summary: 'Guidance on carrier breach claims, FedEx return label issuance, and inventory replacement.',
    content:
      'For freight shipments with broken warehouse seals or punctured goods, collect photographic proof and carrier bill of lading. Auto-refunds are limited to $500. B2B orders above $10,000 require manual review by Tier-2 specialist before issuing replacement inventory.',
    version: 'v2.8.0',
    status: 'published',
    lastUpdated: '2026-08-30',
    author: 'Operations Team'
  },
  {
    id: 'kb-sor-01',
    businessId: 'SORPLOS_INSURTECH',
    title: 'Multi-Carrier Quote Aggregation & Zero-Underwriting Policy',
    category: 'Regulatory Boundary',
    summary: 'CRITICAL: Strict prohibition against AI altering, discounting, or underwriting insurer quotes.',
    content:
      'The AI Agent operates strictly as an aggregation and coordination layer. It must NEVER alter insurer premiums, mark up or discount quotes, or make binding underwriting decisions on out-of-appetite risks. All quotes are fetched directly from authorized carrier APIs.',
    version: 'v5.0.0',
    status: 'published',
    lastUpdated: '2026-09-25',
    author: 'Legal & Risk'
  }
];

export const INITIAL_TASKS: TaskRecord[] = [
  {
    id: 'tsk-101',
    businessId: 'ATONIA_INSURANCE',
    title: 'Fleet Schedule PDF Generation (#AIB-88219-UK)',
    type: 'QUOTE_CALC',
    status: 'completed',
    progressPercent: 100,
    createdAt: '10:16 AM',
    completedAt: '10:17 AM',
    targetRef: 'POL-AIB-88219'
  },
  {
    id: 'tsk-102',
    businessId: 'EUREKA',
    title: 'OCR Passport Verification (NIN & Proof of Address)',
    type: 'OCR_KYC',
    status: 'running',
    progressPercent: 78,
    createdAt: '10:18 AM',
    targetRef: 'CUST-88319'
  },
  {
    id: 'tsk-103',
    businessId: 'ATONIA_MARKETPLACE',
    title: 'FedEx Freight RMA Carrier Label Sync',
    type: 'CARRIER_SYNC',
    status: 'completed',
    progressPercent: 100,
    createdAt: '10:12 AM',
    completedAt: '10:13 AM',
    targetRef: 'TRK-99401294'
  },
  {
    id: 'tsk-104',
    businessId: 'SORPLOS_INSURTECH',
    title: '14-Carrier Health Policy Indexing Batch',
    type: 'QUOTE_CALC',
    status: 'running',
    progressPercent: 92,
    createdAt: '10:15 AM',
    targetRef: 'AGG-BATCH-882'
  }
];

export const INITIAL_TOOL_EXECUTIONS: ToolExecutionEvent[] = [
  {
    id: 'tool-ev-1',
    toolName: 'fx:generate_underwriting_quote',
    businessId: 'SORPLOS_INSURTECH',
    timestamp: '14s ago',
    latencyMs: 320,
    statusCode: 200,
    statusText: 'OK',
    description: 'Quote generated & sent to underwriter API for auto binding.',
    actor: 'AI_AGENT',
    actorId: 'atonia-agent-core',
    verified: true
  },
  {
    id: 'tool-ev-2',
    toolName: 'fx:ocr_kyc_passport_scan',
    businessId: 'EUREKA',
    timestamp: '1m ago',
    latencyMs: 180,
    statusCode: 200,
    statusText: 'OK',
    description: 'KYC Document OCR extracted, matched with national registry & verified (Confidence 0.992).',
    actor: 'AI_AGENT',
    actorId: 'atonia-agent-core',
    verified: true
  },
  {
    id: 'tool-ev-3',
    toolName: 'fx:carrier_dispatch_fedex',
    businessId: 'ATONIA_MARKETPLACE',
    timestamp: '2m ago',
    latencyMs: 140,
    statusCode: 200,
    statusText: 'OK',
    description: 'FedEx return label issued & tracking synced to warehouse ERP (TRK: 99401294).',
    actor: 'AI_AGENT',
    actorId: 'atonia-agent-core',
    verified: true
  },
  {
    id: 'tool-ev-4',
    toolName: 'fx:speech_fnol_transcribe',
    businessId: 'ATONIA_INSURANCE',
    timestamp: '4m ago',
    latencyMs: 85,
    statusCode: 200,
    statusText: 'OK',
    description: 'Claims First Notice of Loss (FNOL) report structured from live voice audio transcript (SIP PCM 16kHz).',
    actor: 'AI_AGENT',
    actorId: 'atonia-agent-core',
    verified: true
  },
  {
    id: 'tool-ev-5',
    toolName: 'fx:auth_banking_mfa_token',
    businessId: 'EUREKA',
    timestamp: '6m ago',
    latencyMs: 55,
    statusCode: 200,
    statusText: 'OK',
    description: 'Customer authenticated via cryptographic device token handshake (FIDO2 WebAuthn).',
    actor: 'SYSTEM',
    actorId: 'gateway-security',
    verified: true
  }
];

export const INITIAL_VOICE_SESSIONS: VoiceCallSession[] = [
  {
    id: 'voice-call-julian',
    businessId: 'EUREKA',
    callerName: 'Julian Weber',
    callerPhone: '+44 20 7946 0912',
    callerAvatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBx5zEgMJJMGR6HjW3OcKop_GesTFwSND5FEIDYMDvvnQsGNANuDfdzFdydeRw99HK1CR3sI5pg0CRruAnOROyQ1rz_Xy8g9U2jK7quCTx5oA5o6oAe6NjWyfGYbQcXDyxTgNXSEDjUMZmHcYwxWkQx4U2gXmRsx7sbpkZMggKrDKu4bbghkWR1zxmxn6LfkSf_VDaAqXkPAToEi4D0iXvwusG3QvPFFqLSGXWJwlrlSRuhi-O55h7Vcg',
    accountRef: 'Retail Checking (Platinum)',
    intent: 'Lost Card & Emergency Cash',
    duration: '01:42',
    latencyMs: 290,
    sttEngine: 'Whisper Large v3 Turbo',
    ttsModel: 'Neural Voice (UK-Elena)',
    sentiment: '94% Calm',
    complianceFlags: 0,
    voiceAuthStatus: 'Passed',
    biometricScore: 99.2,
    status: 'streaming',
    transcripts: [
      {
        time: '00:12',
        speaker: 'caller',
        speakerName: 'Julian Weber',
        text: 'Hi, I think I left my debit card in a coffee shop in Soho about an hour ago. I need to block it immediately.'
      },
      {
        time: '00:16',
        speaker: 'agent',
        speakerName: 'AI Voice Agent (Elena - UK)',
        text: 'I understand how urgent that is, Julian. I have immediately placed a temporary freeze on your Eureka Platinum Visa ending in 4092 so no new transactions can occur.',
        ttsMeta: 'TTS synthesis: 112ms • 32 tokens'
      },
      {
        time: '00:24',
        speaker: 'agent',
        speakerName: 'System Core',
        text: 'Tool executed: fx:freeze_card_v2(card_id="4092", reason="lost_in_transit") -> CONFIRMED (CORE-API 41ms)',
        toolCallTriggered: 'fx:freeze_card_v2'
      },
      {
        time: '00:32',
        speaker: 'caller',
        speakerName: 'Julian Weber',
        text: 'That is a huge relief. Can I also authorize an emergency cash withdrawal from my mobile app while I wait for a new card?'
      },
      {
        time: '00:38',
        speaker: 'agent',
        speakerName: 'AI Voice Agent (Elena - UK)',
        text: 'Yes, I can generate an emergency ATM cash code for up to £200 valid at any partner ATM. Would you like me to send that code via SMS to your verified mobile number ending in 0912?',
        ttsMeta: 'TTS synthesis: 138ms • 41 tokens'
      },
      {
        time: '00:44',
        speaker: 'caller',
        speakerName: 'Julian Weber',
        text: 'Yes please, make it £150.'
      }
    ]
  },
  {
    id: 'voice-call-claire',
    businessId: 'ATONIA_MARKETPLACE',
    callerName: 'Claire Dupont',
    callerPhone: '+33 1 42 68 55 00',
    callerAvatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDD9ouu7hMZ1S1sKAwIH9IRt7_jtZ11hK0Zwnmtoegb_dfTBOtyX_4M5-JzEfdyDpEDwWZk20f-feUgebBq181sGL4S2CfBqjeM5vbTpdFeWQgF-tbxQD1Yj0X4eWoNYxlaaZcY9KVdEAE9YiAhnXGJ2mbCI1KA8I2zULoemcoExbs2VxgQCPRCXWF5b4BOeIfea6ZQyDXAE0kcvI45FD8G38LWqKlKIWdWEannr4FZRHRJtFHvUdvbEg',
    accountRef: 'Order #9841',
    intent: 'Delivery Reschedule',
    duration: '03:15',
    latencyMs: 310,
    sttEngine: 'Whisper Large v3 Turbo',
    ttsModel: 'Neural Voice (FR-Celine)',
    sentiment: '91% Calm',
    complianceFlags: 0,
    voiceAuthStatus: 'Passed',
    biometricScore: 98.4,
    status: 'streaming',
    transcripts: [
      {
        time: '00:08',
        speaker: 'caller',
        speakerName: 'Claire Dupont',
        text: 'Bonjour, I would like to adjust the delivery slot for our industrial air filters to tomorrow morning.'
      }
    ]
  },
  {
    id: 'voice-call-arthur',
    businessId: 'ATONIA_INSURANCE',
    callerName: 'Arthur Pendelton',
    callerPhone: '+44 161 832 9901',
    callerAvatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDu9SeEp4uOfKyRgx71HnrIASlu97KJ55ah_EPSxbOVFjIUaRWxYpq6u3cXQfIn09mmawafh-x5vmq4050JvPxim5nkfDE6bzCzzjZnSb_uslCKbBuCcsmROz84F6UGeaff7pcHZrgF5cHuaMIM5ibc_5M-nVuMeZekG1wpe2A1VBhwUnEcqUdZSDU1u8Cn-Gb8iulyP80KQKDLMCxEZkm5ptVObwVEeJzTgTekoshnYvzqONLvzWwyPA',
    accountRef: 'Commercial Marine Hull Policy',
    intent: 'Underwriting Commercial Policy Transfer',
    duration: '00:48',
    latencyMs: 295,
    sttEngine: 'Whisper Large v3 Turbo',
    ttsModel: 'Neural Voice (UK-Elena)',
    sentiment: 'Neutral / Formal',
    complianceFlags: 1,
    voiceAuthStatus: 'Passed',
    biometricScore: 97.1,
    status: 'escalated',
    transcripts: [
      {
        time: '00:15',
        speaker: 'caller',
        speakerName: 'Arthur Pendelton',
        text: 'I am calling to verify maritime vessel endorsement criteria for international passage.'
      }
    ]
  }
];

export class AppRepository {
  // In-memory fallback state for development mode when MONGODB_URI is not provided
  private memUsers: User[] = JSON.parse(JSON.stringify(INITIAL_USERS));
  private memCustomers: CustomerContext[] = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
  private memConversations: Conversation[] = JSON.parse(JSON.stringify(INITIAL_CONVERSATIONS));
  private memEscalations: EscalationRecord[] = JSON.parse(JSON.stringify(INITIAL_ESCALATIONS));
  private memAuditLogs: AuditLogEntry[] = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
  private memTasks: TaskRecord[] = JSON.parse(JSON.stringify(INITIAL_TASKS));
  private memToolExecutions: ToolExecutionEvent[] = JSON.parse(JSON.stringify(INITIAL_TOOL_EXECUTIONS));
  private memKnowledgeDocs: KnowledgeDocument[] = JSON.parse(JSON.stringify(INITIAL_KNOWLEDGE_DOCS));
  private memVoiceSessions: VoiceCallSession[] = JSON.parse(JSON.stringify(INITIAL_VOICE_SESSIONS));

  private seededDbPromise: Promise<void> | null = null;

  async ensureSeeded(db: Db): Promise<void> {
    if (this.seededDbPromise) {
      return this.seededDbPromise;
    }

    this.seededDbPromise = (async () => {
      // 1. Users
      const usersCol = db.collection(COLLECTIONS.USERS);
      if ((await usersCol.countDocuments()) === 0) {
        await usersCol.insertMany(INITIAL_USERS.map((u) => ({ ...u })));
      }

      // 2. Customers
      const custCol = db.collection(COLLECTIONS.CUSTOMERS);
      if ((await custCol.countDocuments()) === 0) {
        await custCol.insertMany(INITIAL_CUSTOMERS.map((c) => ({ ...c })));
      }

      // 3. Conversations
      const convCol = db.collection(COLLECTIONS.CONVERSATIONS);
      if ((await convCol.countDocuments()) === 0) {
        await convCol.insertMany(INITIAL_CONVERSATIONS.map((c) => ({ ...c })));
      }

      // 4. Escalations
      const escCol = db.collection(COLLECTIONS.ESCALATIONS);
      if ((await escCol.countDocuments()) === 0) {
        await escCol.insertMany(INITIAL_ESCALATIONS.map((e) => ({ ...e })));
      }

      // 5. Audit Logs
      const auditCol = db.collection(COLLECTIONS.AUDIT_LOGS);
      if ((await auditCol.countDocuments()) === 0) {
        await auditCol.insertMany(INITIAL_AUDIT_LOGS.map((a) => ({ ...a })));
      }

      // 6. Tasks
      const taskCol = db.collection(COLLECTIONS.TASKS);
      if ((await taskCol.countDocuments()) === 0) {
        await taskCol.insertMany(INITIAL_TASKS.map((t) => ({ ...t })));
      }

      // 7. Tool Executions
      const toolCol = db.collection(COLLECTIONS.TOOL_EXECUTIONS);
      if ((await toolCol.countDocuments()) === 0) {
        await toolCol.insertMany(INITIAL_TOOL_EXECUTIONS.map((t) => ({ ...t })));
      }

      // 8. Knowledge Docs
      const kbCol = db.collection(COLLECTIONS.KNOWLEDGE_DOCS);
      if ((await kbCol.countDocuments()) === 0) {
        await kbCol.insertMany(INITIAL_KNOWLEDGE_DOCS.map((k) => ({ ...k })));
      }

      // 9. Voice Sessions
      const voiceCol = db.collection(COLLECTIONS.VOICE_SESSIONS);
      if ((await voiceCol.countDocuments()) === 0) {
        await voiceCol.insertMany(INITIAL_VOICE_SESSIONS.map((v) => ({ ...v })));
      }

      console.log('[MONGODB] Initial database records verified.');
    })();

    return this.seededDbPromise;
  }

  // ----------------------------------------------------
  // Users Repository
  // ----------------------------------------------------
  async getUsers(): Promise<User[]> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const docs = await db.collection(COLLECTIONS.USERS).find({}).toArray();
      return docs.map((d) => this.stripMongoId(d) as unknown as User);
    }
    return this.memUsers;
  }

  async getUserById(id: string): Promise<User | null> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const doc = await db.collection(COLLECTIONS.USERS).findOne({ id });
      return doc ? (this.stripMongoId(doc) as unknown as User) : null;
    }
    return this.memUsers.find((u) => u.id === id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const doc = await db.collection(COLLECTIONS.USERS).findOne({ email });
      return doc ? (this.stripMongoId(doc) as unknown as User) : null;
    }
    return this.memUsers.find((u) => u.email === email) || null;
  }

  // ----------------------------------------------------
  // Customers Repository
  // ----------------------------------------------------
  async getCustomers(query?: { businessId?: string; search?: string }): Promise<CustomerContext[]> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const filter: Record<string, unknown> = {};
      if (query?.businessId && query.businessId !== 'ALL') {
        filter.businessId = query.businessId;
      }
      if (query?.search) {
        const regex = { $regex: query.search, $options: 'i' };
        filter.$or = [{ name: regex }, { accountNumber: regex }, { phone: regex }, { email: regex }];
      }
      const docs = await db.collection(COLLECTIONS.CUSTOMERS).find(filter).toArray();
      return docs.map((d) => this.stripMongoId(d) as unknown as CustomerContext);
    }

    let results = this.memCustomers;
    if (query?.businessId && query.businessId !== 'ALL') {
      results = results.filter((c) => c.businessId === query.businessId);
    }
    if (query?.search) {
      const q = query.search.toLowerCase();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.accountNumber && c.accountNumber.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q))
      );
    }
    return results;
  }

  async getCustomerById(id: string): Promise<CustomerContext | null> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const doc = await db.collection(COLLECTIONS.CUSTOMERS).findOne({ id });
      return doc ? (this.stripMongoId(doc) as unknown as CustomerContext) : null;
    }
    return this.memCustomers.find((c) => c.id === id) || null;
  }

  async updateCustomer(id: string, update: Partial<CustomerContext>): Promise<CustomerContext> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const res = await db.collection(COLLECTIONS.CUSTOMERS).findOneAndUpdate(
        { id },
        { $set: update },
        { returnDocument: 'after' }
      );
      if (!res) {
        throw new Error(`Customer ${id} not found in database.`);
      }
      return this.stripMongoId(res) as unknown as CustomerContext;
    }

    const index = this.memCustomers.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Customer ${id} not found.`);
    }
    this.memCustomers[index] = { ...this.memCustomers[index], ...update };
    return this.memCustomers[index];
  }

  // ----------------------------------------------------
  // Conversations & Messages Repository
  // ----------------------------------------------------
  async getConversations(query?: {
    businessId?: string;
    channel?: string;
    status?: string;
    search?: string;
  }): Promise<Conversation[]> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const filter: Record<string, unknown> = {};
      if (query?.businessId && query.businessId !== 'ALL') {
        filter.businessId = query.businessId;
      }
      if (query?.channel && query.channel !== 'all') {
        filter.channel = query.channel;
      }
      if (query?.status && query.status !== 'All Agent States') {
        filter.status = query.status;
      }
      if (query?.search) {
        const regex = { $regex: query.search, $options: 'i' };
        filter.$or = [{ customerName: regex }, { intent: regex }, { customerIdentifier: regex }];
      }

      const docs = await db.collection(COLLECTIONS.CONVERSATIONS).find(filter).toArray();
      return docs.map((d) => this.stripMongoId(d) as unknown as Conversation);
    }

    let list = this.memConversations;
    if (query?.businessId && query.businessId !== 'ALL') {
      list = list.filter((c) => c.businessId === query.businessId);
    }
    if (query?.channel && query.channel !== 'all') {
      list = list.filter((c) => c.channel === query.channel);
    }
    if (query?.status && query.status !== 'All Agent States') {
      list = list.filter((c) => c.status === query.status);
    }
    if (query?.search) {
      const q = query.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.customerName.toLowerCase().includes(q) ||
          c.intent.toLowerCase().includes(q) ||
          c.customerIdentifier.toLowerCase().includes(q)
      );
    }
    return list;
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const doc = await db.collection(COLLECTIONS.CONVERSATIONS).findOne({ id });
      return doc ? (this.stripMongoId(doc) as unknown as Conversation) : null;
    }
    return this.memConversations.find((c) => c.id === id) || null;
  }

  async addMessage(conversationId: string, message: Message): Promise<Conversation> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      // Persist individual message record with timestamp index
      await db.collection(COLLECTIONS.MESSAGES).insertOne({
        ...message,
        createdAt: new Date().toISOString()
      });

      // Atomically append message to conversation document and update lastActivity & updatedAt
      const updated = await db.collection(COLLECTIONS.CONVERSATIONS).findOneAndUpdate(
        { id: conversationId },
        {
          $push: { messages: message } as unknown as Document,
          $set: {
            lastActivity: 'Just now',
            updatedAt: new Date().toISOString()
          }
        },
        { returnDocument: 'after' }
      );

      if (!updated) {
        throw new Error(`Conversation ${conversationId} not found for appending message.`);
      }

      return this.stripMongoId(updated) as unknown as Conversation;
    }

    const conv = this.memConversations.find((c) => c.id === conversationId);
    if (!conv) {
      throw new Error(`Conversation ${conversationId} not found.`);
    }
    conv.messages.push(message);
    conv.lastActivity = 'Just now';
    return conv;
  }

  async updateConversation(conversationId: string, patch: Partial<Conversation>): Promise<Conversation> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const updated = await db.collection(COLLECTIONS.CONVERSATIONS).findOneAndUpdate(
        { id: conversationId },
        {
          $set: {
            ...patch,
            updatedAt: new Date().toISOString()
          }
        },
        { returnDocument: 'after' }
      );
      if (!updated) {
        throw new Error(`Conversation ${conversationId} not found.`);
      }
      return this.stripMongoId(updated) as unknown as Conversation;
    }

    const conv = this.memConversations.find((c) => c.id === conversationId);
    if (!conv) {
      throw new Error(`Conversation ${conversationId} not found.`);
    }
    Object.assign(conv, patch);
    return conv;
  }

  // ----------------------------------------------------
  // Escalations Repository
  // ----------------------------------------------------
  async getEscalations(query?: { businessId?: string; priority?: string; status?: string }): Promise<EscalationRecord[]> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const filter: Record<string, unknown> = {};
      if (query?.businessId && query.businessId !== 'ALL') {
        filter.businessId = query.businessId;
      }
      if (query?.priority && query.priority !== 'all') {
        filter.priority = query.priority;
      }
      if (query?.status && query.status !== 'all') {
        filter.status = query.status;
      }

      const docs = await db.collection(COLLECTIONS.ESCALATIONS).find(filter).toArray();
      return docs.map((d) => this.stripMongoId(d) as unknown as EscalationRecord);
    }

    let list = this.memEscalations;
    if (query?.businessId && query.businessId !== 'ALL') {
      list = list.filter((e) => e.businessId === query.businessId);
    }
    if (query?.priority && query.priority !== 'all') {
      list = list.filter((e) => e.priority === query.priority);
    }
    if (query?.status && query.status !== 'all') {
      list = list.filter((e) => e.status === query.status);
    }
    return list;
  }

  async getEscalationById(id: string): Promise<EscalationRecord | null> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const doc = await db.collection(COLLECTIONS.ESCALATIONS).findOne({ id });
      return doc ? (this.stripMongoId(doc) as unknown as EscalationRecord) : null;
    }
    return this.memEscalations.find((e) => e.id === id) || null;
  }

  async updateEscalation(id: string, patch: Partial<EscalationRecord>): Promise<EscalationRecord> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const updated = await db.collection(COLLECTIONS.ESCALATIONS).findOneAndUpdate(
        { id },
        { $set: patch },
        { returnDocument: 'after' }
      );
      if (!updated) {
        throw new Error(`Escalation ${id} not found.`);
      }
      return this.stripMongoId(updated) as unknown as EscalationRecord;
    }

    const esc = this.memEscalations.find((e) => e.id === id);
    if (!esc) {
      throw new Error(`Escalation ${id} not found.`);
    }
    Object.assign(esc, patch);
    return esc;
  }

  // ----------------------------------------------------
  // Audit Logs Repository
  // ----------------------------------------------------
  async getAuditLogs(query?: { businessId?: string }): Promise<AuditLogEntry[]> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const filter: Record<string, unknown> = {};
      if (query?.businessId && query.businessId !== 'ALL') {
        filter.businessId = query.businessId;
      }
      const docs = await db
        .collection(COLLECTIONS.AUDIT_LOGS)
        .find(filter)
        .sort({ timestamp: -1 })
        .toArray();
      return docs.map((d) => this.stripMongoId(d) as unknown as AuditLogEntry);
    }

    let list = this.memAuditLogs;
    if (query?.businessId && query.businessId !== 'ALL') {
      list = list.filter((a) => a.businessId === query.businessId);
    }
    return list;
  }

  async appendAuditLog(entry: AuditLogEntry): Promise<void> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const result = await db.collection(COLLECTIONS.AUDIT_LOGS).insertOne({ ...entry });
      if (!result.acknowledged) {
        throw new Error(`Failed to persist audit log entry ${entry.id} to MongoDB Atlas.`);
      }
      return;
    }

    // In-memory fallback
    this.memAuditLogs.unshift(entry);
  }

  // ----------------------------------------------------
  // Tasks Repository
  // ----------------------------------------------------
  async getTasks(query?: { businessId?: string }): Promise<TaskRecord[]> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const filter: Record<string, unknown> = {};
      if (query?.businessId && query.businessId !== 'ALL') {
        filter.businessId = query.businessId;
      }
      const docs = await db.collection(COLLECTIONS.TASKS).find(filter).toArray();
      return docs.map((d) => this.stripMongoId(d) as unknown as TaskRecord);
    }

    let list = this.memTasks;
    if (query?.businessId && query.businessId !== 'ALL') {
      list = list.filter((t) => t.businessId === query.businessId);
    }
    return list;
  }

  async updateTask(id: string, patch: Partial<TaskRecord>): Promise<TaskRecord> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const updated = await db.collection(COLLECTIONS.TASKS).findOneAndUpdate(
        { id },
        { $set: patch },
        { returnDocument: 'after' }
      );
      if (!updated) {
        throw new Error(`Task ${id} not found.`);
      }
      return this.stripMongoId(updated) as unknown as TaskRecord;
    }

    const t = this.memTasks.find((task) => task.id === id);
    if (!t) throw new Error(`Task ${id} not found.`);
    Object.assign(t, patch);
    return t;
  }

  // ----------------------------------------------------
  // Tool Executions Repository
  // ----------------------------------------------------
  async getToolExecutions(query?: { businessId?: string }): Promise<ToolExecutionEvent[]> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const filter: Record<string, unknown> = {};
      if (query?.businessId && query.businessId !== 'ALL') {
        filter.businessId = query.businessId;
      }
      const docs = await db
        .collection(COLLECTIONS.TOOL_EXECUTIONS)
        .find(filter)
        .sort({ timestamp: -1 })
        .toArray();
      return docs.map((d) => this.stripMongoId(d) as unknown as ToolExecutionEvent);
    }

    let list = this.memToolExecutions;
    if (query?.businessId && query.businessId !== 'ALL') {
      list = list.filter((e) => e.businessId === query.businessId);
    }
    return list;
  }

  async recordToolExecution(event: ToolExecutionEvent): Promise<void> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const res = await db.collection(COLLECTIONS.TOOL_EXECUTIONS).insertOne({ ...event });
      if (!res.acknowledged) {
        throw new Error(`Failed to record tool execution ${event.id} to database.`);
      }
      return;
    }

    this.memToolExecutions.unshift(event);
  }

  // ----------------------------------------------------
  // Knowledge Base Repository
  // ----------------------------------------------------
  async getKnowledgeDocs(query?: { businessId?: string; search?: string }): Promise<KnowledgeDocument[]> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const filter: Record<string, unknown> = {};
      if (query?.businessId && query.businessId !== 'ALL') {
        filter.businessId = query.businessId;
      }
      if (query?.search) {
        const regex = { $regex: query.search, $options: 'i' };
        filter.$or = [{ title: regex }, { summary: regex }, { content: regex }];
      }
      const docs = await db.collection(COLLECTIONS.KNOWLEDGE_DOCS).find(filter).toArray();
      return docs.map((d) => this.stripMongoId(d) as unknown as KnowledgeDocument);
    }

    let list = this.memKnowledgeDocs;
    if (query?.businessId && query.businessId !== 'ALL') {
      list = list.filter((d) => d.businessId === query.businessId);
    }
    if (query?.search) {
      const q = query.search.toLowerCase();
      list = list.filter((d) => d.title.toLowerCase().includes(q) || d.summary.toLowerCase().includes(q));
    }
    return list;
  }

  // ----------------------------------------------------
  // Voice Sessions Repository
  // ----------------------------------------------------
  async getVoiceSessions(query?: { businessId?: string }): Promise<VoiceCallSession[]> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const filter: Record<string, unknown> = {};
      if (query?.businessId && query.businessId !== 'ALL') {
        filter.businessId = query.businessId;
      }
      const docs = await db.collection(COLLECTIONS.VOICE_SESSIONS).find(filter).toArray();
      return docs.map((d) => this.stripMongoId(d) as unknown as VoiceCallSession);
    }

    let list = this.memVoiceSessions;
    if (query?.businessId && query.businessId !== 'ALL') {
      list = list.filter((s) => s.businessId === query.businessId);
    }
    return list;
  }

  async getVoiceSessionById(id: string): Promise<VoiceCallSession | null> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const doc = await db.collection(COLLECTIONS.VOICE_SESSIONS).findOne({ id });
      return doc ? (this.stripMongoId(doc) as unknown as VoiceCallSession) : null;
    }
    return this.memVoiceSessions.find((s) => s.id === id) || null;
  }

  async updateVoiceSession(id: string, patch: Partial<VoiceCallSession>): Promise<VoiceCallSession> {
    const db = getDb();
    if (db && isDbConnected()) {
      await this.ensureSeeded(db);
      const updated = await db.collection(COLLECTIONS.VOICE_SESSIONS).findOneAndUpdate(
        { id },
        { $set: patch },
        { returnDocument: 'after' }
      );
      if (!updated) {
        throw new Error(`Voice session ${id} not found.`);
      }
      return this.stripMongoId(updated) as unknown as VoiceCallSession;
    }

    const s = this.memVoiceSessions.find((session) => session.id === id);
    if (!s) throw new Error(`Voice session ${id} not found.`);
    Object.assign(s, patch);
    return s;
  }

  private stripMongoId(doc: Document): Record<string, unknown> {
    const { _id, ...rest } = doc;
    return rest;
  }
}

export const repository = new AppRepository();
