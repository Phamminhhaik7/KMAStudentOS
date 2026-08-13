import { Router, type IRouter } from "express";
import healthRouter from "./health";
import gradesRouter from "./grades";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(gradesRouter);
router.use(authRouter);

export default router;
