import { Router } from "express";
import {
  createAirtableRecord,
  deleteAirtableRecord,
  isAirtableConfigured,
  listAirtableRecords,
  updateAirtableRecord,
} from "../lib/airtable";
import { logger } from "../lib/logger";

const router = Router();

interface AirtableEventFields {
  "Event Name": string;
  "Event Date": string;
  Location: string;
  Capacity: number;
  Status: string;
  Type?: string;
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

interface AirtableRegistrationFields {
  "Participant Name": string;
  "Parent Email": string;
  "Parent Phone"?: string;
  Event?: string[];
  "Registration Status"?: string;
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
        ageGroup: null,
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
        ageGroup: null,
      });
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 14);
}

// ─── Schedule Templates ────────────────────────────────────────────────────

router.get("/event-templates", async (_req, res) => {
  try {
    if (!isAirtableConfigured()) {
      res.json([]);
      return;
    }
    const records = await listAirtableRecords<AirtableTemplateFields>("Schedule Templates", {
      sort: [{ field: "Template Name", direction: "asc" }],
    });
    res.json(
      records.map((r) => ({
        id: r.id,
        name: r.fields["Template Name"],
        sport: r.fields.Sport ?? null,
      })),
    );
  } catch (err) {
    logger.error({ err }, "Failed to fetch schedule templates");
    res.json([]);
  }
});

router.get("/event-templates/:id", async (req, res) => {
  const { id } = req.params;
  if (!isAirtableConfigured()) {
    res.status(404).json({ error: "Airtable not configured" });
    return;
  }
  try {
    const records = await listAirtableRecords<AirtableTemplateFields>("Schedule Templates", {
      filterByFormula: `RECORD_ID()='${id}'`,
    });
    if (records.length === 0) {
      res.status(404).json({ error: "Template not found" });
      return;
    }
    const r = records[0];
    res.json({
      id: r.id,
      name: r.fields["Template Name"],
      sport: r.fields.Sport ?? null,
      items: r.fields.Items ?? "",
      durationMinutes: r.fields["Duration Minutes"] ?? null,
      description: r.fields.Description ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch template");
    res.status(500).json({ error: "Failed to load template" });
  }
});

router.patch("/event-templates/:id", async (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret && req.headers["admin-secret"] !== adminSecret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;
  const { name, sport, items, durationMinutes, description } = req.body as {
    name?: string;
    sport?: string;
    items?: string;
    durationMinutes?: number;
    description?: string;
  };

  if (!isAirtableConfigured()) {
    res.json({ success: true, message: "Airtable not configured — changes not saved" });
    return;
  }

  const fields: Record<string, string | number | null | undefined> = {};
  if (name !== undefined) fields["Template Name"] = name;
  if (sport !== undefined) fields["Sport"] = sport;
  if (items !== undefined) fields["Items"] = items;
  if (durationMinutes !== undefined) fields["Duration Minutes"] = durationMinutes;
  if (description !== undefined) fields["Description"] = description;

  try {
    await updateAirtableRecord("Schedule Templates", id, fields);
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to update template");
    res.status(500).json({ error: "Failed to save template" });
  }
});

router.post("/event-templates", async (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret && req.headers["admin-secret"] !== adminSecret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { name, sport, items, durationMinutes } = req.body as {
    name?: string;
    sport?: string;
    items?: string;
    durationMinutes?: number;
  };

  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const fields: Record<string, string | number | null | undefined> = {
    "Template Name": name,
  };
  if (sport) fields["Sport"] = sport;
  if (items) fields["Items"] = items;
  if (durationMinutes) fields["Duration Minutes"] = durationMinutes;

  try {
    if (isAirtableConfigured()) {
      const newId = await createAirtableRecord("Schedule Templates", fields);
      res.status(201).json({ success: true, id: newId });
    } else {
      res.status(201).json({ success: true, id: null });
    }
  } catch (err) {
    logger.error({ err }, "Failed to create template");
    res.status(500).json({ error: "Failed to create template" });
  }
});

// ─── Events ────────────────────────────────────────────────────────────────

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
          type: (r.fields.Type as "Practice" | "Scrimmage" | "Camp" | "Clinic") ?? ("Practice" as const),
          date: r.fields["Event Date"]?.split("T")[0] ?? r.fields["Event Date"],
          time: r.fields["Event Date"]?.includes("T")
            ? new Date(r.fields["Event Date"]).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
            : "",
          location: r.fields.Location,
          capacity: r.fields.Capacity,
          status: (r.fields.Status ?? "Active") as "Active" | "Published" | "Draft" | "Cancelled",
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

router.post("/events", async (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret && req.headers["admin-secret"] !== adminSecret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { name, type, date, time, location, capacity, notes, scheduleTemplateId } = req.body as {
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
    "Event Date": time ? `${date} ${time}` : date,
    Location: location,
    Capacity: capacity,
    Status: "Published",
  };
  if (type) fields["Type"] = type;
  if (notes) fields["Notes"] = notes;
  if (scheduleTemplateId) fields["ScheduleTemplate"] = [scheduleTemplateId];

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

router.patch("/events/:id", async (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret && req.headers["admin-secret"] !== adminSecret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;
  const { name, type, date, time, location, capacity, status, scheduleTemplateId } = req.body as {
    name?: string;
    type?: string;
    date?: string;
    time?: string;
    location?: string;
    capacity?: number;
    status?: string;
    scheduleTemplateId?: string | null;
  };

  const fields: Record<string, string | number | null | undefined | string[]> = {};
  if (name !== undefined) fields["Event Name"] = name;
  if (type !== undefined) fields["Type"] = type;
  if (date !== undefined) fields["Event Date"] = time ? `${date} ${time}` : date;
  if (location !== undefined) fields["Location"] = location;
  if (capacity !== undefined) fields["Capacity"] = capacity;
  if (status !== undefined) fields["Status"] = status;
  if (scheduleTemplateId !== undefined) {
    fields["ScheduleTemplate"] = scheduleTemplateId ? [scheduleTemplateId] : [];
  }

  try {
    if (isAirtableConfigured()) {
      await updateAirtableRecord("Events", id, fields);
      res.json({ success: true });
    } else {
      res.json({ success: true, message: "Airtable not configured — update not saved" });
    }
  } catch (err) {
    logger.error({ err }, "Failed to update event");
    res.status(500).json({ error: "Failed to update event" });
  }
});

router.delete("/events/:id", async (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret && req.headers["admin-secret"] !== adminSecret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;
  try {
    if (isAirtableConfigured()) {
      await deleteAirtableRecord("Events", id);
    }
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to delete event");
    res.status(500).json({ error: "Failed to delete event" });
  }
});

// ─── Event Schedule ─────────────────────────────────────────────────────────

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
      const templateRecords = await listAirtableRecords<AirtableTemplateFields>("Schedule Templates", {
        filterByFormula: `RECORD_ID()='${templateIds[0]}'`,
      });
      template = templateRecords[0];
    }

    if (!template) {
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

    const rawItems = template.fields.Items ?? "";
    const decodeHtml = (s: string) =>
      s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

    let lines: string[] = [];
    const trimmed = rawItems.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        const items = (Array.isArray(parsed) ? parsed : [parsed]) as Array<Record<string, unknown>>;
        lines = items
          .map((item) => {
            const timeVal = item.time ?? item.Time ?? item.start ?? item.Start;
            const actVal = item.activity ?? item.Activity ?? item.name ?? item.Name ?? item.drill ?? item.Drill;
            if (timeVal && actVal) return `${decodeHtml(String(timeVal))}: ${decodeHtml(String(actVal))}`;
            const label = actVal ?? item.name;
            return label ? decodeHtml(String(label)) : null;
          })
          .filter((l): l is string => l !== null && l.length > 0);
      } catch {
        lines = trimmed.split("\n").map((l) => decodeHtml(l.trim())).filter((l) => l.length > 0);
      }
    } else {
      lines = trimmed.split("\n").map((l) => decodeHtml(l.trim())).filter((l) => l.length > 0);
    }

    res.json({ templateName: template.fields["Template Name"], lines });
  } catch (err) {
    logger.error({ err }, "Failed to fetch event schedule");
    res.status(500).json({ error: "Failed to load schedule. Please try again." });
  }
});

// ─── Event RSVPs ──────────────────────────────────────────────────────────

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

// ─── Registrations ──────────────────────────────────────────────────────────

router.get("/registrations", async (req, res) => {
  const { email, eventId } = req.query as { email?: string; eventId?: string };

  // Public email-based lookup — no auth required when an email is provided.
  // Full list access (no email filter) requires admin auth.
  if (!email) {
    const adminSecret = process.env.ADMIN_SECRET;
    if (adminSecret && req.headers["admin-secret"] !== adminSecret) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  }

  if (!isAirtableConfigured()) {
    res.json([]);
    return;
  }

  try {
    let formula: string | undefined;
    if (email) {
      formula = `{Parent Email}='${email.replace(/'/g, "\\'")}'`;
    } else if (eventId) {
      formula = `FIND('${eventId}', ARRAYJOIN({Event}))`;
    }

    const records = await listAirtableRecords<AirtableRegistrationFields>("Registrations", {
      filterByFormula: formula,
      sort: [{ field: "Participant Name", direction: "asc" }],
    });

    // For email-based lookups, enrich with event name/date/location
    if (email && records.length > 0) {
      const eventIds = [...new Set(records.flatMap((r) => r.fields.Event ?? []))];
      const eventDetails: Record<string, { name: string; date: string; location: string }> = {};

      if (eventIds.length > 0) {
        const evFormula = `OR(${eventIds.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
        const eventRecords = await listAirtableRecords<AirtableEventFields>("Events", {
          filterByFormula: evFormula,
        });
        for (const ev of eventRecords) {
          eventDetails[ev.id] = {
            name: ev.fields["Event Name"],
            date: ev.fields["Event Date"]?.split("T")[0] ?? ev.fields["Event Date"],
            location: ev.fields.Location,
          };
        }
      }

      const registrations = records.map((r) => {
        const evId = r.fields.Event?.[0] ?? null;
        return {
          id: r.id,
          athleteName: r.fields["Participant Name"],
          eventId: evId,
          eventName: evId ? (eventDetails[evId]?.name ?? null) : null,
          eventDate: evId ? (eventDetails[evId]?.date ?? null) : null,
          eventLocation: evId ? (eventDetails[evId]?.location ?? null) : null,
          status: r.fields["Registration Status"] ?? "Pending",
        };
      });

      res.json(registrations);
      return;
    }

    // Admin full list response
    const registrations = records.map((r) => ({
      id: r.id,
      athleteName: r.fields["Participant Name"],
      email: r.fields["Parent Email"],
      phone: r.fields["Parent Phone"] ?? null,
      eventId: r.fields.Event?.[0] ?? null,
      status: r.fields["Registration Status"] ?? "Pending",
      createdTime: r.createdTime ?? null,
    }));

    res.json(registrations);
  } catch (err) {
    logger.error({ err }, "Failed to fetch registrations");
    res.status(500).json({ error: "Failed to load registrations" });
  }
});

router.patch("/registrations/:id", async (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret && req.headers["admin-secret"] !== adminSecret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;
  const { status } = req.body as { status?: string };

  if (!status) {
    res.status(400).json({ error: "status is required" });
    return;
  }

  try {
    if (isAirtableConfigured()) {
      await updateAirtableRecord("Registrations", id, { "Registration Status": status });
    }
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to update registration");
    res.status(500).json({ error: "Failed to update registration" });
  }
});

export default router;
