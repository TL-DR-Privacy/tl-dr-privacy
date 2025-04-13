/*********************************************************
 *Prologue Comments
 * crawler.js
 * 
 * Description: 
 * 1) Recursively crawls relevant sub-links (max 1 page).
 * 2) Uses Puppeteer to extract text from the page.
 * 3) Heuristics: only follow links from the same domain
 *    that contain relevant keywords in text or path.
 * 4) Stops crawling when the page limit is reached.
 * 5) Returns the concatenated text content.
 * 
 * Programmer’s name: David Westerhaus & Raven Duong
 * Created: 03/06/2025
 * Revised: 04/13/2025
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
  if (pageCount.count >= maxPages || visited.has(url)) {
    return "";
  }

  visited.add(url);
  pageCount.count++;
  console.log(`Crawling (#${pageCount.count}): ${url}`);

  let browser;
  let textContent = "";

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1366, height: 768 });

    // Fast initial load
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      textContent = await page.evaluate(() => document.body.innerText || "");
    } catch (fastErr) {
      console.warn(`Initial fast load failed for ${url}:`, fastErr.message);
    }

    // If text is too short or empty, try again with networkidle2
    if (!textContent || textContent.trim().length < 200) {
      console.log(`🕵️ Retrying ${url} with networkidle2...`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      textContent = await page.evaluate(() => document.body.innerText || "");
    }

  } catch (error) {
    console.error(`Error extracting text from ${url}:`, error.message);
  } finally {
    if (browser) await browser.close();
  }

  return textContent;
}
