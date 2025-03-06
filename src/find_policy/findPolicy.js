/*********************************************************
 * David Westerhaus & Raven Duong
 * findPolicy.js
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

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { searchBravePrivacyPolicy } from './braveSearch.js';
import dotenv from 'dotenv';
dotenv.config();

puppeteer.use(StealthPlugin());

export async function findPrivacyPolicy(url) {
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
