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