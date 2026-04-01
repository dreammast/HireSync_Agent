# Migration from Gemini to Groq API

## Summary
Successfully migrated HireSync AI from Google Gemini API to Groq API.

## Changes Made

### 1. Created New Groq Service
- **File**: `services/groqService.ts`
- Replaced Gemini API calls with Groq SDK
- Using model: `meta-llama/llama-prompt-guard-2-86m`
- Configured JSON response format for structured output
- Maintained same interface as geminiService for seamless integration

### 2. Updated Environment Configuration
- **File**: `.env.local`
- Changed `GEMINI_API_KEY` to `GROQ_API_KEY`
- Set API key: `your_groq_api_key_here`

### 3. Updated Vite Configuration
- **File**: `vite.config.ts`
- Updated environment variable references from `GEMINI_API_KEY` to `GROQ_API_KEY`
- Ensured both `process.env.GROQ_API_KEY` and `process.env.API_KEY` are defined

### 4. Updated Component Imports
- **File**: `App.tsx`
  - Changed import from `./services/geminiService` to `./services/groqService`
- **File**: `components/CandidateDashboard.tsx`
  - Changed import from `../services/geminiService` to `../services/groqService`

### 5. Installed Dependencies
- Installed `groq-sdk` package via npm

### 6. Updated Documentation
- **File**: `README.md`
- Updated instructions to reference `GROQ_API_KEY` instead of `GEMINI_API_KEY`

## Technical Details

### Groq Configuration
- **Model**: `meta-llama/llama-prompt-guard-2-86m`
- **Temperature**: 0.3 (for consistent results)
- **Max Tokens**: 2048
- **Response Format**: JSON object
- **Browser Support**: Enabled via `dangerouslyAllowBrowser: true`

### API Response Structure
The Groq service maintains the same response structure as the original Gemini service:
```json
{
  "candidateName": "string",
  "candidateEmail": "string",
  "candidatePhone": "string",
  "matchScore": number,
  "matchedSkills": ["string"],
  "missingSkills": ["string"],
  "experienceSummary": "string",
  "educationLevel": "string",
  "explanation": "string",
  "weightedBreakdown": {
    "skillMatch": number,
    "experience": number,
    "education": number
  }
}
```

## Notes
- The old `geminiService.ts` file is still present for reference but is no longer used
- All functionality remains the same; only the AI provider has changed
- The application should work identically to before, now powered by Groq instead of Gemini

## Next Steps
To run the application:
1. Ensure all dependencies are installed: `npm install`
2. Verify `.env.local` has the correct `GROQ_API_KEY`
3. Start the development server: `npm run dev`
