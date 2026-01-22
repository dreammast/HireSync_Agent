import Groq from "groq-sdk";
import { CandidateAnalysis, Candidate } from "../types";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
    dangerouslyAllowBrowser: true // Required for client-side usage
});

export const analyzeResume = async (
    jobDescription: string,
    resumeText: string,
    historicalFeedback?: Candidate[]
): Promise<CandidateAnalysis> => {
    try {
        const feedbackContext = historicalFeedback && historicalFeedback.length > 0
            ? `FEEDBACK FROM PREVIOUS ANALYSES: ${historicalFeedback.map(c => `${c.name}: ${c.feedback}`).join('\n')}`
            : "";

        const prompt = `
You are an expert HR analyst. Analyze this resume against the job description and provide a detailed analysis in JSON format.

JOB DESCRIPTION:
${jobDescription}

RESUME TEXT:
${resumeText}

${feedbackContext}

IMPORTANT: You MUST respond with ONLY valid JSON matching this exact structure (no markdown, no code blocks, just raw JSON):
{
  "candidateName": "Full name of the candidate",
  "candidateEmail": "Email address from resume",
  "candidatePhone": "Phone number from resume",
  "matchScore": 85,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "experienceSummary": "Brief summary of relevant experience",
  "educationLevel": "Highest education level",
  "explanation": "Concise explanation of the scoring",
  "weightedBreakdown": {
    "skillMatch": 42,
    "experience": 25,
    "education": 18
  }
}

Calculate matchScore as a weighted sum:
- Skills match: 50% (0-50 points)
- Experience relevance: 30% (0-30 points)
- Education: 20% (0-20 points)

Extract candidate contact information carefully from the resume header/footer.
`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
            max_tokens: 2048,
            response_format: { type: "json_object" }
        });

        const responseText = completion.choices[0]?.message?.content || '{}';
        const result = JSON.parse(responseText);

        // Validate required fields
        if (!result.candidateName || result.matchScore === undefined) {
            throw new Error("Invalid response format from Groq API");
        }

        return result as CandidateAnalysis;
    } catch (error) {
        console.error("Groq Analysis Error:", error);
        throw new Error(`Failed to analyze resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
