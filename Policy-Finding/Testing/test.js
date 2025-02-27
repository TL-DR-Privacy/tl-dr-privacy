const puppeteer = require('puppeteer');

async function extractTextFromLinks(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Extract text inside <a> links and their URLs
        const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                .map(a => ({
                    text: a.innerText.trim(),
                    href: a.href
                }))
                .filter(link => link.text.length > 0 && link.href.startsWith('http'));
        });

        console.log("\nExtracted Links:");
        links.forEach(link => console.log(`- ${link.text}: ${link.href}`));

        let linkTexts = {};
        
        // Visit each found link and extract text from its page
        for (let link of links) {
            console.log(`\nVisiting: ${link.href}`);

            const newPage = await browser.newPage();
            await newPage.goto(link.href, { waitUntil: 'domcontentloaded' });

            const pageText = await newPage.evaluate(() => document.body.innerText);

            linkTexts[link.text] = pageText.substring(0, 500) + '...'; // Show preview of first 500 chars
            console.log(`Extracted Text (${link.text}):\n${linkTexts[link.text]}\n`);

            await newPage.close();
        }

        await browser.close();
        return linkTexts;

    } catch (error) {
        console.error("Error:", error);
        await browser.close();
    }
}

// Replace with the URL you want to extract text from
const url = 'https://www.facebook.com/privacy/policy/?entry_point=facebook_page_footer';
extractTextFromLinks(url);
