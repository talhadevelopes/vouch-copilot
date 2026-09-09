# API Reference

This document provides a detailed overview of the key API endpoints and authentication flow for the Vouch platform.

## Authentication Flow

Vouch uses JWT-based authentication with Access and Refresh tokens.

### Core Endpoints

- POST /auth/register: Create a new user account with email, name, and password.
- POST /auth/login: Authenticate with email and password to receive Access and Refresh tokens.
- POST /auth/google: Authenticate using a Google OAuth Access Token for social login.
- POST /auth/demo-login: Instant login as a demo user for quick testing and review.
- POST /auth/otp/request: Request a 6-digit one-time password (OTP) via email.
- POST /auth/otp/verify: Verify the OTP and receive tokens.
- GET /auth/me: Retrieve the currently authenticated user's profile information.
- POST /auth/logout: Revoke tokens and terminate the current session.

### Sidebar Linking

- POST /auth/extension/link-code: (Authenticated) Generate a 24-hour 6-digit code to link the browser sidebar.
- POST /auth/extension/link-code/exchange: Exchange a valid link code for a full JWT session.

## AI Services

All AI endpoints require a valid Access Token and provide real-time analysis using Google Gemini.

### Content Verification

- POST /verify: Extract and verify the top factual claims from a provided block of text.
- POST /verify/stream: (SSE) Stream a detailed fact-check for a specific claim with Google Search grounding.

### Language Analysis

- POST /analyze: Run a deep linguistic scan for bias, manipulative language, and overall tone detection.

### Conversational Chat

- POST /chat: (SSE) Start or continue an AI conversation about a specific article's content.

## Dashboard and Data

Endpoints for managing user data and public reporting.

- GET /dashboard/history: Fetch the authenticated user's persistent analysis history.
- GET /dashboard/analysis/:id: Retrieve the full details of a specific past analysis.
- POST /dashboard/analysis/:id/share: Generate a unique public link for an analysis report.
- GET /public/analysis/:shareId: (Public) View a shared analysis report without authentication.

## Response Formats

All non-streaming endpoints follow a standard JSON structure:

### Success Response
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "A detailed error message",
  "error": "ERROR_CODE",
  "status_code": 400
}
```
