const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const readline = require('readline');
const fs = require('fs');

puppeteer.use(StealthPlugin());

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

// Function to extract text from a given URL
async function extractPolicyText(url, visited = new Set()) {
    if (visited.has(url)) return ""; // Avoid visiting the same page twice
    visited.add(url);

    console.log(`Extracting text from: ${url}`);
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Extract all visible text
        const textContent = await page.evaluate(() => {
            return document.body.innerText;
        });

        // Extract relevant links from the page
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

        console.log(`Found ${links.length} relevant links for further extraction.`);

        // Recursively visit and extract text from each found link
        for (let link of links) {
            const additionalText = await extractPolicyText(link.href, visited);
            return textContent + "\n\n" + additionalText;
        }

        return textContent;
    } catch (error) {
        console.error(`Error extracting from ${url}:`, error.message);
        return "";
    } finally {
        await browser.close();
    }
}

// Function to find privacy policy link using policy.js logic
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

        if (policyLink) {
            console.log(`Privacy Policy Found: ${policyLink.href}`);
            return policyLink.href;
        } else {
            console.log('No Privacy Policy Found.');
            return null;
        }
    } catch (error) {
        console.error('Error fetching the website:', error.message);
        return null;
    } finally {
        await browser.close();
    }
}

// Main function to run the script
(async () => {
    const websiteURL = await getWebsiteInput();
    if (!websiteURL.startsWith('http')) {
        console.log("Please enter a valid URL (e.g., https://www.example.com)");
    } else {
        const policyURL = await findPrivacyPolicy(websiteURL);
        if (policyURL) {
            const fullText = await extractPolicyText(policyURL);
            fs.writeFileSync("privacy_policy_text.txt", fullText);
            console.log("Privacy policy text saved to 'privacy_policy_text.txt'");
        }
    }
})();
