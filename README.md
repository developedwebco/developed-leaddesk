# DevEloped LeadDesk — Outbound Web Sales CRM
**Built for Dev — DevEloped Web Co. (Albuquerque, NM)**

A Salesforce-style dark-mode outbound CRM and Power Dialer built specifically for finding local businesses without a real website, ranking them with an automatic Pitch Score, calling them fast, and tracking follow-ups and deals until they buy.

## Quick Start

```powershell
cd C:\Users\Dev\.gemini\antigravity\scratch\developed-leaddesk
node server.js
```

Then open **http://localhost:3456** in your browser.

## Key Features Included

1. **Lead Finder (Google Maps / Places Scrubber)**:
   - Search by category, US city/area (defaults to **Albuquerque, NM**), and radius.
   - Paste your **Google Places API Key** in **Settings** for live Google Maps scrubbing, or use the built-in **Sample / Demo Lead Scrubber** (clearly labeled).
   - Automatically filters out businesses with a real custom website or `<10 reviews`, and flags social/booking-only links (Booksy, Square, GlossGenius, Linktree, Instagram) as **Weak Presence**.

2. **Pitch Score (0–100) & Custom Pitch Angle**:
   - Ranks every prospect based on review volume, 4.0+ rating, website lack (`None` > `Weak Presence`), high-demand category, and momentum.
   - Generates a one-line custom pitch hook per business.

3. **Salesforce-Style 9-Stage Pipeline & Follow-Ups Queue**:
   - Drag-and-drop Kanban across: `New Lead` → `Called` → `Owner Not There` → `Callback Scheduled` → `Interested` → `Sample Sent` → `Sold` → `Not Interested` → `Do Not Call`.
   - Dedicated **Follow-Ups Queue** (`Overdue` in red, `Due Today` in amber, `Upcoming`).

4. **Call Mode (Full-Screen Power Dialer)**:
   - Shows one lead at a time with a big Tap-to-Call button, live call duration timer, inline Owner Name/Email/Sample URL capture, live Call Scripts side panel, and 8 one-tap outcome buttons (Keyboard shortcuts `1`–`8`).
