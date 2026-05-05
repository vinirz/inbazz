import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { IdempotencyKey } from '../../common/decorators/idempotency-key.decorator';
import { IdempotencyKeyGuard } from '../../common/guards/idempotency-key.guard';
import { IdempotencyService } from '../../common/idempotency/idempotency.service';
import { IdempotencyLockService } from '../../common/idempotency/idempotency-lock.service';

@Controller('order')
export class OrderController {
  logger: Logger;

  constructor(
    private readonly orderService: OrderService,
    private readonly idempotencyService: IdempotencyService,
    private readonly lockService: IdempotencyLockService,
  ) {
    this.logger = new Logger(OrderController.name);
  }

  @Post('/webhook')
  @UseGuards(IdempotencyKeyGuard)
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @IdempotencyKey() idempotencyKey: string,
  ) {
    const lockAcquired = await this.lockService.waitForLock(idempotencyKey);

    try {
      if (!lockAcquired) {
        this.logger.warn(
          `[ORDER CONTROLLER] Aguardando lock para ${idempotencyKey.substring(0, 8)}...`,
        );
      }

      const cachedResponse =
        await this.idempotencyService.getIdempotentResponse(idempotencyKey);

      if (cachedResponse) {
        this.logger.log(
          `[ORDER CONTROLLER] Resposta idempotente encontrada para ${idempotencyKey.substring(0, 8)}. Retornando cache...`,
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return cachedResponse;
      }

      const result = await this.orderService.create(createOrderDto);

      await this.idempotencyService.setIdempotentResponse(
        idempotencyKey,
        result,
      );

      return result;
    } finally {
      if (lockAcquired) {
        await this.lockService.releaseLock(idempotencyKey);
      }
    }
  }

  @Get()
  findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }
}
