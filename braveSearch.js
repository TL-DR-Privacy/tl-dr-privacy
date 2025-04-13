/*********************************************************
 * Prologue Comments
 * braveSearch.js
 *
 * Description: 
 * 1) Uses Brave Search API to find privacy policy links.
 * 2) Returns the top results.
 * Programmer’s name: David Westerhaus
 * Created: 03/06/2025
 * Revised: 03/06/2025
 * Preconditions: 
 * - Requires a valid Brave Search API key stored in the environment variables
 * - The input must be a valid website URL
 * Postconditions: 
 * - Returns a URL string of the most relevant privacy policy found
 * - If no results are found, returns null
 * Error and exceptions: None
 * Side effects: None
 * Invariants: None
 * Any known faults: None
 *********************************************************/

import axios from 'axios';
import { URL } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const BRAVE_SEARCH_URL = 'https://api.search.brave.com/res/v1/web/search';

export async function searchBravePrivacyPolicy(site) {
  if (!BRAVE_API_KEY) {
    console.error("Brave API Key is missing! Please set BRAVE_API_KEY in your environment.");
    return null;
  }

  // Use domain in the query
  const domain = new URL(site).hostname.replace("www.", "");
  const query = `${domain} privacy policy`;

  try {
    const response = await axios.get(BRAVE_SEARCH_URL, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': BRAVE_API_KEY
      },
      params: {
        q: query,
        count: 1
      }
    });

    const results = response.data.web?.results;
    if (results && results.length > 0) {
      console.log('\nNo on-page policy found. Top Brave Search results:');
      results.forEach((r, i) => {
        console.log(`${i+1}. ${r.url}`);
      });
      // Return the first result (could refine logic to pick the best one)
      return results[0].url;
    } else {
      console.log("No relevant results found via Brave.");
      return null;
    }
  } catch (error) {
    console.error('Error fetching Brave search results:', error.message);
    return null;
  }
}
