import { Router, type IRouter } from "express";
import healthRouter from "./health";
import servicesRouter from "./services";
import registrationsRouter from "./registrations";
import inquiriesRouter from "./inquiries";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(servicesRouter);
router.use(registrationsRouter);
router.use(inquiriesRouter);
router.use(stripeRouter);

export default router;
