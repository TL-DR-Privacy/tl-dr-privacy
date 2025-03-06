/*********************************************************
 * David Westerhaus & Raven Duong
 * main.js
 * Created: 03/06/2025
 * 
 * 1) Starts policy finding logic. Decided to modularize the finding logic instead of using a single file.
 * 2) Waits for the user to input a website URL.
 * 3) Calls the findPrivacyPolicy function to start the process.
 * 4) Crawls the found website for relevant policy links and text.
 * 5) Extracts white space and non-ASCII characters from the policy text.
 * 6) Saves the policy text to a file.
 * all this will probably be replaced with code inside the actual browser extension code
 *********************************************************/
import fs from 'fs';
import { getWebsiteInput, generateFilename, uploadToS3, checkIfFileExists} from './helpers.js';
import { findPrivacyPolicy } from './findPolicy.js';
import { extractPolicyText } from './crawler.js';
import { summarizeText } from './gemini.js';

(async () => {
  const site = await getWebsiteInput();
  if (!site.startsWith('http')) {
    console.log("Please enter a valid URL (e.g., https://www.example.com)");
    process.exit(1);
  }
  // Generate expected filename
  const filename = generateFilename(site);

  // Check if policy exists in AWS S3 BEFORE crawling
  const exists = await checkIfFileExists(filename);
  if (exists) {
      console.log(`Privacy policy for ${site} already exists in S3. Skipping crawl.`);
      process.exit(0); // Stop execution if file exists
  }

  // 1) Attempt to find a policy link on the main site
  const policyUrl = await findPrivacyPolicy(site);
  if (!policyUrl) {
    console.log("No privacy policy URL found at all. Exiting...");
    process.exit(0);
  }

  // 2) Extract text from the found or Brave-result policy page
  //    with recursion up to 10 pages
  const visited = new Set();
  const pageCount = { count: 0 };
  const maxPages = 10;

  const fullText = await extractPolicyText(policyUrl, visited, maxPages, pageCount);
  const finalText = fullText
    .replace(/\s+/g, '')            // Strip out ALL white space
    .replace(/[^\x21-\x7E]/g, '');    // Remove characters outside the printable ASCII range (english only). We might revisit this later to add support for other langugaes.
  
  // 3) Summarize the cleaned text using your Gemini API to produce a TL;DR summary
  const summary = await summarizeText(finalText);

  console.log("Summary: ", summary);

  // 4) Upload the summary to SQL
  console.log(`\nUploading privacy policy to S3: ${filename}`);
  await uploadToS3(filename, finalText);

})();

