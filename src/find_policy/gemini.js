/*********************************************************
 * Prologue Comments
 * findPolicy.js
 * 
 * Description:
 * 1) This script utilizes the Google Gemini API to generate concise summaries of privacy policies.
 * 2) Given a privacy policy as input, the script:
 *   - Sends the text to the Gemini API with a predefined prompt.
 *   - Requests a bullet-point summary covering key aspects such as:
 *     - Data collection practices.
 *     - Data usage and sharing.
 *     - Retention policies.
 *     - User rights and controls.
 *     - Notable disclosures or disclaimers.
 * 3) If the API call is successful, the summarized text is returned.
 * 4) If the API fails, the original text is returned as a fallback.
 * 
 * Programmer’s name: David Westerhaus 
 * Created: 03/06/2025
 * Revised: 03/06/2025
 * Preconditions: 
 * - Requires a valid Google Gemini API key stored in environment variables.
 * - Input text should be a privacy policy or similar document.
 * Postconditions: 
 * - Outputs a summarized version of the privacy policy in a clear bullet-point format
 * Error and exceptions: 
 * Side effects: None
 * Invariants: None
 * Any known faults: None
 *********************************************************/
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
