/*********************************************************
 * Prologue Comments
 * main.js
 * 
 * Description:
 * 1) Starts policy finding logic. Decided to modularize the finding logic instead of using a single file.
 * 2) Waits for the user to input a website URL.
 * 3) Calls the findPrivacyPolicy function to start the process.
 * 4) Crawls the found website for relevant policy links and text.
 * 5) Extracts white space and non-ASCII characters from the policy text.
 * 6) Saves the policy text to a file.
 * all this will probably be replaced with code inside the actual browser extension code
 * 
 * Programmer’s name: David Westerhaus & Raven Duong
 * Created: 03/06/2025
 * Revised: 03/06/2025
 * Preconditions: 
 * - Requires a valid website URL input
 * - AWS S3 credentials must be set in environment variables
 * - The `findPolicy.js`, `crawler.js`, `helpers.js`, and `gemini.js` modules must be correctly implemented
 * - The Google Gemini API key must be configured for summarization
 * Postconditions: 
 * - If a policy is found, a cleaned and summarized version is stored in AWS S3
 * - If no policy is found, the script exits gracefully with appropriate messages
 * Error and exceptions: None
 * Side effects: None
 * Invariants: None
 * Any known faults: None
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

    // Upload to S3 and return the result
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

