# Vouch Web Copilot

**🌐 Live Demo:** [https://vouch-copilot.vercel.app](https://vouch-copilot.vercel.app)

Vouch is a Chrome extension that acts as your intelligent AI copilot while you read articles online. It doesn't just check facts — it serves as a full conversational assistant that can summarize pages, answer specific questions about what you are reading, and analyze the content for bias and manipulation.

## The Problem
When reading news today, it is hard to instantly know if a claim is accurate, if the author is using manipulative language to sway your opinion, or to quickly find specific answers buried in long pieces. Most readers don't have the time to manually search every claim or read thousands of words to get the gist.

Vouch solves this by bringing the AI directly to the page you are reading, working seamlessly in your browser sidebar.

## Features

* **Chat Interface**: Talk to Vouch about the article you are reading. Ask for a summary, clarify complex topics, or ask it to find specific quotes.
* **Auto Page Extraction**: Automatically extracts the readable text from news pages without the clutter to improve AI processing.
* **Factual Verification**: Scans the page, extracts key verifiable claims, and checks them against the web to show if they are supported, contradicted, or unverified. 
* **Vouch This**: Select any piece of text on a page, right-click, and select "Vouch this" to instantly verify that specific claim.
* **Bias and Language Analysis**: Scans the article to detect overall tone, manipulative language, and opinions presented as facts.
* **Interactive Highlights**: Clicking on checked claims or biased sentences in the sidebar will automatically highlight that exact text directly on the webpage.
* **Chat History**: Your chat sessions for each article are saved locally for 72 hours, so you can always pick up where you left off.

## Tech Stack

### Extension (Frontend)
* React 18
* TypeScript
* Vite
* Mozilla Readability (for clean article extraction)

### Server (Backend)
* Bun runtime
* Hono web framework
* Upstash Redis (for caching API responses)
* Google Gemini (Core AI model)

## Getting Started

To run Vouch locally, you need to spin up both the backend server and the extension.

### 1. Start the Server
Navigate to the `server` directory, install dependencies, and start the development server.

```bash
cd server
bun install
```

Create a `.env` file in the server directory with:
```
PORT=3000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

Then run:
```bash
bun dev
```

### 2. Build the Extension
Navigate to the `extension` directory, install dependencies, and build the project.

```bash
cd extension
npm install
npm run dev
```
Wait for the build to finish. It will create a `dist` folder.

### 3. Load into Chrome
1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" in the top right corner.
3. Click "Load unpacked" and select the `extension/dist` folder you just built.
4. Pin the Vouch extension and open the Chrome side panel to start using it.

## Contributing
Since this is an internal tool, outside contributions are not currently accepted. If you have access to the repository, feel free to open a pull request for review.

## License
All rights reserved. This source code and project belong exclusively to Vouch. Unauthorized copying, modification, distribution, or use of this project outside of Vouch is strictly prohibited.