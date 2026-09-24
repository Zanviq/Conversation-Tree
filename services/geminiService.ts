import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";
import { getGeminiApiKey } from "./apiKeyStore";

export const MISSING_KEY_MESSAGE = "Add your Gemini API key in Settings to enable AI responses.";

// Used when no API key is set: the first few words of the input become the node label
export const fallbackNodeLabel = (text: string): string => {
  const words = text.trim().split(/\s+/).slice(0, 5).join(' ');
  return words.length > 24 ? words.substring(0, 24) + '...' : words;
};

export const streamGeminiResponse = async (
  history: Message[],
  onChunk: (text: string) => void,
  modelId: string = "gemini-3-flash-preview",
  systemInstruction: string = "You are a helpful AI assistant. Answer concisely and clearly.",
  onError?: (errorMessage: string) => void
): Promise<void> => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    if (onError) onError(MISSING_KEY_MESSAGE);
    onChunk(`[${MISSING_KEY_MESSAGE}]`);
    return;
  }

  try {
    // Instantiate here to pick up the latest key
    const ai = new GoogleGenAI({ apiKey });
    
    // Convert our Message structure to Gemini API format
    const contents = history.map((msg) => {
      const parts: any[] = [];
      
      // Add attachments (images) if they exist
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(att => {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.data
            }
          });
        });
      }

      // Add text content
      if (msg.content) {
        parts.push({ text: msg.content });
      }

      // Safety: API requires at least one part
      if (parts.length === 0) {
        parts.push({ text: '' });
      }

      return {
        role: msg.role,
        parts: parts,
      };
    });

    const result = await ai.models.generateContentStream({
      model: modelId,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        onChunk(text);
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    let errorMessage = "Connection to the stars interrupted... Please check your API Key";
    
    if (error?.message?.includes("quota") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      errorMessage = "API quota exceeded (TPM limit reached). Please wait or upgrade your plan.";
    } else if (error?.message?.includes("API_KEY") || error?.message?.includes("Invalid API key")) {
      errorMessage = "Invalid or expired API Key. Please check your credentials.";
    } else if (error?.message?.includes("permission") || error?.message?.includes("PERMISSION_DENIED")) {
      errorMessage = "Permission denied. Check your API Key and permissions.";
    }
    
    if (onError) {
      onError(errorMessage);
    }
    onChunk(`\n[${errorMessage}]`);
  }
};

export const validateApiKey = async (apiKey: string): Promise<{ valid: boolean; error?: string }> => {
  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, error: "API Key is empty" };
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Hello",
      config: {
        responseMimeType: "text/plain",
      },
    });
    return { valid: true };
  } catch (error: any) {
    let errorMessage = "Invalid API Key";
    
    if (error?.message?.includes("API_KEY")) {
      errorMessage = "Invalid API Key";
    } else if (error?.message?.includes("quota") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      errorMessage = "API quota exceeded (TPM limit reached). Please wait or upgrade your plan.";
    } else if (error?.message?.includes("permission") || error?.message?.includes("PERMISSION_DENIED")) {
      errorMessage = "Permission denied. Check your API Key and permissions.";
    } else if (error?.message) {
      errorMessage = `Error: ${error.message}`;
    }
    
    return { valid: false, error: errorMessage };
  }
};

export const generateNodeLabel = async (text: string, modelId: string = "gemini-3-flash-preview"): Promise<string> => {
  if (!text || text.trim().length === 0) return "";
  const apiKey = getGeminiApiKey();
  if (!apiKey) return fallbackNodeLabel(text);
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Summarize the following user input into a very short label (max 3-5 words) to be used as a name for a node in a conversation graph. Identify the language of the input and generate the label in the SAME language. Return only the label text. Input: "${text}"`,
      config: {
        responseMimeType: "text/plain",
      },
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Label generation failed:", error);
    return "";
  }
};