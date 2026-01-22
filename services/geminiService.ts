
import { GoogleGenAI, Type } from "@google/genai";
import { CandidateAnalysis, Candidate } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    candidateName: {
      type: Type.STRING,
      description: "Full name of the candidate extracted from the resume.",
    },
    candidateEmail: {
      type: Type.STRING,
      description: "Candidate email address found in the resume header or footer.",
    },
    candidatePhone: {
      type: Type.STRING,
      description: "Candidate phone number found in the resume.",
    },
    matchScore: {
      type: Type.NUMBER,
      description: "A calculated match percentage from 0 to 100 based on weighted criteria.",
    },
    matchedSkills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of skills found in both the resume and the job description.",
    },
    missingSkills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Key skills mentioned in the job description but not found in the resume.",
    },
    experienceSummary: {
      type: Type.STRING,
      description: "Short summary of relevant work experience.",
    },
    educationLevel: {
      type: Type.STRING,
      description: "Highest level of education detected.",
    },
    explanation: {
      type: Type.STRING,
      description: "A concise explanation of the scoring.",
    },
    weightedBreakdown: {
      type: Type.OBJECT,
      properties: {
        skillMatch: { type: Type.NUMBER, description: "Score for skills (out of 50)" },
        experience: { type: Type.NUMBER, description: "Score for experience (out of 30)" },
        education: { type: Type.NUMBER, description: "Score for education (out of 20)" },
      },
      required: ["skillMatch", "experience", "education"]
    }
  },
  required: [
    "candidateName", 
    "matchScore", 
    "matchedSkills", 
    "missingSkills", 
    "explanation", 
    "weightedBreakdown",
    "experienceSummary",
    "educationLevel"
  ],
};

export const analyzeResume = async (
  jobDescription: string,
  resumeText: string,
  historicalFeedback?: Candidate[]
): Promise<CandidateAnalysis> => {
  try {
    const feedbackContext = historicalFeedback && historicalFeedback.length > 0
      ? `FEEDBACK FROM PREVIOUS ANALYSES: ${historicalFeedback.map(c => `${c.name}: ${c.feedback}`).join('\n')}`
      : "";

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `
        Analyze this resume against the job description.
        EXTRACT the candidate's name, email, and phone number carefully.
        
        JOB DESCRIPTION:
        ${jobDescription}
        
        RESUME TEXT:
        ${resumeText}

        ${feedbackContext}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    const result = JSON.parse(response.text || '{}');
    return result as CandidateAnalysis;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze resume.");
  }
};
