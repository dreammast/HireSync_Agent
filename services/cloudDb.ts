
import { Candidate, User, Job } from '../types';

const BASE_SUPABASE_URL = 'https://isehlzzcgfrvwwdimybu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KKI1IrGNeNaHu2K0f_PbVg_9hd2lCUx';
const TABLE_NAME = 'sync_state'; 

export interface GlobalState {
  candidates: Candidate[];
  registeredUsers: User[];
  jobs: Job[];
  lastUpdated: number;
}

export type FetchResult = {
  success: boolean;
  state?: GlobalState;
  error?: 'TABLE_MISSING' | 'NETWORK_ERROR' | 'UNKNOWN';
};

const DEFAULT_STATE: GlobalState = {
  candidates: [],
  registeredUsers: [],
  jobs: [
    { id: 'job-1', title: 'Senior React Developer', description: 'Expert in React & TypeScript.', department: 'Engineering', location: 'Remote' },
    { id: 'job-2', title: 'UI/UX Designer', description: 'Expert in Figma and Design Systems.', department: 'Product', location: 'Remote' }
  ],
  lastUpdated: Date.now()
};

/**
 * Standard Fetch Wrapper
 * Direct connection to Supabase. No proxies used.
 */
async function directFetch(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10000); // 10s timeout
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'X-Client-Info': 'hiresync-ai-v11'
      }
    });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

export const cloudDb = {
  async fetchState(): Promise<FetchResult> {
    try {
      const targetUrl = `${BASE_SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.1&select=data`;
      const response = await directFetch(targetUrl, { method: 'GET' });

      if (!response.ok) {
        if (response.status === 404 || response.status === 406) return { success: false, error: 'TABLE_MISSING' };
        return { success: false, error: 'NETWORK_ERROR' };
      }

      const rows = await response.json();
      if (rows && rows.length > 0) {
        const rawData = rows[0].data || {};
        const state: GlobalState = {
          jobs: Array.isArray(rawData.jobs) ? rawData.jobs : DEFAULT_STATE.jobs,
          candidates: Array.isArray(rawData.candidates) ? rawData.candidates : DEFAULT_STATE.candidates,
          registeredUsers: Array.isArray(rawData.registeredUsers) ? rawData.registeredUsers : DEFAULT_STATE.registeredUsers,
          lastUpdated: typeof rawData.lastUpdated === 'number' ? rawData.lastUpdated : Date.now()
        };
        return { success: true, state };
      }

      await this.pushState(DEFAULT_STATE);
      return { success: true, state: DEFAULT_STATE };
    } catch (e) {
      return { success: false, error: 'NETWORK_ERROR' };
    }
  },

  async pushState(state: GlobalState): Promise<boolean> {
    try {
      const targetUrl = `${BASE_SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.1`;
      const payload = {
        id: 1,
        data: {
          jobs: state.jobs || [],
          candidates: state.candidates || [],
          registeredUsers: state.registeredUsers || [],
          lastUpdated: Date.now()
        },
        updated_at: new Date().toISOString()
      };

      const response = await directFetch(targetUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (e) {
      return false;
    }
  },

  mergeStates(local: Partial<GlobalState>, remote: Partial<GlobalState>): GlobalState {
    const userMap = new Map<string, User>();
    (remote.registeredUsers || []).forEach(u => userMap.set(u.id, u));
    (local.registeredUsers || []).forEach(u => userMap.set(u.id, u));

    const jobMap = new Map<string, Job>();
    (remote.jobs || []).forEach(j => jobMap.set(j.id, j));
    (local.jobs || []).forEach(j => jobMap.set(j.id, j));

    const candidateMap = new Map<string, Candidate>();
    (remote.candidates || []).forEach(rc => candidateMap.set(rc.id, rc));
    (local.candidates || []).forEach(lc => {
      const existing = candidateMap.get(lc.id);
      if (!existing || lc.timestamp > (existing.timestamp || 0)) {
        candidateMap.set(lc.id, lc);
      } else if (lc.status !== existing.status || lc.feedback !== existing.feedback) {
        candidateMap.set(lc.id, { ...existing, ...lc });
      }
    });

    return {
      jobs: Array.from(jobMap.values()),
      candidates: Array.from(candidateMap.values()),
      registeredUsers: Array.from(userMap.values()),
      lastUpdated: Math.max(local.lastUpdated || 0, remote.lastUpdated || 0) || Date.now()
    };
  }
};
