Install puppeteer: npm install puppeteer
run: node findpolicy.js 

Steps:
- Get user input 
- Start Puppeteer & Load the Website:
    + Launches Puppeteer (opens a browser window)
    + Creates a new page.
    + Navigates to the user’s entered website (page.goto(url))
    + Waits for the page to fully load (networkidle2 ensures most requests are done)
- Extract All Links from the Page
    + Extracts all <a> links from the webpage using page.$$eval('a', callback)
    + Maps each <a> tag into an object { text, href }:
        text: The clickable text inside the link (e.g., "Privacy Policy")
        href: The actual URL of the link (e.g., "https://www.example.com/privacy-policy")
- Search for the Privacy Policy Link
    + Looks for links that match priority patterns (/privacy-policy, /legal/privacy)
    -> If a match is found, it assigns it to policyLink
    + If no priority pattern is found, it falls back to any link containing "privacy".
    -> This ensures compatibility with sites that have different privacy link structures
    + Ignore Misleading Links
    -> Filters out misleading URLs like Facebook's privacy_mutation_token, which isn't an actual privacy policy. If the selected link contains "privacy_mutation_token", it removes it and continues searching.
- Return the Privacy Policy Link:
    + If a valid privacy policy URL is found, it prints it
    + If no link is found, it returns " No Privacy Policy Found."
- Close Puppeteer & Handle Errors:
    + Handles errors, such as websites that fail to load
    + Ensures Puppeteer closes the browser even if an error occurs
- Main Function - Get User Input & Run the Scraper
    + Runs the script asynchronously (async () => {})
    + Waits for user input (getWebsiteInput())
    + Checks if the input is a valid URL (must start with "http")
    + Calls findPrivacyPolicy(websiteURL) to extract the privacy policy