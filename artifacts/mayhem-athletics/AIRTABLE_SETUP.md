# Airtable Setup Guide — Mayhem Athletics

## One-Time Setup Steps

### 1. Create the "Schedule Templates" Table

In your Airtable base, create a new table called **Schedule Templates** with these fields:

| Field Name | Field Type | Notes |
|---|---|---|
| `Name` | Single line text | Template name, e.g. "Speed & Agility" |
| `Schedule` | Long text | One line per time block (see format below) |
| `Sport` | Single line text | Optional tag, e.g. "Football", "All Sports" |

**Schedule format** (one line per block):
```
6:30 PM: Warm Up
6:40 PM: Running Form Drills
7:00 PM: Water Break
7:05 PM: Position Work
7:30 PM: Cool Down & Stretching
7:45 PM: Wrap Up
```

**Add at least 2 example templates**, e.g.:
- "Speed & Agility" — general conditioning template
- "Blocking Fundamentals" — football-specific
- "Shooting Form" — basketball-specific

### 2. Add the ScheduleTemplate Link Field to Events

In the **Events** table:
1. Click **+** to add a new field
2. Choose **Link to another record**
3. Name it exactly: `ScheduleTemplate`
4. Link to: **Schedule Templates**
5. Allow only **one linked record** (uncheck "Allow linking to multiple records" if prompted)

### 3. Verify Field Names

The API server expects these exact field names in Airtable:

**Events table:**
- `Name`, `Type`, `Date`, `Time`, `Location`, `Capacity`, `Notes`, `Status`, `RegistrantCount`, `ScheduleTemplate`

**Schedule Templates table:**
- `Name`, `Schedule`, `Sport`

**Event RSVPs table:**
- `ChildName`, `Email`, `Phone`, `EventName`, `Event` (linked to Events)

## How It Works

- When a coach creates an event on `/admin/events`, they can pick a Schedule Template from a dropdown (populated from Airtable)
- The event card on `/events` shows a **"View Schedule"** button only when a template is attached
- Clicking it fetches the template's Schedule text from Airtable and shows it line-by-line in a modal, with times highlighted in teal
- Templates are managed entirely in Airtable — add, edit, or delete them there
