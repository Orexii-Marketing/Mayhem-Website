import { Router, type IRouter } from "express";
import healthRouter from "./health";
import servicesRouter from "./services";
import registrationsRouter from "./registrations";
import inquiriesRouter from "./inquiries";
import stripeRouter from "./stripe";
import eventsRouter from "./events";

const router: IRouter = Router();

router.use(healthRouter);
router.use(servicesRouter);
router.use(registrationsRouter);
router.use(inquiriesRouter);
router.use(stripeRouter);
router.use(eventsRouter);

export default router;
