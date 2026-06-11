import { Router } from "express";
import { createAirtableRecord, isAirtableConfigured, listAirtableRecords } from "../lib/airtable";
import { logger } from "../lib/logger";

const router = Router();

interface AirtableEventFields {
  Name: string;
  Type: string;
  Date: string;
  Time: string;
  Location: string;
  Capacity: number;
  Notes?: string;
  Status: string;
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
      });
    }

    if ((dow === 6) && i < 14) {
      events.push({
        id: `mock-scrimmage-${id++}`,
        name: "Weekend Scrimmage",
        type: "Scrimmage" as const,
        date: d.toISOString().split("T")[0],
        time: "10:00 AM",
        location: scrimmageLocation,
        capacity: 30,
        status: "Active" as const,
      });
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 14);
}

router.get("/events", async (_req, res) => {
  try {
    if (isAirtableConfigured()) {
      const today = new Date().toISOString().split("T")[0];
      const records = await listAirtableRecords<AirtableEventFields>("Events", {
        filterByFormula: `AND({Status}='Active', IS_AFTER({Date}, '${today}'))`,
        sort: [{ field: "Date", direction: "asc" }],
      });

      if (records.length > 0) {
        const events = records.map((r) => ({
          id: r.id,
          name: r.fields.Name,
          type: r.fields.Type,
          date: r.fields.Date,
          time: r.fields.Time,
          location: r.fields.Location,
          capacity: r.fields.Capacity,
          status: r.fields.Status,
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

router.post("/events", async (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret && req.headers["admin-secret"] !== adminSecret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { name, type, date, time, location, capacity, notes } = req.body as {
    name?: string;
    type?: string;
    date?: string;
    time?: string;
    location?: string;
    capacity?: number;
    notes?: string;
  };

  if (!name || !type || !date || !time || !location || !capacity) {
    res.status(400).json({ error: "Missing required fields: name, type, date, time, location, capacity" });
    return;
  }

  const fields: Record<string, string | number> = {
    Name: name,
    Type: type,
    Date: date,
    Time: time,
    Location: location,
    Capacity: capacity,
    Status: "Active",
  };
  if (notes) fields.Notes = notes;

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
      const records = await listAirtableRecords<{ Name: string }>("Events", {
        filterByFormula: `RECORD_ID()='${id}'`,
      });
      if (records.length === 0) {
        res.status(404).json({ error: "Event not found" });
        return;
      }
      eventName = records[0].fields.Name;
    } else if (id.startsWith("mock-")) {
      const mockEvents = generateMockEvents();
      const mockEvent = mockEvents.find((e) => e.id === id);
      eventName = mockEvent ? mockEvent.name : id;
    }
  } catch (err) {
    logger.warn({ err }, "Could not look up event name, proceeding with id");
  }

  const fields = {
    EventId: id,
    EventName: eventName,
    ChildName: childName,
    Email: email,
    Phone: phone,
  };

  try {
    if (isAirtableConfigured()) {
      const rsvpId = await createAirtableRecord("Event RSVPs", fields);
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
    logger.error({ err }, "Failed to save RSVP to Airtable");
    res.status(500).json({ error: "Failed to submit RSVP. Please try again." });
  }
});

export default router;
