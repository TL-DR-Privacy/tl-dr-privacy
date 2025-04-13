import { findPrivacyPolicy } from './findPolicy.js';
import { extractPolicyText } from './crawler.js';
import { summarizeText } from './gemini.js';
import { generateFilename, uploadToPostgres } from './helpers.js';

const TOP_SITES = [
    "https://google.com",
    "https://youtube.com",
    "https://facebook.com",
    "https://x.com", // formerly Twitter
    "https://instagram.com",
    "https://baidu.com",
    "https://wikipedia.org",
    "https://yahoo.com",
    "https://amazon.com",
    "https://reddit.com",
    "https://whatsapp.com",
    "https://linkedin.com",
    "https://netflix.com",
    "https://office.com",
    "https://live.com",
    "https://tiktok.com",
    "https://microsoft.com",
    "https://bing.com",
    "https://zoom.us",
    "https://pinterest.com",
    "https://apple.com",
    "https://quora.com",
    "https://ebay.com",
    "https://stackexchange.com",
    "https://medium.com",
    "https://github.com",
    "https://cnn.com",
    "https://bbc.com",
    "https://nytimes.com",
    "https://roblox.com",
    "https://espn.com",
    "https://imdb.com",
    "https://etsy.com",
    "https://adobe.com",
    "https://canva.com",
    "https://spotify.com",
    "https://dropbox.com",
    "https://wordpress.com",
    "https://salesforce.com",
    "https://cloudflare.com",
    "https://zoom.com",
    "https://weather.com",
    "https://coursera.org",
    "https://khanacademy.org",
    "https://openai.com",
    "https://codepen.io",
    "https://discord.com",
    "https://trello.com",
    "https://notion.so",
    "https://stackoverflow.com"
  ];
  
  

(async () => {
  console.log("🔁 Starting monthly deep crawl for top sites...");

  for (const site of TOP_SITES) {
    try {
      const filename = generateFilename(site);
      const policyUrl = await findPrivacyPolicy(site);
      if (!policyUrl) {
        console.warn(`⚠️ No policy found for ${site}`);
        continue;
      }

      const visited = new Set();
      const pageCount = { count: 0 };
      const maxPages = 10;

      const fullText = await extractPolicyText(policyUrl, visited, maxPages, pageCount);
      const finalText = fullText
        .replace(/\s+/g, ' ')
        .replace(/[^\x21-\x7E]/g, '')
        .trim();

      if (!finalText || finalText.length < 200) {
        console.warn(`⚠️ Skipping ${site} — extracted text too short.`);
        continue;
      }

      const summary = await summarizeText(finalText);
      await uploadToPostgres(filename, summary);
      console.log(`✅ Updated summary for ${site}`);

    } catch (err) {
      console.error(`❌ Error updating ${site}:`, err.message);
    }
  }

  console.log("✅ Monthly update complete.");
})();
