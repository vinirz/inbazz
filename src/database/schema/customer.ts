import { text, pgTable, varchar, date } from 'drizzle-orm/pg-core';
import { v7 as uuid } from 'uuid';

export const customer = pgTable('customer', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => uuid()),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  deleted_at: date('deleted_at'),
});
