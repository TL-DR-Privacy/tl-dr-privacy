/*********************************************************
 * Raven Duong
 * policy.js
 * 
 * 1) Uses Puppeteer to navigate a user-provided website URL and search for a privacy policy link
 * 2) Prioritizes URLs with common privacy-related keywords and extracts relevant links from the page
 * 3) If a privacy policy is found, it displays the link; otherwise, it informs the user that no policy was located
 * 
 *********************************************************/
const puppeteer = require('puppeteer');
const readline = require('readline');

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
            console.log('No Privacy Policy Found.');
        }
    } catch (error) {
        console.error('Error fetching the website:', error.message);
    } finally {
        await browser.close();
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