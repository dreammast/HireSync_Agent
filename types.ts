
export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum UserRole {
  HR = 'HR',
  CANDIDATE = 'CANDIDATE'
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email?: string;
  authPassword?: string;
  phone?: string;
  lastActive?: number;
  portalCreated?: number;
  emailVerified?: boolean;
  verificationToken?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  department: string;
  location: string;
}

export interface Candidate {
  id: string;
  userId: string;
  jobId: string; 
  name: string;
  fileName: string;
  resumeText: string;
  analysis?: CandidateAnalysis;
  status: ApprovalStatus;
  timestamp: number;
  feedback?: string;
  feedbackType?: 'correct' | 'incorrect';
}

export interface CandidateAnalysis {
  candidateName: string;
  candidateEmail?: string;
  candidatePhone?: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceSummary: string;
  educationLevel: string;
  explanation: string;
  weightedBreakdown: {
    skillMatch: number;
    experience: number;
    education: number;
  };
}
