import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QueueService } from './queue.service';

@ApiTags('queue')
@Controller('queue')
export class QueueController {
  private readonly logger = new Logger(QueueController.name);

  constructor(private readonly queueService: QueueService) {}

  @Get('metrics')
  @ApiOperation({
    summary: 'Métricas das filas',
    description:
      'Retorna contadores de jobs em cada estado (waiting, active, completed, failed, delayed) para todas as filas registradas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas das filas',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          queue: { type: 'string', example: 'orders' },
          waiting: { type: 'integer', example: 0 },
          active: { type: 'integer', example: 1 },
          completed: { type: 'integer', example: 42 },
          failed: { type: 'integer', example: 3 },
          delayed: { type: 'integer', example: 0 },
        },
      },
    },
  })
  async getMetrics() {
    this.logger.log('[METRICS] Fetching queue metrics');
    return this.queueService.getMetrics();
  }
}
