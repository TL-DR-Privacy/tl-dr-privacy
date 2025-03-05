/*********************************************************
 * David Westerhaus & Raven Duong
 * extract-final.js
 * Created: 02/21/2025
 * 
 * 1) Finds privacy policy link with ORIGINAL logic.
 * 2) Recursively crawls relevant sub-links (max 10 pages).
 * 3) Falls back to Brave Search if no policy link found.
 * 
 * Adjustment:
 * - The website crawling is now run headless 
 * - 
 *********************************************************/

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth'); //this is used to reduce detection and bot blocking from website 
const readline = require('readline');
const fs = require('fs');
const axios = require('axios');
const { URL } = require('url');
require('dotenv').config();

// Use the StealthPlugin to reduce detection
puppeteer.use(StealthPlugin());

// Brave Search
const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const BRAVE_SEARCH_URL = 'https://api.search.brave.com/res/v1/web/search';

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

// --- HELPER: Generate a filename from the site domain ---
function generateFilename(websiteURL) {
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
function isRelevantLink(linkText, linkUrl, baseDomain) {
    // Example "disallowed language code" patterns
    const disallowedLangRegex = /\/(ar|de|es|fr|it|nl|pl|pt|ru|zh)\//i;
    // If your site uses query params like `?lang=es` or `?locale=fr`, you can add:
    const disallowedLangParamRegex = /[?&](lang|locale)=(ar|de|es|fr|it|nl|pl|pt|ru|zh)/i;

    // Only same domain
    let domainMatches = false;
    try {
        const parsedUrl = new URL(linkUrl);
        domainMatches = (parsedUrl.hostname === baseDomain);
    } catch (err) {
        domainMatches = false;
    }

    // If domain doesn't match, skip
    if (!domainMatches) return false;

    // Skip if path or query indicates a language we don't want
    if (disallowedLangRegex.test(linkUrl) || disallowedLangParamRegex.test(linkUrl)) {
        return false;
    }

    // Original logic: check keywords
    const keywords = ['privacy', 'data', 'GDPR', 'cookie', 'tracking'];
    const lowerText = linkText.toLowerCase();
    const lowerUrl = linkUrl.toLowerCase();

    // Check if ANY keyword appears in the anchor text or in the URL path
    const hasKeyword = keywords.some((k) => 
        lowerText.includes(k) || lowerUrl.includes(k)
    );

    return hasKeyword;
}

// --- Recursive function to extract text (max 10 pages) ---
async function extractPolicyText(url, visited, maxPages, pageCount) {
  // If we have reached the limit, stop
  if (pageCount.count >= maxPages) {
    return "";
  }
  // If we've visited this exact URL before, skip it
  if (visited.has(url)) {
    return "";
  }
  visited.add(url);

  console.log(`Crawling (#${pageCount.count + 1}): ${url}`);
  pageCount.count++;

  let browser;
  let textContent = "";

  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Some extra stealth or user agent spoofs can be set here if needed
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Grab the main text
    textContent = await page.evaluate(() => document.body.innerText || "");

    // Grab all the links on the page
    const anchorData = await page.$$eval('a', (anchors) => {
      return anchors.map(a => ({
        text: a.innerText.trim(),
        href: a.href
      }));
    });

    // Heuristics: only follow links from the same domain
    // that contain relevant keywords in text or path
    const baseDomain = new URL(url).hostname;
    const relevantLinks = anchorData.filter(linkObj => {
      return isRelevantLink(linkObj.text, linkObj.href, baseDomain);
    });

    // Recursively follow those relevant sub-links
    for (let linkObj of relevantLinks) {
      if (pageCount.count >= maxPages) break; // Enforce limit
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

// --- Brave Search fallback if no policy link on the page ---
async function searchBravePrivacyPolicy(site) {
  if (!BRAVE_API_KEY) {
    console.error("Brave API Key is missing! Please set BRAVE_API_KEY in your environment.");
    return null;
  }

  // Use domain in the query
  const domain = new URL(site).hostname.replace("www.", ""); 
  const query = `${domain} privacy policy`;

  try {
    const response = await axios.get(BRAVE_SEARCH_URL, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': BRAVE_API_KEY
      },
      params: {
        q: query,
        count: 3
      }
    });

    const results = response.data.web?.results;
    if (results && results.length > 0) {
      console.log('\nNo on-page policy found. Top Brave Search results:');
      results.forEach((r, i) => {
        console.log(`${i+1}. ${r.url}`);
      });
      // Return the first result (could refine logic to pick the best one)
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

// --- Original "Find Privacy Policy" logic, unchanged ---
/**
 * Finds a privacy policy page link on the website.
 * If no link is found, it falls back to Brave Search.
 */
async function findPrivacyPolicy(url) {
  const browser = await puppeteer.launch({ headless: true }); // headless: false for debugging, true for production 
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Extract all links from the page
    const links = await page.$$eval('a', (anchors) =>
      anchors.map((a) => ({
        text: a.textContent.trim().toLowerCase(),
        href: a.href,
      }))
    );

    // Define priority patterns for privacy policy URLs
    const priorityPatterns = [
      "/privacy-policy", "/privacy", "/legal/privacy", "/policies/privacy"
    ];

    // Prioritize known privacy policy URL structures
    let policyLink = links.find((link) =>
      priorityPatterns.some(pattern => link.href.includes(pattern))
    );

    // If no priority match, fallback to any link containing "privacy"
    if (!policyLink) {
      policyLink = links.find(
        (link) => /privacy/i.test(link.text) || /privacy/i.test(link.href)
      );
    }

    // (In the original code you had a check for "privacy_mutation_token",
    //  but it's not specifically included here. If you need it, add:)
    // if (policyLink && policyLink.href.includes("privacy_mutation_token")) {
    //   policyLink = null;
    // }

    await browser.close();

    if (policyLink) {
      console.log(`Privacy Policy Found: ${policyLink.href}`);
      return policyLink.href;
    } else {
      console.log('No Privacy Policy Found on the page. Searching on Brave...');
      return await searchBravePrivacyPolicy(url);
    }
  } catch (error) {
    console.error('Error fetching the website:', error.message);
    await browser.close();
    return null;
  }
}

// --- Main: run the script ---
(async () => {
  const site = await getWebsiteInput();
  if (!site.startsWith('http')) {
    console.log("Please enter a valid URL (e.g., https://www.example.com)");
    process.exit(1);
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

  // 3) Save to a file
  const filename = generateFilename(site);
  fs.writeFileSync(filename, fullText, 'utf8');
  console.log(`\n Privacy policy text (max ${maxPages} pages) saved to: ${filename}`);
})();
