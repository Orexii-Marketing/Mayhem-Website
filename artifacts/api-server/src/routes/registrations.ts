import { Router } from "express";
import { createAirtableRecord, isAirtableConfigured } from "../lib/airtable";
import { CreateRegistrationBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router = Router();

router.post("/registrations", async (req, res) => {
  const parsed = CreateRegistrationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  const fields = {
    "Parent Name": data.parentName,
    "Athlete Name": data.athleteName,
    "Email": data.email,
    "Phone": data.phone,
    "Sport": data.sport.charAt(0).toUpperCase() + data.sport.slice(1),
    "Training Format": data.trainingFormat,
    "Age / Grade": data.ageOrGrade,
    "Skill Level": data.skillLevel.charAt(0).toUpperCase() + data.skillLevel.slice(1),
    "Notes": data.notes ?? "",
    "Status": "New",
    "Submitted At": new Date().toISOString(),
  };

  try {
    if (isAirtableConfigured()) {
      const id = await createAirtableRecord("Registrations", fields);
      res.status(201).json({
        success: true,
        message: "Registration received! We'll be in touch shortly to confirm your training schedule.",
        id,
      });
    } else {
      logger.warn({ fields }, "Airtable not configured — registration logged locally");
      res.status(201).json({
        success: true,
        message: "Registration received! We'll be in touch shortly to confirm your training schedule.",
        id: null,
      });
    }
  } catch (err) {
    logger.error({ err }, "Failed to save registration to Airtable");
    res.status(500).json({ error: "Failed to save registration. Please try again." });
  }
});

export default router;
