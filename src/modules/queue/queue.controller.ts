import { Controller, Get, Logger } from '@nestjs/common';
import { QueueService } from './queue.service';

@Controller('queue')
export class QueueController {
  private readonly logger = new Logger(QueueController.name);

  constructor(private readonly queueService: QueueService) {}

  @Get('metrics')
  async getMetrics() {
    this.logger.log('[METRICS] Fetching queue metrics');
    return this.queueService.getMetrics();
  }
}
