# Mayhem Athletics — Website

Public-facing website and admin tools for Mayhem Athletics, a youth sports training organization serving athletes ages 8–12th grade across football, soccer, basketball, and baseball.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Airtable Integration](#airtable-integration)
- [Training Plans](#training-plans)
- [Running Locally](#running-locally)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)

---

## Overview

The site has two main surfaces:

| Surface | Path | Description |
|---|---|---|
| **Public Events page** | `/events` | Displays upcoming events with live registration counts and training plan modals |
| **Admin Events page** | `/admin/events` | Password-protected form to create new events in Airtable |

Events, registrations, and training plan templates are all managed through **Airtable** — no database or code deploy needed when adding or editing content.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript |
| Styling | Tailwind CSS, Radix UI, shadcn/ui |
| Backend | Express (Node.js), TypeScript |
| Data | Airtable (primary data store) |
| API contract | OpenAPI 3.0 → Orval codegen |
| Data fetching | TanStack Query (React Query) |
| Monorepo | pnpm workspaces |

---

## Project Structure

```
.
├── artifacts/
│   ├── api-server/          # Express backend — all Airtable reads/writes
│   │   └── src/
│   │       ├── routes/
│   │       │   ├── events.ts       # Events, RSVPs, schedule templates
│   │       │   ├── contact.ts      # Contact form submissions
│   │       │   └── index.ts        # Route registration
│   │       └── lib/
│   │           └── airtable.ts     # Airtable fetch wrapper
│   └── mayhem-athletics/    # React frontend
│       └── src/
│           ├── pages/
│           │   ├── Home.tsx
│           │   ├── Events.tsx       # Event cards + Training Plan modal
│           │   ├── AdminEvents.tsx  # Admin event creation form
│           │   └── Contact.tsx
│           └── components/
│               └── ui/             # shadcn/ui components
├── lib/
│   ├── api-spec/            # openapi.yaml — single source of truth for API shape
│   ├── api-zod/             # Zod schemas (generated from OpenAPI)
│   └── api-client-react/    # TanStack Query hooks (generated from OpenAPI)
└── scripts/                 # Dev utilities
```

---

## Airtable Integration

All content is stored in Airtable. The API server reads and writes to three tables.

### Connecting

Set two environment variables (see [Environment Variables](#environment-variables)):

```
AIRTABLE_API_KEY=pat...
AIRTABLE_BASE_ID=app...
```

When both are set, the site uses live Airtable data. When either is missing, it falls back to mock data so the site still works during development without credentials.

---

### Table: `Events`

Stores upcoming events shown on the public Events page.

| Field name | Type | Description |
|---|---|---|
| `Event Name` | Single line text | Display name of the event |
| `Event Date` | Date & time | Date and start time (e.g. `2026-07-15 10:00`) |
| `Location` | Single line text | Venue name or address |
| `Capacity` | Number | Maximum number of participants |
| `Age Group` | Single line text | e.g. `U10`, `U12`, `U14` |
| `Status` | Single select | `Scheduled`, `Draft`, or `Published` |
| `RegistrantCount` | Number (rollup) | Count of linked Registrations records — auto-updates as people sign up |
| `ScheduleTemplate` | Linked record | Optional link to a Schedule Templates row — overrides the auto-matched template |

> **Note on filtering:** The API currently shows all events sorted by date. To show only future events in production, restore the formula filter `NOT(IS_BEFORE({Event Date}, TODAY()))` in `artifacts/api-server/src/routes/events.ts` once your events have real future dates.

---

### Table: `Registrations`

Created automatically when someone clicks **Sign Up** on an event card.

| Field name | Type | Description |
|---|---|---|
| `Participant Name` | Single line text | Athlete's name |
| `Parent Email` | Email | Contact email |
| `Parent Phone` | Phone number | Contact phone |
| `Event` | Linked record | Links back to the Events row |
| `Registration Status` | Single select | Manual status tracking (optional) |

The `RegistrantCount` rollup on the Events table counts linked Registrations automatically — the "X signed up" number on each event card updates as new RSVPs arrive.

---

### Table: `Schedule Templates`

Reusable training plans shown in the **Training Plan** modal on each event card.

| Field name | Type | Description |
|---|---|---|
| `Template Name` | Single line text | e.g. `Standard Practice`, `Game Day` |
| `Sport` | Single select | `Soccer`, `Football`, `Basketball`, or `Baseball` |
| `Duration Minutes` | Number | Total session duration in minutes |
| `Items` | Long text | The session activities — see [Training Plans](#training-plans) below |
| `Description` | Long text | Optional internal description |

---

## Training Plans

Each event card has a **Training Plan** button. Clicking it shows the session schedule pulled from the matching Schedule Template.

### How templates are matched to events

Templates are matched automatically — no manual linking required:

1. **Direct link (highest priority):** If the event row in Airtable has a `ScheduleTemplate` linked record filled in, that exact template is used.
2. **Auto-match by sport keyword:** If no template is linked, the API reads the event name and looks for a sport keyword (`Soccer`, `Football`, `Basketball`, `Baseball`). It then finds the template whose `Sport` field matches.
3. **Fallback:** If no sport is detected, the first template (alphabetically) is used.

**Examples:**
- `Spring Soccer Kickoff` → Sport keyword "Soccer" → template with `Sport = Soccer`
- `Youth Football Camp` → Sport keyword "Football" → template with `Sport = Football`
- `Tuesday Practice` → No sport keyword → first template alphabetically

---

### Writing the Items field

The `Items` field in Schedule Templates accepts **plain text** — no JSON required. Write one activity per line:

```
Warm-up & Stretching
Passing Drills
Scrimmage
Cool-down
```

To show a timed column on the left, prefix each line with a time and a dash or colon:

```
0:00 - Warm-up & Stretching
0:15 - Passing Drills
0:45 - Scrimmage
1:15 - Cool-down
```

or

```
0:00: Warm-up
0:15: Passing Drills
```

> Legacy JSON format (`[{"time": "0:00", "activity": "Warm-up", "duration": 15}]`) is also still supported for backward compatibility.

---

## Running Locally

### Prerequisites

- Node.js 18+
- pnpm 8+

### Install dependencies

```bash
pnpm install
```

### Start the API server

```bash
pnpm --filter @workspace/api-server run dev
```

The API server runs on port `8080` by default (configurable via `PORT` env var).

### Start the frontend

```bash
pnpm --filter @workspace/mayhem-athletics run dev
```

### Regenerate API client after OpenAPI changes

If you edit `lib/api-spec/openapi.yaml`, regenerate the typed client:

```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## Environment Variables

Create a `.env` file in `artifacts/api-server/` (or set these in your hosting environment):

| Variable | Required | Description |
|---|---|---|
| `AIRTABLE_API_KEY` | Yes (for live data) | Airtable Personal Access Token (`pat...`) |
| `AIRTABLE_BASE_ID` | Yes (for live data) | Airtable base ID (`app...`) — found in your base URL |
| `ADMIN_SECRET` | No | If set, the admin events form requires this value as a header. Leave unset to allow open access during development. |
| `PORT` | No | Port for the API server (default: `8080`) |

When `AIRTABLE_API_KEY` or `AIRTABLE_BASE_ID` are missing, the API falls back to procedurally generated mock events so the site remains functional without credentials.

---

## API Reference

Base URL: `/api`

| Method | Path | Description |
|---|---|---|
| `GET` | `/events` | List all events (sorted by date) |
| `POST` | `/events` | Create a new event in Airtable |
| `POST` | `/events/:id/rsvp` | Submit a registration for an event |
| `GET` | `/events/:id/schedule` | Get the training plan for an event |
| `GET` | `/event-templates` | List all Schedule Templates |
| `POST` | `/contact` | Submit a contact form inquiry |
| `GET` | `/services` | List training services |

### POST /events — Request body

```json
{
  "name": "Tuesday Soccer Practice",
  "date": "2026-07-15",
  "location": "Mayhem Training Center",
  "capacity": 20,
  "notes": "Bring cleats",
  "scheduleTemplateId": "rec..." 
}
```

### POST /events/:id/rsvp — Request body

```json
{
  "childName": "Alex Johnson",
  "email": "parent@example.com",
  "phone": "555-123-4567"
}
```

### GET /events/:id/schedule — Response

```json
{
  "templateName": "Standard Practice",
  "lines": [
    "0:00: Warm-up",
    "0:15: Passing Drills",
    "0:45: Scrimmage",
    "1:15: Cool-down"
  ]
}
```

---

## Brand & Design

- **Primary color:** Teal (`hsl(168, 78%, 42%)`)
- **Fonts:** Oswald (headings), Inter (body)
- **Theme:** Dark background with teal accents
- **Logo:** `/src/assets/` in the frontend package
