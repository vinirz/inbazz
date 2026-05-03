import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import db from '../../database/connectors/postgres';
import { safeQuery } from '../../common/safe-query';
import { order } from '../../database/schema/order';
import { product } from '../../database/schema/product';
import { eq, inArray } from 'drizzle-orm';
import { orderProducts } from '../../database/schema/orderProducts';
import { customer } from '../../database/schema/customer';

@Injectable()
export class OrderService {
  logger: Logger;

  constructor() {
    this.logger = new Logger(OrderService.name);
  }

  async create(body: CreateOrderDto) {
    this.logger.log(
      `[CREATE] Creating order with data: ${JSON.stringify(body)}`,
    );

    const { data: customerData, error: customerError } = await safeQuery(
      db.select().from(customer).where(eq(customer.id, body.customer_id)),
    );

    if (customerError) {
      throw new BadRequestException(customerError.cause);
    }

    if (customerData.length === 0) {
      throw new BadRequestException('Customer not found');
    }

    const productsIds = body.products.map((p) => p.product_id);
    const { data: saleProducts, error: saleProductsError } = await safeQuery(
      db
        .select({
          id: product.id,
          price: product.price,
        })
        .from(product)
        .where(inArray(product.id, productsIds)),
    );

    if (saleProductsError) {
      throw new BadRequestException(saleProductsError.cause);
    }

    if (saleProducts.length === 0) {
      throw new BadRequestException('No products found');
    }

    const productsSum = saleProducts.reduce((sum, p) => {
      const orderProduct = body.products.find((op) => op.product_id === p.id);

      if (!orderProduct) {
        throw new BadRequestException(
          `Product with id ${p.id} not found in order products`,
        );
      }

      return sum + p.price * orderProduct.quantity;
    }, 0);

    const { data, error } = await safeQuery(
      db.transaction(async (trx) => {
        const [orderResult] = await trx
          .insert(order)
          .values({
            customer_id: body.customer_id,
            amount: productsSum,
          })
          .returning({
            id: order.id,
          });

        if (!orderResult) {
          throw new BadRequestException('Order not created');
        }

        const [orderProductsResult] = await trx
          .insert(orderProducts)
          .values(
            saleProducts.map((product) => {
              return {
                order_id: orderResult.id,
                product_id: product.id,
                quantity:
                  body.products.find((p) => p.product_id === product.id)
                    ?.quantity || 0,
                unit_price: product.price,
              };
            }),
          )
          .returning({
            id: orderProducts.id,
          });

        if (!orderProductsResult) {
          throw new BadRequestException('Order products not created');
        }

        return orderResult;
      }),
    );

    if (error) {
      throw new BadRequestException(error.cause);
    }

    return data;
  }

  async findAll() {
    this.logger.log(`[FIND ALL] Fetching all orders`);

    const { data, error } = await safeQuery(db.select().from(order));

    if (error) {
      throw new BadRequestException(error.cause);
    }

    return data;
  }

  async findOne(id: string) {
    this.logger.log(`[FIND ONE] Fetching order with id: ${id}`);

    const { data, error } = await safeQuery(
      db.select().from(order).where(eq(order.id, id)),
    );

    if (error) {
      throw new BadRequestException(error.cause);
    }

    return data;
  }
}
