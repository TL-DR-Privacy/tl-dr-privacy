/*********************************************************
 * Prologue Comments
 * helpers.js
 * 
 * Description:
 * 1) Contains helper functions for the policy-finding process.
 * 2) Includes functions for user input and filename generation.
 * 3) Defines a function to check if a link is relevant.
 * 4) Uses AWS SDK v3 for S3 storage.
 * 
 * Programmer’s name: David Westerhaus & Raven Duong
 * Created: 03/06/2025
 * Revised: 03/06/2025
 * Preconditions: 
 * Postconditions: 
 * Error and exceptions: 
 * Side effects:
 * Invariants:
 * Any known faults: 
 * 
 *********************************************************/

import { S3Client, HeadObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { URL } from 'url';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

// AWS S3 Configuration (Using SDK v3)
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// --- Check If Privacy Policy Already Exists in S3 ---
export async function checkIfFileExists(filename) {
    const params = {
        Bucket: BUCKET_NAME,
        Key: filename
    };

    try {
        await s3.send(new HeadObjectCommand(params)); // Check if file exists
        console.log(`Privacy policy already exists in S3: ${filename}`);
        return true;
    } catch (error) {
        if (error.name === 'NotFound') {
            return false; // File does not exist, but no unnecessary logging
        } else {
            console.error("Error checking S3:", error.message);
            return false;
        }
    }
}

// --- Retrieve an Existing Privacy Policy from S3 ---
export async function getExistingPolicy(filename) {
    const params = {
        Bucket: BUCKET_NAME,
        Key: filename
    };

    try {
        const data = await s3.send(new GetObjectCommand(params));
        const bodyContents = await data.Body.transformToString();
        return bodyContents;
    } catch (error) {
        if (error.name === 'NoSuchKey') {
            return null; // File not found, avoid unnecessary logs
        } else {
            console.error("Error retrieving S3 file:", error.message);
            return null;
        }
    }
}

// --- Upload to S3 (Without Rechecking) ---
export async function uploadToS3(filename, content, alreadyChecked = false) {
    // Skip redundant checks if we already confirmed the file does not exist
    if (!alreadyChecked) {
        const exists = await checkIfFileExists(filename);
        if (exists) {
            console.log(`Skipping upload: Privacy policy for ${filename} already exists in S3.`);
            return;
        }
    }

    const params = {
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: content,
        ContentType: "text/plain"
    };

    try {
        await s3.send(new PutObjectCommand(params));
        console.log(`Uploaded to S3: ${filename}`);
    } catch (error) {
        console.error("Error uploading to S3:", error.message);
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

// --- Generate a filename from the site domain ---
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
