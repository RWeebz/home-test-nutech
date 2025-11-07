import { pgTable, integer } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const userBalance = pgTable('user_balance', {
  userId: integer('user_id').primaryKey().references(() => users.id),
  balance: integer('balance').notNull(),
});
