/*********************************************************
 * David Westerhaus & Raven Duong
 * helpers.js
 * Created: 02/21/2025
 * 
 * 1) Contains helper functions for the policy-finding process.
 * 2) Includes functions for user input and filename generation.
 * 3) Defines a function to check if a link is relevant.
 *********************************************************/

import AWS from 'aws-sdk';
import { URL } from 'url';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

// AWS S3 Configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME;


// --- Check If Privacy Policy Already Exists in S3 ---
export async function checkIfFileExists(filename) {
  const params = {
      Bucket: BUCKET_NAME,
      Key: filename
  };

  try {
      await s3.headObject(params).promise(); // Check if file exists
      console.log(`Privacy policy already exists in S3: ${filename}`);
      return true; // File exists
  } catch (error) {
      if (error.code === 'NotFound') {
          return false; // File does not exist
      } else {
          console.error("Error checking S3:", error);
          return false;
      }
  }
}

// --- Upload to S3 (Prevents Duplicates) ---
export async function uploadToS3(filename, content) {
  // First, check if the file already exists
  const exists = await checkIfFileExists(filename);
  if (exists) {
      console.log(`Skipping upload: Privacy policy for ${filename} already exists in S3.`);
      return; // Stop function if file exists
  }

  // Upload if the file does not exist
  const params = {
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: content,
      ContentType: "text/plain"
  };

  try {
      await s3.upload(params).promise();
      console.log(`Uploaded to S3: ${filename}`);
  } catch (error) {
      console.error("Error uploading to S3:", error);
  }
}

// --- User Input (website URL) ---
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

// --- HELPER: Generate a filename from the site domain ---
export function generateFilename(websiteURL) {
  try {
    const domain = new URL(websiteURL).hostname.replace(/\./g, "_");
    return `privacy_policy_${domain}.txt`;
  } catch (err) {
    return 'privacy_policy_generic.txt';
  }
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
