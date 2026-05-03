import { text, pgTable, integer } from 'drizzle-orm/pg-core';
import { v7 as uuid } from 'uuid';
import { order } from './order';
import { product } from './product';

export const orderProducts = pgTable('orderProducts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => uuid()),

  order_id: text('order_id').references(() => order.id),
  product_id: text('product_id').references(() => product.id),
  quantity: integer('quantity').notNull(),
  unit_price: integer('unit_price').notNull(),
});
