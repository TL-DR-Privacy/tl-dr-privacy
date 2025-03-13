/*********************************************************
 * Prologue Comments
 * findPolicy.js
 * 
 * Description:
 * 1) When given a URL, this script will attempt to find a privacy policy link on the page. It does this by:
 *   - Prioritizing known privacy policy URL structures
 *   - Fallback to any link containing "privacy"
 *   - If no policy link found, it will search on Brave
 * 2) If a policy link is found, it will return the URL.
 * 3) If no policy link is found, it will return null.
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

  // was in original code but idk if we need
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
