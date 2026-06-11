import { Router } from "express";
import { createAirtableRecord, isAirtableConfigured, listAirtableRecords } from "../lib/airtable";
import { logger } from "../lib/logger";

const router = Router();

// Matches the actual Airtable "Events" table field names
interface AirtableEventFields {
  "Event Name": string;
  "Event Date": string;
  Location: string;
  Capacity: number;
  Status: string;
  "Age Group"?: string;
  RegistrantCount?: number;
  ScheduleTemplate?: string[];
}

interface AirtableTemplateFields {
  "Template Name": string;
  Items: string;
  Sport?: string;
  "Duration Minutes"?: number;
  Description?: string;
}

function generateMockEvents() {
  const events = [];
  const now = new Date();

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const practiceLocation = "Mayhem Athletics Training Center";
  const scrimmageLocation = "Riverside Sports Complex";

  let id = 1;
  for (let i = 0; i < 21; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dow = d.getDay();

    if (dow === 1 || dow === 3 || dow === 5) {
      events.push({
        id: `mock-practice-${id++}`,
        name: `${days[dow]} Practice`,
        type: "Practice" as const,
        date: d.toISOString().split("T")[0],
        time: "5:00 PM",
        location: practiceLocation,
        capacity: 20,
        status: "Active" as const,
        registrantCount: null,
        scheduleTemplateId: null,
      });
    }

    if (dow === 6 && i < 14) {
      events.push({
        id: `mock-scrimmage-${id++}`,
        name: "Weekend Scrimmage",
        type: "Scrimmage" as const,
        date: d.toISOString().split("T")[0],
        time: "10:00 AM",
        location: scrimmageLocation,
        capacity: 30,
        status: "Active" as const,
        registrantCount: null,
        scheduleTemplateId: null,
      });
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 14);
}

router.get("/event-templates", async (_req, res) => {
  try {
    if (!isAirtableConfigured()) {
      res.json([]);
      return;
    }

    const records = await listAirtableRecords<AirtableTemplateFields>("Schedule Templates", {
      sort: [{ field: "Template Name", direction: "asc" }],
    });

    const templates = records.map((r) => ({
      id: r.id,
      name: r.fields["Template Name"],
      sport: r.fields.Sport ?? null,
    }));

    res.json(templates);
  } catch (err) {
    logger.error({ err }, "Failed to fetch schedule templates");
    res.json([]);
  }
});

router.get("/events", async (_req, res) => {
  try {
    if (isAirtableConfigured()) {
      const records = await listAirtableRecords<AirtableEventFields>("Events", {
        sort: [{ field: "Event Date", direction: "asc" }],
      });

      if (records.length > 0) {
        const events = records.map((r) => ({
          id: r.id,
          name: r.fields["Event Name"],
          type: "Practice" as const,
          date: r.fields["Event Date"]?.split("T")[0] ?? r.fields["Event Date"],
          time: r.fields["Event Date"]?.includes("T")
            ? new Date(r.fields["Event Date"]).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
            : "",
          location: r.fields.Location,
          capacity: r.fields.Capacity,
          status: "Active" as const,
          registrantCount: r.fields.RegistrantCount ?? null,
          scheduleTemplateId: r.fields.ScheduleTemplate?.[0] ?? null,
          ageGroup: r.fields["Age Group"] ?? null,
        }));
        res.json(events);
        return;
      }
    }

    res.json(generateMockEvents());
  } catch (err) {
    logger.error({ err }, "Failed to fetch events — falling back to mock data");
    res.json(generateMockEvents());
  }
});

router.get("/events/:id/schedule", async (req, res) => {
  const { id } = req.params;

  if (!isAirtableConfigured() || id.startsWith("mock-")) {
    res.status(404).json({ error: "No schedule available for this event." });
    return;
  }

  try {
    const eventRecords = await listAirtableRecords<AirtableEventFields>("Events", {
      filterByFormula: `RECORD_ID()='${id}'`,
    });

    if (eventRecords.length === 0) {
      res.status(404).json({ error: "Event not found." });
      return;
    }

    const event = eventRecords[0];
    const templateIds = event.fields.ScheduleTemplate;

    let template: { id: string; fields: AirtableTemplateFields } | undefined;

    if (templateIds && templateIds.length > 0) {
      // Event has a directly linked template — use it
      const templateRecords = await listAirtableRecords<AirtableTemplateFields>("Schedule Templates", {
        filterByFormula: `RECORD_ID()='${templateIds[0]}'`,
      });
      template = templateRecords[0];
    }

    if (!template) {
      // Auto-match by sport keyword in the event name
      const eventName = (event.fields["Event Name"] ?? "").toLowerCase();
      const sports = ["Soccer", "Football", "Basketball", "Baseball"];
      const matchedSport = sports.find((s) => eventName.includes(s.toLowerCase()));

      const allTemplates = await listAirtableRecords<AirtableTemplateFields>("Schedule Templates", {
        sort: [{ field: "Template Name", direction: "asc" }],
      });

      if (matchedSport) {
        template = allTemplates.find((t) => t.fields.Sport === matchedSport) ?? allTemplates[0];
      } else {
        template = allTemplates[0];
      }
    }

    if (!template) {
      res.status(404).json({ error: "No training plan found for this event." });
      return;
    }

    const rawItems = template.fields.Items ?? "[]";

    let lines: string[] = [];
    try {
      const items = JSON.parse(rawItems) as Array<{ time?: string; activity?: string; duration?: number }>;
      lines = items
        .filter((item) => item.time && item.activity)
        .map((item) => `${item.time}: ${item.activity}`);
    } catch {
      lines = rawItems
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    }

    res.json({ templateName: template.fields["Template Name"], lines });
  } catch (err) {
    logger.error({ err }, "Failed to fetch event schedule");
    res.status(500).json({ error: "Failed to load schedule. Please try again." });
  }
});

router.post("/events", async (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret && req.headers["admin-secret"] !== adminSecret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { name, date, location, capacity, notes, scheduleTemplateId } = req.body as {
    name?: string;
    type?: string;
    date?: string;
    time?: string;
    location?: string;
    capacity?: number;
    notes?: string;
    scheduleTemplateId?: string | null;
  };

  if (!name || !date || !location || !capacity) {
    res.status(400).json({ error: "Missing required fields: name, date, location, capacity" });
    return;
  }

  const fields: Record<string, string | number | string[]> = {
    "Event Name": name,
    "Event Date": date,
    Location: location,
    Capacity: capacity,
    Status: "Active",
  };
  if (notes) fields.Notes = notes;
  if (scheduleTemplateId) fields.ScheduleTemplate = [scheduleTemplateId];

  try {
    if (isAirtableConfigured()) {
      const id = await createAirtableRecord("Events", fields);
      res.status(201).json({ success: true, message: "Event created successfully.", id });
    } else {
      logger.warn({ fields }, "Airtable not configured — event creation logged locally");
      res.status(201).json({ success: true, message: "Event created (Airtable not configured).", id: null });
    }
  } catch (err) {
    logger.error({ err }, "Failed to create event in Airtable");
    res.status(500).json({ error: "Failed to create event. Please try again." });
  }
});

router.post("/events/:id/rsvp", async (req, res) => {
  const { id } = req.params;
  const { childName, email, phone } = req.body as {
    childName?: string;
    email?: string;
    phone?: string;
  };

  if (!childName || !email || !phone) {
    res.status(400).json({ error: "Missing required fields: childName, email, phone" });
    return;
  }

  let eventName = id;
  try {
    if (isAirtableConfigured() && !id.startsWith("mock-")) {
      const records = await listAirtableRecords<AirtableEventFields>("Events", {
        filterByFormula: `RECORD_ID()='${id}'`,
      });
      if (records.length === 0) {
        res.status(404).json({ error: "Event not found" });
        return;
      }
      eventName = records[0].fields["Event Name"];
    } else if (id.startsWith("mock-")) {
      const mockEvents = generateMockEvents();
      const mockEvent = mockEvents.find((e) => e.id === id);
      eventName = mockEvent ? mockEvent.name : id;
    }
  } catch (err) {
    logger.warn({ err }, "Could not look up event name, proceeding with id");
  }

  const fields: Record<string, string | string[]> = {
    "Participant Name": childName,
    "Parent Email": email,
    "Parent Phone": phone,
  };

  if (isAirtableConfigured() && !id.startsWith("mock-")) {
    fields["Event"] = [id];
  }

  try {
    if (isAirtableConfigured()) {
      const rsvpId = await createAirtableRecord("Registrations", fields);
      res.status(201).json({
        success: true,
        message: `You're signed up for ${eventName}! See you there.`,
        id: rsvpId,
      });
    } else {
      logger.warn({ fields }, "Airtable not configured — RSVP logged locally");
      res.status(201).json({
        success: true,
        message: `You're signed up for ${eventName}! See you there.`,
        id: null,
      });
    }
  } catch (err) {
    logger.error({ err }, "Failed to save registration to Airtable");
    res.status(500).json({ error: "Failed to submit registration. Please try again." });
  }
});

export default router;
