import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { OrderProcessor } from './order.processor';
import { QueueController } from './queue.controller';
import { CurrencyService } from './currency.service';

@Module({
  controllers: [QueueController],
  providers: [QueueService, OrderProcessor, CurrencyService],
  exports: [QueueService],
})
export class QueueModule {}
