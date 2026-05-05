import { text, pgTable, integer } from 'drizzle-orm/pg-core';
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
  amount: integer('amount').notNull(),
  amount_brl: integer('amount_brl'),
  status: statusEnum('status').default('created').notNull(),
});
