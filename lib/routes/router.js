import express from 'express';
import indexRouter from '#lib/routes/index.route.js';
import membershipRouter from '#lib/routes/membership/membership.route.js';
import informationRouter from '#lib/routes/information/information.route.js';
import transactionRouter from '#lib/routes/transaction/transaction.route.js';

const router = express.Router();

// Register all module routes
router.use('/', indexRouter);
router.use('/', membershipRouter);
router.use('/', informationRouter);
router.use('/', transactionRouter);

export default router;
