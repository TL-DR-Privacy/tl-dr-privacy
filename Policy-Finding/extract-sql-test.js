/*********************************************************
 * This script extracts privacy policies from websites.
 * - Finds privacy policy links on a website
 * - Recursively crawls relevant sub-links (max 10 pages)
 * - Falls back to Brave Search if no policy is found
 * - Saves extracted text to AWS S3
 *********************************************************/

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth'); // Prevents bot detection
const readline = require('readline');
const fs = require('fs');
const axios = require('axios');
const { URL } = require('url');
require('dotenv').config();

// Use the StealthPlugin to reduce detection
puppeteer.use(StealthPlugin());

// Brave Search API
const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const BRAVE_SEARCH_URL = 'https://api.search.brave.com/res/v1/web/search';

// AWS SDK for S3
const AWS = require('aws-sdk');
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});
const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// --- User Input (website URL) ---
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function getWebsiteInput() {
    return new Promise((resolve) => {
        rl.question("Enter website URL: ", (url) => {
            rl.close();
            resolve(url.trim());
        });
    });
}

// --- Generate a filename from the site domain ---
function generateFilename(site) {
    try {
        const domain = new URL(site).hostname.replace(/\./g, "_");
        return `privacy_policy_${domain}.txt`;
    } catch (err) {
        return 'privacy_policy_generic.txt';
    }
}

// --- Helper: Check if a link is relevant ---
function isRelevantLink(linkText, linkUrl, baseDomain) {
    const disallowedLangRegex = /\/(ar|de|es|fr|it|nl|pl|pt|ru|zh)\//i;
    const disallowedLangParamRegex = /[?&](lang|locale)=(ar|de|es|fr|it|nl|pl|pt|ru|zh)/i;

    let domainMatches = false;
    try {
        domainMatches = new URL(linkUrl).hostname === baseDomain;
    } catch (err) {
        domainMatches = false;
    }

    if (!domainMatches) return false;
    if (disallowedLangRegex.test(linkUrl) || disallowedLangParamRegex.test(linkUrl)) return false;

    const keywords = ['privacy', 'data', 'GDPR', 'cookie', 'tracking'];
    return keywords.some((k) => linkText.toLowerCase().includes(k) || linkUrl.toLowerCase().includes(k));
}

// --- Extract Privacy Policy Text (Recursive, max 10 pages) ---
async function extractPolicyText(url, visited, maxPages, pageCount) {
    if (pageCount.count >= maxPages || visited.has(url)) return "";
    visited.add(url);
    console.log(`Crawling (#${pageCount.count + 1}): ${url}`);
    pageCount.count++;

    let browser;
    let textContent = "";

    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        textContent = await page.evaluate(() => document.body.innerText || "");

        const baseDomain = new URL(url).hostname;
        const anchorData = await page.$$eval('a', (anchors) => 
            anchors.map(a => ({ text: a.innerText.trim(), href: a.href }))
        );
        const relevantLinks = anchorData.filter(linkObj => 
            isRelevantLink(linkObj.text, linkObj.href, baseDomain)
        );

        for (let linkObj of relevantLinks) {
            if (pageCount.count >= maxPages) break;
            const subText = await extractPolicyText(linkObj.href, visited, maxPages, pageCount);
            textContent += `\n\n${subText}`;
        }

    } catch (error) {
        console.error(`Error extracting text from ${url}:`, error.message);
    } finally {
        if (browser) await browser.close();
    }
    
    return textContent;
}

// --- Search Brave for Privacy Policy ---
async function searchBravePrivacyPolicy(site) {
    if (!BRAVE_API_KEY) {
        console.error("Brave API Key is missing! Please set BRAVE_API_KEY in your environment.");
        return null;
    }

    const domain = new URL(site).hostname.replace("www.", ""); 
    const query = `site:${domain} privacy policy`;

    try {
        const response = await axios.get(BRAVE_SEARCH_URL, {
            headers: { 'Accept': 'application/json', 'X-Subscription-Token': BRAVE_API_KEY },
            params: { q: query, count: 3 }
        });

        const results = response.data.web?.results;
        if (results && results.length > 0) {
            console.log('\nNo on-page policy found. Top Brave Search results:');
            results.forEach((r, i) => console.log(`${i+1}. ${r.url}`));
            return results[0].url;
        } else {
            console.log("No relevant results found via Brave.");
            return null;
        }
    } catch (error) {
        console.error('Error fetching Brave search results:', error.message);
        return null;
    }
}

// --- Find Privacy Policy Link ---
async function findPrivacyPolicy(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });

        const links = await page.$$eval('a', (anchors) =>
            anchors.map((a) => ({ text: a.textContent.trim().toLowerCase(), href: a.href }))
        );

        const priorityPatterns = ["/privacy-policy", "/privacy", "/legal/privacy", "/policies/privacy"];
        let policyLink = links.find(link => priorityPatterns.some(pattern => link.href.includes(pattern)));
        if (!policyLink) {
            policyLink = links.find(link => /privacy/i.test(link.text) || /privacy/i.test(link.href));
        }

        await browser.close();
        return policyLink ? policyLink.href : await searchBravePrivacyPolicy(url);
    } catch (error) {
        console.error('Error fetching the website:', error.message);
        await browser.close();
        return null;
    }
}

// --- Upload Privacy Policy to S3 ---
async function uploadToS3(filename, content) {
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

// --- Main Execution ---
(async () => {
    const site = await getWebsiteInput();
    if (!site.startsWith('http')) {
        console.log("Please enter a valid URL (e.g., https://www.example.com)");
        process.exit(1);
    }

    const policyUrl = await findPrivacyPolicy(site);
    if (!policyUrl) {
        console.log("No privacy policy URL found. Exiting...");
        process.exit(0);
    }

    const visited = new Set();
    const pageCount = { count: 0 };
    const maxPages = 10;
    const fullText = await extractPolicyText(policyUrl, visited, maxPages, pageCount);

    if (fullText) {
        const filename = generateFilename(site);
        fs.writeFileSync(filename, fullText);
        await uploadToS3(filename, fullText);
    }
})();
