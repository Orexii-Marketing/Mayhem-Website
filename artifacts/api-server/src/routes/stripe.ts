import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

router.get("/stripe/status", (_req, res) => {
  res.json({ enabled: !!STRIPE_SECRET_KEY });
});

router.post("/stripe/checkout", async (req, res) => {
  if (!STRIPE_SECRET_KEY) {
    res.status(503).json({
      error: "Online payments are coming soon. We will contact you to complete enrollment.",
    });
    return;
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(STRIPE_SECRET_KEY);

    const { sport, trainingFormat, athleteName, email, successUrl, cancelUrl } = req.body as {
      sport: string;
      trainingFormat: string;
      athleteName: string;
      email: string;
      successUrl: string;
      cancelUrl: string;
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Mayhem Athletics — ${sport} ${trainingFormat}`,
              description: `Training registration for ${athleteName}`,
            },
            unit_amount: 0,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, "Stripe checkout session creation failed");
    res.status(500).json({ error: "Failed to create checkout session." });
  }
});

export default router;
