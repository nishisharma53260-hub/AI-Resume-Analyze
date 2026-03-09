import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export interface AnalysisResult {
  suitabilityScore: number;
  skillsFound: string[];
  qualifications: string[];
  experienceHighlights: string[];
  improvementSuggestions: string[];
  detailedFeedback: string;
}

export async function analyzeResume(resumeText: string, jobDescription: string): Promise<AnalysisResult> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3.1-pro-preview";

  const prompt = `
    You are an expert HR and Resume Screening AI. 
    Analyze the following resume text against the provided job description.
    
    Job Description:
    ${jobDescription}
    
    Resume Text:
    ${resumeText}
    
    Provide a detailed analysis including:
    1. A suitability score from 0 to 100.
    2. Key skills identified in the resume that match or are relevant to the job.
    3. Qualifications and education found.
    4. Work experience highlights.
    5. Actionable suggestions for improvement to better match the job description.
    6. A brief detailed feedback summary.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suitabilityScore: { type: Type.NUMBER },
          skillsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
          qualifications: { type: Type.ARRAY, items: { type: Type.STRING } },
          experienceHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvementSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          detailedFeedback: { type: Type.STRING },
        },
        required: [
          "suitabilityScore",
          "skillsFound",
          "qualifications",
          "experienceHighlights",
          "improvementSuggestions",
          "detailedFeedback"
        ],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(text) as AnalysisResult;
}
