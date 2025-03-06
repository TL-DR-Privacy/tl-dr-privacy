import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Your API key from environment

export async function summarizeText(text) {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Create a prompt to summarize text in a TL;DR format
    const prompt = `Below is a privacy policy. Please read it in full, then produce a clear, concise bullet-point summary that covers: What data they collect. How they use that data (and for what purposes). Who they share it with (e.g., affiliates, partners, advertisers). How long they retain the data. Key user rights/controls (how people can access, delete, or restrict their data). Other notable ‘gotchas’ or disclaimers (location tracking, law enforcement disclosures, child protection, etc.).
    Provide the summary in simple TL;DR language and keep it focused on core takeaways. Omit fluff. Plain text only: \n\n${text}`;
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating summary with Gemini API:", error.message);
    // Fallback: return the original text if the API fails
    return text;
  }
}
