import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { IdempotencyService } from '../../common/idempotency/idempotency.service';
import { IdempotencyLockService } from '../../common/idempotency/idempotency-lock.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService, IdempotencyService, IdempotencyLockService],
})
export class OrderModule {}
