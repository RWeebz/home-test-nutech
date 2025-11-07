import express from 'express';
import * as transactionController from './transaction.controller.js';
import { authenticate } from '#lib/middleware/auth.js';
import { handleValidationErrors } from '#lib/middleware/validation.js';
import { validateTopUp, validateTransaction, validateTransactionHistory } from './transaction.validation.js';

const router = express.Router();

// GET /balance - Get user balance
router.get('/balance', authenticate, transactionController.getBalance);

// POST /topup - Top up balance
router.post(
  '/topup',
  authenticate,
  validateTopUp,
  handleValidationErrors,
  transactionController.topUp
);

// POST /transaction - Create transaction
router.post(
  '/transaction',
  authenticate,
  validateTransaction,
  handleValidationErrors,
  transactionController.createTransaction
);

// GET /transaction/history - Get transaction history
router.get(
  '/transaction/history',
  authenticate,
  validateTransactionHistory,
  handleValidationErrors,
  transactionController.getTransactionHistory
);

export default router;
