import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const streamGeminiResponse = async (
  history: Message[],
  onChunk: (text: string) => void,
  systemInstruction: string = "You are a helpful AI assistant. Answer concisely and clearly."
): Promise<void> => {
  try {
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

    const modelId = "gemini-3-flash-preview"; 

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
  } catch (error) {
    console.error("Gemini API Error:", error);
    onChunk("\n[Connection to the stars interrupted...]");
  }
};

export const generateNodeLabel = async (text: string): Promise<string> => {
  if (!text || text.trim().length === 0) return "";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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