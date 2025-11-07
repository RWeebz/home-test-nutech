import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { services } from './services.js';
import { transactionTypeEnum } from './transaction_type_enum.js';
import { users } from './users.js';

export const userTransactions = pgTable('user_transactions', {
  id: serial('id').primaryKey().notNull(),
  userId: integer('user_id').notNull().references(() => users.id),
  invoiceNumber: text('invoice_number').notNull(),
  serviceId: integer('service_id').references(() => services.id),
  description: text('description').notNull(),
  totalAmount: integer('total_amount').notNull(),
  createdOn: timestamp('created_on', { withTimezone: true }),
  transactionTypeId: integer('transaction_type_id').notNull().references(() => transactionTypeEnum.id),
});
