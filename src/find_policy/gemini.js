import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Your API key from environment

export async function summarizeText(text) {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Create a prompt to summarize text in a TL;DR format
    const prompt = `Summarize the following text in TL;DR format:\n\n${text}`;
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating summary with Gemini API:", error.message);
    // Fallback: return the original text if the API fails
    return text;
  }
}
