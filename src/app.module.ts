import { Module } from '@nestjs/common';
import { CustomerModule } from './modules/customer/customer.module';
import { ProductModule } from './modules/product/product.module';
import { OrderModule } from './modules/order/order.module';
import { QueueModule } from './modules/queue/queue.module';
import { IdempotencyService } from './common/idempotency/idempotency.service';
import { IdempotencyLockService } from './common/idempotency/idempotency-lock.service';

@Module({
  imports: [CustomerModule, ProductModule, OrderModule, QueueModule],
  controllers: [],
  providers: [IdempotencyService, IdempotencyLockService],
})
export class AppModule {}
