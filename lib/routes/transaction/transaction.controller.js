import { catchError, catchErrorSync } from '#lib/util/result.js';
import { success, error } from '#lib/api/response.js';
import * as transactionService from './transaction.service.js';
import * as transactionDTO from './transaction.dto.js';
import logger from '#lib/util/logger.js';

/**
 * Get user balance
 * GET /balance
 */
export async function getBalance(req, res) {
  const { db_conn } = req.app.locals.state;
  const userId = req.middleware.auth.user.userId;

  // Use connection pool for read operation
  const [err, balance] = await catchError(transactionService.getBalance(db_conn, userId));

  if (err) {
    logger.error('Failed to get balance', { error: err.message, userId });
    return error(res, 'Internal server error', 500);
  }

  // Transform to DTO with error handling
  const [dtoErr, balanceResponse] = catchErrorSync(() => transactionDTO.toBalanceResponseDTO(balance));

  if (dtoErr) {
    logger.error('Failed to transform balance to DTO', { error: dtoErr.message });
    return error(res, 'Internal server error', 500);
  }

  return success(res, 'Get Balance Berhasil', balanceResponse);
}

/**
 * Top up user balance
 * POST /topup
 */
export async function topUp(req, res) {
  const { db_conn } = req.app.locals.state;
  const userId = req.middleware.auth.user.userId;
  const { top_up_amount } = req.body;

  // Use Drizzle transaction with callback pattern (auto-rollback on error)
  const [err, result] = await catchError(
    db_conn.transaction(async (tx) => {
      return await transactionService.topUpBalance(tx, userId, top_up_amount);
    })
  );

  if (err) {
    logger.error('Top up failed', { error: err.message, stack: err.stack, userId, amount: top_up_amount });

    // Check for specific user-facing error messages
    if (err.message === 'Paramter amount hanya boleh angka dan tidak boleh lebih kecil dari 0') {
      return error(res, err.message, 400, 102, null);
    }
    if (err.message === 'User not found') {
      return error(res, 'User not found', 404, 102, null);
    }

    // For all other errors (database errors, etc.), return generic message
    return error(res, 'Internal server error', 500);
  }

  // Transform to DTO with error handling
  const [dtoErr, topUpResponse] = catchErrorSync(() => transactionDTO.toTopUpResponseDTO(result));

  if (dtoErr) {
    logger.error('Failed to transform top up result to DTO', { error: dtoErr.message });
    return error(res, 'Internal server error', 500);
  }

  return success(res, 'Top Up Balance berhasil', topUpResponse);
}

/**
 * Create transaction (payment)
 * POST /transaction
 */
export async function createTransaction(req, res) {
  const { db_conn } = req.app.locals.state;
  const userId = req.middleware.auth.user.userId;
  const { service_code } = req.body;

  // Use Drizzle transaction with callback pattern (auto-rollback on error)
  const [err, result] = await catchError(
    db_conn.transaction(async (tx) => {
      return await transactionService.createTransaction(tx, userId, service_code);
    })
  );

  if (err) {
    logger.error('Transaction failed', { error: err.message, userId, service_code });

    // Check for specific error messages
    if (err.message === 'Service ataus Layanan tidak ditemukan') {
      return error(res, err.message, 400, 102, null);
    }
    if (err.message === 'Balance tidak mencukupi') {
      return error(res, err.message, 400, 102, null);
    }

    return error(res, 'Internal server error', 500);
  }

  // Transform to DTO with error handling
  const [dtoErr, transactionResponse] = catchErrorSync(() => transactionDTO.toTransactionResponseDTO(result));

  if (dtoErr) {
    logger.error('Failed to transform transaction result to DTO', { error: dtoErr.message });
    return error(res, 'Internal server error', 500);
  }

  return success(res, 'Transaksi berhasil', transactionResponse);
}

/**
 * Get transaction history
 * GET /transaction/history
 */
export async function getTransactionHistory(req, res) {
  const { db_conn } = req.app.locals.state;
  const userId = req.middleware.auth.user.userId;

  // Parse query parameters
  const offset = parseInt(req.query.offset) || 0;
  const limit = req.query.limit ? parseInt(req.query.limit) : 5;

  // Use connection pool for read operation
  const [err, history] = await catchError(
    transactionService.getTransactionHistory(db_conn, userId, offset, limit)
  );

  if (err) {
    logger.error('Failed to get transaction history', { error: err.message, userId });
    return error(res, 'Internal server error', 500);
  }

  // Transform to DTO with error handling
  const [dtoErr, historyResponse] = catchErrorSync(() => transactionDTO.toTransactionHistoryResponseDTO(history));

  if (dtoErr) {
    logger.error('Failed to transform transaction history to DTO', { error: dtoErr.message });
    return error(res, 'Internal server error', 500);
  }

  return success(res, 'Get History Berhasil', historyResponse);
}
