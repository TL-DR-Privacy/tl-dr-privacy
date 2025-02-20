const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const axios = require('axios');
require('dotenv').config();

puppeteer.use(StealthPlugin());

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const BRAVE_SEARCH_URL = 'https://api.search.brave.com/res/v1/web/search';

//Get user input (website URL)
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

//Generate a unique filename based on the website URL
function generateFilename(url) {
    try {
        const domain = new URL(url).hostname.replace(/\./g, "_");
        return `privacy_policy_${domain}.txt`;
    } catch (error) {
        console.error("Invalid URL format.");
        return "privacy_policy_generic.txt";
    }
}

//Extract text from a given URL and follow additional privacy-related links, avoiding duplicates
async function extractPolicyText(url, visited = new Set(), extractedTexts = new Set()) {
    if (visited.has(url)) return ""; //Avoid visiting the same page twice
    visited.add(url);

    console.log(`Extracting text from: ${url}`);
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        //Extract all visible text
        let textContent = await page.evaluate(() => document.body.innerText);
        if (extractedTexts.has(textContent)) {
            console.log("Duplicate content detected. Skipping...");
            return "";
        }
        extractedTexts.add(textContent);

        //Extract relevant links from the page
        const links = await page.$$eval('a', (anchors) =>
            anchors
                .map(a => ({
                    text: a.textContent.trim().toLowerCase(),
                    href: a.href
                }))
                .filter(link =>
                    link.href &&
                    !link.href.includes("javascript:void(0)") &&
                    (link.text.includes("privacy") ||
                     link.text.includes("terms") ||
                     link.text.includes("policy") ||
                     link.text.includes("data") ||
                     link.text.includes("security"))
                )
        );

        console.log(`Found ${links.length} additional privacy-related links.`);
        for (let link of links) {
            if (!visited.has(link.href)) {
                console.log(`Following additional link: ${link.href}`);
                const additionalText = await extractPolicyText(link.href, visited, extractedTexts);
                textContent += "\n\n" + additionalText;
            }
        }

        return textContent;
    } catch (error) {
        console.error(`Error extracting from ${url}:`, error.message);
        return "";
    } finally {
        await browser.close();
    }
}

//Find privacy policy link
async function findPrivacyPolicy(url) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });

        //Extract all links from the page
        const links = await page.$$eval('a', (anchors) =>
            anchors.map((a) => ({
                text: a.textContent.trim().toLowerCase(),
                href: a.href,
            }))
        );

        //Define priority patterns for privacy policy URLs
        const priorityPatterns = [
            "/privacy-policy", "/privacy", "/legal/privacy", "/policies/privacy"
        ];

        //Prioritize known privacy policy URL structures
        let policyLink = links.find((link) =>
            priorityPatterns.some(pattern => link.href.includes(pattern))
        );

        //If no priority match, fallback to any link containing "privacy"
        if (!policyLink) {
            policyLink = links.find(
                (link) => /privacy/i.test(link.text) || /privacy/i.test(link.href)
            );
        }

        if (policyLink) {
            console.log(`Privacy Policy Found: ${policyLink.href}`);
            return policyLink.href;
        } else {
            console.log('No Privacy Policy Found. Searching on Brave...');
            return await searchBravePrivacyPolicy(url);
        }
    } catch (error) {
        console.error('Error fetching the website:', error.message);
        return null;
    } finally {
        await browser.close();
    }
}

//Search Brave API for Privacy Policy if not found on site
async function searchBravePrivacyPolicy(site) {
    if (!BRAVE_API_KEY) {
        console.error("Brave API Key is missing! Set BRAVE_API_KEY in .env.");
        return null;
    }

    const domain = new URL(site).hostname.replace("www.", ""); 
    const query = `${domain} privacy policy`; 
    const url = `${BRAVE_SEARCH_URL}?q=${encodeURIComponent(query)}&count=3`;

    try {
        console.log(`Searching Brave for privacy policy: ${query}`);
        const response = await axios.get(url, {
            headers: {
                "Accept": "application/json",
                "X-Subscription-Token": BRAVE_API_KEY
            }
        });

        const results = response.data.web?.results || [];
        if (results.length > 0) {
            console.log("\nNo privacy policy found directly. Here are the top 3 search results:");
            results.forEach((result, index) => {
                console.log(`${index + 1}. ${result.url}`);
            });
            return results[0].url; // Use the first search result
        } else {
            console.log("No relevant results found.");
            return null;
        }
    } catch (error) {
        console.error(`Error using Brave Search API: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        return null;
    }
}

//Main 
(async () => {
    const websiteURL = await getWebsiteInput();
    if (!websiteURL.startsWith('http')) {
        console.log("Please enter a valid URL (e.g., https://www.example.com)");
    } else {
        let policyURL = await findPrivacyPolicy(websiteURL);
        if (policyURL) {
            const fullText = await extractPolicyText(policyURL);
            const filename = generateFilename(websiteURL);
            fs.writeFileSync(filename, fullText);
            console.log(`Privacy policy text saved to '${filename}'`);
        }
    }
})();
