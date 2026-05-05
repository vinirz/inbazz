import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import db from '../../database/connectors/postgres';
import { order } from '../../database/schema/order';
import { orderProducts } from '../../database/schema/orderProducts';
import { safeQuery } from '../../common/safe-query';
import { QueueService } from './queue.service';
import { CurrencyService } from './currency.service';

export const ORDER_QUEUE_NAME = 'orders';

@Injectable()
export class OrderProcessor implements OnModuleInit {
  private readonly logger = new Logger(OrderProcessor.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly currencyService: CurrencyService,
  ) {}

  onModuleInit() {
    const worker = this.queueService.registerWorker(ORDER_QUEUE_NAME, (job) =>
      this.processOrder(job),
    );

    worker.on('failed', (job, err) => {
      void this.handleJobFailure(job, err);
    });
  }

  private async processOrder(job: Job): Promise<{ processed: true }> {
    const orderId = job.data?.id as string;

    this.logger.log(`[PROCESS] Processing job ${job.id} | orderId: ${orderId}`);

    await this.updateOrderStatus(orderId, 'processing');

    const rate = await this.currencyService.getUsdToBrlRate();

    const { data: orderItems, error: itemsError } = await safeQuery(
      db
        .select({
          id: orderProducts.id,
          unit_price: orderProducts.unit_price,
        })
        .from(orderProducts)
        .where(eq(orderProducts.order_id, orderId)),
    );

    if (itemsError || !orderItems) {
      throw new Error(
        `Failed to fetch order items for orderId ${orderId}: ${itemsError?.message}`,
      );
    }

    await Promise.all(
      orderItems.map((item) => {
        const unit_price_brl = this.currencyService.convertUsdCentsToBrlCents(
          item.unit_price,
          rate,
        );

        return safeQuery(
          db
            .update(orderProducts)
            .set({ unit_price_brl })
            .where(eq(orderProducts.id, item.id)),
        );
      }),
    );

    const { data: orderData, error: orderError } = await safeQuery(
      db
        .select({ amount: order.amount })
        .from(order)
        .where(eq(order.id, orderId)),
    );

    if (orderError || !orderData?.[0]) {
      throw new Error(
        `Failed to fetch order amount for orderId ${orderId}: ${orderError?.message}`,
      );
    }

    const amount_brl = this.currencyService.convertUsdCentsToBrlCents(
      orderData[0].amount,
      rate,
    );

    const { error: updateError } = await safeQuery(
      db
        .update(order)
        .set({ amount_brl, status: 'completed' })
        .where(eq(order.id, orderId)),
    );

    if (updateError) {
      throw new Error(
        `Failed to update order with BRL values for orderId ${orderId}: ${updateError.message}`,
      );
    }

    this.logger.log(
      `[PROCESS] Order ${orderId} enriched | USD rate: ${rate} | amount_brl: ${amount_brl} cents`,
    );

    return { processed: true };
  }

  private async handleJobFailure(
    job: Job | undefined,
    err: Error,
  ): Promise<void> {
    if (!job) {
      return;
    }

    const orderId = job.data?.id as string | undefined;

    if (!orderId) {
      return;
    }

    const totalAttempts = job.opts?.attempts ?? 1;
    const isLastAttempt = job.attemptsMade >= totalAttempts;

    if (!isLastAttempt) {
      this.logger.warn(
        `[PROCESS] Job ${job.id} failed (attempt ${job.attemptsMade}/${totalAttempts}) for orderId: ${orderId} — will retry. Error: ${err.message}`,
      );
      return;
    }

    this.logger.error(
      `[PROCESS] Job ${job.id} exhausted all retries for orderId: ${orderId}. Marking order as cancelled. Error: ${err.message}`,
    );

    await this.updateOrderStatus(orderId, 'cancelled');
  }

  private async updateOrderStatus(
    orderId: string,
    status: 'processing' | 'completed' | 'cancelled',
  ): Promise<void> {
    const { error } = await safeQuery(
      db.update(order).set({ status }).where(eq(order.id, orderId)),
    );

    if (error) {
      this.logger.error(
        `[PROCESS] Failed to update status to "${status}" for orderId: ${orderId}. Error: ${error.message}`,
      );
    } else {
      this.logger.log(
        `[PROCESS] Order ${orderId} status updated to "${status}"`,
      );
    }
  }
}
