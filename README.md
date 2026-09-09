# Vouch Web Copilot

Your Personalized AI companion for Browser-Native Intelligence.

### System Design

![Vouch System Design](./docs/system-design.png)

> End-to-end architecture showing how the sidebar, web dashboard, Express API, AI pipeline, and data layer interact. See [Architecture Docs](./docs/ARCHITECTURE.md) for a written breakdown.

---

### Live Links
- Dashboard: https://vouch-copilot.vercel.app
- Source Code: https://github.com/talhadevelopes/vouch-webcopilot

### Description
Vouch is a browser-native AI platform that brings powerful intelligence directly into any webpage you visit.
No copy-pasting, no tab switching, no re-explaining. Highlight a claim and verify it, scan an article for bias, or chat with the page directly. The intelligence comes to you.

### Problem: Context Switching Fatigue
Reading online today is frustrating. You see claims you want to verify, jargon you don't understand, or bias you want to spot, but current AI tools break your flow. You have to copy text, open new tabs, paste content, and repeatedly explain context.

### Solution: Browser-Native AI Intelligence
Vouch changes this completely. It works natively inside your browser. The AI automatically understands the current page, so you can highlight text, ask questions, or run full analysis with zero friction. The result is a seamless experience that feels like having a personal research assistant always available on every site.

### Features

#### Core Browser Experience
- Works on any webpage instantly without needing to paste URLs or to provide extra context at all.
- "Vouch This" feature: Highlight any text and right-click to get instant, targeted AI analysis with search-grounded verification
- Real-time full page scanning that extracts and evaluates key claims with clear verdicts

#### Live Interaction and Highlights
- Smart yellow highlighting on the original page with one-click navigation to the exact location
- Context-aware conversational chat that maintains full understanding of the current article for follow-up questions

#### Advanced AI Analysis
- Bias scored 0-100 with political leaning detection, sentence-level manipulation flagging, and opinion-as-fact identification.
- Search grounding using live web data to reduce hallucinations and provide reliable sources
- Streaming responses for natural, real-time conversation flow

#### Web Dashboard
- New Analysis tool: Paste any URL on the website to run complete AI verification
- Persistent history of all analyses with summaries and key metrics
- Detailed report view with claims, proof, bias breakdown, and visual highlight previews
- Public shareable links for easy sharing of analysis results
- Demo login for instant testing with pre-loaded examples

### Key Performance Metrics
- 5+ live web sources cited per verified claim via Google Search grounding
- Bias quantified as a numeric score (0-100) with sentence-level manipulation detection
- Per-article chat history persisted with 72-hour expiry, full persistence for logged-in users
- Single right-click triggers a fully sourced fact report in under 3 seconds
- 100% end-to-end type safety via Zod + TypeScript across all packages
- Works on any webpage with zero user-provided context

### Quick Start
1. Open the Dashboard at https://vouch-copilot.vercel.app
2. Go to login and click "Continue with Demo User"
3. Try analysis directly on the dashboard or install the sidebar for the complete in-browser experience

### Documentation
For more detailed technical information, please refer to the following documents in the docs directory:

- [System Architecture](./docs/ARCHITECTURE.md): Detailed breakdown of the monorepo structure, AI pipeline, and synchronization logic.
- [API Reference](./docs/API_REFERENCE.md): Overview of authentication flows and AI service endpoints.
- [Contributing and Setup](./docs/CONTRIBUTING.md): Instructions for local development and project standards.

### Tech Stack

| Layer            | Technologies |
|------------------|--------------|
| Monorepo         | Turborepo, pnpm |
| Web Dashboard    | Next.js 15, React 18, Tailwind CSS, Framer Motion, Recharts |
| Backend          | Node.js, Express, Prisma, PostgreSQL |
| Sidebar          | React 18, TypeScript, Vite, Chrome Extension APIs |
| AI               | Google Gemini 1.5 Flash with search grounding |
| Authentication   | JWT, Email/Password, Google OAuth, OTP |
| Additional       | Server-Sent Events, Zod, Upstash Redis |