import { integer } from 'drizzle-orm/pg-core';
import { text, pgTable, varchar, date } from 'drizzle-orm/pg-core';
import { v7 as uuid } from 'uuid';

export const product = pgTable('product', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => uuid()),

  sku: varchar({ length: 255 }).notNull().unique(),
  description: varchar({ length: 255 }).notNull(),
  price: integer('price').notNull(),
  stock_quantity: integer('stock_quantity').notNull(),
  deleted_at: date('deleted_at'),
});
