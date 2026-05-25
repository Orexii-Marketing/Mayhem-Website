import { Router } from "express";
import { createAirtableRecord, isAirtableConfigured } from "../lib/airtable";
import { CreateInquiryBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router = Router();

router.post("/inquiries", async (req, res) => {
  const parsed = CreateInquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  const fields = {
    "Name": data.name,
    "Email": data.email,
    "Phone": data.phone ?? "",
    "Subject": data.subject,
    "Message": data.message,
    "Status": "New",
    "Submitted At": new Date().toISOString(),
  };

  try {
    if (isAirtableConfigured()) {
      const id = await createAirtableRecord("Inquiries", fields);
      res.status(201).json({
        success: true,
        message: "Thanks for reaching out! We'll get back to you within 24 hours.",
        id,
      });
    } else {
      logger.warn({ fields }, "Airtable not configured — inquiry logged locally");
      res.status(201).json({
        success: true,
        message: "Thanks for reaching out! We'll get back to you within 24 hours.",
        id: null,
      });
    }
  } catch (err) {
    logger.error({ err }, "Failed to save inquiry to Airtable");
    res.status(500).json({ error: "Failed to save inquiry. Please try again." });
  }
});

export default router;
