const puppeteer = require('puppeteer');
const readline = require('readline');
const axios = require('axios');
require('dotenv').config(); 

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const BRAVE_SEARCH_URL = 'https://api.search.brave.com/res/v1/web/search';
console.log('API Key:', process.env.BRAVE_API_KEY); // Debugging line

// Function to get user input (website URL)
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

async function findPrivacyPolicy(url) {
    const browser = await puppeteer.launch({ headless: false });
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

        // If a misleading privacy link is found, discard it
        if (policyLink && policyLink.href.includes("privacy_mutation_token")) {
            policyLink = null;
        }

        if (policyLink) {
            console.log(`Privacy Policy Found: ${policyLink.href}`);
        } else {
            console.log('No Privacy Policy Found. Searching on Brave...');
            await searchBravePrivacyPolicy(url);
        }
    } catch (error) {
        console.error('Error fetching the website:', error.message);
    } finally {
        await browser.close();
    }
}

/**
 * Searches Brave Search API for a privacy policy.
 * @param {string} websiteName - The website name to search for privacy policy.
 */
async function searchBravePrivacyPolicy(websiteName) {
    try {
        const query = websiteName + " privacy policy";
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

        const results = response.data.web.results;
        if (results && results.length > 0) {
            console.log('\n🔎 No privacy policy found directly. Here are the top 3 search results:');
            results.forEach((result, index) => {
                console.log(`${result.url}`);
            });
        } else {
            console.log('No relevant results found.');
        }
    } catch (error) {
        console.error('❌ Error fetching search results:', error.response ? error.response.data : error.message);
    }
}

// Run the script with user input
(async () => {
    const websiteURL = await getWebsiteInput();
    if (!websiteURL.startsWith('http')) {
        console.log("Please enter a valid URL (e.g., https://www.example.com)");
    } else {
        await findPrivacyPolicy(websiteURL);
    }
})();
