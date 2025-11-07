/**
 * Transaction Data Transfer Objects (DTOs)
 * Transform service data into standardized API response formats
 */

/**
 * Transform balance data to BalanceResponseDTO
 * @param {Object} balance - Balance object from service
 * @returns {Object} Formatted balance response
 */
export function toBalanceResponseDTO(balance) {
  return {
    balance: balance.balance
  };
}

/**
 * Transform top up result to TopUpResponseDTO
 * @param {Object} result - Top up result from service
 * @returns {Object} Formatted top up response
 */
export function toTopUpResponseDTO(result) {
  return {
    balance: result.balance
  };
}

/**
 * Transform transaction to TransactionResponseDTO
 * @param {Object} transaction - Transaction object from service
 * @returns {Object} Formatted transaction response
 */
export function toTransactionResponseDTO(transaction) {
  return {
    invoice_number: transaction.invoice_number,
    service_code: transaction.service_code,
    service_name: transaction.service_name,
    transaction_type: transaction.transaction_type,
    total_amount: transaction.total_amount,
    created_on: transaction.created_on
  };
}

/**
 * Transform transaction history record to HistoryRecordDTO
 * @param {Object} record - Transaction history record
 * @returns {Object} Formatted history record
 */
export function toHistoryRecordDTO(record) {
  return {
    invoice_number: record.invoice_number,
    transaction_type: record.transaction_type,
    description: record.description,
    total_amount: record.total_amount,
    created_on: record.created_on
  };
}

/**
 * Transform transaction history to TransactionHistoryResponseDTO
 * @param {Object} history - Transaction history from service
 * @returns {Object} Formatted transaction history response
 */
export function toTransactionHistoryResponseDTO(history) {
  return {
    offset: history.offset,
    limit: history.limit,
    records: history.records.map(record => toHistoryRecordDTO(record))
  };
}
