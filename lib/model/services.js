import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';

export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  iconUrl: text('icon_url').notNull(),
  tariff: integer('tariff').notNull(),
});
