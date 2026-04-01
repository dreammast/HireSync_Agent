import { ApprovalStatus } from '../types';

/**
 * HireSync Transactional Email Orchestrator
 * Target Node: https://isehlzzcgfrvwwdimybu.supabase.co/functions/v1/send-automated-email
 * 
 * CRITICAL FIX:
 * Get the correct anon key from: https://supabase.com/dashboard/project/isehlzzcgfrvwwdimybu/settings/api
 * It should start with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... */

// ⚠️ REPLACE THIS WITH YOUR ACTUAL ANON KEY FROM SUPABASE DASHBOARD
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZWhsenpjZ2Zydnd3ZGlteWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MDc1MzcsImV4cCI6MjA4NDQ4MzUzN30.gNptRWF38XDbiwGS1x1s1HpZZDzM4HgYnqe5OqmJaTU';

const EDGE_FUNCTION_URL = 'https://isehlzzcgfrvwwdimybu.supabase.co/functions/v1/send-automated-email';

export interface NextRoundDetails {
  type: string;
  date: string;
  time: string;
  mode: string;
  venue?: string;
  link?: string;
  instructions?: string;
}

interface EmailParams {
  toEmail: string;
  candidateName: string;
  jobTitle: string;
  status: ApprovalStatus;
  nextRound?: NextRoundDetails;
}

interface VerificationEmailParams {
  toEmail: string;
  candidateName: string;
  verificationLink: string;
}

export interface InternalSystemResponse {
  success: boolean;
  error?: string;
  statusCode?: number;
  diagnostic?: string;
}

/**
 * Dispatches a request to the HireSync Edge Function.
 * Enhanced with proper error handling and diagnostics.
 */
const dispatchBackendEmail = async (payload: any): Promise<InternalSystemResponse> => {
  console.log(`[HireSync-Email] 🚀 Dispatching to: ${EDGE_FUNCTION_URL}`);
  console.log(`[HireSync-Email] 📦 Payload:`, payload);
  
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(payload),
    });

    console.log(`[HireSync-Email] ✅ Response Status:`, response.status);

    // Parse response body regardless of status
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    if (!response.ok) {
      console.error(`[HireSync-Email] ❌ Node rejected request: ${response.status}`, data);
      
      let diagnostic = '';
      if (response.status === 500 && data.details?.includes('SendGrid')) {
        diagnostic = 'SendGrid secrets not configured. Run:\nsupabase secrets set SENDGRID_API_KEY=SG.xxx\nsupabase secrets set SENDGRID_FROM_EMAIL=your@email.com';      } else if (response.status === 401 || response.status === 403) {
        diagnostic = 'Authentication failed. Check if your SUPABASE_ANON_KEY is correct in emailService.ts';
      } else if (response.status === 404) {
        diagnostic = 'Edge function not found. Deploy with:\nsupabase functions deploy send-automated-email --no-verify-jwt';
      } else if (response.status === 502) {
        diagnostic = data.details || 'SendGrid API failed. Check your API key and from email.';      } else {
        diagnostic = data.details || responseText || `Server returned ${response.status}`;
      }

      return { 
        success: false, 
        error: `HTTP ${response.status}`,
        statusCode: response.status,
        diagnostic
      };
    }

    console.log('[HireSync-Email] ✅ Email sent successfully:', data);
    return { 
      success: true, 
      diagnostic: data.message || 'Email dispatched successfully' 
    };
    
  } catch (error: any) {
    console.error("[HireSync-Email] ❌ Network Level Failure:", error);
    
    let diagnostic = error.message;
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      diagnostic = 'Cannot reach Supabase Edge Function. Check:\n1. Internet connection\n2. Edge function is deployed\n3. URL is correct';
    } else if (error.message.includes('CORS')) {
      diagnostic = 'CORS error. Ensure Edge function has correct CORS headers.';
    }

    return { 
      success: false, 
      error: "Node Unreachable",
      diagnostic
    };
  }
};

export const pingEmailNode = async (): Promise<InternalSystemResponse> => {
  console.log('[HireSync-Email] 🏓 Pinging email node...');
  return await dispatchBackendEmail({ type: 'ping' });
};

export const sendStatusEmail = async (params: EmailParams): Promise<InternalSystemResponse> => {
  console.log('[HireSync-Email] 📧 Sending status update email to:', params.toEmail);
  return await dispatchBackendEmail({
    type: 'status_update',
    to: params.toEmail,
    candidateName: params.candidateName,
    jobTitle: params.jobTitle,
    status: params.status,
    nextRound: params.nextRound
  });
};

export const sendVerificationEmail = async (params: VerificationEmailParams): Promise<InternalSystemResponse> => {
  console.log('[HireSync-Email] ✉️ Sending verification email to:', params.toEmail);
  return await dispatchBackendEmail({
    type: 'verification',
    to: params.toEmail,
    candidateName: params.candidateName,
    verificationLink: params.verificationLink
  });
};