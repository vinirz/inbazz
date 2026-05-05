import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import db from '../../database/connectors/postgres';
import { safeQuery } from '../../common/safe-query';
import { order } from '../../database/schema/order';
import { product } from '../../database/schema/product';
import { eq, inArray } from 'drizzle-orm';
import { FindAllOrdersDto } from './dto/find-all-orders.dto';
import { orderProducts } from '../../database/schema/orderProducts';
import { customer } from '../../database/schema/customer';
import { QueueService } from '../queue/queue.service';
import { ORDER_QUEUE_NAME } from '../queue/order.processor';

@Injectable()
export class OrderService {
  logger: Logger;

  constructor(private queueService: QueueService) {
    this.logger = new Logger(OrderService.name);
  }

  async create(body: CreateOrderDto) {
    this.logger.log(
      `[CREATE] Creating order with data: ${JSON.stringify(body)}`,
    );

    const [
      { data: customerData, error: customerError },
      { data: saleProducts, error: saleProductsError },
    ] = await Promise.all([
      safeQuery(
        db.select().from(customer).where(eq(customer.id, body.customer_id)),
      ),
      safeQuery(
        db
          .select({
            id: product.id,
            price: product.price,
          })
          .from(product)
          .where(
            inArray(
              product.id,
              body.products.map((p) => p.product_id),
            ),
          ),
      ),
    ]);

    if (customerError || saleProductsError) {
      throw new BadRequestException(
        customerError?.cause || saleProductsError?.cause,
      );
    }

    if (customerData.length === 0) {
      throw new BadRequestException('Customer not found');
    }

    const productMap = new Map(saleProducts.map((p) => [p.id, p]));
    const requestedProductIds = new Set(body.products.map((p) => p.product_id));

    if (productMap.size !== requestedProductIds.size) {
      throw new BadRequestException('Some products not found');
    }

    const orderProductsData = body.products.map((orderProduct) => {
      const prod = productMap.get(orderProduct.product_id)!;
      return {
        product_id: prod.id,
        quantity: orderProduct.quantity,
        unit_price: prod.price,
      };
    });

    const productsSum = orderProductsData.reduce(
      (sum, op) => sum + op.unit_price * op.quantity,
      0,
    );

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
            orderProductsData.map((op) => ({
              order_id: orderResult.id,
              ...op,
            })),
          )
          .returning({
            id: orderProducts.id,
          });

        if (!orderProductsResult) {
          throw new BadRequestException('Order products not created');
        }

        return {
          id: orderResult.id,
          customer_id: body.customer_id,
          amount: productsSum,
          products: orderProductsData.map((op) => ({
            product_id: op.product_id,
            quantity: op.quantity,
            unit_price: op.unit_price,
          })),
        };
      }),
    );

    if (error) {
      throw new BadRequestException(error.cause);
    }

    await this.queueService.addJob(ORDER_QUEUE_NAME, 'process-order', data);

    return data;
  }

  async findAll(query: FindAllOrdersDto = {}) {
    this.logger.log(
      `[FIND ALL] Fetching all orders${query.status ? ` with status "${query.status}"` : ''}`,
    );

    const { data, error } = await safeQuery(
      query.status
        ? db.select().from(order).where(eq(order.status, query.status))
        : db.select().from(order),
    );

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
