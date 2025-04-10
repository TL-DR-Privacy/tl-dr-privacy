/*********************************************************
 * Prologue Comments
 * main.js
 * 
 * Description:
 * 1) Implements the main API server for tl;dr Privacy.
 * 2) Provides a POST endpoint (/analyze) to process and summarize privacy policies.
 * 3) Extracts and crawls privacy policy text from the web.
 * 4) Cleans and summarizes policy content using the Gemini API.
 * 5) Caches summaries in a PostgreSQL database via Railway.
 * 
 * Programmer’s names: David Westerhaus & Raven Duong
 * Created: 03/06/2025
 * Revised: 04/10/2025
 * Preconditions: 
 * - Environment must contain: POSTGRES_URL and GEMINI_API_KEY
 * - Modules findPolicy.js, crawler.js, helpers.js, and gemini.js must be functional
 * - Input must include a valid URL (https://...)
 * Postconditions: 
 * - Responds with a summarized privacy policy (from cache or newly crawled)
 * - Stores new summaries in PostgreSQL
 * Error and exceptions: 
 * - Catches errors related to HTTP, crawling, and summarization
 * Side effects: 
 * - Writes to PostgreSQL
 * Invariants: None
 * Known faults: None
 *********************************************************/
import express from 'express';
import bodyParser from 'body-parser';
import { generateFilename, uploadToPostgres, getExistingPolicy } from './helpers.js';
import { findPrivacyPolicy } from './findPolicy.js';
import { extractPolicyText } from './crawler.js';
import { summarizeText } from './gemini.js';

const app = express();
app.use(bodyParser.json());

app.post('/analyze', async (req, res) => {
  const { url } = req.body;

  // Basic validation
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Please provide a valid URL (e.g., https://example.com)' });
  }

  try {
    const filename = generateFilename(url);

    // Check if the policy already exists in S3
    const existingContent = await getExistingPolicy(filename);
    if (existingContent) {
      return res.json({ summary: existingContent, source: 'cached' });
    }

    // Find the privacy policy URL
    const policyUrl = await findPrivacyPolicy(url);
    if (!policyUrl) {
      return res.status(404).json({ error: 'No privacy policy URL found for the given site.' });
    }

    // Crawl and extract policy text (recursively, up to 10 pages)
    const visited = new Set();
    const pageCount = { count: 0 };
    const maxPages = 10;
    const fullText = await extractPolicyText(policyUrl, visited, maxPages, pageCount);

    // Clean and summarize text
    const finalText = fullText
      .replace(/\s+/g, '')
      .replace(/[^\x21-\x7E]/g, '');
    const summary = await summarizeText(finalText);

    // Upload to sql and return the result
    await uploadToPostgres(filename, summary);
    return res.json({ summary, source: 'new' });

  } catch (err) {
    console.error('Error during analysis:', err);
    return res.status(500).json({ error: 'Internal server error during analysis.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔍 Privacy Policy API server is running on http://localhost:${PORT}`);
});

