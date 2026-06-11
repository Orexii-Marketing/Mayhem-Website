---
name: Airtable field names
description: Exact field names for all three Mayhem Athletics Airtable tables — mismatches cause silent 0-record fallback to mock data
---

## Events table
- `Event Name` (text)
- `Event Date` (DateTime — includes time component, split on "T" to get date, parse for time display)
- `Location` (text)
- `Capacity` (number)
- `Age Group` (text: "U10", "U12", "U14" etc.)
- `Status` (text: "Scheduled", "Draft", "Published" — NOT "Active"/"Cancelled")
- `RegistrantCount` (number, rollup from Registrations)
- `ScheduleTemplate` (linked record array → Schedule Templates)

## Schedule Templates table
- `Template Name` (text)
- `Sport` (single select: Soccer, Football, Basketball, Baseball)
- `Duration Minutes` (number)
- `Items` (long text — JSON array: `[{"time":"0:00","activity":"Warm-up","duration":15},...]`)
- `Description` (long text, optional)

## Registrations table
- `Participant Name`
- `Parent Name`
- `Parent Email`
- `Parent Phone`
- `Event` (linked record array → Events)
- `Registration Status`
- `Registration Count`

## Date filter note
The date filter `NOT(IS_BEFORE({Event Date}, '${today}'))` was removed because all test events had past dates (March–May 2026). Re-add this filter for production once events have future dates.

**Why:** Airtable returns 0 records (no error) when all records are filtered out — the API silently falls back to mock data. Always check whether records exist without a filter first when debugging 0-record responses.
