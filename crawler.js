/*********************************************************
 *Prologue Comments
 * crawler.js
 * 
 * Description: 
 * 1) Recursively crawls relevant sub-links (max 10 pages).
 * 2) Uses Puppeteer to extract text from the page.
 * 3) Heuristics: only follow links from the same domain
 *    that contain relevant keywords in text or path.
 * 4) Stops crawling when the page limit is reached.
 * 5) Returns the concatenated text content.
 * 
 * Programmer’s name: David Westerhaus & Raven Duong
 * Created: 03/06/2025
 * Revised: 03/06/2025
 * Preconditions: 
 * - Requires Puppeteer and puppeteer-extra with the stealth plugin.
 * - Input URL must be valid and accessible.
 * - The `isRelevantLink` function must be correctly implemented.
 * Postconditions: 
 * - Returns a string containing the extracted text from the crawled pages.
 * - Stops when the page limit is reached.
 * Error and exceptions: None
 * Side effects:  None
 * Invariants:  None
 * Any known faults: None
 *********************************************************/

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { isRelevantLink } from './helpers.js';

puppeteer.use(StealthPlugin());

export async function extractPolicyText(url, visited, maxPages, pageCount) {
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
    browser = await puppeteer.launch({ headless: true , args: ['--no-sandbox', '--disable-setuid-sandbox'],});
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
