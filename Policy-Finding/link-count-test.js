/*********************************************************
 * Raven Duong
 * link-count.js
 * 
 * Find out how many links are present on a webpage and list them out.
 * 
 *********************************************************/
const puppeteer = require('puppeteer');

async function countLinks(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Extract all links and remove duplicates
        const links = await page.evaluate(() => {
            return Array.from(new Set(
                Array.from(document.querySelectorAll('a'))
                    .map(a => a.href.trim())
                    .filter(href => href.startsWith('http')) // Keep only valid links
            ));
        });

        console.log(`\nTotal Links Found: ${links.length}`);
        links.forEach((link, index) => console.log(`${index + 1}. ${link}`));

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await browser.close();
    }
}

// Replace with the URL you want to check
const url = 'https://www.facebook.com/privacy/policy/?entry_point=facebook_page_footer';
countLinks(url);
