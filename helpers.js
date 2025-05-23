/*********************************************************
 * Prologue Comments
 * helpers.js
 * 
 * Description:
 * 1) Contains helper functions for the privacy policy processing pipeline.
 * 2) Includes functions for user input, filename generation, and link relevance filtering.
 * 3) Interfaces with PostgreSQL to retrieve and store policy summaries.
 * 
 * Programmer’s names: David Westerhaus & Raven Duong
 * Created: 03/06/2025
 * Revised: 04/10/2025
 * Preconditions: 
 * - PostgreSQL connection must be configured via environment variable POSTGRES_URL.
 * - The database must contain a table named "privacy-policies" with appropriate columns.
 * - The input website URL must be valid.
 * Postconditions: 
 * - Returns cached summaries from the database if available.
 * - Uploads new summaries to PostgreSQL.
 * - Provides heuristics for determining if a link is privacy-related.
 * Error and exceptions: 
 * - Logs and handles SQL connection or query errors gracefully.
 * Side effects: 
 * - Writes and updates entries in the database.
 * Invariants: None
 * Any known faults: None
 *********************************************************/

//import { S3Client, HeadObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { pool } from './postgresClient.js';
import { URL } from 'url';
import readline from 'readline';
import dotenv from 'dotenv';
dotenv.config();

// --- Generate a filename from the site domain ---
export function generateFilename(websiteURL) {
    try {
      const domain = new URL(websiteURL).hostname.replace(/\./g, "_");
      return `privacy_policy_${domain}.txt`;
    } catch (err) {
      return 'privacy_policy_generic.txt';
    }
}
  
export async function getExistingPolicy(filename) {
    const domain = filename.replace('privacy_policy_', '').replace('.txt', '').replace(/_/g, '.');
    try {
      const { rows } = await pool.query(
        'SELECT policy FROM "privacy-policies" WHERE base_url = $1',
        [domain]
      );
  
      if (rows.length > 0) {
        await pool.query(
          'UPDATE "privacy-policies" SET last_requested = NOW() WHERE base_url = $1',
          [domain]
        );
        return rows[0].policy;
      } else {
        return null;
      }
    } catch (err) {
      console.error('Postgres SELECT error:', err.message);
      return null;
    }
}
export async function uploadToPostgres(filename, content) {
    const domain = filename.replace('privacy_policy_', '').replace('.txt', '').replace(/_/g, '.');
    try {
      await pool.query(
        `INSERT INTO "privacy-policies" (base_url, policy, last_updated, last_requested)
         VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT (base_url) DO UPDATE
         SET policy = EXCLUDED.policy,
             last_updated = NOW(),
             last_requested = NOW()`,
        [domain, content]
      );
      console.log(`Saved to PostgreSQL: ${domain}`);
    } catch (err) {
      console.error('Postgres INSERT error:', err.message);
    }
}
  
export function getWebsiteInput() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  
    return new Promise((resolve) => {
      rl.question("Enter website URL: ", (url) => {
        rl.close();
        resolve(url.trim());
      });
    });
}
  

// --- HELPER: Check if a link is "relevant" (heuristics) ---
/**
 * Filters out irrelevant links by:
 *  - Checking if they belong to the same domain
 *  - Avoiding links that point to language-specific pages
 *  - Searching for keywords that indicate privacy-related content
 */
export function isRelevantLink(linkText, linkUrl, baseDomain) {
    // Example "disallowed language code" patterns
    const disallowedLangRegex = /\/(ar|de|es|fr|it|nl|pl|pt|ru|zh)\//i;
    const disallowedLangParamRegex = /[?&](lang|locale)=(ar|de|es|fr|it|nl|pl|pt|ru|zh)/i;

    // Only same domain
    let domainMatches = false;
    try {
        const parsedUrl = new URL(linkUrl);
        domainMatches = (parsedUrl.hostname === baseDomain);
    } catch (err) {
        domainMatches = false;
    }
    if (!domainMatches) return false;

    // Skip if path or query indicates a language we don't want
    if (disallowedLangRegex.test(linkUrl) || disallowedLangParamRegex.test(linkUrl)) {
        return false;
    }

    // Original logic: check keywords
    const keywords = ['privacy', 'data', 'GDPR', 'cookie', 'tracking'];
    const lowerText = linkText.toLowerCase();
    const lowerUrl = linkUrl.toLowerCase();
    const hasKeyword = keywords.some((k) => lowerText.includes(k) || lowerUrl.includes(k));

    return hasKeyword;
}
