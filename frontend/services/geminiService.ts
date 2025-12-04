import { GoogleGenAI } from "@google/genai";
import { OpportunityInput } from "../types";

// Initialize the client. 
// Note: In a real app, ensure process.env.API_KEY is available.
// If the user hasn't provided one, we'll handle the error gracefully in the UI.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateOpportunityAnalysis = async (input: OpportunityInput): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please ensure REACT_APP_GEMINI_API_KEY (or equivalent) is set.";
  }

  const prompt = `
    You are an expert Presales Consultant and Technical Architect.
    Analyze the following sales opportunity and generate a structured "Opportunity Play Outline".
    
    Context:
    - Sector: ${input.sector}
    - Offering: ${input.offering}
    - Current Stage: ${input.stage}
    - Technologies: ${input.technologies.join(', ')}
    - Region: ${input.geo}
    - Notes: ${input.notes || 'None'}
    
    Please provide the response in Markdown format.
    The structure should be:
    
    ## Executive Summary
    (Brief understanding of the deal)
    
    ## Recommended Strategy
    (How to win this specific deal based on sector and offering)
    
    ## Key Assets to Leverage
    (Generic types of assets needed, e.g., "Reference Architecture for Retail", "ROI Calculator")
    
    ## Action Plan
    (Bulleted steps for the ${input.stage} stage moving forward)
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate analysis. Please try again later or check your network/API key.";
  }
};
