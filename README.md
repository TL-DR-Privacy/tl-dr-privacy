# TL;DR Privacy - Backend Web Server

This repository contains the backend web server that powers the **TL;DR Privacy** Chrome extension. The server is responsible for fetching, summarizing, and analyzing privacy policies from websites.

## 🚀 Overview

The backend processes requests from the Chrome extension, scrapes website privacy policies, and provides concise summaries using AI models. It integrates with **Google's Generative AI**, **AWS S3**, and **Brave Search** for retrieving and analyzing policy data.

---

## 📂 Project Structure

Here's a breakdown of the key files and directories:

### **Main Files**
- **`main.js`** – Entry point for the backend server, handles HTTP requests and communication with the extension.
- **`helpers.js`** – Utility functions for processing text, filtering relevant links, and extracting privacy policy content.
- **`braveSearch.js`** – Functions for querying Brave Search to find privacy policies efficiently.
- **`crawler.js`** - Crawls privacy webpage for relevant links. Extracts all relevent text regarding user privacy.

### **Dependencies & Config**
- **`package.json`** – Lists dependencies and scripts for running the server.
- **`.env`** – Stores API keys and configuration settings (ensure you create this file before running the server).
- **`node_modules/`** – Contains installed dependencies (generated after running `npm install`).

### **AI Integration**
- **`gemini.js`** – Handles requests to Google’s Generative AI API for summarizing privacy policies.

---

## 🔧 Installation & Setup

### 1️⃣ **Clone the Repository**
```sh
git clone https://github.com/TL-DR-Privacy/tl-dr-privacy.git
cd tl-dr-privacy
