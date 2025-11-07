import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  imageUrl: text('image_url').notNull(),
  description: text('description').notNull(),
});
