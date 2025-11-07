import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const transactionTypeEnum = pgTable('transaction_type_enum', {
  id: serial('id').primaryKey().notNull(),
  transactionType: text('transaction_type').notNull().unique(),
});
