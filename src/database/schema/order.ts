import { text, pgTable, varchar } from 'drizzle-orm/pg-core';
import { v7 as uuid } from 'uuid';
import { customer } from './customer';
import { pgEnum } from 'drizzle-orm/pg-core';

export const statusEnum = pgEnum('status', [
  'created',
  'processing',
  'completed',
  'cancelled',
]);

export const order = pgTable('order', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => uuid()),

  customer_id: text('customer_id').references(() => customer.id),
  amount: text('amount').notNull(),
  status: statusEnum('status').default('created').notNull(),
  currency: varchar({ length: 255 }).notNull(),
});
